/**
 * Script para sincronizar dados do Sleeper com o banco de dados local
 *
 * Este script deve ser executado para:
 * 1. Buscar dados atualizados de ligas do Sleeper
 * 2. Sincronizar rosters e jogadores
 * 3. Atualizar informações de times
 * 4. Manter consistência entre Sleeper e banco local
 *
 * Uso:
 * npm run sync-sleeper
 * ou
 * npx tsx scripts/sync-sleeper-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as sleeperService from '../src/services/sleeperService';

const prisma = new PrismaClient();

/**
 * Função principal de sincronização
 */
async function syncSleeperData() {
  console.log('🚀 Iniciando sincronização com Sleeper API...');

  try {
    // 1. Buscar todas as ligas ativas no banco
    const leagues = await prisma.league.findMany({
      where: {
        status: 'ACTIVE',
        sleeperLeagueId: {
          not: null,
        },
      },
      include: {
        teams: true,
      },
    });

    console.log(`📊 Encontradas ${leagues.length} ligas para sincronizar`);

    for (const league of leagues) {
      if (!league.sleeperLeagueId) continue;

      console.log(`\n🔄 Sincronizando liga: ${league.name} (${league.sleeperLeagueId})`);

      try {
        // Buscar dados atualizados da liga
        const [sleeperLeague, sleeperRosters, sleeperUsers] = await Promise.all([
          sleeperService.fetchSleeperLeague(league.sleeperLeagueId!),
          sleeperService.fetchSleeperRosters(league.sleeperLeagueId!),
          sleeperService.fetchSleeperUsers(league.sleeperLeagueId!),
        ]);

        if (!sleeperLeague) {
          console.log(`⚠️  Liga ${league.sleeperLeagueId} não encontrada no Sleeper`);
          continue;
        }

        // 3. Atualizar informações da liga
        await prisma.league.update({
          where: { id: league.id },
          data: {
            name: sleeperLeague.name,
            season: parseInt(sleeperLeague.season),
            totalTeams: sleeperLeague.total_rosters,
            updatedAt: new Date().toISOString(),
          },
        });

        console.log(`📋 Encontrados ${sleeperRosters.length} rosters`);

        // 4. Sincronizar times e rosters
        for (const roster of sleeperRosters) {
          await syncTeamRoster(league.id, roster);
        }

        // 5. Sincronizar jogadores
        await syncPlayersFromRosters(sleeperRosters);

        console.log(`✅ Liga ${league.name} sincronizada com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar liga ${league.name}:`, error);
      }
    }

    console.log('\n🎉 Sincronização concluída!');
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Sincroniza um time específico com seu roster do Sleeper
 */
async function syncTeamRoster(leagueId: string, roster: any) {
  try {
    // Buscar time existente pelo sleeperTeamId
    let team = await prisma.team.findFirst({
      where: {
        leagueId,
        sleeperTeamId: roster.roster_id.toString(),
      },
    });

    // Se não existir, criar novo time
    if (!team) {
      console.log(`➕ Criando novo time para roster ${roster.roster_id}`);

      team = await prisma.team.create({
        data: {
          name: roster.metadata?.team_name || `Time ${roster.roster_id}`,
          leagueId,
          sleeperTeamId: roster.roster_id.toString(),
          sleeperOwnerId: roster.owner_id,
          currentSalaryCap: 0, // Será calculado baseado nos contratos
          currentDeadMoney: 0,
        },
      });
    } else {
      // Atualizar informações do time
      await prisma.team.update({
        where: { id: team.id },
        data: {
          name: roster.metadata?.team_name || team.name,
          sleeperOwnerId: roster.owner_id,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Sincronizar jogadores do roster
    await syncTeamRosterPlayers(team.id, roster);

    console.log(`🔄 Time ${team.name} atualizado`);
  } catch (error) {
    console.error(`❌ Erro ao sincronizar team roster ${roster.roster_id}:`, error);
  }
}

/**
 * Sincroniza os jogadores do roster de um time
 */
async function syncTeamRosterPlayers(teamId: string, roster: any) {
  try {
    // Limpar roster atual do time
    await prisma.teamRoster.deleteMany({
      where: { teamId },
    });

    // Processar jogadores ativos
    if (roster.players && roster.players.length > 0) {
      for (const playerId of roster.players) {
        await addPlayerToRoster(teamId, playerId, 'active');
      }
    }

    // Processar jogadores na reserva (IR)
    if (roster.reserve && roster.reserve.length > 0) {
      for (const playerId of roster.reserve) {
        await addPlayerToRoster(teamId, playerId, 'ir');
      }
    }

    // Processar jogadores no taxi squad
    if (roster.taxi && roster.taxi.length > 0) {
      for (const playerId of roster.taxi) {
        await addPlayerToRoster(teamId, playerId, 'taxi');
      }
    }

    console.log(`✅ Roster do time sincronizado: ${roster.players?.length || 0} ativos, ${roster.reserve?.length || 0} IR, ${roster.taxi?.length || 0} taxi`);
  } catch (error) {
    console.error(`❌ Erro ao sincronizar jogadores do roster:`, error);
  }
}

/**
 * Adiciona um jogador ao roster do time
 */
async function addPlayerToRoster(teamId: string, sleeperPlayerId: string, status: string) {
  try {
    // Buscar ou criar o jogador
    let player = await prisma.player.findUnique({
      where: { sleeperPlayerId },
    });

    if (!player) {
      // Buscar informações do jogador no Sleeper
       const sleeperPlayers = await sleeperService.fetchSleeperPlayers();
       const sleeperPlayer = sleeperPlayers?.[sleeperPlayerId];

      if (!sleeperPlayer) {
        console.warn(`⚠️  Jogador ${sleeperPlayerId} não encontrado no Sleeper`);
        return;
      }

      // Criar novo jogador
      player = await prisma.player.create({
        data: {
          name: `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim(),
          position: sleeperPlayer.position || 'UNKNOWN',
          fantasyPositions: sleeperPlayer.fantasy_positions?.join(',') || '',
          team: sleeperPlayer.team || 'FA',
          age: sleeperPlayer.age || null,
          sleeperPlayerId,
          isActive: sleeperPlayer.active || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Adicionar ao roster do time (usando upsert para evitar duplicatas)
    await prisma.teamRoster.upsert({
      where: {
        teamId_playerId: {
          teamId,
          playerId: player.id,
        },
      },
      update: {
        sleeperPlayerId,
        status,
        updatedAt: new Date().toISOString(),
      },
      create: {
        teamId,
        playerId: player.id,
        sleeperPlayerId,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`❌ Erro ao adicionar jogador ${sleeperPlayerId} ao roster:`, error);
  }
}

/**
 * Sincroniza jogadores baseado nos rosters
 */
async function syncPlayersFromRosters(rosters: any[]) {
  try {
    // Coletar todos os IDs de jogadores únicos dos rosters
    const allPlayerIds = new Set<string>();

    rosters.forEach(roster => {
      if (roster.players) {
        roster.players.forEach((playerId: string) => {
          allPlayerIds.add(playerId);
        });
      }
    });

    console.log(`👥 Sincronizando ${allPlayerIds.size} jogadores únicos...`);

    // Buscar informações dos jogadores no Sleeper
    const sleeperPlayers = await sleeperService.fetchSleeperPlayers();

    if (!sleeperPlayers) {
      console.log('⚠️  Não foi possível buscar dados de jogadores do Sleeper');
      return;
    }

    let playersUpdated = 0;
    let playersCreated = 0;

    // Processar cada jogador
    for (const playerId of allPlayerIds) {
      const sleeperPlayer = sleeperPlayers[playerId];

      if (!sleeperPlayer) {
        console.log(`⚠️  Jogador ${playerId} não encontrado no Sleeper`);
        continue;
      }

      try {
        // Verificar se jogador já existe
        const existingPlayer = await prisma.player.findUnique({
          where: { sleeperPlayerId: playerId },
        });

        if (existingPlayer) {
          // Atualizar jogador existente
          await prisma.player.update({
            where: { id: existingPlayer.id },
            data: {
              name: `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim(),
              position: sleeperPlayer.position || 'UNKNOWN',
              fantasyPositions: sleeperPlayer.fantasy_positions?.join(',') || '',
              team: sleeperPlayer.team || 'FA',
              age: sleeperPlayer.age || null,
              isActive: sleeperPlayer.active || false,
              updatedAt: new Date().toISOString(),
            },
          });
          playersUpdated++;
        } else {
          // Criar novo jogador
          await prisma.player.create({
            data: {
              name: `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim(),
              position: sleeperPlayer.position || 'UNKNOWN',
              fantasyPositions: sleeperPlayer.fantasy_positions?.join(',') || '',
              team: sleeperPlayer.team || 'FA',
              age: sleeperPlayer.age || null,
              sleeperPlayerId: playerId,
              isActive: sleeperPlayer.active || false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
          playersCreated++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar jogador ${playerId}:`, error);
      }
    }

    console.log(
      `✅ Jogadores sincronizados: ${playersCreated} criados, ${playersUpdated} atualizados`,
    );
  } catch (error) {
    console.error('❌ Erro ao sincronizar jogadores:', error);
  }
}

/**
 * Função para recalcular salary cap de todos os times
 */
async function recalculateSalaryCaps() {
  console.log('💰 Recalculando salary caps...');

  try {
    const teams = await prisma.team.findMany({
      include: {
        contracts: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    for (const team of teams) {
      const totalSalary = team.contracts.reduce((sum, contract) => {
        return sum + contract.currentSalary;
      }, 0);

      await prisma.team.update({
        where: { id: team.id },
        data: {
          currentSalaryCap: totalSalary,
        },
      });
    }

    console.log(`✅ Salary caps recalculados para ${teams.length} times`);
  } catch (error) {
    console.error('❌ Erro ao recalcular salary caps:', error);
  }
}

// Executar script se chamado diretamente
if (require.main === module) {
  syncSleeperData()
    .then(() => {
      console.log('🎯 Script executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export { syncSleeperData, recalculateSalaryCaps };
