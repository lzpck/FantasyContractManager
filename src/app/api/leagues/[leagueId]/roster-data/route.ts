import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/leagues/[leagueId]/roster-data
 * Busca dados atuais do roster de todos os times da liga
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;

    // Verificar se a liga existe
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    // Buscar todos os times da liga com seus rosters
    const teams = await prisma.team.findMany({
      where: { leagueId },
      select: {
        id: true,
        name: true,
        sleeperTeamId: true,
      },
    });

    // Buscar todos os jogadores dos rosters da liga
    const rosterPlayers = await prisma.teamRoster.findMany({
      where: {
        team: {
          leagueId,
        },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            sleeperPlayerId: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            sleeperTeamId: true,
          },
        },
      },
    });

    // Transformar dados para o formato esperado pelo hook
    const currentRosters = rosterPlayers.map(rosterEntry => ({
      sleeperPlayerId: rosterEntry.sleeperPlayerId,
      teamId: rosterEntry.teamId,
      status: rosterEntry.status as 'active' | 'ir' | 'taxi',
      player: {
        name: rosterEntry.player.name,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        teams,
        currentRosters,
        league: {
          id: league.id,
          name: league.name,
          sleeperLeagueId: league.sleeperLeagueId,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do roster:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
