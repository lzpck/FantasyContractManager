import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

/**
 * GET /api/teams
 *
 * Lista todos os times do usuário autenticado.
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, retorna dados reais do banco.
 */
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Usuário demo: retornar dados fictícios com salary cap
    if (isDemoUser(userEmail)) {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Time Demo 1',
          leagueId: 'league-1',
          ownerId: 'demo-user',
          currentSalaryCap: 200000000,
          currentDeadMoney: 5000000,
          usedCap: 180000000,
          availableCap: 20000000,
          usedPercentage: 90,
          activeContracts: 25,
          expiringContracts: 3,
        },
        {
          id: 'team-2',
          name: 'Time Demo 2',
          leagueId: 'league-2',
          ownerId: 'demo-user',
          currentSalaryCap: 200000000,
          currentDeadMoney: 2000000,
          usedCap: 150000000,
          availableCap: 50000000,
          usedPercentage: 75,
          activeContracts: 22,
          expiringContracts: 1,
        },
      ];

      return NextResponse.json(mockTeams);
    }

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
