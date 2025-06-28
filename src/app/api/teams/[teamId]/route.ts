import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (isDemoUser(userEmail)) {
      return NextResponse.json({ team: null, message: 'Dados demo gerenciados no frontend' });
    }

    const { teamId } = params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Erro ao buscar time:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
