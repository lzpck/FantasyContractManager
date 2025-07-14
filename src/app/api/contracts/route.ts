import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo

/**
 * GET /api/contracts
 * Busca todos os contratos das ligas do usuário
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Para o dashboard analytics, retornar todos os contratos das ligas acessíveis
    // Dashboard precisa de dados agregados da liga, não filtrados por usuário
    // Buscar todas as ligas onde o usuário tem acesso (como membro ou comissário)
    const userLeagues = await prisma.leagueUser.findMany({
      where: { userId: user.id },
      select: { leagueId: true },
    });

    const commissionedLeagues = await prisma.league.findMany({
      where: { commissionerId: user.id },
      select: { id: true },
    });

    const allAccessibleLeagueIds = [
      ...userLeagues.map(ul => ul.leagueId),
      ...commissionedLeagues.map(cl => cl.id),
    ];

    const whereClause = {
      team: {
        leagueId: {
          in: allAccessibleLeagueIds,
        },
      },
    };

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        player: true,
        team: {
          include: {
            league: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/contracts
 * Cria um novo contrato
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = await request.json();

    const {
      playerId,
      teamId,
      leagueId,
      originalSalary,
      currentSalary,
      originalYears,
      yearsRemaining,
      acquisitionType,
      hasFourthYearOption,
      hasBeenTagged,
      hasBeenExtended,
      fourthYearOptionActivated,
      signedSeason,
      status,
    } = body;

    // Validação básica
    if (!playerId || !teamId || !leagueId || !originalSalary || !originalYears) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: playerId, teamId, leagueId, originalSalary, originalYears' },
        { status: 400 },
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o jogador existe (buscar pelo id)
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    }

    // Verificar se a liga existe
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
    });

    if (!league) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
    }

    // Verificar se o time existe e está na liga correta
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        leagueId: leagueId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Time não encontrado ou não está na liga especificada' },
        { status: 404 },
      );
    }

    // Verificar se o usuário tem permissão para adicionar contratos neste time
    // Permitir se: 1) É dono do time OU 2) É comissário da liga
    const isTeamOwner = team.ownerId === user.id;
    const isLeagueCommissioner = league.commissionerId === user.id;

    if (!isTeamOwner && !isLeagueCommissioner) {
      return NextResponse.json(
        {
          error:
            'Você não tem permissão para adicionar contratos neste time. Apenas o dono do time ou o comissário da liga podem fazer isso.',
        },
        { status: 403 },
      );
    }

    // Verificar se já existe um contrato ativo para este jogador neste time
    const existingContract = await prisma.contract.findFirst({
      where: {
        playerId: player.id,
        teamId,
        status: 'ACTIVE',
      },
    });

    if (existingContract) {
      return NextResponse.json(
        { error: 'Jogador já possui contrato ativo neste time' },
        { status: 409 },
      );
    }

    // Criar o contrato
    const contract = await prisma.contract.create({
      data: {
        playerId: player.id,
        teamId,
        leagueId,
        originalSalary,
        currentSalary: currentSalary || originalSalary,
        originalYears,
        yearsRemaining: yearsRemaining || originalYears,
        acquisitionType: acquisitionType.toUpperCase(),
        hasFourthYearOption: hasFourthYearOption || false,
        hasBeenTagged: hasBeenTagged || false,
        hasBeenExtended: hasBeenExtended || false,
        fourthYearOptionActivated: fourthYearOptionActivated || false,
        signedSeason: signedSeason || new Date().getFullYear(),
        status: (status || 'ACTIVE').toUpperCase(),
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

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
