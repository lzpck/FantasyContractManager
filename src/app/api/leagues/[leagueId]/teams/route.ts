import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/leagues/[leagueId]/teams
 *
 * Lista todos os times de uma liga específica.
 * Retorna dados reais do banco de dados exclusivamente.
 */
export async function GET(request: NextRequest, context: { params: { leagueId: string } }) {
  const { leagueId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar times da liga no banco de dados
    const teams = await prisma.team.findMany({
      where: { leagueId },
      include: {
        league: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Formatar dados dos times
    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      leagueId: team.leagueId,
      ownerId: team.ownerId,
      ownerDisplayName: team.owner?.name || team.owner?.email || 'Sem dono',
      currentDeadMoney: team.currentDeadMoney || 0,
      nextSeasonDeadMoney: team.nextSeasonDeadMoney || 0,
      availableCap: 0, // Será calculado no frontend baseado nos contratos
      sleeperTeamId: team.sleeperTeamId,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return NextResponse.json({ teams: formattedTeams });
  } catch (error) {
    console.error('Erro ao buscar times da liga:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
