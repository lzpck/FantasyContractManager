import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * API para listar usuários (apenas comissários)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            teams: true,
            leagues: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
