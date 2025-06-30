import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar ligas do usuário
    const leagues = await prisma.league.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            teams: {
              some: {
                ownerId: session.user.id,
              },
            },
          },
        ],
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
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Erro ao buscar ligas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leagues
 *
 * Cria uma nova liga (apenas para comissários).
 * Usuário demo não pode criar ligas reais.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é usuário demo
    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 400 });
    }

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
        deadMoneyConfig: deadMoneyConfig ? JSON.stringify(deadMoneyConfig) : JSON.stringify({"currentSeason":1.0,"futureSeasons":{"1":0.25,"2":0.25,"3":0.25,"4":0.25}}),
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
