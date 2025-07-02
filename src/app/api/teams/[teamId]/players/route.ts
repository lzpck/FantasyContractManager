import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * GET /api/teams/[teamId]/players
 *
 * Busca todos os jogadores do roster de um time específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { teamId } = await params;

    // Removido verificação de usuário demo

    // Verificar se o usuário tem acesso ao time
    // (proprietário do time, comissário da liga ou membro da liga)
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        OR: [
          // Proprietário do time
          {
            owner: {
              email: userEmail!,
            },
          },
          // Comissário da liga
          {
            league: {
              commissioner: {
                email: userEmail!,
              },
            },
          },
          // Membro da liga
          {
            league: {
              leagueUsers: {
                some: {
                  user: {
                    email: userEmail!,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        league: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado ou acesso negado' }, { status: 404 });
    }

    // Buscar jogadores do roster do time
    const rosterPlayers = await prisma.teamRoster.findMany({
      where: {
        teamId: teamId,
      },
      include: {
        player: true,
      },
      orderBy: {
        status: 'asc', // active, ir, taxi
      },
    });

    // Transformar dados para o formato esperado pelo frontend
    const players = rosterPlayers.map(rosterEntry => ({
      sleeperPlayerId: rosterEntry.sleeperPlayerId,
      name: rosterEntry.player.name,
      position: rosterEntry.player.position,
      fantasyPositions: rosterEntry.player.fantasyPositions
        ? rosterEntry.player.fantasyPositions.split(',')
        : [],
      nflTeam: rosterEntry.player.team,
      age: rosterEntry.player.age,
      status: rosterEntry.status, // active, ir, taxi
      player: {
        ...rosterEntry.player,
        fantasyPositions: rosterEntry.player.fantasyPositions
          ? rosterEntry.player.fantasyPositions.split(',')
          : [],
      },
    }));

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Erro ao buscar jogadores do time:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
