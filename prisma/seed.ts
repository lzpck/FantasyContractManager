import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Script de seed para popular o banco de dados com dados iniciais
 *
 * Garante que o usuário de demonstração sempre exista no sistema.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar usuário de demonstração
    const demoUserEmail = 'demo@demo.com';
    const demoUserPassword = 'demo';

    // Criar usuário administrador
    const adminUserEmail = 'admin@admin.com';
    const adminUserPassword = 'admin';

    // Verificar se o usuário demo já existe
    const existingDemoUser = await prisma.user.findUnique({
      where: { email: demoUserEmail },
    });

    // Verificar se o usuário admin já existe
    const existingAdminUser = await prisma.user.findUnique({
      where: { email: adminUserEmail },
    });

    if (existingDemoUser) {
      console.log('✅ Usuário de demonstração já existe:', demoUserEmail);
    } else {
      // Hash da senha
      const hashedPassword = await bcrypt.hash(demoUserPassword, 12);

      // Criar usuário demo
      const demoUser = await prisma.user.create({
        data: {
          name: 'Usuário Demonstração',
          email: demoUserEmail,
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          emailVerified: new Date(),
        },
      });

      console.log('✅ Usuário de demonstração criado:', {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      });
    }

    if (existingAdminUser) {
      console.log('✅ Usuário administrador já existe:', adminUserEmail);
    } else {
      const hashedPassword = await bcrypt.hash(adminUserPassword, 12);

      const adminUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminUserEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          emailVerified: new Date(),
        },
      });

      console.log('✅ Usuário administrador criado:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      });
    }

    // Aqui você pode adicionar outros dados de seed se necessário
    // Por exemplo: ligas padrão, configurações do sistema, etc.

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
