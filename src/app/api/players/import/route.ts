import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/database';
import { fetchSleeperPlayers, transformSleeperPlayersToLocal } from '@/services/sleeperService';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface ImportResult {
  success: boolean;
  imported?: number;
  message: string;
  performanceStats?: {
    totalTime: number;
    apiCallTime: number;
    dbOperationsTime: number;
    playersProcessed: number;
    withinTimeout: boolean;
    timeout: number;
  };
}

type ExistingPlayer = {
  id: string;
  sleeperPlayerId: string;
  name: string;
  position: string;
  fantasyPositions: string;
  team: string | null;
  isActive: boolean;
};

// ============================================================================
// FUNÇÃO PRINCIPAL DE IMPORTAÇÃO
// ============================================================================

async function importPlayersWithTimeout(): Promise<ImportResult> {
  const requestStartTime = Date.now();
  const TIMEOUT_MS = 25000; // 25 segundos

  console.log('🚀 Iniciando importação de jogadores NFL...');

  try {
    // Otimização: Buscar dados em paralelo (API + DB) para economizar tempo
    const startFetchTime = Date.now();
    console.log('📡 Buscando dados da API e do Banco em paralelo...');

    const [sleeperPlayers, existingPlayers] = await Promise.all([
      fetchSleeperPlayers(),
      prisma.player.findMany({
        select: {
          id: true,
          sleeperPlayerId: true,
          name: true,
          position: true,
          fantasyPositions: true,
          team: true,
          isActive: true,
        },
      }),
    ]);

    const allowed = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];
    const players = transformSleeperPlayersToLocal(sleeperPlayers, allowed);

    const apiCallTime = Date.now() - startFetchTime;
    console.log(`✅ Dados obtidos em ${apiCallTime}ms`);
    console.log(`   - Sleeper: ${players.length} jogadores`);
    console.log(`   - DB Local: ${existingPlayers.length} jogadores`);

    const dbStartTime = Date.now();
    console.log('💾 Calculando diferenças...');

    const existingPlayersMap = new Map<string, ExistingPlayer>(
      existingPlayers.map(p => [p.sleeperPlayerId, p as ExistingPlayer]),
    );

    // Preparar operações em lote
    const playersToCreate: any[] = [];
    const playersToUpdate: any[] = [];
    let playersUnchanged = 0;

    for (const player of players) {
      const existing = existingPlayersMap.get(player.sleeperPlayerId);

      if (!existing) {
        // Novo jogador
        playersToCreate.push({
          name: player.name,
          position: player.position,
          fantasyPositions: player.fantasyPositions.join(','),
          team: player.nflTeam,
          sleeperPlayerId: player.sleeperPlayerId,
          isActive: player.isActive,
        });
      } else {
        // Verificar se precisa atualizar
        const needsUpdate =
          existing.name !== player.name ||
          existing.position !== player.position ||
          existing.fantasyPositions !== player.fantasyPositions.join(',') ||
          existing.team !== player.nflTeam ||
          existing.isActive !== player.isActive;

        if (needsUpdate) {
          playersToUpdate.push({
            where: { sleeperPlayerId: player.sleeperPlayerId },
            data: {
              name: player.name,
              position: player.position,
              fantasyPositions: player.fantasyPositions.join(','),
              team: player.nflTeam,
              isActive: player.isActive,
            },
          });
        } else {
          playersUnchanged++;
        }
      }
    }

    console.log(`📈 Estatísticas de processamento:`);
    console.log(`   - Novos jogadores: ${playersToCreate.length}`);
    console.log(`   - Jogadores para atualizar: ${playersToUpdate.length}`);
    console.log(`   - Jogadores inalterados: ${playersUnchanged}`);

    // Configurações de otimização
    // Aumentamos a concorrência para 4 (deixa 1 livre no pool de 5)
    const CONCURRENCY_LIMIT = 4;
    const BATCH_SIZE_CREATE = 1000;
    const BATCH_SIZE_UPDATE = 100; // Aumentar lote para reduzir overhead de transações

    // Helper para processamento com concorrência controlada
    const processInBatches = async <T>(
      items: T[],
      batchSize: number,
      processor: (batch: T[]) => Promise<void>,
    ) => {
      // Dividir em lotes
      const batches: T[][] = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      console.log(
        `⚡ Processando ${items.length} itens em ${batches.length} lotes com concorrência ${CONCURRENCY_LIMIT}...`,
      );

      // Processar batches com limite de concorrência
      const queue = [...batches];
      const workers = Array(Math.min(CONCURRENCY_LIMIT, batches.length))
        .fill(null)
        .map(async (_, workerId) => {
          while (queue.length > 0) {
            const batch = queue.shift();
            if (batch) {
              // console.log(`Worker ${workerId} processando lote de ${batch.length}...`);
              await processor(batch);
            }
          }
        });

      await Promise.all(workers);
    };

    // Criar novos jogadores em lotes (Concorrente)
    if (playersToCreate.length > 0) {
      console.log(`🆕 Criando ${playersToCreate.length} novos jogadores...`);
      await processInBatches(playersToCreate, BATCH_SIZE_CREATE, async batch => {
        await prisma.player.createMany({
          data: batch,
          skipDuplicates: true,
        });
      });
    }

    // Atualizar jogadores existentes em lotes (Concorrente)
    if (playersToUpdate.length > 0) {
      console.log(`🔄 Atualizando ${playersToUpdate.length} jogadores existentes...`);
      await processInBatches(playersToUpdate, BATCH_SIZE_UPDATE, async batch => {
        await prisma.$transaction(batch.map(update => prisma.player.update(update)));
      });
    }

    const dbOperationsTime = Date.now() - dbStartTime;
    const totalTime = Date.now() - requestStartTime;
    const withinTimeout = totalTime < TIMEOUT_MS;

    console.log(`✅ Importação concluída em ${totalTime}ms`);
    console.log(`   - Tempo API: ${apiCallTime}ms`);
    console.log(`   - Tempo DB: ${dbOperationsTime}ms`);
    console.log(`   - Dentro do timeout: ${withinTimeout ? 'Sim' : 'Não'}`);

    return {
      success: true,
      imported: playersToCreate.length + playersToUpdate.length,
      message: `Importação concluída: ${playersToCreate.length} novos, ${playersToUpdate.length} atualizados, ${playersUnchanged} inalterados`,
      performanceStats: {
        totalTime,
        apiCallTime,
        dbOperationsTime,
        playersProcessed: players.length,
        withinTimeout,
        timeout: TIMEOUT_MS,
      },
    };
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error('❌ Erro durante importação:', error);

    return {
      success: false,
      message: `Erro durante importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      performanceStats: {
        totalTime,
        apiCallTime: 0,
        dbOperationsTime: 0,
        playersProcessed: 0,
        withinTimeout: totalTime < 25000,
        timeout: 25000,
      },
    };
  }
}

// ============================================================================
// ROTA API
// ============================================================================

export async function POST() {
  const requestStartTime = Date.now();

  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.user.role !== UserRole.COMMISSIONER) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas comissários podem importar jogadores.' },
        { status: 403 },
      );
    }

    // Implementar timeout de segurança
    const TIMEOUT_MS = 25000; // 25 segundos para Vercel

    const timeoutPromise = new Promise<ImportResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: Importação excedeu 25 segundos'));
      }, TIMEOUT_MS);
    });

    // Competir entre importação e timeout
    const result = await Promise.race([importPlayersWithTimeout(), timeoutPromise]);

    const totalRequestTime = Date.now() - requestStartTime;
    console.log(`🏁 Request total: ${totalRequestTime}ms`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        imported: result.imported,
        message: result.message,
        performanceStats: {
          ...result.performanceStats,
          totalRequestTime,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          performanceStats: result.performanceStats,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const totalRequestTime = Date.now() - requestStartTime;

    if (error instanceof Error && error.message.includes('Timeout')) {
      console.error('⏰ Timeout na importação de jogadores');
      return NextResponse.json(
        {
          success: false,
          message: 'Importação interrompida por timeout (25s). Tente novamente.',
          performanceStats: {
            totalTime: totalRequestTime,
            withinTimeout: false,
            timeout: 25000,
          },
        },
        { status: 408 },
      );
    }

    console.error('❌ Erro na importação de jogadores:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        performanceStats: {
          totalTime: totalRequestTime,
          withinTimeout: totalRequestTime < 25000,
          timeout: 25000,
        },
      },
      { status: 500 },
    );
  }
}
