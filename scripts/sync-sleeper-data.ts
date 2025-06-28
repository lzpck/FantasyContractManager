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
import { SleeperService } from '../src/services/sleeperService';

const prisma = new PrismaClient();
const sleeperService = new SleeperService();

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
        // 2. Buscar dados atualizados da liga no Sleeper
        const sleeperLeague = await sleeperService.getLeague(league.sleeperLeagueId);

        if (!sleeperLeague) {
          console.log(`⚠️  Liga ${league.sleeperLeagueId} não encontrada no Sleeper`);
          continue;
        }

        // 3. Atualizar informações da liga
        await prisma.league.update({
          where: { id: league.id },
          data: {
            name: sleeperLeague.name,
            season: sleeperLeague.season,
            totalTeams: sleeperLeague.total_rosters,
            updatedAt: new Date(),
          },
        });

        // 4. Buscar rosters do Sleeper
        const rosters = await sleeperService.getRosters(league.sleeperLeagueId);

        if (!rosters || rosters.length === 0) {
          console.log(`⚠️  Nenhum roster encontrado para liga ${league.sleeperLeagueId}`);
          continue;
        }

        console.log(`📋 Encontrados ${rosters.length} rosters`);

        // 5. Sincronizar times e rosters
        for (const roster of rosters) {
          await syncTeamRoster(league.id, roster);
        }

        // 6. Sincronizar jogadores
        await syncPlayersFromRosters(rosters);

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
    // Buscar time existente pelo sleeperRosterId
    let team = await prisma.team.findFirst({
      where: {
        leagueId,
        sleeperRosterId: roster.roster_id.toString(),
      },
    });

    // Se não existir, criar novo time
    if (!team) {
      console.log(`➕ Criando novo time para roster ${roster.roster_id}`);

      team = await prisma.team.create({
        data: {
          name: roster.metadata?.team_name || `Time ${roster.roster_id}`,
          leagueId,
          sleeperRosterId: roster.roster_id.toString(),
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
          updatedAt: new Date(),
        },
      });
    }

    console.log(`🔄 Time ${team.name} atualizado`);
  } catch (error) {
    console.error(`❌ Erro ao sincronizar team roster ${roster.roster_id}:`, error);
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
    const sleeperPlayers = await sleeperService.getPlayers();

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
              updatedAt: new Date(),
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
