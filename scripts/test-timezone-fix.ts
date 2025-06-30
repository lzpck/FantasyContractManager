/**
 * Script para testar a correção do fuso horário brasileiro
 */

// Importa as funções corrigidas
const { toISOString, nowInBrazil } = require('../src/lib/prisma.ts');

console.log('=== TESTE DE CORREÇÃO DO FUSO HORÁRIO BRASILEIRO ===\n');

// Teste básico de data
const agora = new Date();
console.log('1. Data atual:');
console.log(`   UTC: ${agora.toISOString()}`);
console.log(
  `   Brasil (sistema): ${agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
);

try {
  console.log(`   Brasil (nossa função): ${toISOString(agora)}`);

  const brazilNow = nowInBrazil();
  console.log(`   nowInBrazil(): ${brazilNow.toLocaleString('pt-BR')}`);

  console.log('\n✅ Funções executadas com sucesso!');
} catch (error) {
  console.log('\n❌ Erro ao executar funções:', error.message);
}

console.log('\n=== FIM DO TESTE ===');
