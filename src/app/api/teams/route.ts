import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teams
 *
 * Lista todos os times do usuário autenticado.
 * Retorna dados reais do banco de dados exclusivamente.
 */
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Usuários reais: buscar times do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      include: {
        teams: {
          include: {
            league: true,
            contracts: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                player: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Calcular dados de salary cap para cada time
    const teamsWithSalaryCap = user.teams.map(team => {
      const totalUsedCap = team.contracts.reduce((sum, contract) => {
        return sum + contract.currentSalary;
      }, 0);

      const availableCap = team.league.salaryCap - totalUsedCap;
      const usedPercentage = (totalUsedCap / team.league.salaryCap) * 100;

      const expiringContracts = team.contracts.filter(
        contract => contract.yearsRemaining === 1,
      ).length;

      return {
        id: team.id,
        name: team.name,
        leagueId: team.leagueId,
        ownerId: team.ownerId,
        currentSalaryCap: team.league.salaryCap,
        currentDeadMoney: team.currentDeadMoney || 0,
        usedCap: totalUsedCap,
        availableCap,
        usedPercentage,
        activeContracts: team.contracts.length,
        expiringContracts,
      };
    });

    return NextResponse.json(teamsWithSalaryCap);
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
