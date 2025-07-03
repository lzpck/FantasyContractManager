import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Schema de validação para adicionar contrato
 */
const addContractSchema = z.object({
  sleeperPlayerId: z.string().min(1, 'ID do jogador é obrigatório'),
  teamId: z.string().min(1, 'ID do time é obrigatório'),
  contractValue: z.number().min(0, 'Valor do contrato deve ser positivo'),
  contractYears: z.number().min(1, 'Duração do contrato deve ser pelo menos 1 ano'),
  guaranteedMoney: z.number().min(0, 'Dinheiro garantido deve ser positivo').optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/roster-transactions/add-contract
 * Adiciona um contrato para um jogador recém-adicionado ao roster
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addContractSchema.parse(body);

    const {
      sleeperPlayerId,
      teamId,
      contractValue,
      contractYears,
      guaranteedMoney = 0,
      notes,
    } = validatedData;

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

    // Verificar se o jogador já tem contrato ativo com este time
    const existingContract = await prisma.contract.findFirst({
      where: {
        playerId: player.id,
        teamId,
        status: 'ACTIVE',
      },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: 'Jogador já possui contrato ativo com este time' },
        { status: 400 },
      );
    }

    // Verificar se o jogador está no roster do time
    const rosterEntry = await prisma.teamRoster.findFirst({
      where: {
        teamId,
        sleeperPlayerId,
      },
    });

    if (!rosterEntry) {
      return NextResponse.json({ error: 'Jogador não está no roster do time' }, { status: 400 });
    }

    // Criar o contrato
    const contract = await prisma.contract.create({
      data: {
        playerId: player.id,
        teamId,
        leagueId: team.leagueId,
        currentSalary: contractValue,
        originalSalary: contractValue,
        yearsRemaining: contractYears,
        originalYears: contractYears,
        status: 'ACTIVE',
        acquisitionType: 'FAAB',
        signedSeason: new Date().getFullYear(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      contract,
      message: `Contrato criado para ${player.name} no valor de $${contractValue.toLocaleString()} por ${contractYears} ano(s)`,
    });
  } catch (error) {
    console.error('Erro ao adicionar contrato:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
