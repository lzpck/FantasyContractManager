import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/database';
import { fetchSleeperPlayers, transformSleeperPlayersToLocal } from '@/services/sleeperService';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem importar jogadores.' },
        { status: 403 },
      );
    }

    const sleeperPlayers = await fetchSleeperPlayers();
    const allowed = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];
    const players = transformSleeperPlayersToLocal(sleeperPlayers, allowed);

    const batchSize = 100;
    for (let i = 0; i < players.length; i += batchSize) {
      const operations = players.slice(i, i + batchSize).map(p =>
        prisma.player.upsert({
          where: { sleeperPlayerId: p.sleeperPlayerId },
          update: {
            name: p.name,
            position: p.position,
            fantasyPositions: Array.isArray(p.fantasyPositions) ? p.fantasyPositions.join(',') : p.fantasyPositions,
            team: p.team || 'FA',
            age: p.age,
            isActive: p.isActive,
          },
          create: {
            name: p.name,
            position: p.position,
            fantasyPositions: Array.isArray(p.fantasyPositions) ? p.fantasyPositions.join(',') : p.fantasyPositions,
            team: p.team || 'FA',
            age: p.age,
            sleeperPlayerId: p.sleeperPlayerId,
            isActive: p.isActive,
          },
        }),
      );
      await prisma.$transaction(operations);
    }

    return NextResponse.json({ success: true, imported: players.length });
  } catch (error) {
    console.error('Erro ao importar jogadores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
