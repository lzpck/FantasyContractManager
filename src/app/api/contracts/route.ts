import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isDemoUser } from '@/data/demoData';

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

    // Para usuário demo, retornar dados fictícios
    if (isDemoUser(userEmail)) {
      const mockContracts = [
        {
          id: 'contract-1',
          playerId: 'player-1',
          teamId: 'team-1',
          leagueId: 'league-1',
          currentSalary: 15000000,
          originalSalary: 12000000,
          yearsRemaining: 3,
          originalYears: 4,
          status: 'ACTIVE',
          acquisitionType: 'AUCTION',
          signedSeason: '2023',
          hasBeenTagged: false,
          hasBeenExtended: false,
          player: {
            id: 'player-1',
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
          },
        },
        {
          id: 'contract-2',
          playerId: 'player-2',
          teamId: 'team-1',
          leagueId: 'league-1',
          currentSalary: 8000000,
          originalSalary: 8000000,
          yearsRemaining: 1,
          originalYears: 2,
          status: 'ACTIVE',
          acquisitionType: 'FAAB',
          signedSeason: '2024',
          hasBeenTagged: false,
          hasBeenExtended: false,
          player: {
            id: 'player-2',
            name: 'Stefon Diggs',
            position: 'WR',
            team: 'BUF',
          },
        },
        {
          id: 'contract-3',
          playerId: 'player-3',
          teamId: 'team-2',
          leagueId: 'league-2',
          currentSalary: 12000000,
          originalSalary: 10000000,
          yearsRemaining: 2,
          originalYears: 3,
          status: 'ACTIVE',
          acquisitionType: 'ROOKIE_DRAFT',
          signedSeason: '2023',
          hasBeenTagged: false,
          hasBeenExtended: true,
          player: {
            id: 'player-3',
            name: 'Justin Jefferson',
            position: 'WR',
            team: 'MIN',
          },
        },
      ];

      return NextResponse.json(mockContracts);
    }

    // Buscar usuário real
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar contratos das ligas onde o usuário tem times
    const contracts = await prisma.contract.findMany({
      where: {
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

    // Para usuário demo, simular criação
    if (isDemoUser(userEmail)) {
      const mockContract = {
        id: `contract-${Date.now()}`,
        playerId,
        teamId,
        leagueId,
        originalSalary,
        currentSalary: currentSalary || originalSalary,
        originalYears,
        yearsRemaining: yearsRemaining || originalYears,
        acquisitionType,
        hasFourthYearOption: hasFourthYearOption || false,
        hasBeenTagged: hasBeenTagged || false,
        hasBeenExtended: hasBeenExtended || false,
        fourthYearOptionActivated: fourthYearOptionActivated || false,
        signedSeason: signedSeason || new Date().getFullYear(),
        status: status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Contrato criado (modo demo):', mockContract);
      return NextResponse.json({ contract: mockContract }, { status: 201 });
    }

    // Buscar usuário real
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

    // Verificar se o time pertence ao usuário e está na liga correta
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ownerId: user.id,
        leagueId: leagueId,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Time não encontrado, não pertence ao usuário ou não está na liga especificada' },
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
        status: (status || 'active').toUpperCase(),
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
