import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API para operações individuais de eventos
 *
 * GET: Busca um evento específico
 * PUT: Atualiza um evento (apenas comissários)
 * DELETE: Remove um evento (apenas comissários)
 */

// GET /api/leagues/[leagueId]/events/[eventId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; eventId: string }> },
) {
  try {
    const { leagueId, eventId } = await params;

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
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
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/leagues/[leagueId]/events/[eventId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId, eventId } = await params;
    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    // Validações básicas
    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Nome e data de início são obrigatórios' },
        { status: 400 },
      );
    }

    // Verificar se o evento existe e pertence à liga
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        leagueId,
      },
      include: {
        league: {
          select: { commissionerId: true },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é comissário da liga
    if (existingEvent.league.commissionerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas comissários podem editar eventos' },
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

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        description: description || null,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime?.toISOString() || null,
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

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/leagues/[leagueId]/events/[eventId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string; eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leagueId, eventId } = await params;

    // Verificar se o evento existe e pertence à liga
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        leagueId,
      },
      include: {
        league: {
          select: { commissionerId: true },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é comissário da liga
    if (existingEvent.league.commissionerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Apenas comissários podem excluir eventos' },
        { status: 403 },
      );
    }

    // Excluir evento
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Evento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
