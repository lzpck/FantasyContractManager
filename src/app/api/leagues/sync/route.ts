import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole, LeagueStatus as DBLeagueStatus } from '@/types/database';
import { prisma } from '@/lib/prisma';
import { syncLeagueWithSleeper } from '@/services/sleeperService';
import { League, LeagueStatus } from '@/types';
import { LeagueStatus as PrismaLeagueStatus } from '@prisma/client';

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
}

// ============================================================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ============================================================================

/**
 * Sincroniza os rosters dos times, persistindo jogadores em team_rosters
 */
async function syncTeamRosters(sleeperRosters: any[], teams: any[], players: any[]) {
  try {
    for (const sleeperRoster of sleeperRosters) {
      // Encontrar o time correspondente
      const team = teams.find(t => t.sleeperTeamId === sleeperRoster.roster_id.toString());
      if (!team) continue;

      // Buscar roster atual do time no banco
      const currentRoster = await prisma.teamRoster.findMany({
        where: { teamId: team.id },
        include: { player: true }
      });

      // Coletar todos os jogadores do Sleeper para este time
      const allSleeperPlayers = [
        ...(sleeperRoster.players || []).map((id: string) => ({ id, status: 'active' })),
        ...(sleeperRoster.reserve || []).map((id: string) => ({ id, status: 'ir' })),
        ...(sleeperRoster.taxi || []).map((id: string) => ({ id, status: 'taxi' }))
      ];

      // Atualizar status dos jogadores existentes e adicionar novos
      for (const { id: sleeperPlayerId, status } of allSleeperPlayers) {
        // Buscar ou criar o jogador
        let player = await prisma.player.findUnique({
          where: { sleeperPlayerId },
        });

        if (!player) {
          // Buscar dados do jogador nos dados sincronizados
          const playerData = players.find(p => p.sleeperPlayerId === sleeperPlayerId);
          if (!playerData) {
            console.warn(`⚠️  Jogador ${sleeperPlayerId} não encontrado nos dados sincronizados`);
            continue;
          }

          // Criar novo jogador
          player = await prisma.player.create({
            data: {
              name: playerData.name,
              position: playerData.position,
              fantasyPositions: playerData.fantasyPositions,
              team: playerData.team,
              age: playerData.age,
              sleeperPlayerId,
              isActive: playerData.isActive,
            },
          });
        }

        // Adicionar/atualizar jogador no roster do time
        await prisma.teamRoster.upsert({
          where: {
            teamId_playerId: {
              teamId: team.id,
              playerId: player.id,
            },
          },
          update: {
            sleeperPlayerId,
            status,
          },
          create: {
            teamId: team.id,
            playerId: player.id,
            sleeperPlayerId,
            status,
          },
        });
      }

      // Remover jogadores que não estão mais no roster do Sleeper
      const sleeperPlayerIds = allSleeperPlayers.map(p => p.id);
      const playersToRemove = currentRoster.filter(
        rosterEntry => !sleeperPlayerIds.includes(rosterEntry.sleeperPlayerId)
      );

      for (const rosterEntry of playersToRemove) {
        await prisma.teamRoster.delete({
          where: {
            teamId_playerId: {
              teamId: team.id,
              playerId: rosterEntry.playerId,
            },
          },
        });
      }

      console.log(`✅ Roster do time ${team.name} sincronizado: ${sleeperRoster.players?.length || 0} ativos, ${sleeperRoster.reserve?.length || 0} IR, ${sleeperRoster.taxi?.length || 0} taxi`);
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar rosters dos times:', error);
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

    // Atualizar a liga no banco de dados
    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: {
        name: syncedData.league.name,
        season: syncedData.league.season,
        totalTeams: syncedData.league.totalTeams,
        status: prismaStatus,
        updatedAt: new Date(),
      },
    });

    // Atualizar times existentes e adicionar novos
    const teamUpdatePromises = syncedData.teams.map(async team => {
      const existingTeam = existingLeague.teams.find(t => t.sleeperTeamId === team.sleeperTeamId);

      if (existingTeam) {
        // Atualizar time existente
        return prisma.team.update({
          where: { id: existingTeam.id },
          data: {
            name: team.name,
            ownerDisplayName: team.ownerDisplayName,
            sleeperOwnerId: team.sleeperOwnerId,
            updatedAt: new Date(),
          },
        });
      } else {
        // Criar novo time
        return prisma.team.create({
          data: {
            name: team.name,
            leagueId: leagueId,
            ownerId: league.commissionerId, // Por padrão, atribuir ao comissário
            sleeperTeamId: team.sleeperTeamId,
            ownerDisplayName: team.ownerDisplayName,
            sleeperOwnerId: team.sleeperOwnerId,
          },
        });
      }
    });

    const updatedTeams = await Promise.all(teamUpdatePromises);

    // Sincronizar rosters dos times (persistir jogadores em team_rosters)
    await syncTeamRosters(syncedData.sleeperData.rosters, updatedTeams, syncedData.players);

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

    return {
      success: true,
      league: leagueWithSettings,
      message: `Liga "${updatedLeague.name}" sincronizada com sucesso!`,
      details: {
        teamsUpdated: updatedTeams.length,
        playersUpdated: syncedData.players.length,
      },
    };
  } catch (error) {
    console.error('Erro durante sincronização:', error);

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
 */
export async function POST(request: NextRequest) {
  try {
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

    // Sincronizar a liga
    const result = await syncLeague(leagueId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        league: result.league,
        message: result.message,
        details: result.details,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Erro na API de sincronização:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
