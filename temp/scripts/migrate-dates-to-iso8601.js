'use strict';
/**
 * Script de migração para popular dados de teste com datas ISO 8601
 *
 * Este script:
 * 1. Conecta ao banco de dados
 * 2. Popula dados de demonstração com datas em formato ISO 8601
 * 3. Gera relatório de migração
 *
 * Uso: npx ts-node scripts/migrate-dates-to-iso8601.ts
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.migrateDemoData = migrateDemoData;
const client_1 = require('@prisma/client');
const demoData_1 = require('../src/data/demoData');
const fs_1 = __importDefault(require('fs'));
const path_1 = __importDefault(require('path'));
const prisma = new client_1.PrismaClient();
/**
 * Converte uma data para formato ISO 8601
 */
function toISOString(date = new Date()) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
/**
 * Executa a migração dos dados de demonstração
 */
async function migrateDemoData() {
  console.log('🚀 Iniciando população de dados de demonstração com datas ISO 8601...');
  const migrationReport = {
    startTime: new Date().toISOString(),
    tables: {},
    errors: [],
  };
  try {
    // ============================================================================
    // CRIAR USUÁRIO DE DEMONSTRAÇÃO
    // ============================================================================
    console.log('👤 Criando usuário de demonstração...');
    migrationReport.tables.users = { total: 1, created: 0, errors: 0 };
    try {
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { id: demoData_1.demoUser.id },
      });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...demoData_1.demoUser,
            createdAt: toISOString(demoData_1.demoUser.createdAt),
            updatedAt: toISOString(demoData_1.demoUser.updatedAt),
          },
        });
        migrationReport.tables.users.created++;
        console.log('✅ Usuário de demonstração criado');
      } else {
        console.log('ℹ️ Usuário de demonstração já existe');
      }
    } catch (error) {
      migrationReport.tables.users.errors++;
      migrationReport.errors.push(`Erro ao criar usuário: ${error}`);
      console.error('❌ Erro ao criar usuário:', error);
    }
    // ============================================================================
    // CRIAR LIGAS DE DEMONSTRAÇÃO
    // ============================================================================
    console.log('🏆 Criando ligas de demonstração...');
    migrationReport.tables.leagues = {
      total: demoData_1.demoLeagues.length,
      created: 0,
      errors: 0,
    };
    for (const league of demoData_1.demoLeagues) {
      try {
        const existingLeague = await prisma.league.findUnique({
          where: { id: league.id },
        });
        if (!existingLeague) {
          await prisma.league.create({
            data: {
              ...league,
              createdAt: toISOString(league.createdAt),
              updatedAt: toISOString(league.updatedAt),
            },
          });
          migrationReport.tables.leagues.created++;
          console.log(`✅ Liga "${league.name}" criada`);
        } else {
          console.log(`ℹ️ Liga "${league.name}" já existe`);
        }
      } catch (error) {
        migrationReport.tables.leagues.errors++;
        migrationReport.errors.push(`Erro ao criar liga ${league.name}: ${error}`);
        console.error(`❌ Erro ao criar liga ${league.name}:`, error);
      }
    }
    // ============================================================================
    // RELATÓRIO FINAL
    // ============================================================================
    migrationReport.endTime = new Date().toISOString();
    console.log('\n📊 RELATÓRIO DE MIGRAÇÃO');
    console.log('========================');
    console.log(`⏰ Início: ${migrationReport.startTime}`);
    console.log(`⏰ Fim: ${migrationReport.endTime}`);
    console.log('');
    Object.entries(migrationReport.tables).forEach(([table, stats]) => {
      console.log(`📋 Tabela: ${table}`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Criados: ${stats.created}`);
      console.log(`   Erros: ${stats.errors}`);
      console.log('');
    });
    if (migrationReport.errors.length > 0) {
      console.log('❌ ERROS ENCONTRADOS:');
      migrationReport.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ Migração concluída sem erros!');
    }
    // Salvar relatório em arquivo
    const reportPath = path_1.default.join(process.cwd(), 'migration-report.json');
    await fs_1.default.promises.writeFile(reportPath, JSON.stringify(migrationReport, null, 2));
    console.log(`📄 Relatório salvo em: ${reportPath}`);
  } catch (error) {
    console.error('💥 Erro crítico durante a migração:', error);
    migrationReport.errors.push(`Erro crítico: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}
// Executar migração
if (require.main === module) {
  migrateDemoData()
    .then(() => {
      console.log('🎉 Processo de migração finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}
