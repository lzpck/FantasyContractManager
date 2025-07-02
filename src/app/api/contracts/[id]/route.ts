import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * PUT /api/contracts/[id]
 * Atualiza um contrato existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const url = new URL(request.url);
    const contractId = url.pathname.split('/').pop();
    const body = await request.json();

    const {
      originalSalary,
      currentSalary,
      originalYears,
      yearsRemaining,
      acquisitionType,
      hasFourthYearOption,
      hasBeenTagged,
      hasBeenExtended,
      fourthYearOptionActivated,
      status,
    } = body;

    // Validação básica
    if (!originalSalary || !originalYears) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: originalSalary, originalYears' },
        { status: 400 },
      );
    }

    // Removido verificação de usuário demo

    // Buscar usuário real
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o contrato existe e pertence ao usuário
    const existingContract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        team: {
          ownerId: user.id,
        },
      },
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado ou não pertence ao usuário' },
        { status: 404 },
      );
    }

    // Verificar se o usuário é comissário da liga
    const isCommissioner = user.role === 'COMMISSIONER';
    if (!isCommissioner) {
      return NextResponse.json(
        { error: 'Apenas comissários podem editar contratos' },
        { status: 403 },
      );
    }

    // Atualizar o contrato
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        originalSalary,
        currentSalary: currentSalary || originalSalary,
        originalYears,
        yearsRemaining: yearsRemaining || originalYears,
        acquisitionType: acquisitionType?.toUpperCase(),
        hasFourthYearOption: hasFourthYearOption || false,
        hasBeenTagged: hasBeenTagged || false,
        hasBeenExtended: hasBeenExtended || false,
        fourthYearOptionActivated: fourthYearOptionActivated || false,
        status: (status || 'ACTIVE').toUpperCase(),
        updatedAt: new Date(),
      },
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
    });

    return NextResponse.json({ contract: updatedContract }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/contracts/[id]
 * Remove um contrato (cortar jogador)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const url = new URL(request.url);
    const contractId = url.pathname.split('/').pop();

    // Removido verificação de usuário demo

    // Buscar usuário real
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o contrato existe e pertence ao usuário
    const existingContract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        team: {
          ownerId: user.id,
        },
      },
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado ou não pertence ao usuário' },
        { status: 404 },
      );
    }

    // Verificar se o usuário é comissário da liga
    const isCommissioner = user.role === 'COMMISSIONER';
    if (!isCommissioner) {
      return NextResponse.json(
        { error: 'Apenas comissários podem remover contratos' },
        { status: 403 },
      );
    }

    // Marcar contrato como inativo (não deletar para manter histórico)
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Contrato removido com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover contrato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
