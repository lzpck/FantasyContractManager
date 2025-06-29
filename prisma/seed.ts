import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { toISOString, nowInBrazil } from '../src/lib/prisma';

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

    // Criar usuário comissário (substitui o antigo admin)
    const commissionerUserEmail = 'commissioner@demo.com';
    const commissionerUserPassword = 'commissioner';

    // Verificar se o usuário demo já existe
    const existingDemoUser = await prisma.user.findUnique({
      where: { email: demoUserEmail },
    });

    // Verificar se o usuário comissário já existe
    const existingCommissionerUser = await prisma.user.findUnique({
      where: { email: commissionerUserEmail },
    });

    let demoUser;
    if (existingDemoUser) {
      demoUser = existingDemoUser;
      console.log('✅ Usuário de demonstração já existe:', demoUserEmail);
    } else {
      // Hash da senha
      const hashedPassword = await bcrypt.hash(demoUserPassword, 12);

      // Criar usuário demo
      demoUser = await prisma.user.create({
        data: {
          name: 'Usuário Demonstração',
          email: demoUserEmail,
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          emailVerified: toISOString(nowInBrazil()),
        },
      });

      console.log('✅ Usuário de demonstração criado:', {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      });
    }

    let commissionerUser;
    if (existingCommissionerUser) {
      commissionerUser = existingCommissionerUser;
      console.log('✅ Usuário comissário já existe:', commissionerUserEmail);
    } else {
      const hashedPassword = await bcrypt.hash(commissionerUserPassword, 12);

      commissionerUser = await prisma.user.create({
        data: {
          name: 'Comissário Demo',
          email: commissionerUserEmail,
          password: hashedPassword,
          role: 'COMMISSIONER',
          isActive: true,
          emailVerified: toISOString(nowInBrazil()),
        },
      });

      console.log('✅ Usuário comissário criado:', {
        id: commissionerUser.id,
        email: commissionerUser.email,
        name: commissionerUser.name,
        role: commissionerUser.role,
      });
    }

    // Garantir que exista uma liga de demonstração vinculada ao usuário demo
    const demoLeagueName = 'Liga The Bad Place - Demo';
    let demoLeague = await prisma.league.findFirst({
      where: { name: demoLeagueName },
    });

    if (demoLeague) {
      if (demoLeague.commissionerId !== demoUser.id) {
        await prisma.league.update({
          where: { id: demoLeague.id },
          data: { commissionerId: demoUser.id },
        });
        console.log('✅ Liga de demonstração atualizada para o usuário demo.');
      } else {
        console.log('✅ Liga de demonstração já vinculada ao usuário demo.');
      }
    } else {
      demoLeague = await prisma.league.create({
        data: {
          name: demoLeagueName,
          season: new Date().getFullYear(),
          salaryCap: 279_000_000,
          totalTeams: 12,
          status: 'ACTIVE',
          sleeperLeagueId: 'demo-sleeper-1',
          commissionerId: demoUser.id,
          maxFranchiseTags: 1,
          annualIncreasePercentage: 15,
          minimumSalary: 1_000_000,
          seasonTurnoverDate: '04-01',
        },
      });
      console.log('✅ Liga de demonstração criada e vinculada ao usuário demo');
    }

    // Caso existam times da liga vinculados ao comissário, transferir para o usuário demo
    if (demoLeague) {
      await prisma.team.updateMany({
        where: { leagueId: demoLeague.id, ownerId: commissionerUser.id },
        data: { ownerId: demoUser.id },
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
