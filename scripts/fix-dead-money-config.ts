/**
 * Script para corrigir a configuração de dead money das ligas existentes
 *
 * Problema: A configuração padrão no schema tinha futureSeasons['1'] = 0,
 * impedindo a criação de registros de dead money para anos futuros.
 *
 * Solução: Atualizar todas as ligas para usar a configuração correta
 * conforme a documentação (25% para todos os anos futuros).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuração correta conforme documentação
const CORRECT_DEAD_MONEY_CONFIG = {
  currentSeason: 1.0,
  futureSeasons: {
    '1': 0.25,
    '2': 0.25,
    '3': 0.25,
    '4': 0.25,
  },
};

// Configuração problemática do schema original
const PROBLEMATIC_CONFIG = {
  currentSeason: 1.0,
  futureSeasons: {
    '1': 0,
    '2': 0.5,
    '3': 0.75,
    '4': 1.0,
  },
};

async function fixDeadMoneyConfig() {
  try {
    console.log('🔍 Buscando ligas com configuração problemática...');

    // Buscar todas as ligas
    const leagues = await prisma.league.findMany({
      select: {
        id: true,
        name: true,
        deadMoneyConfig: true,
      },
    });

    console.log(`📊 Encontradas ${leagues.length} ligas`);

    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const league of leagues) {
      try {
        // Parse da configuração atual
        const currentConfig = JSON.parse(league.deadMoneyConfig);

        // Verificar se a configuração está problemática
        const isProblematic =
          currentConfig.futureSeasons?.['1'] === 0 &&
          currentConfig.futureSeasons?.['2'] === 0.5 &&
          currentConfig.futureSeasons?.['3'] === 0.75 &&
          currentConfig.futureSeasons?.['4'] === 1.0;

        if (isProblematic) {
          console.log(`🔧 Corrigindo liga: ${league.name} (ID: ${league.id})`);

          // Atualizar com a configuração correta
          await prisma.league.update({
            where: { id: league.id },
            data: {
              deadMoneyConfig: JSON.stringify(CORRECT_DEAD_MONEY_CONFIG),
            },
          });

          updatedCount++;
          console.log(`   ✅ Configuração atualizada`);
        } else {
          console.log(`✅ Liga já possui configuração correta: ${league.name}`);
          alreadyCorrectCount++;
        }
      } catch (parseError) {
        console.error(`❌ Erro ao processar liga ${league.name}:`, parseError);
      }
    }

    console.log('\n📈 Resumo da correção:');
    console.log(`   • Ligas atualizadas: ${updatedCount}`);
    console.log(`   • Ligas já corretas: ${alreadyCorrectCount}`);
    console.log(`   • Total processadas: ${leagues.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Configurações de dead money corrigidas com sucesso!');
      console.log('   Agora os cortes de jogadores criarão registros para anos futuros.');
    } else {
      console.log('\n✨ Todas as ligas já possuem configuração correta.');
    }
  } catch (error) {
    console.error('❌ Erro ao corrigir configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
fixDeadMoneyConfig()
  .then(() => {
    console.log('\n🏁 Script finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
