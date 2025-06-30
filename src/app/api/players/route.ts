import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sleeperPlayerId = searchParams.get('sleeperPlayerId');

    // Se foi fornecido um sleeperPlayerId específico, buscar apenas esse jogador
    if (sleeperPlayerId) {
      const player = await prisma.player.findFirst({
        where: { sleeperPlayerId },
      });

      if (!player) {
        return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
      }

      const playerData = {
        id: player.id,
        name: player.name,
        position: player.position,
        fantasyPositions: player.fantasyPositions.split(',').filter(s => s),
        nflTeam: player.team,
        age: player.age,
        sleeperPlayerId: player.sleeperPlayerId,
        isActive: player.isActive,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      };

      return NextResponse.json(playerData);
    }

    // Caso contrário, retornar todos os jogadores
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
