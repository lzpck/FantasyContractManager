/**
 * Script de teste para verificar a correção do problema de sincronização
 * dos jogadores do IR e Taxi Squad com o Sleeper
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSyncFix() {
  console.log('🧪 Iniciando teste da correção de sincronização...');

  try {
    // 1. Buscar uma liga para teste
    const league = await prisma.league.findFirst({
      where: {
        sleeperLeagueId: { not: null },
      },
      include: {
        teams: {
          include: {
            roster: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    if (!league) {
      console.log('❌ Nenhuma liga encontrada para teste');
      return;
    }

    console.log(`📋 Testando liga: ${league.name} (ID: ${league.sleeperLeagueId})`);

    // 2. Verificar status atual dos jogadores
    console.log('\n📊 Status atual dos jogadores por time:');

    for (const team of league.teams) {
      const activeCount = team.roster.filter(r => r.status === 'active').length;
      const irCount = team.roster.filter(r => r.status === 'ir').length;
      const taxiCount = team.roster.filter(r => r.status === 'taxi').length;

      console.log(`   ${team.name}:`);
      console.log(`     - Ativos: ${activeCount}`);
      console.log(`     - IR: ${irCount}`);
      console.log(`     - Taxi: ${taxiCount}`);

      if (irCount > 0) {
        const irPlayers = team.roster.filter(r => r.status === 'ir');
        console.log(`     - Jogadores no IR: ${irPlayers.map(r => r.player.name).join(', ')}`);
      }

      if (taxiCount > 0) {
        const taxiPlayers = team.roster.filter(r => r.status === 'taxi');
        console.log(`     - Jogadores no Taxi: ${taxiPlayers.map(r => r.player.name).join(', ')}`);
      }
    }

    // 3. Simular chamada de sincronização
    console.log('\n🔄 Executando sincronização de teste...');

    const response = await fetch(`http://localhost:3000/api/leagues/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leagueId: league.id,
      }),
    });

    if (!response.ok) {
      console.log('❌ Erro na sincronização:', response.statusText);
      return;
    }

    const syncResult = await response.json();
    console.log('✅ Sincronização concluída:', syncResult.message);

    // 4. Verificar status após sincronização
    console.log('\n📊 Status após sincronização:');

    const updatedLeague = await prisma.league.findUnique({
      where: { id: league.id },
      include: {
        teams: {
          include: {
            roster: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    for (const team of updatedLeague.teams) {
      const activeCount = team.roster.filter(r => r.status === 'active').length;
      const irCount = team.roster.filter(r => r.status === 'ir').length;
      const taxiCount = team.roster.filter(r => r.status === 'taxi').length;

      console.log(`   ${team.name}:`);
      console.log(`     - Ativos: ${activeCount}`);
      console.log(`     - IR: ${irCount}`);
      console.log(`     - Taxi: ${taxiCount}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSyncFix();
}

module.exports = { testSyncFix };
