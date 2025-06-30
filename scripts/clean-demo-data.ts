/**
 * Script para remover completamente todos os dados de demonstração
 * do sistema Fantasy Contract Manager
 * 
 * Este script:
 * 1. Remove todos os dados demo do banco de dados
 * 2. Limpa registros com identificadores demo/test/sample
 * 3. Garante que o banco esteja pronto para uso em produção
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Identifica e remove todos os dados de demonstração
 */
async function cleanDemoData() {
  console.log('🧹 Iniciando limpeza de dados de demonstração...');
  
  try {
    // 1. Remover contratos demo
    console.log('\n📋 Removendo contratos de demonstração...');
    const deletedContracts = await prisma.contract.deleteMany({
      where: {
        OR: [
          { id: { contains: 'demo' } },
          { id: { contains: 'test' } },
          { id: { contains: 'sample' } },
          { player: { sleeperPlayerId: { contains: 'demo' } } },
          { team: { name: { contains: 'demo' } } },
          { team: { name: { contains: 'Demo' } } },
          { team: { name: { contains: 'TEST' } } },
          { team: { name: { contains: 'Test' } } },
          { team: { name: { contains: 'Exemplo' } } },
          { team: { name: { contains: 'Sample' } } },
          { league: { name: { contains: 'Demo' } } },
          { league: { name: { contains: 'demo' } } },
          { league: { name: { contains: 'Test' } } },
          { league: { name: { contains: 'test' } } },
        ]
      }
    });
    console.log(`✅ ${deletedContracts.count} contratos demo removidos`);

    // 2. Remover jogadores demo
    console.log('\n🏃 Removendo jogadores de demonstração...');
    const deletedPlayers = await prisma.player.deleteMany({
      where: {
        OR: [
          { id: { contains: 'demo' } },
          { id: { contains: 'test' } },
          { id: { contains: 'sample' } },
          { sleeperPlayerId: { contains: 'demo' } },
          { sleeperPlayerId: { contains: 'test' } },
          { sleeperPlayerId: { contains: 'sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Sample' } },
        ]
      }
    });
    console.log(`✅ ${deletedPlayers.count} jogadores demo removidos`);

    // 3. Remover times demo
    console.log('\n🏈 Removendo times de demonstração...');
    const deletedTeams = await prisma.team.deleteMany({
      where: {
        OR: [
          { id: { contains: 'demo' } },
          { id: { contains: 'test' } },
          { id: { contains: 'sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } },
          { name: { contains: 'Exemplo' } },
          { name: { contains: 'Sample' } },
          { name: { contains: 'Forklift' } },
          { name: { contains: 'Gronk' } },
          { name: { contains: 'Dynasty' } },
          { name: { contains: 'Touchdown' } },
          { name: { contains: 'Fantasy' } },
          { name: { contains: 'Salary Cap Hell' } },
          { sleeperTeamId: { contains: 'demo' } },
          { sleeperTeamId: { contains: 'test' } },
          { sleeperOwnerId: { contains: 'demo' } },
          { sleeperOwnerId: { contains: 'test' } },
        ]
      }
    });
    console.log(`✅ ${deletedTeams.count} times demo removidos`);

    // 4. Remover ligas demo
    console.log('\n🏆 Removendo ligas de demonstração...');
    const deletedLeagues = await prisma.league.deleteMany({
      where: {
        OR: [
          { id: { contains: 'demo' } },
          { id: { contains: 'test' } },
          { id: { contains: 'sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } },
          { name: { contains: 'Exemplo' } },
          { name: { contains: 'Sample' } },
          { name: { contains: 'Bad Place' } },
          { name: { contains: 'Elite Fantasy' } },
          { sleeperLeagueId: { contains: 'demo' } },
          { sleeperLeagueId: { contains: 'test' } },
        ]
      }
    });
    console.log(`✅ ${deletedLeagues.count} ligas demo removidas`);

    // 5. Remover usuários demo
    console.log('\n👤 Removendo usuários de demonstração...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { id: { contains: 'demo' } },
          { id: { contains: 'test' } },
          { id: { contains: 'sample' } },
          { email: 'demo@demo.com' },
          { email: 'commissioner@demo.com' },
          { email: { contains: 'demo' } },
          { email: { contains: 'test' } },
          { email: { contains: 'sample' } },
          { name: { contains: 'Demo' } },
          { name: { contains: 'Demonstração' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Sample' } },
        ]
      }
    });
    console.log(`✅ ${deletedUsers.count} usuários demo removidos`);

    // 6. Remover sessões e contas relacionadas a usuários demo
    console.log('\n🔐 Removendo sessões e contas demo...');
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        user: {
          OR: [
            { email: { contains: 'demo' } },
            { email: { contains: 'test' } },
            { name: { contains: 'Demo' } },
            { name: { contains: 'Test' } },
          ]
        }
      }
    });
    console.log(`✅ ${deletedSessions.count} sessões demo removidas`);

    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        user: {
          OR: [
            { email: { contains: 'demo' } },
            { email: { contains: 'test' } },
            { name: { contains: 'Demo' } },
            { name: { contains: 'Test' } },
          ]
        }
      }
    });
    console.log(`✅ ${deletedAccounts.count} contas demo removidas`);

    // 7. Verificação final - contar registros restantes
    console.log('\n📊 Verificação final dos dados restantes:');
    const remainingUsers = await prisma.user.count();
    const remainingLeagues = await prisma.league.count();
    const remainingTeams = await prisma.team.count();
    const remainingPlayers = await prisma.player.count();
    const remainingContracts = await prisma.contract.count();
    
    console.log(`- Usuários restantes: ${remainingUsers}`);
    console.log(`- Ligas restantes: ${remainingLeagues}`);
    console.log(`- Times restantes: ${remainingTeams}`);
    console.log(`- Jogadores restantes: ${remainingPlayers}`);
    console.log(`- Contratos restantes: ${remainingContracts}`);

    console.log('\n✅ Limpeza de dados demo concluída com sucesso!');
    console.log('🎯 O banco de dados está agora pronto para uso em produção.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

/**
 * Executa a limpeza
 */
async function main() {
  try {
    await cleanDemoData();
  } catch (error) {
    console.error('❌ Falha na limpeza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

export { cleanDemoData };