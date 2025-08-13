import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Executar a virada de temporada em uma transação
    const result = await prisma.$transaction(async tx => {
      const updatedContracts = [];
      const expiredContracts = [];

      for (const contract of activeContracts) {
        const newYearsRemaining = contract.yearsRemaining - 1;

        // Só aplicar aumento salarial se o contrato não chegar a zero anos
        // Quando chega a zero, o jogador se torna free agent ou precisa de extensão/tag
        const newSalary =
          newYearsRemaining > 0
            ? contract.currentSalary * (1 + league.annualIncreasePercentage / 100)
            : contract.currentSalary; // Mantém o salário atual se chegar a zero anos

        // Atualizar o contrato
        const updatedContract = await tx.contract.update({
          where: { id: contract.id },
          data: {
            yearsRemaining: newYearsRemaining,
            currentSalary: newSalary,
            updatedAt: new Date().toISOString(),
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

        updatedContracts.push(updatedContract);

        // Se o contrato expirou (0 anos restantes), marcar como expirado
        if (newYearsRemaining === 0) {
          await tx.contract.update({
            where: { id: contract.id },
            data: {
              status: 'EXPIRED',
              updatedAt: new Date().toISOString(),
            },
          });
          expiredContracts.push(updatedContract);
        }
      }

      // Atualizar a temporada da liga
      await tx.league.update({
        where: { id: leagueId },
        data: {
          season: league.season + 1,
          updatedAt: new Date().toISOString(),
        },
      });

      // Resetar flags de franchise tag para a nova temporada
      await tx.contract.updateMany({
        where: {
          leagueId,
          status: 'ACTIVE',
        },
        data: {
          hasBeenTagged: false,
          updatedAt: new Date().toISOString(),
        },
      });

      return {
        updatedContracts,
        expiredContracts,
        totalUpdated: updatedContracts.length,
      };
    });

    // Log da operação para auditoria
    console.log(`Virada de temporada executada para liga ${league.name}:`, {
      leagueId,
      season: league.season + 1,
      contractsUpdated: result.totalUpdated,
      expiredContracts: result.expiredContracts.length,
      executedBy: session.user.email,
      executedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Virada de temporada executada com sucesso',
      contractsUpdated: result.totalUpdated,
      expiredContracts: result.expiredContracts.length,
      newSeason: league.season + 1,
      summary: {
        totalProcessed: result.totalUpdated,
        contractsExpired: result.expiredContracts.length,
        contractsActive: result.totalUpdated - result.expiredContracts.length,
      },
    });
  } catch (error) {
    console.error('Erro ao executar virada de temporada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao executar virada de temporada' },
      { status: 500 },
    );
  }
}
