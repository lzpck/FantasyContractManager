import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * GET /api/teams/[teamId]/dead-money
 * Busca todos os registros de dead money de um time específico
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
    const { searchParams } = new URL(request.url);

    // Parâmetros opcionais para filtrar por ano
    const year = searchParams.get('year');
    const currentYearOnly = searchParams.get('currentYearOnly') === 'true';
    const nextYearOnly = searchParams.get('nextYearOnly') === 'true';

    // Removido verificação de usuário demo

    // Verificar se o time existe e pertence ao usuário
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
        ],
      },
      include: {
        league: {
          select: {
            id: true,
            season: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Constrói o filtro dinamicamente
    const where: any = {
      teamId: teamId,
    };

    // Filtros por ano baseados na temporada da liga
    if (year) {
      where.year = parseInt(year);
    } else if (currentYearOnly) {
      where.year = team.league.season;
    } else if (nextYearOnly) {
      where.year = team.league.season + 1;
    }

    // Buscar registros de dead money
    const deadMoneyRecords = await prisma.deadMoney.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            sleeperPlayerId: true,
          },
        },
        contract: {
          select: {
            id: true,
            currentSalary: true,
            originalYears: true,
            signedSeason: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ year: 'asc' }, { amount: 'desc' }],
    });

    // Transforma os dados para o formato esperado
    const formattedRecords = deadMoneyRecords.map(record => ({
      id: record.id,
      teamId: record.teamId,
      playerId: record.playerId,
      contractId: record.contractId,
      amount: record.amount,
      year: record.year,
      reason: record.reason,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      player: record.player,
      contract: record.contract,
      team: record.team,
    }));

    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Erro ao buscar registros de dead money:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/teams/[teamId]/dead-money
 * Cria novos registros de dead money (usado quando um jogador é cortado)
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
    const { playerId, contractId, currentSeasonAmount, nextSeasonAmount, reason } = body;

    // Validar dados obrigatórios
    if (!playerId || (!currentSeasonAmount && !nextSeasonAmount)) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    const currentYear = team.league.season;
    const nextYear = currentYear + 1;
    const createdRecords = [];

    // Criar registro para o ano atual se houver valor
    if (currentSeasonAmount && currentSeasonAmount > 0) {
      const currentYearRecord = await prisma.deadMoney.create({
        data: {
          teamId,
          playerId,
          contractId,
          amount: parseFloat(currentSeasonAmount),
          year: currentYear,
          reason: reason || 'Corte de jogador',
        },
        include: {
          player: true,
          contract: true,
        },
      });
      createdRecords.push(currentYearRecord);
    }

    // Criar registro para o próximo ano se houver valor
    if (nextSeasonAmount && nextSeasonAmount > 0) {
      const nextYearRecord = await prisma.deadMoney.create({
        data: {
          teamId,
          playerId,
          contractId,
          amount: parseFloat(nextSeasonAmount),
          year: nextYear,
          reason: reason || 'Corte de jogador',
        },
        include: {
          player: true,
          contract: true,
        },
      });
      createdRecords.push(nextYearRecord);
    }

    return NextResponse.json({ deadMoneyRecords: createdRecords }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar registros de dead money:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
