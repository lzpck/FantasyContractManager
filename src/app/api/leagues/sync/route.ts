import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole, LeagueStatus as DBLeagueStatus } from '@/types/database';
import { prisma } from '@/lib/prisma';
import { syncLeagueWithSleeper } from '@/services/sleeperService';
import { League, LeagueStatus } from '@/types';
import { LeagueStatus as PrismaLeagueStatus } from '@prisma/client';

/**
 * Interface para resultado de processamento de trade
 */
interface TradeProcessResult {
  isTraded: boolean;
  fromTeam?: string;
  toTeam?: string;
  playerName?: string;
  contractId?: string;
}

/**
 * Detecta uma possível trade sem processá-la automaticamente
 * @param playerId - ID do jogador
 * @param newTeamId - ID do novo time
 * @param leagueId - ID da liga
 * @returns Resultado da detecção da trade
 */
async function detectPlayerTrade(
  playerId: string,
  newTeamId: string,
  leagueId: string,
): Promise<TradeProcessResult> {
  try {
    // Buscar contrato ativo em outro time
    const existingContract = await prisma.contract.findFirst({
      where: {
        playerId,
        leagueId,
        status: 'ACTIVE',
        teamId: {
          not: newTeamId,
        },
      },
      include: {
        team: true,
        player: true,
      },
    });

    if (!existingContract) {
      return { isTraded: false };
    }

    // Buscar dados do novo time
    const newTeam = await prisma.team.findUnique({
      where: { id: newTeamId },
    });

    if (!newTeam) {
      return { isTraded: false };
    }

    return {
      isTraded: true,
      fromTeam: existingContract.team.name,
      toTeam: newTeam.name,
      playerName: existingContract.player.name,
      contractId: existingContract.id,
    };
  } catch (error) {
    return { isTraded: false };
  }
}

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface SyncResult {
  success: boolean;
  league?: League;
  message: string;
  details?: {
    teamsUpdated: number;
    playersUpdated: number;
  };
  tradesProcessed?: TradeProcessResult[];
  syncStats?: SyncStats;
}

/**
 * Interface para estatísticas de sincronização
 */
interface SyncStats {
  tradesProcessed: TradeProcessResult[];
  playersAdded: number;
  playersRemoved: number;
}

// ============================================================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ============================================================================

/**
 * Sincroniza os rosters dos times, persistindo jogadores em team_rosters
 * OTIMIZADA para reduzir operações de banco de dados
 */
