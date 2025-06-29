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

import { PrismaClient } from '@prisma/client';
import { demoUser, demoLeagues, demoContracts } from '../src/data/demoData';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Converte uma data para formato ISO 8601
 */
function toISOString(date: Date | string = new Date()): string {
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
  
  const migrationReport: {
    startTime: string;
    endTime?: string;
    tables: Record<string, { total: number; created: number; errors: number }>;
    errors: string[];
  } = {
    startTime: new Date().toISOString(),
    tables: {},
    errors: []
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
        where: { id: demoUser.id }
      });
      
      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...demoUser,
            createdAt: toISOString(demoUser.createdAt),
            updatedAt: toISOString(demoUser.updatedAt)
          }
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
    
    migrationReport.tables.leagues = { total: demoLeagues.length, created: 0, errors: 0 };
    
    for (const league of demoLeagues) {
      try {
        const existingLeague = await prisma.league.findUnique({
          where: { id: league.id }
        });
        
        if (!existingLeague) {
          await prisma.league.create({
            data: {
              ...league,
              createdAt: toISOString(league.createdAt),
              updatedAt: toISOString(league.updatedAt)
            }
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
    const reportPath = path.join(process.cwd(), 'migration-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(migrationReport, null, 2));
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
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export { migrateDemoData };