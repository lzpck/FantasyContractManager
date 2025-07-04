import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * GET /api/leagues/[leagueId]
 *
 * Busca uma liga específica por ID.
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, retorna dados reais do banco.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { leagueId } = await params;

    // Removido verificação de usuário demo

    // Usuários reais: buscar liga do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar a liga específica
    const league = await prisma.league.findFirst({
      where: {
        id: leagueId,
        OR: [
          { commissionerId: user.id }, // Liga onde o usuário é comissário
          {
            teams: {
              some: {
                ownerId: user.id, // Liga onde o usuário tem um time
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
        commissioner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    // Parse do deadMoneyConfig se for uma string JSON
    const parsedLeague = { ...league };
    if (league.deadMoneyConfig && typeof league.deadMoneyConfig === 'string') {
      try {
        parsedLeague.deadMoneyConfig = JSON.parse(league.deadMoneyConfig);
      } catch (error) {
        console.warn('Erro ao fazer parse do deadMoneyConfig:', error);
        // Mantém como string se não conseguir fazer parse
      }
    }

    return NextResponse.json({
      league: parsedLeague,
    });
  } catch (error) {
    console.error('Erro ao buscar liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/leagues/[leagueId]
 *
 * Atualiza uma liga específica.
 * Apenas o comissário pode atualizar a liga.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { leagueId } = await params;

    // Removido verificação de usuário demo

    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é o comissário da liga
    const league = await prisma.league.findFirst({
      where: {
        id: leagueId,
        commissionerId: user.id,
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: 'Liga não encontrada ou você não tem permissão para editá-la' },
        { status: 404 },
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const {
      name,
      salaryCap,
      sleeperLeagueId,
      maxFranchiseTags,
      minimumSalary,
      annualIncreasePercentage,
      seasonTurnoverDate,
      deadMoneyConfig,
    } = body;

    // Atualizar a liga
    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: {
        ...(name && { name }),
        ...(salaryCap && { salaryCap }),
        ...(sleeperLeagueId !== undefined && { sleeperLeagueId }),
        ...(maxFranchiseTags !== undefined && { maxFranchiseTags }),
        ...(minimumSalary && { minimumSalary }),
        ...(annualIncreasePercentage !== undefined && { annualIncreasePercentage }),
        ...(seasonTurnoverDate && { seasonTurnoverDate }),
        ...(deadMoneyConfig !== undefined && { deadMoneyConfig: JSON.stringify(deadMoneyConfig) }),
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

    return NextResponse.json({
      league: updatedLeague,
      message: 'Liga atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
