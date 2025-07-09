import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/gpt/players/search
 *
 * Busca avançada de jogadores com múltiplos critérios
 *
 * Body:
 * {
 *   "players": ["Josh Allen", "Patrick Mahomes"],
 *   "includeContracts": true,
 *   "leagueId": "optional-league-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const body = await request.json();
    const { players: playerNames, includeContracts = false, leagueId } = body;

    if (!playerNames || !Array.isArray(playerNames)) {
      return NextResponse.json({ error: 'Lista de jogadores é obrigatória' }, { status: 400 });
    }

    // Construir filtros
    const whereClause: any = {
      name: {
        in: playerNames,
        mode: 'insensitive',
      },
    };

    // Incluir contratos se solicitado
    const include: any = {};
    if (includeContracts) {
      include.contracts = {
        where: leagueId ? {
          team: {
            leagueId: leagueId
          }
        } : {},
        include: {
          team: {
            include: {
              league: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      };
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      include,
      orderBy: {
        name: 'asc',
      },
    });

    // Formatar resposta
    const formattedPlayers = players.map(player => {
      const playerData: any = {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        sleeperPlayerId: player.sleeperPlayerId,
      };

      if (includeContracts && player.contracts) {
        playerData.contracts = player.contracts.map(contract => ({
          id: contract.id,
          currentSalary: contract.currentSalary,
          yearsRemaining: contract.yearsRemaining,
          status: contract.status,
          hasBeenExtended: contract.hasBeenExtended,
          hasBeenTagged: contract.hasBeenTagged,
          team: contract.team ? {
            id: contract.team.id,
            name: contract.team.name,
            sleeperTeamId: contract.team.sleeperTeamId,
            league: contract.team.league ? {
              id: contract.team.league.id,
              name: contract.team.league.name,
              sleeperLeagueId: contract.team.league.sleeperLeagueId
            } : null
          } : null
        }));
      }

      return playerData;
    });

    return NextResponse.json({
      success: true,
      count: formattedPlayers.length,
      players: formattedPlayers,
    });

  } catch (error) {
    console.error('Erro na busca avançada de jogadores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}