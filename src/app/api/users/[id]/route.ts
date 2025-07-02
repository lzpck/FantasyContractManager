import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/database';

/**
 * API para buscar usuário específico (apenas comissários)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leagueUsers: {
          select: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * API para atualizar usuário específico (apenas comissários)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: userId } = await params;
    const { name, email, role, isActive, password, teamId } = await request.json();

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: true, // Times onde é owner
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário está tentando desativar a si mesmo
    if (session.user.id === userId && isActive === false) {
      return NextResponse.json(
        { error: 'Você não pode desativar sua própria conta' },
        { status: 400 },
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
      }
    }

    // Verificar se o time existe e está disponível (se teamId foi fornecido)
    let newTeam = null;
    if (teamId) {
      newTeam = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          owner: true,
          league: true,
        },
      });

      if (!newTeam) {
        return NextResponse.json({ error: 'Time não encontrado' }, { status: 400 });
      }

      // Verificar se o time já tem outro owner (que não seja o usuário atual)
      if (newTeam.ownerId && newTeam.ownerId !== userId) {
        return NextResponse.json(
          { error: 'Time já possui outro usuário associado' },
          { status: 400 },
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(typeof isActive === 'boolean' && { isActive }),
    };

    // Hash da nova senha se fornecida
    if (password) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.default.hash(password, 12);
    }

    // Gerenciar associação de times
    if (teamId !== undefined) {
      // Se teamId é null, desassociar do time atual
      if (teamId === null) {
        // Remover ownerId dos times atuais
        if (existingUser.teams.length > 0) {
          await prisma.team.updateMany({
            where: { ownerId: userId },
            data: {
              ownerId: null,
            },
          });

          // Remover usuário das ligas dos times
          const teamLeagueIds = existingUser.teams.map(team => team.leagueId);
          await prisma.leagueUser.deleteMany({
            where: {
              userId: userId,
              leagueId: { in: teamLeagueIds },
            },
          });

          console.log(
            `[AUDIT] Usuário ${userId} (${existingUser.name}) desassociado de todos os times`,
          );
        }

        // Atualizar users.teamId para null
        updateData.teamId = null;
      } else {
        // Associar a novo time
        // Primeiro, desassociar de times atuais
        if (existingUser.teams.length > 0) {
          await prisma.team.updateMany({
            where: { ownerId: userId },
            data: {
              ownerId: null,
            },
          });

          // Remover usuário das ligas dos times antigos
          const oldTeamLeagueIds = existingUser.teams.map(team => team.leagueId);
          await prisma.leagueUser.deleteMany({
            where: {
              userId: userId,
              leagueId: { in: oldTeamLeagueIds },
            },
          });
        }

        // Associar ao novo time
        await prisma.team.update({
          where: { id: teamId },
          data: {
            ownerId: userId,
          },
        });

        // Garantir que o usuário seja membro da nova liga
        await prisma.leagueUser.upsert({
          where: {
            leagueId_userId: {
              leagueId: newTeam!.leagueId,
              userId: userId,
            },
          },
          update: {},
          create: {
            leagueId: newTeam!.leagueId,
            userId: userId,
            role: 'MEMBER',
          },
        });

        // Atualizar users.teamId com o novo time
        updateData.teamId = teamId;

        console.log(
          `[AUDIT] Usuário ${userId} (${existingUser.name}) associado ao time ${teamId} (${newTeam!.name}) na liga ${newTeam!.leagueId}`,
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        isActive: true,
        teamId: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        leagueUsers: {
          select: {
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * API para deletar usuário (apenas comissários)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Não permitir que o usuário delete a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 },
      );
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teams: true,
        leagues: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem times ou ligas associadas
    if (existingUser.teams.length > 0 || existingUser.leagues.length > 0) {
      return NextResponse.json(
        {
          error:
            'Não é possível deletar usuário com times ou ligas associadas. Desative o usuário em vez disso.',
        },
        { status: 400 },
      );
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
