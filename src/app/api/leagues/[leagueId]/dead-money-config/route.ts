import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeadMoneyConfig, DEFAULT_DEAD_MONEY_CONFIG } from '@/types';

/**
 * GET /api/leagues/[leagueId]/dead-money-config
 * Busca a configuração de dead money de uma liga
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId } = await params;

    // Buscar a liga e verificar permissões
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        deadMoneyConfig: true,
        commissionerId: true,
        teams: {
          where: { owner: { email: session.user.email } },
          select: { id: true },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso à liga (comissário ou membro)
    const isCommissioner = league.commissionerId === session.user.id;
    const isMember = league.teams.length > 0;

    if (!isCommissioner && !isMember) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Parse da configuração de dead money
    let deadMoneyConfig: DeadMoneyConfig;
    try {
      deadMoneyConfig = JSON.parse(league.deadMoneyConfig);
    } catch (error) {
      // Retornar configuração padrão em caso de erro
      deadMoneyConfig = DEFAULT_DEAD_MONEY_CONFIG;
    }

    return NextResponse.json({
      leagueId: league.id,
      leagueName: league.name,
      deadMoneyConfig,
      isCommissioner,
    });
  } catch (error) {
    console.error('Erro ao buscar configuração de dead money:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/leagues/[leagueId]/dead-money-config
 * Atualiza a configuração de dead money de uma liga (apenas comissário)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId } = await params;
    const body = await request.json();
    const { deadMoneyConfig } = body;

    // Validar estrutura da configuração
    if (!deadMoneyConfig || typeof deadMoneyConfig !== 'object') {
      return NextResponse.json({ error: 'Configuração de dead money inválida' }, { status: 400 });
    }

    // Validar campos obrigatórios
    if (
      typeof deadMoneyConfig.currentSeason !== 'number' ||
      !deadMoneyConfig.futureSeasons ||
      typeof deadMoneyConfig.futureSeasons !== 'object'
    ) {
      return NextResponse.json({ error: 'Estrutura de configuração inválida' }, { status: 400 });
    }

    // Validar percentuais (devem estar entre 0 e 1)
    const validatePercentage = (value: number): boolean => {
      return typeof value === 'number' && value >= 0 && value <= 1;
    };

    if (!validatePercentage(deadMoneyConfig.currentSeason)) {
      return NextResponse.json(
        { error: 'Percentual da temporada atual deve estar entre 0 e 1' },
        { status: 400 },
      );
    }

    // Validar percentuais das temporadas futuras
    const requiredKeys = ['1', '2', '3', '4'];
    for (const key of requiredKeys) {
      if (!validatePercentage(deadMoneyConfig.futureSeasons[key])) {
        return NextResponse.json(
          { error: `Percentual para ${key} ano(s) restante(s) deve estar entre 0 e 1` },
          { status: 400 },
        );
      }
    }

    // Buscar a liga e verificar se o usuário é comissário
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        name: true,
        commissionerId: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário é o comissário
    if (league.commissionerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas o comissário pode alterar as configurações da liga' },
        { status: 403 },
      );
    }

    // Atualizar a configuração no banco de dados
    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: {
        deadMoneyConfig: JSON.stringify(deadMoneyConfig),
        updatedAt: new Date().toISOString(),
      },
      select: {
        id: true,
        name: true,
        deadMoneyConfig: true,
      },
    });

    // TODO: Registrar alteração no histórico da liga para auditoria
    // Isso pode ser implementado em uma tabela de logs separada

    return NextResponse.json({
      message: 'Configuração de dead money atualizada com sucesso',
      leagueId: updatedLeague.id,
      leagueName: updatedLeague.name,
      deadMoneyConfig: JSON.parse(updatedLeague.deadMoneyConfig),
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração de dead money:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