async function syncTeamRosters(
  sleeperRosters: any[],
  teams: any[],
  players: any[],
): Promise<SyncStats> {
  const startTime = Date.now();

  const stats: SyncStats = {
    tradesProcessed: [],
    playersAdded: 0,
    playersRemoved: 0,
  };

  try {
    // OTIMIZAÇÃO 1: Buscar todos os rosters atuais de uma vez
    const teamIds = teams.map(t => t.id);
    const allCurrentRosters = await prisma.teamRoster.findMany({
      where: { teamId: { in: teamIds } },
      include: { player: true },
    });

    // OTIMIZAÇÃO 2: Buscar todos os jogadores existentes de uma vez
    const allSleeperPlayerIds = sleeperRosters.flatMap(roster => [
      ...(roster.players || []),
      ...(roster.reserve || []),
      ...(roster.taxi || []),
    ]);

    const existingPlayers = await prisma.player.findMany({
      where: { sleeperPlayerId: { in: allSleeperPlayerIds } },
    });

    const existingPlayersMap = new Map(existingPlayers.map(p => [p.sleeperPlayerId, p]));

    // OTIMIZAÇÃO 3: Preparar operações em lote
    const playersToCreate: any[] = [];
    const playersToUpdate: any[] = [];
    const rosterUpserts: any[] = [];
    const rosterDeletes: any[] = [];

    for (const sleeperRoster of sleeperRosters) {
      // Encontrar o time correspondente
      const team = teams.find(t => t.sleeperTeamId === sleeperRoster.roster_id.toString());
      if (!team) continue;

      // Buscar roster atual do time
      const currentRoster = allCurrentRosters.filter(r => r.teamId === team.id);

      // Coletar todos os jogadores do Sleeper para este time
      const allSleeperPlayers = [
        ...(sleeperRoster.players || []).map((id: string) => ({ id, status: 'active' })),
        ...(sleeperRoster.reserve || []).map((id: string) => ({ id, status: 'ir' })),
        ...(sleeperRoster.taxi || []).map((id: string) => ({ id, status: 'taxi' })),
      ];

      // Processar jogadores do Sleeper
      for (const { id: sleeperPlayerId, status } of allSleeperPlayers) {
        let player = existingPlayersMap.get(sleeperPlayerId);

        if (!player) {
          // Buscar dados do jogador nos dados sincronizados
          const playerData = players.find(p => p.sleeperPlayerId === sleeperPlayerId);
          if (!playerData) {
            continue;
          }

          // Preparar criação do jogador
          const newPlayer = {
            name: playerData.name,
            position: playerData.position,
            fantasyPositions: Array.isArray(playerData.fantasyPositions)
              ? playerData.fantasyPositions.join(',')
              : playerData.fantasyPositions,
            team: playerData.team || 'FA',
            age: playerData.age,
            sleeperPlayerId,
            isActive: playerData.isActive,
          };

          playersToCreate.push(newPlayer);

          // Criar objeto temporário para usar nas próximas operações
          player = {
            id: `temp_${sleeperPlayerId}`,
            ...newPlayer,
          } as any;

          existingPlayersMap.set(sleeperPlayerId, player!);
        }

        // Garantir que player não é undefined antes de continuar
        if (!player) {
          continue;
        }

        // Verificar se jogador já existe no roster atual
        const existingRosterEntry = currentRoster.find(r => r.playerId === player.id);

        // Verificar e detectar possível trade (apenas para logging)
        if (!existingRosterEntry) {
          const tradeResult = await detectPlayerTrade(player.id, team.id, team.leagueId);
          if (tradeResult.isTraded) {
            stats.tradesProcessed.push(tradeResult);
          } else {
            stats.playersAdded++;
          }
        }

        // Preparar upsert do roster
        rosterUpserts.push({
          teamId: team.id,
          playerId: player.id,
          sleeperPlayerId,
          status,
        });
      }

      // Preparar remoções
      const sleeperPlayerIds = allSleeperPlayers.map(p => p.id);
      const playersToRemove = currentRoster.filter(
        rosterEntry => !sleeperPlayerIds.includes(rosterEntry.sleeperPlayerId),
      );

      for (const rosterEntry of playersToRemove) {
        rosterDeletes.push({
          teamId: team.id,
          playerId: rosterEntry.playerId,
        });
        stats.playersRemoved++;
      }
    }

    // OTIMIZAÇÃO 4: Executar operações em lote
    const batchStartTime = Date.now();

    // Executar operações em paralelo quando possível
    await Promise.all([
      // Criar novos jogadores
      playersToCreate.length > 0
        ? prisma.player.createMany({
            data: playersToCreate,
            skipDuplicates: true,
          })
        : Promise.resolve(),

      // Remover entradas de roster
      rosterDeletes.length > 0
        ? prisma.teamRoster.deleteMany({
            where: {
              OR: rosterDeletes.map(del => ({
                teamId: del.teamId,
                playerId: del.playerId,
              })),
            },
          })
        : Promise.resolve(),
    ]);

    // Buscar IDs reais dos jogadores criados
    if (playersToCreate.length > 0) {
      const createdPlayers = await prisma.player.findMany({
        where: {
          sleeperPlayerId: { in: playersToCreate.map(p => p.sleeperPlayerId) },
        },
      });

      // Atualizar mapa com IDs reais
      createdPlayers.forEach(player => {
        existingPlayersMap.set(player.sleeperPlayerId, player);
      });

      // Atualizar rosterUpserts com IDs reais
      rosterUpserts.forEach(upsert => {
        const realPlayer = existingPlayersMap.get(upsert.sleeperPlayerId);
        if (realPlayer && realPlayer.id !== upsert.playerId) {
          upsert.playerId = realPlayer.id;
        }
      });
    }

    // Executar upserts de roster em lotes menores para evitar timeout
    const BATCH_SIZE = 100;

    for (let i = 0; i < rosterUpserts.length; i += BATCH_SIZE) {
      const batch = rosterUpserts.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async upsert => {
          return prisma.teamRoster.upsert({
            where: {
              teamId_playerId: {
                teamId: upsert.teamId,
                playerId: upsert.playerId,
              },
            },
            update: {
              sleeperPlayerId: upsert.sleeperPlayerId,
              status: upsert.status,
            },
            create: upsert,
          });
        }),
      );
    }

    const batchEndTime = Date.now();

    // VALIDAÇÃO ADICIONAL: Verificar se os status foram aplicados corretamente
    const validationStartTime = Date.now();
    let inconsistenciesFound = 0;

    for (const sleeperRoster of sleeperRosters) {
      const team = teams.find(t => t.sleeperTeamId === sleeperRoster.roster_id.toString());
      if (!team) continue;

      // Verificar jogadores no IR
      if (sleeperRoster.reserve && sleeperRoster.reserve.length > 0) {
        const irPlayersInDb = await prisma.teamRoster.findMany({
          where: {
            teamId: team.id,
            sleeperPlayerId: { in: sleeperRoster.reserve },
            status: { not: 'ir' },
          },
          include: { player: true },
        });

        if (irPlayersInDb.length > 0) {
          inconsistenciesFound += irPlayersInDb.length;

          // Corrigir inconsistências
          await prisma.teamRoster.updateMany({
            where: {
              teamId: team.id,
              sleeperPlayerId: { in: sleeperRoster.reserve },
            },
            data: { status: 'ir' },
          });
        }
      }

      // Verificar jogadores no Taxi
      if (sleeperRoster.taxi && sleeperRoster.taxi.length > 0) {
        const taxiPlayersInDb = await prisma.teamRoster.findMany({
          where: {
            teamId: team.id,
            sleeperPlayerId: { in: sleeperRoster.taxi },
            status: { not: 'taxi' },
          },
          include: { player: true },
        });

        if (taxiPlayersInDb.length > 0) {
          inconsistenciesFound += taxiPlayersInDb.length;

          // Corrigir inconsistências
          await prisma.teamRoster.updateMany({
            where: {
              teamId: team.id,
              sleeperPlayerId: { in: sleeperRoster.taxi },
            },
            data: { status: 'taxi' },
          });
        }
      }
    }

    const validationEndTime = Date.now();
    const totalTime = Date.now() - startTime;

    return stats;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    throw error;
  }
}

