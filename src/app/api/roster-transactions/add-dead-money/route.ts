import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
        status: 'active',
      },
    });

    let calculatedDeadMoney = deadMoneyAmount || 0;

    // Se há contrato ativo, calcular dead money baseado no dinheiro garantido
    if (activeContract && deadMoneyAmount === undefined) {
      calculatedDeadMoney = activeContract.guaranteedMoney || 0;
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
            status: 'cut',
            notes: notes
              ? `${activeContract.notes || ''} | Cortado: ${notes}`
              : `${activeContract.notes || ''} | Jogador cortado`,
          },
        });
      }

      // 3. Criar registro de dead money se houver valor
      let deadMoneyRecord = null;
      if (calculatedDeadMoney > 0) {
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

      return {
        contract: activeContract,
        deadMoney: deadMoneyRecord,
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
        deadMoneyCreated: !!result.deadMoney,
        deadMoneyAmount: calculatedDeadMoney,
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
