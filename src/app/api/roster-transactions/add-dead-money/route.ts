import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Função de cálculo e persistência de dead money
 */
async function handlePlayerCut(contract: any, league: { deadMoneyConfig: any; season: number }) {
  const config = league.deadMoneyConfig;

  // 1. Dead money do ano atual
  const deadMoneyAtual = contract.currentSalary * (config.currentSeason ?? 1);

  const records = [
    {
      playerId: contract.playerId,
      teamId: contract.teamId,
      contractId: contract.id,
      year: league.season,
      amount: deadMoneyAtual,
      reason: 'Jogador cortado via transação de roster',
    },
  ];

  // 2. Dead money do próximo ano (baseado nos anos restantes)
  const yearsRemaining = contract.yearsRemaining;

  if (yearsRemaining >= 1) {
    // Usa o percentual baseado nos anos restantes do contrato
    const yearsKey = Math.min(yearsRemaining, 4).toString(); // Máximo 4 anos
    const nextYearPercent = config.futureSeasons?.[yearsKey] ?? 0;

    if (nextYearPercent > 0) {
      // Projeta salário do próximo ano com aumento anual (15% padrão)
      const annualIncreaseRate = 1 + (contract.annualIncrease ?? 0.15);
      const nextYearSalary = contract.currentSalary * annualIncreaseRate;
      const deadMoneyNext = nextYearSalary * nextYearPercent;

      records.push({
        playerId: contract.playerId,
        teamId: contract.teamId,
        contractId: contract.id,
        year: league.season + 1,
        amount: deadMoneyNext,
        reason: `Dead money próxima temporada`,
      });
    }
  }

  // 3. Persistir no banco
  await prisma.deadMoney.createMany({ data: records });

  return records;
}

/**
 * Schema de validação para adicionar dead money
 */
const addDeadMoneySchema = z.object({
  sleeperPlayerId: z.string().min(1, 'ID do jogador é obrigatório'),
  teamId: z.string().min(1, 'ID do time é obrigatório'),
  deadMoneyAmount: z.number().min(0, 'Valor do dead money deve ser positivo').optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/roster-transactions/add-dead-money
 * Adiciona dead money para um jogador cortado e remove do roster
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addDeadMoneySchema.parse(body);

    const { sleeperPlayerId, teamId, deadMoneyAmount, notes } = validatedData;

    // Verificar se o time existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { league: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Verificar se o jogador existe
    const player = await prisma.player.findUnique({
      where: { sleeperPlayerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    // Buscar contrato ativo do jogador com o time
    const activeContract = await prisma.contract.findFirst({
      where: {
        playerId: player.id,
        teamId,
        status: 'ACTIVE',
      },
    });

    let deadMoneyRecords: any[] = [];
    let calculatedDeadMoney = deadMoneyAmount || 0;

    // Se há contrato ativo, usar nossa função de cálculo de dead money
    if (activeContract && deadMoneyAmount === undefined) {
      // Buscar configuração de dead money da liga
      const league = await prisma.league.findUnique({
        where: { id: team.league.id },
        select: { deadMoneyConfig: true, season: true },
      });

      if (league) {
        // Parse da configuração de dead money
        let deadMoneyConfig;
        try {
          deadMoneyConfig = JSON.parse(league.deadMoneyConfig);
        } catch (error) {
          // Usar configuração padrão em caso de erro
          deadMoneyConfig = {
            currentSeason: 1.0,
            futureSeasons: { '1': 0, '2': 0.5, '3': 0.75, '4': 1.0 },
          };
        }

        // Calcular endYear baseado no yearsRemaining e season atual
        const contractWithEndYear = {
          ...activeContract,
          endYear: league.season + activeContract.yearsRemaining,
        };

        // Calcular e persistir dead money usando nossa função
        deadMoneyRecords = await handlePlayerCut(contractWithEndYear, {
          deadMoneyConfig,
          season: league.season,
        });
        calculatedDeadMoney = deadMoneyRecords.reduce((sum, record) => sum + record.amount, 0);
      } else {
        calculatedDeadMoney = activeContract.currentSalary || 0;
      }
    }

    // Usar transação para garantir consistência
    const result = await prisma.$transaction(async tx => {
      // 1. Remover jogador do roster
      await tx.teamRoster.deleteMany({
        where: {
          teamId,
          sleeperPlayerId,
        },
      });

      // 2. Atualizar status do contrato para 'cut' se existir
      if (activeContract) {
        await tx.contract.update({
          where: { id: activeContract.id },
          data: {
            status: 'CUT',
          },
        });
      }

      // 3. Criar registro de dead money apenas se não foi calculado pela função handlePlayerCut
      let deadMoneyRecord = null;
      if (calculatedDeadMoney > 0 && deadMoneyRecords.length === 0) {
        deadMoneyRecord = await tx.deadMoney.create({
          data: {
            teamId,
            playerId: player.id,
            amount: calculatedDeadMoney,
            year: new Date().getFullYear(),
            reason: notes || 'Jogador cortado do roster',
            contractId: activeContract?.id,
          },
          include: {
            player: true,
            team: true,
          },
        });
      }

      const currentSeason = team.league.season;
      const nextSeason = currentSeason + 1;
      const currentSeasonTotal = deadMoneyRecords
        .filter(r => r.year === currentSeason)
        .reduce((sum, r) => sum + r.amount, 0);
      const nextSeasonTotal = deadMoneyRecords
        .filter(r => r.year === nextSeason)
        .reduce((sum, r) => sum + r.amount, 0);

      if (deadMoneyRecord) {
        if (deadMoneyRecord.year === currentSeason) {
          deadMoneyRecords = [...deadMoneyRecords, deadMoneyRecord];
        }
        if (deadMoneyRecord.year === nextSeason) {
          deadMoneyRecords = [...deadMoneyRecords, deadMoneyRecord];
        }
      }

      const finalCurrentTotal = deadMoneyRecords
        .filter(r => r.year === currentSeason)
        .reduce((sum, r) => sum + r.amount, currentSeasonTotal);
      const finalNextTotal = deadMoneyRecords
        .filter(r => r.year === nextSeason)
        .reduce((sum, r) => sum + r.amount, nextSeasonTotal);

      await tx.team.update({
        where: { id: teamId },
        data: {
          currentDeadMoney: { increment: finalCurrentTotal },
          nextSeasonDeadMoney: { increment: finalNextTotal },
        },
      });

      return {
        contract: activeContract,
        deadMoney: deadMoneyRecord,
        deadMoneyRecords: deadMoneyRecords,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${player.name} foi removido do roster${calculatedDeadMoney > 0 ? ` com $${calculatedDeadMoney.toLocaleString()} em dead money` : ''}`,
      data: {
        player,
        team,
        removedFromRoster: true,
        contractUpdated: !!result.contract,
        deadMoneyCreated: !!result.deadMoney || deadMoneyRecords.length > 0,
        deadMoneyAmount: calculatedDeadMoney,
        deadMoneyRecords: deadMoneyRecords,
        totalRecords: deadMoneyRecords.length,
      },
    });
  } catch (error) {
    console.error('Erro ao adicionar dead money:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
