import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const league = await prisma.league.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!league) {
      return NextResponse.json({ error: 'Nenhuma liga encontrada' }, { status: 404 });
    }
    return NextResponse.json({ league });
  } catch (error) {
    console.error('Erro ao obter liga única:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user || user.role !== 'COMMISSIONER') {
      return NextResponse.json(
        { error: 'Apenas comissários podem editar a liga' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { leagueId, sleeperLeagueId, name, season, salaryCap, totalTeams } = body;

    const targetLeague = leagueId
      ? await prisma.league.findUnique({ where: { id: leagueId } })
      : await prisma.league.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!targetLeague) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    const updated = await prisma.league.update({
      where: { id: targetLeague.id },
      data: {
        sleeperLeagueId: sleeperLeagueId ?? undefined,
        name: name ?? undefined,
        season: season ?? undefined,
        salaryCap: salaryCap ?? undefined,
        totalTeams: totalTeams ?? undefined,
      },
    });

    return NextResponse.json({ league: updated });
  } catch (error) {
    console.error('Erro ao atualizar liga única:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
