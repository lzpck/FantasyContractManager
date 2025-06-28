import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const players = await prisma.player.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
