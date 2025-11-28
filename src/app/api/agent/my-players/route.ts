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
    const team = await prisma.team.findFirst({
      where: {
        ownerId: user.id,
        league: {
          status: 'ACTIVE',
        },
      },
    });

    if (!team) {
      return NextResponse.json([]);
    }

    // Busca jogadores com contrato ativo neste time que estão expirando (<= 1 ano)
    const activeContracts = await prisma.contract.findMany({
      where: {
        teamId: team.id,
        status: 'ACTIVE',
        yearsRemaining: {
          lte: 1,
        },
      },
      include: {
        player: true,
      },
    });

    const players = activeContracts.map(contract => {
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
