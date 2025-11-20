import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removido sistema demo
import { ContractStatus } from '@/types';

/**
 * POST /api/teams/[teamId]/contracts/[action]
 *
 * Executa ações específicas em contratos:
 * - edit: Editar contrato existente
 * - release: Liberar jogador (cortar)
 * - extend: Estender contrato
 * - tag: Aplicar franchise tag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; action: string }> },
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { teamId, action } = await params;

    // Removido verificação de usuário demo

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail! },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o time existe
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
      },
      include: {
        league: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem permissão para executar ações neste time
    // Permitir se: 1) É dono do time OU 2) É comissário da liga
    const isTeamOwner = team.ownerId === user.id;
    const isLeagueCommissioner = team.league.commissionerId === user.id;

    if (!isTeamOwner && !isLeagueCommissioner) {
      return NextResponse.json(
        {
          error:
            'Você não tem permissão para executar ações neste time. Apenas o dono do time ou o comissário da liga podem fazer isso.',
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    if ((action === 'edit' || action === 'extend') && !isLeagueCommissioner) {
      return NextResponse.json(
        { error: 'Apenas o comissário da liga pode editar ou estender contratos' },
        { status: 403 },
      );
    }

    switch (action) {
      case 'edit':
        return await handleEditContract(body, teamId);
      case 'release':
        return await handleReleasePlayer(body, teamId, team);
      case 'extend':
        return await handleExtendContract(body, teamId);
      case 'tag':
        return await handleFranchiseTag(body, teamId, team);
      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao executar ação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * Editar contrato existente
 */
async function handleEditContract(body: any, teamId: string) {
  const { contractId, currentSalary, yearsRemaining } = body;

  if (!contractId) {
    return NextResponse.json({ error: 'ID do contrato é obrigatório' }, { status: 400 });
  }

  // Verificar se o contrato existe e pertence ao time
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      teamId,
      status: 'ACTIVE',
    },
  });

  if (!contract) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  }

  // Atualizar contrato
  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      ...(currentSalary && { currentSalary: parseFloat(currentSalary) }),
      ...(yearsRemaining && { yearsRemaining: parseInt(yearsRemaining) }),
      updatedAt: new Date().toISOString(),
    },
    include: {
      player: true,
    },
  });

  return NextResponse.json({ contract: updatedContract });
}

/**
 * Função de cálculo e persistência de dead money
 */
async function handlePlayerCut(contract: any, league: { deadMoneyConfig: any; season: number }) {
  const config = league.deadMoneyConfig;

  // 1. Dead money do ano atual
  const deadMoneyAtual = contract.currentSalary * (config.currentSeason ?? 1);

  const records = [
    {
      playerId: contract.playerId,
      teamId: contract.teamId,
      contractId: contract.id,
      year: league.season,
      amount: deadMoneyAtual,
      reason: 'Corte',
    },
  ];

  // 2. Dead money dos anos futuros
  const yearsLeft = contract.endYear - league.season;

  if (yearsLeft >= 1) {
    // Para cada ano restante, calcular o dead money baseado na configuração
    for (let i = 1; i <= yearsLeft && i <= 4; i++) {
      const yearKey = i.toString() as keyof typeof config.futureSeasons;
      const futurePercentage = config.futureSeasons?.[yearKey] ?? 0;

      if (futurePercentage > 0) {
        // Calcular salário do ano futuro com aumentos anuais
        const futureSalary =
          contract.currentSalary * Math.pow(1 + (contract.annualIncrease ?? 0.15), i);
        const deadMoneyFuture = futureSalary * futurePercentage;

        records.push({
          playerId: contract.playerId,
          teamId: contract.teamId,
          contractId: contract.id,
          year: league.season + i,
          amount: deadMoneyFuture,
          reason: `Corte futuro (ano ${i})`,
        });
      }
    }
  }

  // 3. Persistir no banco
  await prisma.deadMoney.createMany({ data: records });

  return records;
}

/**
 * Liberar jogador (cortar)
 */
