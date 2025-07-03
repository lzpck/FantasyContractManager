import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Schema de validação para atualização de perfil
 */
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional(),
});

/**
 * Schema de validação para alteração de senha
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Nova senha e confirmação não coincidem',
  path: ['confirmPassword'],
});

/**
 * API para buscar dados do perfil do usuário autenticado
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * API para atualizar dados do perfil do usuário autenticado
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'profile') {
      // Atualização de dados pessoais
      const validation = updateProfileSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { name, email } = validation.data;

      // Verificar se o email já está em uso por outro usuário
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: session.user.id },
          },
        });

        if (existingUser) {
          return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
        }
      }

      // Atualizar dados do usuário
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          updatedAt: new Date().toISOString(),
        },
        select: {
          id: true,
          name: true,
          login: true,
          email: true,
          role: true,
          teamId: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              league: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Perfil atualizado com sucesso',
        user: updatedUser,
      });
    } else if (type === 'password') {
      // Alteração de senha
      const validation = changePasswordSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Dados inválidos', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { currentPassword, newPassword } = validation.data;

      // Buscar usuário com senha atual
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, password: true },
      });

      if (!user || !user.password) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }

      // Hash da nova senha
      const hashedNewPassword = await hashPassword(newPassword);

      // Atualizar senha
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        message: 'Senha alterada com sucesso',
      });
    } else {
      return NextResponse.json({ error: 'Tipo de operação inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}