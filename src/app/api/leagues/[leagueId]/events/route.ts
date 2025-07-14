import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API para gerenciamento de eventos da liga
 *
 * GET: Lista todos os eventos de uma liga
 * POST: Cria um novo evento (apenas comissários)
 */

// GET /api/leagues/[leagueId]/events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const { leagueId } = await params;

    // Buscar eventos da liga ordenados por data de início
    const events = await prisma.event.findMany({
      where: {
        leagueId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/leagues/[leagueId]/events
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    // Validações básicas
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Nome e data de início são obrigatórios' },
        { status: 400 },
      );
    }

    // Verificar se o usuário é comissário da liga
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { commissionerId: true },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    if (league.commissionerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas comissários podem criar eventos' },
        { status: 403 },
      );
    }

    // Validar datas
    const startDateTime = new Date(startDate);
    const endDateTime = endDate ? new Date(endDate) : null;

    if (endDateTime && endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: 'Data de fim deve ser posterior à data de início' },
        { status: 400 },
      );
    }

    // Criar evento
    const event = await prisma.event.create({
      data: {
        leagueId,
        name,
        description: description || null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString() || null,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
