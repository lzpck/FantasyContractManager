import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { UserRole } from '@/types/database';

/**
 * API para registro de novos usuários
 * Requer autenticação e perfil COMMISSIONER
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é comissário
    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem criar usuários.' },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await request.json();

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Determinar o role (apenas comissários podem criar outros comissários)
    let userRole = UserRole.USER;
    if (role && Object.values(UserRole).includes(role)) {
      userRole = role;
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
