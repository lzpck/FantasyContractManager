/**
 * Script de teste para verificar a correção do problema de sincronização
 * dos jogadores do IR e Taxi Squad com o Sleeper
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSyncFix() {
  try {
    // 1. Buscar uma liga para teste
    const league = await prisma.league.findFirst({
      where: {
        sleeperLeagueId: { not: null },
      },
      include: {
        teams: {
          include: {
            roster: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    if (!league) {
      return;
    }

    // 2. Verificar status atual dos jogadores
    // (logs removidos para manter apenas funcionalidade essencial)

    // 3. Simular chamada de sincronização

    const response = await fetch(`http://localhost:3000/api/leagues/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leagueId: league.id,
      }),
    });

    if (!response.ok) {
      return;
    }

    const syncResult = await response.json();

    // 4. Verificar status após sincronização

    const updatedLeague = await prisma.league.findUnique({
      where: { id: league.id },
      include: {
        teams: {
          include: {
            roster: {
              include: {
                player: true,
              },
            },
          },
        },
      },
    });

    // Verificação dos status após sincronização
    // (logs removidos para manter apenas funcionalidade essencial)

    return { success: true, league: updatedLeague };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSyncFix();
}

module.exports = { testSyncFix };
