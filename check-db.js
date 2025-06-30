const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando dados no banco...');

    const users = await prisma.user.count();
    const leagues = await prisma.league.count();
    const teams = await prisma.team.count();
    const players = await prisma.player.count();
    const contracts = await prisma.contract.count();

    console.log('📊 Contagem de registros:');
    console.log(`- Usuários: ${users}`);
    console.log(`- Ligas: ${leagues}`);
    console.log(`- Times: ${teams}`);
    console.log(`- Jogadores: ${players}`);
    console.log(`- Contratos: ${contracts}`);

    if (players === 0) {
      console.log('\n⚠️  Não há jogadores no banco. Criando alguns jogadores de teste...');

      const testPlayers = [
        {
          name: 'Josh Allen',
          position: 'QB',
          fantasyPositions: 'QB',
          team: 'BUF',
          age: 28,
          sleeperPlayerId: 'test-josh-allen',
        },
        {
          name: 'Christian McCaffrey',
          position: 'RB',
          fantasyPositions: 'RB',
          team: 'SF',
          age: 28,
          sleeperPlayerId: 'test-mccaffrey',
        },
        {
          name: 'Cooper Kupp',
          position: 'WR',
          fantasyPositions: 'WR',
          team: 'LAR',
          age: 31,
          sleeperPlayerId: 'test-kupp',
        },
      ];

      for (const player of testPlayers) {
        await prisma.player.create({ data: player });
        console.log(`✅ Jogador criado: ${player.name}`);
      }
    }

    if (teams === 0 && leagues > 0) {
      console.log('\n⚠️  Não há times no banco. Criando um time de teste...');

      const league = await prisma.league.findFirst();
      const user = await prisma.user.findFirst();

      if (league && user) {
        await prisma.team.create({
          data: {
            name: 'Time Demo',
            sleeperOwnerId: 'demo-owner-1',
            ownerDisplayName: 'Demo Owner',
            sleeperTeamId: 'demo-team-1',
            currentSalaryCap: 279000000,
            currentDeadMoney: 0,
            leagueId: league.id,
            ownerId: user.id,
          },
        });
        console.log('✅ Time de teste criado');
      }
    }

    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
