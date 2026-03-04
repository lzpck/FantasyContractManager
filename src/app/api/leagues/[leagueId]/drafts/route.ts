import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSleeperLeague, SleeperLeague } from '@/services/sleeperService';

/**
 * Interface para picks do Draft (projetada)
 */
export interface DraftPickProjection {
  round: number;
  pickInRound: number;
  overallPick: number;
  originalRosterId: number;
  currentRosterId: number;
  salaryCap: number;
  teamName: string;
  originalTeamName: string;
  ownerId?: string;
  isTraded: boolean;
}

export interface DraftInfoResponse {
  draftId?: string;
  season?: string;
  status: string;
  rounds: number;
  picks: DraftPickProjection[];
  teams: any[];
}

// Valores da escala salarial dos rookies (conforme regras The Bad Place)
const getRookieSalary = (round: number, pickInRound: number): number => {
  if (round === 1) {
    // 1.01: $13.960.000, diminui 960k por pick
    return 13960000 - (pickInRound - 1) * 960000;
  } else if (round === 2) {
    // 2.01: $2.500.000, diminui 100k por pick
    return 2500000 - (pickInRound - 1) * 100000;
  } else {
    // 3ª Rodada em diante: $1.000.000 fixo
    return 1000000;
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar a liga local para obter o ID do Sleeper
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        teams: true,
      },
    });

    if (!league || !league.sleeperLeagueId) {
      return NextResponse.json(
        { error: 'Liga não encontrada ou não vinculada ao Sleeper' },
        { status: 404 },
      );
    }

    // Buscar times da liga
    const localTeams = league.teams;

    const searchSeason = request.nextUrl.searchParams.get('season');
    const availableDrafts: { draftId: string; season: string }[] = [];
    let targetDraft: any = null;
    let currentSleeperLeagueId = league.sleeperLeagueId;

    // Buscar histórico de drafts iterando nas ligas (do ano atual para trás)
    while (currentSleeperLeagueId) {
      const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${currentSleeperLeagueId}`);
      if (!leagueRes.ok) break;
      const sleeperLeagueData = await leagueRes.json();

      const iterSeason = parseInt(sleeperLeagueData.season || '0', 10);

      // Regra: manter o histórico dos drafts, mas a partir de 2026
      if (iterSeason > 0 && iterSeason < 2026) {
        break;
      }

      // Buscar drafts dessa liga específica (deste ano)
      const draftsResponse = await fetch(
        `https://api.sleeper.app/v1/league/${currentSleeperLeagueId}/drafts`,
      );
      if (draftsResponse.ok) {
        const drafts = await draftsResponse.json();
        if (drafts && drafts.length > 0) {
          const mainDraft = drafts[0];
          availableDrafts.push({
            draftId: mainDraft.draft_id,
            season: mainDraft.season,
          });

          // Se a data de season bate com a buscada, ou se é a primeira (mais recente) e não tem filtro
          if (searchSeason && mainDraft.season === searchSeason) {
            targetDraft = mainDraft;
          } else if (!searchSeason && !targetDraft) {
            targetDraft = mainDraft;
          }
        }
      }

      currentSleeperLeagueId = sleeperLeagueData.previous_league_id;
    }

    if (!targetDraft) {
      return NextResponse.json({
        draftId: null,
        status: 'not_found',
        rounds: 3,
        picks: [],
        teams: localTeams,
        availableDrafts,
        currentSeason: searchSeason,
      });
    }

    // Buscar picks trocadas do draft alvo
    let tradedPicks: any[] = [];
    if (targetDraft.draft_id) {
      const tradedResponse = await fetch(
        `https://api.sleeper.app/v1/draft/${targetDraft.draft_id}/traded_picks`,
      );
      if (tradedResponse.ok) {
        tradedPicks = await tradedResponse.json();
      }
    }

    const rounds = targetDraft.settings?.rounds || 3;
    const numTeams = targetDraft.settings?.teams || 12;
    const slotToRosterId = targetDraft.slot_to_roster_id || {};
    const draftOrder = targetDraft.draft_order || {};

    // Criar um mapa de 'slot' (1, 2, 3...) para 'owner_id'
    const slotToOwnerId: Record<number, string> = {};
    for (const [ownerId, slot] of Object.entries(draftOrder)) {
      slotToOwnerId[slot as number] = ownerId;
    }

    const picks: DraftPickProjection[] = [];

    // Gerar as picks da tabela
    for (let round = 1; round <= rounds; round++) {
      for (let pickInRound = 1; pickInRound <= numTeams; pickInRound++) {
        // Encontra o roster_id original daquele slot
        const originalRosterIdStr = slotToRosterId[pickInRound.toString()];
        const originalRosterId = originalRosterIdStr
          ? parseInt(originalRosterIdStr, 10)
          : pickInRound;

        // O dono original é verificado pelo mapa se existir
        const pickOriginalOwnerId = slotToOwnerId[pickInRound];

        // Se houver um owner definido diretamente no draft_order pro pick, descobrimos seu rosterId
        // pela ligação owner <-> team (uma vez que roster_id no sleeper mapeia pra isso)
        let resolvedOriginalRosterId = originalRosterIdStr
          ? parseInt(originalRosterIdStr, 10)
          : pickInRound;

        if (pickOriginalOwnerId) {
          const ownerTeam = localTeams.find(t => t.sleeperOwnerId === pickOriginalOwnerId);
          if (ownerTeam && ownerTeam.sleeperTeamId) {
            resolvedOriginalRosterId = parseInt(ownerTeam.sleeperTeamId, 10);
          }
        }

        // Verifica se houve troca
        const tradedPick = tradedPicks.find(
          (tp: any) => tp.round === round && tp.roster_id === resolvedOriginalRosterId,
        );

        const currentRosterId = tradedPick ? tradedPick.owner_id : resolvedOriginalRosterId;
        const isTraded = !!tradedPick;

        const currentTeam = localTeams.find(t => t.sleeperTeamId === currentRosterId.toString());
        const originalTeam = localTeams.find(
          t => t.sleeperTeamId === resolvedOriginalRosterId.toString(),
        );

        picks.push({
          round,
          pickInRound,
          overallPick: (round - 1) * numTeams + pickInRound,
          originalRosterId: resolvedOriginalRosterId,
          currentRosterId,
          salaryCap: getRookieSalary(round, pickInRound),
          teamName: currentTeam ? currentTeam.name : `Time ${currentRosterId}`,
          originalTeamName: originalTeam ? originalTeam.name : `Time ${resolvedOriginalRosterId}`,
          ownerId: currentTeam?.ownerId || undefined,
          isTraded,
        });
      }
    }

    return NextResponse.json({
      draftId: targetDraft.draft_id,
      season: targetDraft.season,
      status: targetDraft.status,
      rounds,
      picks,
      availableDrafts,
      teams: localTeams.map(t => ({
        id: t.id,
        name: t.name,
        sleeperTeamId: t.sleeperTeamId,
        ownerId: t.ownerId,
      })),
    });
  } catch (error) {
    console.error('Erro ao processar dados do draft:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
