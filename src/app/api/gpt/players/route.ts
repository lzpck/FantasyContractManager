import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint específico para integração com ChatGPT
 * Permite consultar informações de jogadores e seus contratos
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
 * GET /api/gpt/players
 * 
 * Parâmetros de consulta:
 * - name: Nome do jogador (busca parcial)
 * - sleeperPlayerId: ID específico do Sleeper
 * - position: Posição do jogador (QB, RB, WR, TE, etc.)
 * - includeContracts: true/false - incluir informações de contratos
 * 
 * Exemplo de uso:
 * GET /api/gpt/players?name=Josh Allen&includeContracts=true
 * GET /api/gpt/players?sleeperPlayerId=4881&includeContracts=true
 */
export async function GET(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const sleeperPlayerId = searchParams.get('sleeperPlayerId');
    const position = searchParams.get('position');
    const includeContracts = searchParams.get('includeContracts') === 'true';

    // Construir filtros de busca
    const whereClause: any = {};
    
    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive'
      };
    }
    
    if (sleeperPlayerId) {
      whereClause.sleeperPlayerId = sleeperPlayerId;
    }
    
    if (position) {
      whereClause.position = position;
    }

    // Configurar include para contratos se solicitado
    const includeClause: any = {};
    if (includeContracts) {
      includeClause.contracts = {
        where: {
          status: 'ACTIVE' // Apenas contratos ativos
        },
        include: {
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
                  salaryCap: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      };
    }

    // Buscar jogadores
    const players = await prisma.player.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { name: 'asc' },
      take: 50 // Limitar resultados para evitar sobrecarga
    });

    // Formatar resposta
    const formattedPlayers = players.map(player => {
      const basePlayer = {
        id: player.id,
        name: player.name,
        position: player.position,
        fantasyPositions: player.fantasyPositions?.split(',').filter(Boolean) || [],
        nflTeam: player.team,
        age: player.age,
        sleeperPlayerId: player.sleeperPlayerId,
        isActive: player.isActive
      };

      if (includeContracts && player.contracts) {
        return {
          ...basePlayer,
          contracts: player.contracts.map((contract: any) => ({
            id: contract.id,
            originalSalary: contract.originalSalary,
            currentSalary: contract.currentSalary,
            originalYears: contract.originalYears,
            remainingYears: contract.remainingYears,
            status: contract.status,
            acquisitionType: contract.acquisitionType,
            team: {
              id: contract.team.id,
              name: contract.team.name,
              league: {
                id: contract.team.league.id,
                name: contract.team.league.name,
                season: contract.team.league.season,
                salaryCap: contract.team.league.salaryCap
              }
            },
            createdAt: contract.createdAt
          }))
        };
      }

      return basePlayer;
    });

    return NextResponse.json({
      success: true,
      count: formattedPlayers.length,
      players: formattedPlayers
    });

  } catch (error) {
    console.error('Erro na API GPT Players:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível processar a solicitação'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gpt/players/search
 * 
 * Busca avançada de jogadores com múltiplos critérios
 * 
 * Body:
 * {
 *   "players": ["Josh Allen", "Patrick Mahomes"],
 *   "includeContracts": true,
 *   "leagueId": "optional-league-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Acesso público para ChatGPT - sem autenticação necessária

    const body = await request.json();
    const { players: playerNames, includeContracts = false, leagueId } = body;

    if (!playerNames || !Array.isArray(playerNames)) {
      return NextResponse.json(
        { error: 'Lista de jogadores é obrigatória' },
        { status: 400 }
      );
    }

    // Construir filtros
    const whereClause: any = {
      name: {
        in: playerNames,
        mode: 'insensitive'
      }
    };

    // Configurar include
    const includeClause: any = {};
    if (includeContracts) {
      const contractWhere: any = { status: 'ACTIVE' };
      
      // Filtrar por liga específica se fornecida
      if (leagueId) {
        contractWhere.team = {
          leagueId: leagueId
        };
      }

      includeClause.contracts = {
        where: contractWhere,
        include: {
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
                  salaryCap: true
                }
              }
            }
          }
        }
      };
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { name: 'asc' }
    });

    // Formatar resposta similar ao GET
    const formattedPlayers = players.map(player => {
      const basePlayer = {
        id: player.id,
        name: player.name,
        position: player.position,
        fantasyPositions: player.fantasyPositions?.split(',').filter(Boolean) || [],
        nflTeam: player.team,
        age: player.age,
        sleeperPlayerId: player.sleeperPlayerId,
        isActive: player.isActive
      };

      if (includeContracts && player.contracts) {
        return {
          ...basePlayer,
          contracts: player.contracts.map((contract: any) => ({
            id: contract.id,
            originalSalary: contract.originalSalary,
            currentSalary: contract.currentSalary,
            originalYears: contract.originalYears,
            remainingYears: contract.remainingYears,
            status: contract.status,
            acquisitionType: contract.acquisitionType,
            team: {
              id: contract.team.id,
              name: contract.team.name,
              league: {
                id: contract.team.league.id,
                name: contract.team.league.name,
                season: contract.team.league.season,
                salaryCap: contract.team.league.salaryCap
              }
            },
            createdAt: contract.createdAt
          }))
        };
      }

      return basePlayer;
    });

    return NextResponse.json({
      success: true,
      count: formattedPlayers.length,
      players: formattedPlayers,
      searchedNames: playerNames
    });

  } catch (error) {
    console.error('Erro na busca avançada GPT Players:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível processar a busca'
      },
      { status: 500 }
    );
  }
}