/**
 * Sincroniza uma liga existente com a Sleeper API
 */
async function syncLeague(leagueId: string): Promise<SyncResult> {
  try {
    // Buscar a liga no banco de dados
    const existingLeague = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: true,
      },
    });

    if (!existingLeague) {
      return {
        success: false,
        message: 'Liga não encontrada.',
      };
    }

    // Verificar se a liga tem ID do Sleeper
    if (!existingLeague.sleeperLeagueId) {
      return {
        success: false,
        message: 'Esta liga não possui integração com o Sleeper.',
      };
    }

    // Transformar para o formato esperado pelo serviço
    // Converter o status do Prisma para o formato esperado pelo tipo League
    let leagueStatus;
    switch (existingLeague.status) {
      case PrismaLeagueStatus.ACTIVE:
        leagueStatus = LeagueStatus.ACTIVE;
        break;
      case PrismaLeagueStatus.OFFSEASON:
        leagueStatus = LeagueStatus.OFFSEASON;
        break;
      case PrismaLeagueStatus.ARCHIVED:
        leagueStatus = LeagueStatus.ARCHIVED;
        break;
      default:
        leagueStatus = LeagueStatus.ACTIVE;
    }

    const league: League = {
      id: existingLeague.id,
      name: existingLeague.name,
      season: existingLeague.season,
      salaryCap: existingLeague.salaryCap,
      totalTeams: existingLeague.totalTeams,
      status: leagueStatus,
      sleeperLeagueId: existingLeague.sleeperLeagueId,
      commissionerId: existingLeague.commissionerId,
      // Adicionar propriedades requeridas pelo tipo League
      maxFranchiseTags: existingLeague.maxFranchiseTags,
      annualIncreasePercentage: existingLeague.annualIncreasePercentage,
      minimumSalary: existingLeague.minimumSalary,
      seasonTurnoverDate: existingLeague.seasonTurnoverDate,
      settings: {
        maxFranchiseTags: existingLeague.maxFranchiseTags,
        annualIncreasePercentage: existingLeague.annualIncreasePercentage,
        minimumSalary: existingLeague.minimumSalary,
        seasonTurnoverDate: existingLeague.seasonTurnoverDate,
        rookieDraft: {
          rounds: 3,
          firstRoundFourthYearOption: true,
          salaryTable: [],
        },
      },
      teams: existingLeague.teams.map(team => ({
        id: team.id,
        name: team.name,
        leagueId: team.leagueId,
        ownerId: team.ownerId || '',
        abbreviation: team.name.substring(0, 3).toUpperCase(),
        availableCap: existingLeague.salaryCap,
        currentDeadMoney: 0,
        nextSeasonDeadMoney: 0,
        franchiseTagsUsed: 0,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      createdAt: existingLeague.createdAt,
      updatedAt: existingLeague.updatedAt,
    };

    // Sincronizar com a Sleeper API
    const syncedData = await syncLeagueWithSleeper(league);

    // Converter o status para o formato esperado pelo Prisma
    let prismaStatus: PrismaLeagueStatus;
    switch (syncedData.league.status) {
      case LeagueStatus.ACTIVE:
        prismaStatus = PrismaLeagueStatus.ACTIVE;
        break;
      case LeagueStatus.OFFSEASON:
        prismaStatus = PrismaLeagueStatus.OFFSEASON;
        break;
      case LeagueStatus.ARCHIVED:
        prismaStatus = PrismaLeagueStatus.ARCHIVED;
        break;
      default:
        prismaStatus = PrismaLeagueStatus.ACTIVE;
    }

    // Liga já foi atualizada na operação paralela acima

    // OTIMIZAÇÃO: Paralelizar atualização da liga e times
    const dbStartTime = Date.now();

    const [updatedLeagueResult, teamUpdateResults] = await Promise.all([
      // Atualizar a liga
      prisma.league.update({
        where: { id: leagueId },
        data: {
          name: syncedData.league.name,
          season: syncedData.league.season,
          totalTeams: syncedData.league.totalTeams,
          status: prismaStatus,
          updatedAt: new Date().toISOString(),
        },
      }),

      // Atualizar times em paralelo
      Promise.all(
        syncedData.teams.map(async team => {
          const existingTeam = existingLeague.teams.find(
            t => t.sleeperTeamId === team.sleeperTeamId,
          );

          if (existingTeam) {
            // Atualizar time existente
            return prisma.team.update({
              where: { id: existingTeam.id },
              data: {
                name: team.name,
                ownerDisplayName: team.ownerDisplayName,
                sleeperOwnerId: team.sleeperOwnerId,
                updatedAt: new Date().toISOString(),
              },
            });
          } else {
            // Criar novo time
            return prisma.team.create({
              data: {
                name: team.name,
                leagueId: leagueId,
                sleeperTeamId: team.sleeperTeamId,
                ownerDisplayName: team.ownerDisplayName,
                sleeperOwnerId: team.sleeperOwnerId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            });
          }
        }),
      ),
    ]);

    const updatedLeague = updatedLeagueResult;
    const updatedTeams = teamUpdateResults;

    const dbEndTime = Date.now();

    // Sincronizar rosters dos times (persistir jogadores em team_rosters)
    const syncStats = await syncTeamRosters(
      syncedData.sleeperData.rosters,
      updatedTeams,
      syncedData.players,
    );

    // Converter o status do Prisma para o formato esperado pelo tipo League
    let frontendStatus;
    switch (updatedLeague.status) {
      case PrismaLeagueStatus.ACTIVE:
        frontendStatus = LeagueStatus.ACTIVE;
        break;
      case PrismaLeagueStatus.OFFSEASON:
        frontendStatus = LeagueStatus.OFFSEASON;
        break;
      case PrismaLeagueStatus.ARCHIVED:
        frontendStatus = LeagueStatus.ARCHIVED;
        break;
      default:
        frontendStatus = LeagueStatus.ACTIVE;
    }

    // Transformar para o formato esperado pelo frontend
    const leagueWithSettings: League = {
      id: updatedLeague.id,
      name: updatedLeague.name,
      season: updatedLeague.season,
      salaryCap: updatedLeague.salaryCap,
      totalTeams: updatedLeague.totalTeams,
      status: frontendStatus,
      sleeperLeagueId: updatedLeague.sleeperLeagueId || undefined,
      commissionerId: updatedLeague.commissionerId,
      maxFranchiseTags: updatedLeague.maxFranchiseTags,
      annualIncreasePercentage: updatedLeague.annualIncreasePercentage,
      minimumSalary: updatedLeague.minimumSalary,
      seasonTurnoverDate: updatedLeague.seasonTurnoverDate,
      createdAt: updatedLeague.createdAt,
      updatedAt: updatedLeague.updatedAt,
      settings: {
        maxFranchiseTags: updatedLeague.maxFranchiseTags,
        annualIncreasePercentage: updatedLeague.annualIncreasePercentage,
        minimumSalary: updatedLeague.minimumSalary,
        seasonTurnoverDate: updatedLeague.seasonTurnoverDate,
        rookieDraft: league.settings.rookieDraft,
      },
      teams: updatedTeams.map(team => ({
        id: team.id,
        name: team.name,
        leagueId: team.leagueId,
        ownerId: team.ownerId || '',
        abbreviation: team.name.substring(0, 3).toUpperCase(),
        availableCap: updatedLeague.salaryCap,
        currentDeadMoney: 0,
        nextSeasonDeadMoney: 0,
        franchiseTagsUsed: 0,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    };

    // Criar mensagem com estatísticas de trades
    let message = `Liga "${updatedLeague.name}" sincronizada com sucesso!`;
    if (syncStats.tradesProcessed.length > 0) {
      message += ` ${syncStats.tradesProcessed.length} trade(s) processada(s).`;
    }

    return {
      success: true,
      league: leagueWithSettings,
      message,
      details: {
        teamsUpdated: updatedTeams.length,
        playersUpdated: syncedData.players.length,
      },
      tradesProcessed: syncStats.tradesProcessed,
      syncStats,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Erro na sincronização: ${error.message}`
          : 'Erro desconhecido durante a sincronização',
    };
  }
}

// ============================================================================
// ROTAS DA API
// ============================================================================

/**
 * POST /api/leagues/sync
 *
 * Sincroniza uma liga existente com a Sleeper API
 * Requer autenticação e perfil COMMISSIONER
 * OTIMIZADA para execução em menos de 30 segundos
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    // OTIMIZAÇÃO: Timeout de segurança para Vercel (25 segundos)
    const TIMEOUT_MS = 25000; // 25 segundos para dar margem

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: Sincronização excedeu 25 segundos'));
      }, TIMEOUT_MS);
    });

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é comissário
    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem sincronizar ligas.' },
        { status: 403 },
      );
    }

    // Obter dados da requisição
    const { leagueId } = await request.json();

    if (!leagueId) {
      return NextResponse.json({ error: 'ID da liga é obrigatório' }, { status: 400 });
    }

    // Sincronizar a liga com timeout
    const result = (await Promise.race([syncLeague(leagueId), timeoutPromise])) as SyncResult;

    const requestEndTime = Date.now();
    const totalRequestTime = requestEndTime - requestStartTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        league: result.league,
        message: result.message,
        details: result.details,
        tradesProcessed: result.tradesProcessed,
        syncStats: result.syncStats,
        performanceStats: {
          totalTime: totalRequestTime,
          withinTimeout: totalRequestTime < TIMEOUT_MS,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          performanceStats: {
            totalTime: totalRequestTime,
            withinTimeout: totalRequestTime < TIMEOUT_MS,
          },
        },
        { status: 400 },
      );
    }
  } catch (error) {
    const requestEndTime = Date.now();
    const totalRequestTime = requestEndTime - requestStartTime;

    // Verificar se foi timeout
    const isTimeout = error instanceof Error && error.message.includes('Timeout');

    return NextResponse.json(
      {
        error: isTimeout
          ? 'Sincronização interrompida por timeout. Tente novamente.'
          : 'Erro interno do servidor',
        performanceStats: {
          totalTime: totalRequestTime,
          timeout: isTimeout,
        },
      },
      { status: isTimeout ? 408 : 500 },
    );
  }
}
