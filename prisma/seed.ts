import { PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de seed para popular o banco de dados com dados iniciais
 *
 * ATENÇÃO: Este seed foi limpo e não cria mais dados de demonstração.
 * O banco será inicializado vazio, pronto para uso em produção.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Verificar se o banco está vazio
    const userCount = await prisma.user.count();
    const leagueCount = await prisma.league.count();
    const teamCount = await prisma.team.count();
    const playerCount = await prisma.player.count();
    const contractCount = await prisma.contract.count();

    console.log('📊 Estado atual do banco:');
    console.log(`- Usuários: ${userCount}`);
    console.log(`- Ligas: ${leagueCount}`);
    console.log(`- Times: ${teamCount}`);
    console.log(`- Jogadores: ${playerCount}`);
    console.log(`- Contratos: ${contractCount}`);

    if (userCount === 0 && leagueCount === 0 && teamCount === 0 && playerCount === 0 && contractCount === 0) {
      console.log('✅ Banco de dados está vazio e pronto para uso em produção.');
    } else {
      console.log('ℹ️  Banco contém dados. Para limpar dados demo, execute: npm run clean-demo-data');
    }

    // Aqui você pode adicionar configurações do sistema se necessário
    // Por exemplo: configurações padrão, tabelas de referência, etc.
    // IMPORTANTE: NÃO adicione dados de usuários, ligas ou times demo

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar o seed
main()
  .catch(e => {
    console.error('❌ Falha no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
