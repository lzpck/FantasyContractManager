import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { toISOString, nowInBrazil } from '../src/lib/prisma';

const prisma = new PrismaClient();

/**
 * Script de seed para popular o banco de dados com dados iniciais
 *
 * Cria apenas o usuário administrador inicial.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário administrador inicial
    const adminUserLogin = 'admin';
    const adminUserEmail = 'admin@system.com';
    const adminUserPassword = 'admin123';

    // Verificar se o usuário admin já existe
    const existingAdminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminUserEmail },
          { login: adminUserLogin }
        ]
      },
    });

    let adminUser;
    if (existingAdminUser) {
      adminUser = existingAdminUser;
      console.log('✅ Usuário administrador já existe:', adminUserLogin);
    } else {
      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminUserPassword, 12);

      // Criar usuário admin
      adminUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          login: adminUserLogin,
          email: adminUserEmail,
          password: hashedPassword,
          role: 'COMMISSIONER',
          isActive: true,
          emailVerified: toISOString(nowInBrazil()),
        },
      });

      console.log('✅ Usuário administrador criado:', {
        id: adminUser.id,
        login: adminUser.login,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });
    }

    // Sistema inicializado com usuário administrador
    // Não há dados demo - o sistema inicia limpo

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