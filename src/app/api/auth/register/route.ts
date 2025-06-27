import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';

/**
 * API para registro de novos usuários
 */
export async function POST(request: NextRequest) {
  try {
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
    let userRole = UserRole.VIEWER;
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
