import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para processar trade
const processTradeSchema = z.object({
  contractId: z.string().min(1, 'ID do contrato é obrigatório'),
  fromTeam: z.string().min(1, 'Time de origem é obrigatório'),
  toTeam: z.string().min(1, 'Time de destino é obrigatório'),
  playerName: z.string().min(1, 'Nome do jogador é obrigatório'),
});

/**
 * POST /api/roster-transactions/process-trade
 * Processa uma trade diretamente, atualizando o contrato do jogador
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = processTradeSchema.parse(body);

    const { contractId, fromTeam, toTeam, playerName } = validatedData;

    // Buscar o contrato
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        player: true,
        team: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 },
      );
    }

    // Buscar o time de destino
    const destinationTeam = await prisma.team.findFirst({
      where: { name: toTeam },
    });

    if (!destinationTeam) {
      return NextResponse.json(
        { success: false, error: 'Time de destino não encontrado' },
        { status: 404 },
      );
    }

    // Atualizar o contrato para o novo time e marcar como trade
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        teamId: destinationTeam.id,
        acquisitionType: 'TRADE',
        updatedAt: new Date(),
      },
      include: {
        player: true,
        team: true,
      },
    });

    console.log(`Trade processada: ${playerName} de ${fromTeam} para ${toTeam}`);

    return NextResponse.json({
      success: true,
      message: `Trade processada com sucesso: ${playerName} transferido para ${toTeam}`,
      contract: updatedContract,
    });
  } catch (error) {
    console.error('Erro ao processar trade:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor ao processar trade',
      },
      { status: 500 },
    );
  }
}
