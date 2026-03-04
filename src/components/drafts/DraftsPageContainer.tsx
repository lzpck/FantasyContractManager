'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowRightLeft, ScrollText, Trophy } from 'lucide-react';
import { formatSalaryCap } from '@/lib/utils';
import { DraftPickProjection, DraftInfoResponse } from '@/app/api/leagues/[leagueId]/drafts/route';
import { Badge } from '@/components/ui/badge';

export function DraftsPageContainer({ leagueId }: { leagueId: string }) {
  const [draftInfo, setDraftInfo] = useState<
    (DraftInfoResponse & { availableDrafts?: { draftId: string; season: string }[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const query = selectedSeason ? `?season=${selectedSeason}` : '';
        const res = await fetch(`/api/leagues/${leagueId}/drafts${query}`);
        if (!res.ok) throw new Error('Falha ao carregar informações de drafts');
        const data = await res.json();
        setDraftInfo(data);
        if (!selectedSeason && data.season) {
          setSelectedSeason(data.season);
        }
      } catch (err) {
        setError('Erro ao carregar os dados do draft. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (leagueId) fetchDrafts();
  }, [leagueId, selectedSeason]);

  if (loading && !draftInfo) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-muted-foreground text-slate-400">Carregando informações do Draft...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-6 text-center">
        <h3 className="text-lg font-semibold text-red-500">Erro Tático</h3>
        <p className="mt-2 text-slate-300">{error}</p>
      </div>
    );
  }

  if (!draftInfo || draftInfo.picks.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <ScrollText className="h-16 w-16 text-slate-700" />
        <h2 className="text-2xl font-bold text-slate-200">Nenhum Draft Encontrado</h2>
        <p className="text-slate-400">
          Não foi possível encontrar um draft do Sleeper associado a esta liga nesta temporada.
        </p>

        {draftInfo?.availableDrafts && draftInfo.availableDrafts.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-medium text-slate-300">Tentar outra temporada:</span>
            <select
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="w-32 rounded-md bg-slate-800 border-slate-700 text-slate-200 py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                Temporada
              </option>
              {draftInfo.availableDrafts.map(d => (
                <option key={d.draftId} value={d.season}>
                  {d.season}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // Agrupando as escolhas por round
  const picksByRound = Array.from({ length: draftInfo.rounds }, (_, idx) => {
    const roundNumber = idx + 1;
    return draftInfo.picks.filter(p => p.round === roundNumber);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ScrollText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Rookie Draft</h1>
            <p className="text-slate-400">
              Acompanhe a ordem das escolhas{draftInfo.season ? ` para ${draftInfo.season}` : ''},
              impactos no salary cap e trocas realizadas.
            </p>
          </div>
        </div>

        {draftInfo?.availableDrafts && draftInfo.availableDrafts.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-400">Temporada:</span>
            <select
              value={selectedSeason || draftInfo.season}
              onChange={e => setSelectedSeason(e.target.value)}
              disabled={loading}
              className="w-32 rounded-md bg-slate-800 border border-slate-700 text-slate-200 py-2 px-3 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>
                Selecione
              </option>
              {draftInfo.availableDrafts.map(d => (
                <option key={d.draftId} value={d.season}>
                  {d.season}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && draftInfo && (
        <div className="mb-4 flex items-center justify-center py-4 text-blue-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Buscando dados da temporada...</span>
        </div>
      )}

      {draftInfo.status === 'complete' && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 flex items-start gap-4">
          <Trophy className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-500">Draft Concluído</h3>
            <p className="text-sm text-slate-300 mt-1">
              Este draft já foi finalizado no Sleeper. A ordem e trocas abaixo representam a
              configuração antes/durante do Draft.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Rounds */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {picksByRound.map(roundPicks => {
          if (roundPicks.length === 0) return null;
          const currentRoundNumber = roundPicks[0].round;

          return (
            <Card
              key={`round-${currentRoundNumber}`}
              className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col"
            >
              <CardHeader className="bg-slate-950/50 border-b border-slate-800 pb-4">
                <CardTitle className="text-xl text-slate-100 flex items-center justify-between">
                  <span>Rodada {currentRoundNumber}</span>
                  <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-900">
                    {roundPicks.length} Escolhas
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {currentRoundNumber === 1
                    ? 'Opção de 4º ano ativável no futuro'
                    : 'Contrato padrão de 3 anos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {roundPicks.map(pick => (
                    <div
                      key={pick.overallPick}
                      className={`p-4 transition-colors hover:bg-slate-800/50 ${
                        pick.isTraded ? 'bg-indigo-950/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        {/* Pick Info & Team */}
                        <div className="flex gap-4">
                          <div className="font-mono text-sm font-bold text-slate-500 mt-1 w-10 text-right">
                            {pick.round}.{pick.pickInRound.toString().padStart(2, '0')}
                          </div>

                          <div>
                            <div className="font-medium text-slate-200">{pick.teamName}</div>

                            {/* Traded Info */}
                            {pick.isTraded && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                                <ArrowRightLeft className="h-3 w-3" />
                                <span>via {pick.originalTeamName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Salary Info */}
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className="bg-green-950/30 text-emerald-400 hover:bg-green-950/50 border-0 font-mono"
                          >
                            {formatSalaryCap(pick.salaryCap)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
