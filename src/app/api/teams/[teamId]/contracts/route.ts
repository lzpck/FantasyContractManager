import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AcquisitionType, ContractStatus } from '@prisma/client';
// Removido sistema demo

/**
 * GET /api/teams/[teamId]/contracts
 *
 * Busca todos os contratos de um time específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { teamId } = await params;

    // Removido verificação de usuário demo

    // Verificar se o time existe e se o usuário tem acesso
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          // Usuário é o proprietário do time
          {
            owner: {
              email: userEmail!,
            },
          },
          // Usuário é o comissário da liga
          {
            league: {
              commissioner: {
                email: userEmail!,
              },
            },
          },
          // Usuário é membro da liga (pode visualizar outros times)
          {
            league: {
              leagueUsers: {
                some: {
                  user: {
                    email: userEmail!,
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Buscar contratos do time
    const contracts = await prisma.contract.findMany({
      where: {
        teamId: teamId,
      },
      include: {
        player: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Erro ao buscar contratos do time:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/teams/[teamId]/contracts
 *
 * Cria um novo contrato para um jogador no time.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { teamId } = await params;

    // Removido verificação de usuário demo

    // Verificar se o time existe e pertence ao usuário
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        league: {
          leagueUsers: {
            some: {
              user: {
                email: userEmail!,
              },
            },
          },
        },
      },
      include: {
        league: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { playerId, currentSalary, yearsRemaining, acquisitionType, originalSalary, originalYears, signedSeason } = body;

    // Validar dados obrigatórios
    if (!playerId || !currentSalary || !yearsRemaining || !acquisitionType || !originalSalary || !originalYears) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Verificar se já existe contrato ativo para o jogador no time
    const existingContract = await prisma.contract.findFirst({
      where: {
        playerId,
        teamId,
        status: ContractStatus.ACTIVE,
      },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: 'Jogador já possui contrato ativo neste time' },
        { status: 400 },
      );
    }

    // Criar novo contrato
    const contract = await prisma.contract.create({
      data: {
        playerId,
        teamId,
        leagueId: team.leagueId,
        currentSalary: parseFloat(currentSalary),
        originalSalary: parseFloat(originalSalary || currentSalary),
        yearsRemaining: parseInt(yearsRemaining),
        originalYears: parseInt(originalYears || yearsRemaining),
        acquisitionType: acquisitionType as AcquisitionType,
        signedSeason: signedSeason || new Date().getFullYear(),
        status: ContractStatus.ACTIVE,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
