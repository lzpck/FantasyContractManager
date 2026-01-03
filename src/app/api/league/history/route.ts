import { NextResponse } from 'next/server';
import { SleeperService } from '@/services/sleeperService';

export const dynamic = 'force-dynamic'; // Garantir que não seja estático, mas usaremos cache manual se necessário

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  const includeMatchups = searchParams.get('includeMatchups') === 'true';

  if (!leagueId) {
    return NextResponse.json({ error: 'League ID required' }, { status: 400 });
  }

  try {
    // 1. Buscar histórico básico (campeões, standings)
    const history = await SleeperService.fetchHistory(leagueId);

    // 2. Se solicitado, buscar matchups completos para matriz H2H
    if (includeMatchups) {
      /* 
         Isso pode demorar, pois fará ~= 17 requests * N temporadas.
         Idealmente, o frontend deve solicitar isso apenas quando o usuário entrar na aba "Confrontos".
         Ou podemos cachear agressivamente.
      */
      await Promise.all(
        history.map(async season => {
          try {
            season.matchups = await SleeperService.fetchAllSeasonMatchups(season.leagueId);
          } catch (err) {
            console.error(
              `Erro ao buscar matchups para temporada ${season.year} (${season.leagueId}):`,
              err,
            );
          }
        }),
      );
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching league history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: (error as Error).message },
      { status: 500 },
    );
  }
}
