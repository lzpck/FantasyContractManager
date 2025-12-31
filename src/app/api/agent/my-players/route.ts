import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Busca o time do usuário na liga ativa
    // Prioridade 1: Pelo teamId associado no perfil do usuário
    // Prioridade 2: Pelo ownerId (times que o usuário possui)
    let team = null;

    if (user.teamId) {
      team = await prisma.team.findUnique({
        where: { id: user.teamId },
        include: { league: true },
      });
    }

    if (!team) {
      team = await prisma.team.findFirst({
        where: {
          ownerId: user.id,
          league: {
            status: 'ACTIVE',
          },
        },
      });
    }

    if (!team) {
      return NextResponse.json([]);
    }

    // Busca jogadores com contrato expirado (0 anos restantes) neste time
    // Filtra apenas jogadores que ainda estão no roster (não foram removidos do Sleeper)
    const expiredContracts = await prisma.contract.findMany({
      where: {
        teamId: team.id,
        status: 'EXPIRED',
        yearsRemaining: 0,
        player: {
          teamRosters: {
            some: {
              teamId: team.id,
            },
          },
        },
      },
      include: {
        player: true,
      },
    });

    const players = expiredContracts.map(contract => {
      const { player } = contract;
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        avatarUrl: `https://sleepercdn.com/content/nfl/players/${player.sleeperPlayerId}.jpg`,
      };
    });

    // Ordenação por posição padrão
    const POSITION_ORDER: Record<string, number> = {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 4,
      DL: 5,
      LB: 6,
      DB: 7,
      K: 8,
    };

    players.sort((a, b) => {
      const posA = POSITION_ORDER[a.position] || 99;
      const posB = POSITION_ORDER[b.position] || 99;
      return posA - posB;
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching user players:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
