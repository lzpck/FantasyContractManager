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
        { status: 403 },
      );
    }

    const { name, login, email, password, role, teamId } = await request.json();

    // Validação básica
    if (!name || !login || !email || !password) {
      return NextResponse.json({ error: 'Nome, login, email e senha são obrigatórios' }, { status: 400 });
    }

    // Para usuários (não comissários), teamId é obrigatório
    if (role === UserRole.USER && !teamId) {
      return NextResponse.json({ error: 'Seleção de time é obrigatória para usuários' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
    }

    // Verificar se o login já existe
    const existingUserByLogin = await prisma.user.findUnique({
      where: { login },
    });

    if (existingUserByLogin) {
      return NextResponse.json({ error: 'Login já está em uso' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Determinar o role (apenas comissários podem criar outros comissários)
    let userRole = UserRole.USER;
    if (role && Object.values(UserRole).includes(role)) {
      userRole = role;
    }

    // Verificar se o time existe e está disponível (se teamId foi fornecido)
    let team = null;
    if (teamId) {
      team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { 
          owner: true,
          league: true,
        },
      });

      if (!team) {
        return NextResponse.json({ error: 'Time não encontrado' }, { status: 400 });
      }

      if (team.ownerId) {
        return NextResponse.json({ error: 'Time já possui um usuário associado' }, { status: 400 });
      }
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        login,
        email,
        password: hashedPassword,
        role: userRole,
        teamId: teamId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        teamId: true,
        createdAt: true,
      },
    });

    // Se um time foi selecionado, associar o usuário ao time
    if (teamId && team) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          ownerId: user.id,
          updatedAt: new Date().toISOString(),
        },
      });

      // Garantir que o usuário seja membro da liga
      await prisma.leagueUser.create({
        data: {
          leagueId: team.leagueId,
          userId: user.id,
          role: 'MEMBER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      // Log da operação para auditoria
      console.log(`[AUDIT] Usuário ${user.id} (${user.name}) criado e associado ao time ${teamId} (${team.name}) na liga ${team.leagueId}`);
    }

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
