import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dbPlayers = await prisma.player.findMany({ orderBy: { name: 'asc' } });
    const players = dbPlayers.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      fantasyPositions: p.fantasyPositions.split(',').filter(s => s),
      nflTeam: p.team,
      age: p.age,
      sleeperPlayerId: p.sleeperPlayerId,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
