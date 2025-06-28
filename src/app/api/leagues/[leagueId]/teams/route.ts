import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

export async function GET(request: NextRequest, context: { params: { leagueId: string } }) {
  const { leagueId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (isDemoUser(userEmail)) {
      return NextResponse.json({ teams: [], message: 'Dados demo gerenciados no frontend' });
    }

    const teams = await prisma.team.findMany({
      where: { leagueId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Erro ao buscar times da liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
