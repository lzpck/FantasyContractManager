import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint específico para consultar contratos via ChatGPT
 * Permite buscar contratos por jogador, time ou liga
 *
 * Autenticação: API Key no header 'X-API-Key'
 */

// Função para validar API Key (removida - acesso público para ChatGPT)
// function validateApiKey(request: NextRequest): boolean {
//   const apiKey = request.headers.get('X-API-Key');
//   const validApiKey = process.env.GPT_API_KEY;
//
//   if (!validApiKey) {
//     console.error('GPT_API_KEY não configurada no ambiente');
//     return false;
//   }
//
//   return apiKey === validApiKey;
// }

/**
 * GET /api/gpt/contracts
 *
 * Parâmetros de consulta:
 * - playerId: ID do jogador
 * - playerName: Nome do jogador (busca parcial)
 * - teamId: ID do time
 * - leagueId: ID da liga
 * - status: Status do contrato (ACTIVE, EXPIRED, etc.)
 * - includePlayer: true/false - incluir dados do jogador
 * - includeTeam: true/false - incluir dados do time
 *
 * Exemplo de uso:
 * GET /api/gpt/contracts?playerName=Josh Allen&status=ACTIVE&includePlayer=true&includeTeam=true
 */
export async function GET(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const playerName = searchParams.get('playerName');
    const teamId = searchParams.get('teamId');
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status');
    const includePlayer = searchParams.get('includePlayer') === 'true';
    const includeTeam = searchParams.get('includeTeam') === 'true';

    // Construir filtros de busca
    const whereClause: any = {};

    if (playerId) {
      whereClause.playerId = playerId;
    }

    if (playerName) {
      whereClause.player = {
        name: {
          contains: playerName,
          mode: 'insensitive',
        },
      };
    }

    if (teamId) {
      whereClause.teamId = teamId;
    }

    if (leagueId) {
      whereClause.team = {
        leagueId: leagueId,
      };
    }

    if (status) {
      whereClause.status = status;
    }

    // Configurar includes
    const includeClause: any = {};

    if (includePlayer) {
      includeClause.player = {
        select: {
          id: true,
          name: true,
          position: true,
          fantasyPositions: true,
          team: true, // NFL team
          age: true,
          sleeperPlayerId: true,
          isActive: true,
        },
      };
    }

    if (includeTeam) {
      includeClause.team = {
        select: {
          id: true,
          name: true,
          sleeperTeamId: true,
          league: {
            select: {
              id: true,
              name: true,
              season: true,
              salaryCap: true,
            },
          },
        },
      };
    }

    // Buscar contratos
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: [{ createdAt: 'desc' }, { currentSalary: 'desc' }],
      take: 100, // Limitar resultados
    });

    // Formatar resposta
    const formattedContracts = contracts.map(contract => {
      const baseContract = {
        id: contract.id,
        originalSalary: contract.originalSalary,
        currentSalary: contract.currentSalary,
        originalYears: contract.originalYears,
        remainingYears: contract.yearsRemaining,
        status: contract.status,
        acquisitionType: contract.acquisitionType,
        canExtend: contract.yearsRemaining === 1 && !contract.hasBeenExtended,
        canTag: contract.yearsRemaining === 1 && !contract.hasBeenTagged,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      };

      const result: any = { ...baseContract };

      if (
        includePlayer &&
        contract.player &&
        typeof contract.player === 'object' &&
        'id' in contract.player &&
        'name' in contract.player &&
        'position' in contract.player &&
        'fantasyPositions' in contract.player &&
        'team' in contract.player &&
        'age' in contract.player &&
        'sleeperPlayerId' in contract.player &&
        'isActive' in contract.player
      ) {
        result.player = {
          id: contract.player.id,
          name: contract.player.name,
          position: contract.player.position,
          fantasyPositions:
            typeof contract.player.fantasyPositions === 'string'
              ? contract.player.fantasyPositions.split(',').filter(Boolean)
              : [],
          nflTeam: contract.player.team,
          age: contract.player.age,
          sleeperPlayerId: contract.player.sleeperPlayerId,
          isActive: contract.player.isActive,
        };
      }

      if (
        includeTeam &&
        contract.team &&
        typeof contract.team === 'object' &&
        'id' in contract.team &&
        'name' in contract.team &&
        'sleeperTeamId' in contract.team &&
        'league' in contract.team
      ) {
        result.team = {
          id: contract.team.id,
          name: contract.team.name,
          sleeperTeamId: contract.team.sleeperTeamId,
          league: contract.team.league,
        };
      }

      return result;
    });

    return NextResponse.json({
      success: true,
      count: formattedContracts.length,
      contracts: formattedContracts,
    });
  } catch (error) {
    console.error('Erro na API GPT Contracts:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: 'Não foi possível processar a solicitação',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/gpt/contracts/analysis
 *
 * Análise de contratos para negociação
 *
 * Body:
 * {
 *   "playerName": "Josh Allen",
 *   "leagueId": "league-id",
 *   "analysisType": "extension" | "tag" | "trade" | "cut"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const body = await request.json();
    const { playerName, leagueId, analysisType } = body;

    if (!playerName) {
      return NextResponse.json({ error: 'Nome do jogador é obrigatório' }, { status: 400 });
    }

    // Buscar contrato ativo do jogador
    const contract = await prisma.contract.findFirst({
      where: {
        player: {
          name: {
            contains: playerName,
            mode: 'insensitive',
          },
        },
        status: 'ACTIVE',
        ...(leagueId && {
          team: {
            leagueId: leagueId,
          },
        }),
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            position: true,
            fantasyPositions: true,
            team: true,
            age: true,
            sleeperPlayerId: true,
            isActive: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            sleeperTeamId: true,
            league: {
              select: {
                id: true,
                name: true,
                season: true,
                salaryCap: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato ativo não encontrado para este jogador' },
        { status: 404 },
      );
    }

    // Calcular informações para análise
    const currentYear = new Date().getFullYear();
    const contractYear = contract.originalYears - contract.yearsRemaining + 1;
    const isLastYear = contract.yearsRemaining === 1;
    const nextYearSalary = Math.round(contract.currentSalary * 1.15); // Aumento de 15%

    // Buscar salary cap disponível do time
    const teamContracts = await prisma.contract.findMany({
      where: {
        teamId: contract.teamId,
        status: 'ACTIVE',
      },
      select: {
        currentSalary: true,
      },
    });

    const totalSalaryUsed = teamContracts.reduce((sum, c) => sum + c.currentSalary, 0);
    const availableCap = contract.team.league.salaryCap - totalSalaryUsed;

    // Análise específica por tipo
    const analysis: any = {
      contract: {
        id: contract.id,
        originalSalary: contract.originalSalary,
        currentSalary: contract.currentSalary,
        originalYears: contract.originalYears,
        remainingYears: contract.yearsRemaining,
        contractYear: contractYear,
        isLastYear: isLastYear,
        nextYearSalary: nextYearSalary,
        canExtend: contract.yearsRemaining === 1 && !contract.hasBeenExtended,
        canTag: contract.yearsRemaining === 1 && !contract.hasBeenTagged,
      },
      player: contract.player,
      team: contract.team,
      financials: {
        totalSalaryUsed: totalSalaryUsed,
        availableCap: availableCap,
        capPercentage: (totalSalaryUsed / contract.team.league.salaryCap) * 100,
      },
    };

    switch (analysisType) {
      case 'extension':
        analysis.extensionAnalysis = {
          eligible: !contract.hasBeenExtended && isLastYear,
          reason: contract.hasBeenExtended
            ? 'Jogador já foi estendido anteriormente'
            : !isLastYear
              ? 'Só pode estender no último ano do contrato'
              : 'Elegível para extensão',
          suggestedYears: [1, 2, 3, 4],
          suggestedSalaryRange: {
            min: Math.round(contract.currentSalary * 0.9),
            max: Math.round(contract.currentSalary * 1.5),
          },
        };
        break;

      case 'tag':
        // Buscar média dos top 10 da posição (simulado)
        const positionAverage = Math.round(contract.currentSalary * 1.2); // Simulação
        const tagCost = Math.max(nextYearSalary, positionAverage);

        analysis.tagAnalysis = {
          eligible: !contract.hasBeenTagged && isLastYear,
          reason: contract.hasBeenTagged
            ? 'Jogador já foi tagueado anteriormente'
            : !isLastYear
              ? 'Só pode taguear após o último ano'
              : 'Elegível para tag',
          estimatedCost: tagCost,
          affordable: tagCost <= availableCap,
        };
        break;

      case 'cut':
        // Calcular dead money
        const deadMoneyCurrent = contract.currentSalary;
        const deadMoneyFuture =
          contract.yearsRemaining > 1
            ? Math.round(contract.currentSalary * 0.25 * (contract.yearsRemaining - 1))
            : 0;

        analysis.cutAnalysis = {
          deadMoneyCurrent: deadMoneyCurrent,
          deadMoneyFuture: deadMoneyFuture,
          totalDeadMoney: deadMoneyCurrent + deadMoneyFuture,
          capSavings: 0, // No ano atual não há economia
          futureCapSavings:
            contract.yearsRemaining > 1
              ? Math.round(contract.currentSalary * 0.75 * (contract.yearsRemaining - 1))
              : 0,
        };
        break;

      case 'trade':
        analysis.tradeAnalysis = {
          tradeable: true,
          contractValue: contract.currentSalary,
          remainingYears: contract.yearsRemaining,
          attractiveness:
            contract.yearsRemaining > 1 && contract.currentSalary < 20000000
              ? 'Alta'
              : contract.yearsRemaining === 1
                ? 'Baixa'
                : 'Média',
        };
        break;
    }

    return NextResponse.json({
      success: true,
      analysisType: analysisType,
      ...analysis,
    });
  } catch (error) {
    console.error('Erro na análise de contratos GPT:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: 'Não foi possível processar a análise',
      },
      { status: 500 },
    );
  }
}
