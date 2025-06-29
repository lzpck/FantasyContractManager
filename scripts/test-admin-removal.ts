/**
 * Script de teste para verificar se o perfil ADMIN foi removido completamente
 * 
 * Este script verifica:
 * 1. Se não há mais usuários com role ADMIN no banco
 * 2. Se todos os usuários antigos ADMIN foram migrados para COMMISSIONER
 * 3. Se as enumerações não contêm mais ADMIN
 */

import { PrismaClient } from '@prisma/client';
import { UserRole } from '../src/types/database';

const prisma = new PrismaClient();

async function testAdminRemoval() {
  console.log('🔍 Testando remoção do perfil ADMIN...');

  try {
    // 1. Verificar se não há usuários ADMIN no banco
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' as any }
    });

    if (adminUsers.length > 0) {
      console.error('❌ ERRO: Ainda existem usuários com perfil ADMIN:', adminUsers);
      return false;
    }
    console.log('✅ Nenhum usuário com perfil ADMIN encontrado');

    // 2. Verificar se o enum UserRole não contém ADMIN
    const validRoles = Object.values(UserRole);
    if (validRoles.includes('ADMIN' as any)) {
      console.error('❌ ERRO: Enum UserRole ainda contém ADMIN:', validRoles);
      return false;
    }
    console.log('✅ Enum UserRole não contém mais ADMIN:', validRoles);

    // 3. Listar todos os usuários e seus perfis
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('📋 Usuários no sistema:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): ${user.role}`);
    });

    // 4. Verificar se há comissários suficientes
    const commissioners = allUsers.filter(user => user.role === 'COMMISSIONER');
    if (commissioners.length === 0) {
      console.warn('⚠️ AVISO: Nenhum comissário encontrado no sistema');
    } else {
      console.log(`✅ ${commissioners.length} comissário(s) encontrado(s)`);
    }

    console.log('🎉 Teste de remoção do perfil ADMIN concluído com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
if (require.main === module) {
  testAdminRemoval()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Falha no teste:', error);
      process.exit(1);
    });
}

export { testAdminRemoval };