async function handleReleasePlayer(body: any, teamId: string, team: any) {
  const { contractId, playerId } = body;

  if (!contractId && !playerId) {
    return NextResponse.json({ error: 'ID do contrato ou jogador é obrigatório' }, { status: 400 });
  }

  // Buscar contrato
  const contract = await prisma.contract.findFirst({
    where: {
      ...(contractId ? { id: contractId } : { playerId }),
      teamId,
      status: 'ACTIVE',
    },
  });

  if (!contract) {
    return NextResponse.json({ error: 'Contrato ativo não encontrado' }, { status: 404 });
  }

  // Buscar configuração de dead money da liga
  const league = await prisma.league.findUnique({
    where: { id: contract.leagueId },
    select: { deadMoneyConfig: true },
  });

  if (!league) {
    return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
  }

  // Parse da configuração de dead money
  let deadMoneyConfig;
  try {
    deadMoneyConfig = JSON.parse(league.deadMoneyConfig);
  } catch (error) {
    // Usar configuração padrão em caso de erro
    deadMoneyConfig = {
      currentSeason: 1.0,
      futureSeasons: { '1': 0, '2': 0.5, '3': 0.75, '4': 1.0 },
    };
  }

  // Buscar informações da liga para obter o ano atual
  const leagueInfo = await prisma.league.findUnique({
    where: { id: contract.leagueId },
    select: { season: true },
  });

  if (!leagueInfo) {
    return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 });
  }

  const cutYear = leagueInfo.season;

  // Calcular e persistir dead money
  const deadMoneyRecords = await handlePlayerCut(contract, { deadMoneyConfig, season: cutYear });

  // Atualizar contrato para CUT
  const updatedContract = await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: 'CUT',
      updatedAt: new Date().toISOString(),
    },
    include: {
      player: true,
    },
  });

  // Calcular total de dead money para atualizar o time
  const currentSeasonTotal = deadMoneyRecords
    .filter(r => r.year === cutYear)
    .reduce((sum, r) => sum + r.amount, 0);
  const nextSeasonTotal = deadMoneyRecords
    .filter(r => r.year === cutYear + 1)
    .reduce((sum, r) => sum + r.amount, 0);

  await prisma.team.update({
    where: { id: teamId },
    data: {
      currentDeadMoney: { increment: currentSeasonTotal },
      nextSeasonDeadMoney: { increment: nextSeasonTotal },
    },
  });

  return NextResponse.json({
    contract: updatedContract,
    deadMoney: currentSeasonTotal + nextSeasonTotal,
    deadMoneyRecords,
    message: 'Jogador liberado com sucesso',
  });
}

/**
 * Estender contrato
 */
async function handleExtendContract(body: any, teamId: string) {
  const { contractId, newSalary, additionalYears } = body;

  if (!contractId || !newSalary || !additionalYears) {
    return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
  }

  // Verificar se o contrato existe e está no último ano
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      teamId,
      status: 'ACTIVE',
      yearsRemaining: 1, // Só pode estender no último ano
    },
  });

  if (!contract) {
    return NextResponse.json(
      { error: 'Contrato não encontrado ou não elegível para extensão' },
      { status: 404 },
    );
  }

  // Verificar se já foi estendido antes
  if (contract.hasBeenExtended) {
    return NextResponse.json({ error: 'Contrato já foi estendido anteriormente' }, { status: 400 });
  }

  // Verificar se já foi tagueado antes
  if (contract.hasBeenTagged) {
    return NextResponse.json(
      { error: 'Jogador tagueado não pode receber extensão' },
      { status: 400 },
    );
  }

  // Atualizar contrato
  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'EXTENDED',
      currentSalary: parseFloat(newSalary),
      yearsRemaining: parseInt(additionalYears),
      hasBeenExtended: true,
      updatedAt: new Date().toISOString(),
    },
    include: {
      player: true,
    },
  });

  return NextResponse.json({
    contract: updatedContract,
    message: 'Contrato estendido com sucesso',
  });
}

/**
 * Aplicar franchise tag
 */
async function handleFranchiseTag(body: any, teamId: string, team: any) {
  const { contractId, tagValue } = body;

  if (!contractId || !tagValue) {
    return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
  }

  // Verificar se o contrato existe e está no último ano
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      teamId,
      status: 'ACTIVE',
      yearsRemaining: 0, // Só pode aplicar tag em contrato expirado
    },
  });

  if (!contract) {
    return NextResponse.json(
      { error: 'Contrato não encontrado ou não elegível para tag' },
      { status: 404 },
    );
  }

  // Verificar se já foi tagueado antes
  if (contract.hasBeenTagged) {
    return NextResponse.json({ error: 'Jogador já foi tagueado anteriormente' }, { status: 400 });
  }

  // Verificar limite de tags da liga (assumindo 1 por temporada)
  const currentSeasonTags = await prisma.contract.count({
    where: {
      teamId,
      status: 'TAGGED',
      // Adicionar filtro por temporada quando implementado
    },
  });

  if (currentSeasonTags >= 1) {
    return NextResponse.json(
      { error: 'Limite de franchise tags atingido para esta temporada' },
      { status: 400 },
    );
  }

  // Atualizar contrato
  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'TAGGED',
      currentSalary: parseFloat(tagValue),
      yearsRemaining: 1,
      hasBeenTagged: true,
      updatedAt: new Date().toISOString(),
    },
    include: {
      player: true,
    },
  });

  return NextResponse.json({
    contract: updatedContract,
    message: 'Franchise tag aplicada com sucesso',
  });
}
