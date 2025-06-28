import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

/**
 * GET /api/contracts
 * Busca todos os contratos das ligas do usuário
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Para usuário demo, retornar dados fictícios
    if (isDemoUser(userEmail)) {
      const mockContracts = [
        {
          id: 'contract-1',
          playerId: 'player-1',
          teamId: 'team-1',
          leagueId: 'league-1',
          currentSalary: 15000000,
          originalSalary: 12000000,
          yearsRemaining: 3,
          originalYears: 4,
          status: 'ACTIVE',
          acquisitionType: 'AUCTION',
          signedSeason: '2023',
          hasBeenTagged: false,
          hasBeenExtended: false,
          player: {
            id: 'player-1',
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
          },
        },
        {
          id: 'contract-2',
          playerId: 'player-2',
          teamId: 'team-1',
          leagueId: 'league-1',
          currentSalary: 8000000,
          originalSalary: 8000000,
          yearsRemaining: 1,
          originalYears: 2,
          status: 'ACTIVE',
          acquisitionType: 'FAAB',
          signedSeason: '2024',
          hasBeenTagged: false,
          hasBeenExtended: false,
          player: {
            id: 'player-2',
            name: 'Stefon Diggs',
            position: 'WR',
            team: 'BUF',
          },
        },
        {
          id: 'contract-3',
          playerId: 'player-3',
          teamId: 'team-2',
          leagueId: 'league-2',
          currentSalary: 12000000,
          originalSalary: 10000000,
          yearsRemaining: 2,
          originalYears: 3,
          status: 'ACTIVE',
          acquisitionType: 'ROOKIE_DRAFT',
          signedSeason: '2023',
          hasBeenTagged: false,
          hasBeenExtended: true,
          player: {
            id: 'player-3',
            name: 'Justin Jefferson',
            position: 'WR',
            team: 'MIN',
          },
        },
      ];

      return NextResponse.json(mockContracts);
    }

    // Buscar usuário real
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar contratos das ligas onde o usuário tem times
    const contracts = await prisma.contract.findMany({
      where: {
        team: {
          ownerId: user.id,
        },
      },
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
