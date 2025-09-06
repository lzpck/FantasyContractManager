import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/database';

/**
 * API para associar/desassociar usuário a um time
 * Apenas comissários podem fazer essa operação
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { userId } = await request.json();
    const { teamId } = await params;

    // Verificar se o time existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        league: true,
        owner: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Se userId for null, desassociar usuário atual
    if (!userId) {
      const currentOwnerId = team.ownerId;

      await prisma.team.update({
        where: { id: teamId },
        data: {
          ownerId: null,
        },
      });

      // Atualizar users.teamId para null
      if (currentOwnerId) {
        await prisma.user.update({
          where: { id: currentOwnerId },
          data: {
            teamId: null,
          },
        });
      }

      // Remover usuário da liga se não tiver outros times
      if (currentOwnerId) {
        const userOtherTeams = await prisma.team.count({
          where: {
            leagueId: team.leagueId,
            ownerId: currentOwnerId,
            id: { not: teamId },
          },
        });

        if (userOtherTeams === 0) {
          await prisma.leagueUser.deleteMany({
            where: {
              leagueId: team.leagueId,
              userId: currentOwnerId,
            },
          });
        }
      }

      return NextResponse.json({
        message: 'Usuário desassociado do time com sucesso',
        team: { ...team, ownerId: null, owner: null },
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário já tem um time associado
    const userCurrentTeam = await prisma.team.findFirst({
      where: { ownerId: userId },
    });

    if (userCurrentTeam && userCurrentTeam.id !== teamId) {
      return NextResponse.json(
        { error: 'Usuário já possui um time associado. Desassocie primeiro.' },
        { status: 400 },
      );
    }

    // Verificar se o time já tem um proprietário
    if (team.ownerId && team.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Time já possui um proprietário associado' },
        { status: 400 },
      );
    }

    // Associar usuário ao time
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ownerId: userId,
        updatedAt: new Date().toISOString(),
      },
      include: {
        owner: true,
        league: true,
      },
    });

    // Atualizar users.teamId
    await prisma.user.update({
      where: { id: userId },
      data: {
        teamId: teamId,
      },
    });

    // Garantir que o usuário seja membro da liga
    await prisma.leagueUser.upsert({
      where: {
        leagueId_userId: {
          leagueId: team.leagueId,
          userId: userId,
        },
      },
      update: {},
      create: {
        leagueId: team.leagueId,
        userId: userId,
        role: 'MEMBER',
      },
    });

    // Log da operação para auditoria
    console.log(
      `[AUDIT] Usuário ${userId} (${user.name}) associado ao time ${teamId} (${team.name}) na liga ${team.leagueId} por ${session.user.id}`,
    );

    return NextResponse.json({
      message: 'Usuário associado ao time com sucesso',
      team: updatedTeam,
    });
  } catch (error) {
    console.error('Erro ao associar usuário ao time:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
