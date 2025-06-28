import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchSleeperRosters } from '@/services/sleeperService';
import { isDemoUser } from '@/data/demoData';

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string; teamId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (isDemoUser(userEmail)) {
      return NextResponse.json({ active: [], reserve: [], taxi: [] });
    }

    const { leagueId, teamId } = params;

    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league || !league.sleeperLeagueId) {
      return NextResponse.json({ error: 'Liga não encontrada ou sem integração' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { contracts: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    const rosters = await fetchSleeperRosters(league.sleeperLeagueId);
    const roster = rosters.find(
      r => r.roster_id.toString() === team.sleeperTeamId || r.owner_id === team.sleeperOwnerId,
    );

    if (!roster) {
      return NextResponse.json({ active: [], reserve: [], taxi: [] });
    }

    const ids = Array.from(
      new Set([...(roster.players || []), ...(roster.reserve || []), ...(roster.taxi || [])]),
    );

    const dbPlayers = await prisma.player.findMany({
      where: { sleeperPlayerId: { in: ids } },
    });
    const contracts = await prisma.contract.findMany({ where: { teamId } });

    const mapPlayer = (pid: string) => {
      const db = dbPlayers.find(p => p.sleeperPlayerId === pid);
      if (!db) return null;
      const contract = contracts.find(c => c.playerId === db.id);
      return {
        player: {
          id: db.id,
          sleeperPlayerId: db.sleeperPlayerId,
          name: db.name,
          position: db.position,
          fantasyPositions: db.fantasyPositions.split(',').filter(s => s),
          nflTeam: db.team,
          age: db.age ?? undefined,
          isActive: db.isActive,
          createdAt: db.createdAt,
          updatedAt: db.updatedAt,
        },
        contract: contract || null,
      };
    };

    const active = (roster.players || [])
      .map(mapPlayer)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const reserve = (roster.reserve || [])
      .map(mapPlayer)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const taxi = (roster.taxi || [])
      .map(mapPlayer)
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    return NextResponse.json({ active, reserve, taxi });
  } catch (error) {
    console.error('Erro ao buscar roster:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
