import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * GET /api/leagues
 *
 * Lista todas as ligas do usuário autenticado.
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Buscar ligas do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      include: {
        leagues: {
          orderBy: { createdAt: 'desc' },
        },
        teams: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Combinar ligas onde o usuário é comissário e ligas onde tem times
    const commissionerLeagues = user.leagues;
    const teamLeagues = user.teams.map(team => team.league);

    // Remover duplicatas
    const allLeagues = [...commissionerLeagues];
    teamLeagues.forEach(league => {
      if (!allLeagues.find(l => l.id === league.id)) {
        allLeagues.push(league);
      }
    });

    return NextResponse.json({
      leagues: allLeagues,
      total: allLeagues.length,
    });
  } catch (error) {
    console.error('Erro ao buscar ligas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/leagues
 *
 * Cria uma nova liga (apenas para comissários).
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;



    // Verificar se o usuário é comissário
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
    });

    if (!user || user.role !== 'COMMISSIONER') {
      return NextResponse.json({ error: 'Apenas comissários podem criar ligas' }, { status: 403 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const {
      name,
      salaryCap,
      totalTeams,
      season,
      status,
      sleeperLeagueId,
      maxFranchiseTags,
      minimumSalary,
      annualIncreasePercentage,
      seasonTurnoverDate,
      deadMoneyConfig,
    } = body;

    // Validar dados obrigatórios
    if (!name || !salaryCap || !totalTeams || !season) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, salaryCap, totalTeams, season' },
        { status: 400 },
      );
    }

    // Criar a liga
    const newLeague = await prisma.league.create({
      data: {
        name,
        salaryCap,
        totalTeams,
        season,
        status: status || 'ACTIVE',
        sleeperLeagueId: sleeperLeagueId || null,
        commissionerId: user.id,
        maxFranchiseTags: maxFranchiseTags || 1,
        minimumSalary: minimumSalary || 1000000,
        annualIncreasePercentage: annualIncreasePercentage || 15.0,
        seasonTurnoverDate: seasonTurnoverDate || '04-01',
        deadMoneyConfig: deadMoneyConfig
          ? JSON.stringify(deadMoneyConfig)
          : JSON.stringify({
              currentSeason: 1.0,
              futureSeasons: { '1': 0.25, '2': 0.25, '3': 0.25, '4': 0.25 },
            }),
      },
      include: {
        teams: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        commissioner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        league: newLeague,
        message: 'Liga criada com sucesso',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao criar liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
