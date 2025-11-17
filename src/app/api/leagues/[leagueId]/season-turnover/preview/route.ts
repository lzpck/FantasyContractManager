import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/leagues/[leagueId]/season-turnover/preview
 * Pré-visualização das alterações da virada de temporada
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
        { error: 'Apenas o comissário pode visualizar a virada de temporada' },
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
      orderBy: [{ team: { name: 'asc' } }, { player: { name: 'asc' } }],
    });

    // Calcular as alterações para cada contrato
    const contractChanges = activeContracts.map(contract => {
      const newYearsRemaining = contract.yearsRemaining - 1;

      // Aplicar aumento salarial apenas se o contrato não chegar a zero anos
      // Ao chegar a zero anos, o salário é automaticamente redefinido para 0
      const newSalary =
        newYearsRemaining > 0
          ? contract.currentSalary * (1 + league.annualIncreasePercentage / 100)
          : 0;

      // Determinar o novo status do contrato
      let newStatus: 'Elegível para Extensão' | 'Elegível para Tag' | 'Contrato Ativo';

      if (newYearsRemaining === 0) {
        // Jogador no último ano após a virada
        if (!contract.hasBeenExtended) {
          // Pode estender
          newStatus = 'Elegível para Extensão';
        } else if (!contract.hasBeenTagged) {
          // Já foi estendido, mas ainda pode usar tag
          newStatus = 'Elegível para Tag';
        } else {
          // Já foi tagueado, contrato ativo normal
          newStatus = 'Contrato Ativo';
        }
      } else {
        newStatus = 'Contrato Ativo';
      }

      return {
        id: contract.id,
        playerName: contract.player.name,
        teamName: contract.team.name,
        currentYearsRemaining: contract.yearsRemaining,
        newYearsRemaining,
        currentSalary: contract.currentSalary,
        newSalary,
        newStatus,
        hasBeenExtended: contract.hasBeenExtended,
        hasBeenTagged: contract.hasBeenTagged,
      };
    });

    // Classificar contratos nas 3 categorias conforme especificado
    const contractsAffected = contractChanges.filter(c => c.currentYearsRemaining > 0);
    const eligibleForExtension = contractChanges.filter(
      c => c.newYearsRemaining === 0 && !c.hasBeenExtended,
    );
    const eligibleForFranchiseTag = contractChanges.filter(
      c => c.newYearsRemaining === 0 && !c.hasBeenTagged,
    );

    return NextResponse.json({
      contractChanges,
      categories: {
        contractsAffected: {
          count: contractsAffected.length,
          contracts: contractsAffected,
        },
        eligibleForExtension: {
          count: eligibleForExtension.length,
          contracts: eligibleForExtension,
        },
        eligibleForFranchiseTag: {
          count: eligibleForFranchiseTag.length,
          contracts: eligibleForFranchiseTag,
        },
      },
      summary: {
        totalContracts: contractChanges.length,
        contractsAffected: contractsAffected.length,
        eligibleForExtension: eligibleForExtension.length,
        eligibleForFranchiseTag: eligibleForFranchiseTag.length,
      },
      leagueSettings: {
        annualIncreasePercentage: league.annualIncreasePercentage,
        seasonTurnoverDate: league.seasonTurnoverDate,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pré-visualização da virada de temporada:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
