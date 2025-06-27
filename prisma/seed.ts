import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Script de seed para popular o banco de dados com dados iniciais
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

      // Criar usuário de demonstração
      const demoUser = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: demoUserEmail,
          password: hashedPassword,
          role: 'USER',
          emailVerified: new Date(),
        },
      });

      console.log('✅ Usuário de demonstração criado:', demoUser.email);
    }

    if (existingAdminUser) {
      console.log('✅ Usuário administrador já existe:', adminUserEmail);
    } else {
      // Hash da senha
      const hashedAdminPassword = await bcrypt.hash(adminUserPassword, 12);

      // Criar usuário administrador
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminUserEmail,
          password: hashedAdminPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });

      console.log('✅ Usuário administrador criado:', adminUser.email);
    }

    // Criar dados de exemplo dos novos modelos
    await createExampleData();

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

/**
 * Cria dados de exemplo para demonstrar os novos modelos com datas amigáveis
 */
async function createExampleData() {
  console.log('📋 Criando dados de exemplo dos contratos...');

  // Verificar se já existem dados
  const existingContracts = await prisma.contract.count();
  if (existingContracts > 0) {
    console.log('✅ Dados de exemplo já existem no banco.');
    return;
  }

  // Buscar usuários existentes
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@demo.com' } });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@admin.com' } });

  if (!demoUser || !adminUser) {
    console.log('⚠️ Usuários não encontrados, pulando criação de dados de exemplo.');
    return;
  }

  // Criar liga de exemplo
  const exampleLeague = await prisma.league.create({
    data: {
      name: 'Liga Demonstração 2024',
      season: 2024,
      salaryCap: 279.0,
      totalTeams: 12,
      status: 'ACTIVE',
      commissionerId: adminUser.id,
      maxFranchiseTags: 1,
      annualIncreasePercentage: 15.0,
      minimumSalary: 1.0,
      seasonTurnoverDate: '04-01',
      createdAt: new Date(2024, 0, 15), // 15 de janeiro de 2024
      updatedAt: new Date(2024, 0, 15),
    },
  });

  // Criar times de exemplo
  const team1 = await prisma.team.create({
    data: {
      name: 'Buffalo Bills Fantasy',
      leagueId: exampleLeague.id,
      ownerId: demoUser.id,
      currentSalaryCap: 45.5,
      currentDeadMoney: 8.2,
      createdAt: new Date(2024, 0, 20), // 20 de janeiro de 2024
      updatedAt: new Date(2024, 5, 15), // 15 de junho de 2024
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Kansas City Chiefs Fantasy',
      leagueId: exampleLeague.id,
      ownerId: adminUser.id,
      currentSalaryCap: 52.3,
      currentDeadMoney: 3.1,
      createdAt: new Date(2024, 0, 20),
      updatedAt: new Date(2024, 5, 15),
    },
  });

  // Criar jogadores de exemplo
  const joshAllen = await prisma.player.create({
    data: {
      name: 'Josh Allen',
      position: 'QB',
      team: 'BUF',
      age: 28,
      sleeperPlayerId: 'josh_allen_demo',
      isActive: true,
      createdAt: new Date(2024, 0, 10), // 10 de janeiro de 2024
      updatedAt: new Date(2024, 5, 1), // 1 de junho de 2024
    },
  });

  const patrickMahomes = await prisma.player.create({
    data: {
      name: 'Patrick Mahomes',
      position: 'QB',
      team: 'KC',
      age: 29,
      sleeperPlayerId: 'patrick_mahomes_demo',
      isActive: true,
      createdAt: new Date(2024, 0, 10),
      updatedAt: new Date(2024, 5, 1),
    },
  });

  // Criar contratos de exemplo com datas amigáveis
  const joshAllenContract = await prisma.contract.create({
    data: {
      playerId: joshAllen.id,
      teamId: team1.id,
      leagueId: exampleLeague.id,
      currentSalary: 13.225, // Salário após 2 aumentos de 15%
      originalSalary: 10.0,
      yearsRemaining: 2,
      originalYears: 4,
      status: 'ACTIVE',
      acquisitionType: 'AUCTION',
      signedSeason: 2022,
      hasBeenTagged: false,
      hasBeenExtended: false,
      hasFourthYearOption: false,
      fourthYearOptionActivated: false,
      signedAt: new Date(2022, 7, 15), // 15 de agosto de 2022
      createdAt: new Date(2022, 7, 15),
      updatedAt: new Date(2024, 3, 1), // 1 de abril de 2024
    },
  });

  const mahomesContract = await prisma.contract.create({
    data: {
      playerId: patrickMahomes.id,
      teamId: team2.id,
      leagueId: exampleLeague.id,
      currentSalary: 17.25, // Salário após 1 aumento de 15%
      originalSalary: 15.0,
      yearsRemaining: 1, // Último ano - elegível para extensão/tag
      originalYears: 3,
      status: 'ACTIVE',
      acquisitionType: 'AUCTION',
      signedSeason: 2023,
      hasBeenTagged: false,
      hasBeenExtended: false,
      hasFourthYearOption: false,
      fourthYearOptionActivated: false,
      signedAt: new Date(2023, 7, 20), // 20 de agosto de 2023
      createdAt: new Date(2023, 7, 20),
      updatedAt: new Date(2024, 3, 1),
    },
  });

  console.log('✅ Dados de exemplo criados com sucesso!');
  console.log('📊 Resumo dos dados criados:');
  console.log('   - 1 Liga: Liga Demonstração 2024');
  console.log('   - 2 Times: Buffalo Bills Fantasy, Kansas City Chiefs Fantasy');
  console.log('   - 2 Jogadores: Josh Allen, Patrick Mahomes');
  console.log('   - 2 Contratos com datas de assinatura específicas');
  console.log('💡 Todas as datas são agora mais amigáveis e legíveis!');
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
