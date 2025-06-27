import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

/**
 * GET /api/teams
 *
 * Lista todos os times do usuário autenticado.
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, retorna dados reais do banco.
 */
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Usuário demo: não acessa dados reais
    if (isDemoUser(userEmail)) {
      return NextResponse.json({
        teams: [], // Dados demo são gerenciados no frontend
        message: 'Dados demo gerenciados no frontend',
      });
    }

    // Usuários reais: buscar times do banco de dados
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
      include: {
        teams: {
          include: {
            league: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      teams: user.teams,
      total: user.teams.length,
    });
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
