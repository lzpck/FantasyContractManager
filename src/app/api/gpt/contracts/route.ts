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
