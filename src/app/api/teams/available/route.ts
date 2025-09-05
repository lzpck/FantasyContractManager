import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teams/available
 *
 * Lista todos os times disponíveis (sem usuário associado) para seleção durante o cadastro.
 * Apenas comissários podem acessar esta rota.
 */
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar times disponíveis (sem proprietário associado)
    const availableTeams = await prisma.team.findMany({
      where: {
        ownerId: null, // Times sem proprietário associado
      },
      include: {
        league: {
          select: {
            id: true,
            name: true,
            season: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ league: { name: 'asc' } }, { name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      teams: availableTeams,
    });
  } catch (error) {
    console.error('Erro ao buscar times disponíveis:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
