import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { teamId } = params;

    // Buscar contratos do time
    const contracts = await prisma.contract.findMany({
      where: {
        teamId,
        team: {
          ownerId: session.user.id,
        },
      },
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Erro ao buscar contratos do time:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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



    // Verificar se o time existe e pertence ao usuário
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        league: {
          users: {
            some: {
              email: userEmail!,
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
    const { playerId, currentSalary, yearsRemaining, acquisitionType } = body;

    // Validar dados obrigatórios
    if (!playerId || !currentSalary || !yearsRemaining || !acquisitionType) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Verificar se já existe contrato ativo para o jogador no time
    const existingContract = await prisma.contract.findFirst({
      where: {
        playerId,
        teamId,
        status: 'ACTIVE',
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
        yearsRemaining: parseInt(yearsRemaining),
        acquisitionType,
        status: 'ACTIVE',
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
