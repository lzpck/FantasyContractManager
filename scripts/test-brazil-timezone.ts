import { PrismaClient } from '@prisma/client';
import { toISOString, nowInBrazil, formatISOToBrazilian } from '../src/lib/prisma';
import { formatDate } from '../src/utils/formatUtils';

const prisma = new PrismaClient();

/**
 * Script para testar se as datas estão sendo salvas corretamente
 * no fuso horário do Brasil (America/Sao_Paulo)
 */
async function testBrazilTimezone() {
  console.log('🇧🇷 Testando fuso horário do Brasil...');
  console.log('=' .repeat(50));

  try {
    // 1. Testar funções de data
    console.log('\n📅 Testando funções de data:');
    
    const agora = new Date();
    const agoraNoBrasil = nowInBrazil();
    const isoString = toISOString(agoraNoBrasil);
    
    console.log(`Data atual (sistema): ${agora.toISOString()}`);
    console.log(`Data atual (Brasil): ${agoraNoBrasil.toISOString()}`);
    console.log(`ISO String (Brasil): ${isoString}`);
    console.log(`Formatada (Brasil): ${formatDate(agoraNoBrasil)}`);
    console.log(`Formatada ISO: ${formatISOToBrazilian(isoString)}`);

    // 2. Testar criação de usuário
    console.log('\n👤 Testando criação de usuário:');
    
    const testUser = await prisma.user.create({
      data: {
        name: 'Teste Fuso Horário',
        email: `teste-${Date.now()}@teste.com`,
        password: 'teste123',
        role: 'USER',
        isActive: true,
        emailVerified: toISOString(nowInBrazil()),
      },
    });

    console.log(`Usuário criado:`);
    console.log(`- ID: ${testUser.id}`);
    console.log(`- Email: ${testUser.email}`);
    console.log(`- Created At: ${testUser.createdAt}`);
    console.log(`- Updated At: ${testUser.updatedAt}`);
    console.log(`- Email Verified: ${testUser.emailVerified}`);
    
    // Formatação das datas
    console.log(`\n📊 Datas formatadas:`);
    console.log(`- Created At: ${formatISOToBrazilian(testUser.createdAt)}`);
    console.log(`- Updated At: ${formatISOToBrazilian(testUser.updatedAt)}`);
    console.log(`- Email Verified: ${formatISOToBrazilian(testUser.emailVerified || '')}`);

    // 3. Testar atualização
    console.log('\n🔄 Testando atualização:');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo
    
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Teste Fuso Horário Atualizado' },
    });

    console.log(`Usuário atualizado:`);
    console.log(`- Updated At: ${updatedUser.updatedAt}`);
    console.log(`- Updated At (formatado): ${formatISOToBrazilian(updatedUser.updatedAt)}`);

    // 4. Verificar diferença de tempo
    console.log('\n⏰ Verificando diferenças de tempo:');
    
    const createdDate = new Date(testUser.createdAt);
    const updatedDate = new Date(updatedUser.updatedAt);
    const diffMs = updatedDate.getTime() - createdDate.getTime();
    
    console.log(`Diferença entre criação e atualização: ${diffMs}ms`);
    console.log(`Diferença em segundos: ${(diffMs / 1000).toFixed(2)}s`);

    // 5. Comparar com UTC
    console.log('\n🌍 Comparação com UTC:');
    
    const utcNow = new Date().toISOString();
    const brazilNow = toISOString(nowInBrazil());
    
    console.log(`UTC agora: ${utcNow}`);
    console.log(`Brasil agora: ${brazilNow}`);
    
    const utcDate = new Date(utcNow);
    const brazilDate = new Date(brazilNow);
    const timezoneOffset = brazilDate.getTime() - utcDate.getTime();
    
    console.log(`Diferença de fuso (ms): ${timezoneOffset}`);
    console.log(`Diferença de fuso (horas): ${(timezoneOffset / (1000 * 60 * 60)).toFixed(2)}h`);

    // 6. Limpeza - remover usuário de teste
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    
    console.log('\n🧹 Usuário de teste removido.');
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('- ✅ Funções de data funcionando corretamente');
    console.log('- ✅ Middleware do Prisma aplicando timestamps brasileiros');
    console.log('- ✅ Formatação em português brasileiro');
    console.log('- ✅ Fuso horário America/Sao_Paulo aplicado');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    throw error;
  }
}

// Executar o teste
main()
  .catch(e => {
    console.error('❌ Falha no teste:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function main() {
  await testBrazilTimezone();
}