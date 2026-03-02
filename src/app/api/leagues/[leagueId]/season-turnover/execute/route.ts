import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Aumenta o tempo máximo de execução na Vercel para 60 segundos (limite do plano Hobby)
export const maxDuration = 60;

/**
 * POST /api/leagues/[leagueId]/season-turnover/execute
 * Executa a virada de temporada aplicando todas as alterações contratuais
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId } = await params;

    // Verificar se o usuário é comissário da liga
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        commissioner: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    if (league.commissioner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Apenas o comissário pode executar a virada de temporada' },
        { status: 403 },
      );
    }

    // Buscar todos os contratos ativos da liga
    const activeContracts = await prisma.contract.findMany({
      where: {
        leagueId,
        status: 'ACTIVE',
        yearsRemaining: {
          gt: 0,
        },
      },
      include: {
        player: {
          select: {
            name: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    if (activeContracts.length === 0) {
      return NextResponse.json({
        message: 'Nenhum contrato ativo encontrado para processar',
        contractsUpdated: 0,
      });
    }

    // Executar a virada de temporada em LOTE (Batch Transaction), evitando timeout
    const transactionQueries = [];
    let updatedContractsCount = 0;
    let expiredContractsCount = 0;

    for (const contract of activeContracts) {
      const newYearsRemaining = contract.yearsRemaining - 1;
      const isExpired = newYearsRemaining === 0;

      const newSalary = isExpired
        ? 0
        : contract.currentSalary * (1 + league.annualIncreasePercentage / 100);

      // Empilhando as promessas, SEM aguardar individualmente
      transactionQueries.push(
        prisma.contract.update({
          where: { id: contract.id },
          data: {
            yearsRemaining: newYearsRemaining,
            currentSalary: newSalary,
            status: isExpired ? 'EXPIRED' : 'ACTIVE',
            updatedAt: new Date().toISOString(),
          },
        }),
      );

      updatedContractsCount++;
      if (isExpired) {
        expiredContractsCount++;
      }
    }

    // Atualizar a temporada da liga
    transactionQueries.push(
      prisma.league.update({
        where: { id: leagueId },
        data: {
          season: league.season + 1,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    // Resetar flags de franchise tag para a nova temporada
    transactionQueries.push(
      prisma.contract.updateMany({
        where: {
          leagueId,
          status: 'ACTIVE',
        },
        data: {
          hasBeenTagged: false,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    // Dispara todas as queries de uma só vez em uma única requisição ao banco
    await prisma.$transaction(transactionQueries);

    const newSeason = league.season + 1;

    // Log da operação para auditoria
    console.log(`Virada de temporada executada para liga ${league.name}:`, {
      leagueId,
      season: newSeason,
      contractsUpdated: updatedContractsCount,
      expiredContracts: expiredContractsCount,
      executedBy: session.user.email,
      executedAt: new Date().toISOString(),
    });

    const teams = await prisma.team.findMany({ where: { leagueId } });

    // Paraleliza as queries de Dead Money para acelerar a execução fora da transação
    const deadMoneyPromises = teams.map(async team => {
      const sumCurrent = await prisma.deadMoney.aggregate({
        where: { teamId: team.id, year: newSeason },
        _sum: { amount: true },
      });
      const sumNext = await prisma.deadMoney.aggregate({
        where: { teamId: team.id, year: newSeason + 1 },
        _sum: { amount: true },
      });

      const current = sumCurrent._sum.amount || 0;
      const next = sumNext._sum.amount || 0;

      await prisma.team.update({
        where: { id: team.id },
        data: {
          currentDeadMoney: current,
          nextSeasonDeadMoney: next,
        },
      });

      return {
        teamId: team.id,
        currentDeadMoney: current,
        sumForNewSeason: current,
        nextSeasonDeadMoney: next,
        sumForNextSeason: next,
      };
    });

    const deadMoneyValidation = await Promise.all(deadMoneyPromises);

    return NextResponse.json({
      message: 'Virada de temporada executada com sucesso',
      contractsUpdated: updatedContractsCount,
      expiredContracts: expiredContractsCount,
      newSeason,
      summary: {
        totalProcessed: updatedContractsCount,
        contractsExpired: expiredContractsCount,
        contractsActive: updatedContractsCount - expiredContractsCount,
      },
      deadMoneyValidation,
    });
  } catch (error) {
    console.error('Erro ao executar virada de temporada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao executar virada de temporada' },
      { status: 500 },
    );
  }
}
