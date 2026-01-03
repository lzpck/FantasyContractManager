'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { SeasonHistory } from '@/services/sleeperService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, ChevronDown, ChevronUp, ArrowUpDown, Star, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChampionsListProps {
  history: SeasonHistory[];
}

function TeamAvatar({
  avatar,
  teamName,
  size,
  className,
}: {
  avatar?: string;
  teamName: string;
  size: number;
  className?: string;
}) {
  const [src, setSrc] = useState(
    avatar
      ? `https://sleepercdn.com/avatars/thumbs/${avatar}`
      : 'https://sleepercdn.com/images/v2/icons/player_default.webp',
  );

  return (
    <Image
      src={src}
      alt={teamName}
      width={size}
      height={size}
      className={cn('bg-slate-800', className)}
      onError={() => {
        setSrc('https://sleepercdn.com/images/v2/icons/player_default.webp');
      }}
      unoptimized
    />
  );
}

export function ChampionsList({ history }: ChampionsListProps) {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'recent'>('all');

  const filteredAndSortedHistory = useMemo(() => {
    let data = [...history];

    // Filter
    if (periodFilter === 'recent') {
      const currentYear = new Date().getFullYear();
      data = data.filter(season => season.year >= currentYear - 5);
    }

    // Sort
    data.sort((a, b) => {
      return sortOrder === 'desc' ? b.year - a.year : a.year - b.year;
    });

    return data;
  }, [history, sortOrder, periodFilter]);

  const toggleExpand = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const getTeamStats = (season: SeasonHistory, rosterId?: number) => {
    if (!rosterId) return null;
    return season.standings.find(s => s.rosterId === rosterId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={periodFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPeriodFilter('all')}
            className={cn(
              'h-9 px-4 rounded-lg transition-all',
              periodFilter === 'all'
                ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
            )}
          >
            Todos
          </Button>
          <Button
            variant={periodFilter === 'recent' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPeriodFilter('recent')}
            className={cn(
              'h-9 px-4 rounded-lg transition-all',
              periodFilter === 'recent'
                ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
            )}
          >
            Últimos 5 Anos
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
          className="h-9 gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {filteredAndSortedHistory.map(season => {
          const champion = season.champion;
          const runnerUp = season.runnerUp;
          const isExpanded = expandedYear === season.year;

          const championStats = getTeamStats(season, champion?.rosterId);
          const runnerUpStats = getTeamStats(season, runnerUp?.rosterId);

          return (
            <Card
              key={season.year}
              className={cn(
                'group overflow-hidden border transition-all duration-300 bg-slate-800',
                isExpanded
                  ? 'border-yellow-500/50 shadow-lg shadow-black/20 ring-1 ring-yellow-500/20'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-750',
              )}
            >
              <div
                className="cursor-pointer"
                onClick={() => toggleExpand(season.year)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggleExpand(season.year);
                  }
                }}
                role="button"
                aria-expanded={isExpanded}
              >
                {/* Custom Gradient Background for Card Header when Expanded */}
                <div
                  className={cn(
                    'relative flex items-center justify-between p-5 sm:p-6 transition-colors duration-300',
                    isExpanded
                      ? 'bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900/50'
                      : '',
                  )}
                >
                  {/* Left: Year & Badge */}
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="flex min-w-[70px] flex-col items-center justify-center">
                      <span
                        className={cn(
                          'text-3xl font-black tabular-nums transition-colors',
                          isExpanded
                            ? 'text-yellow-500'
                            : 'text-slate-500 group-hover:text-slate-300',
                        )}
                      >
                        {season.year}
                      </span>
                      {isExpanded && (
                        <Badge
                          variant="outline"
                          className="mt-1 border-yellow-500/30 text-[10px] text-yellow-500 bg-yellow-500/10"
                        >
                          CAMPEÃO
                        </Badge>
                      )}
                    </div>

                    {/* Champion Info (Summary) */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className={cn(
                            'absolute -inset-1 rounded-full opacity-0 blur-md transition-opacity duration-500',
                            isExpanded
                              ? 'bg-yellow-500 opacity-20'
                              : 'group-hover:opacity-10 bg-white',
                          )}
                        />
                        <div
                          className={cn(
                            'relative h-14 w-14 overflow-hidden rounded-full border-2 transition-all duration-300',
                            isExpanded
                              ? 'border-yellow-500 h-16 w-16'
                              : 'border-slate-600 group-hover:border-slate-500',
                          )}
                        >
                          <TeamAvatar
                            avatar={champion?.avatar}
                            teamName={champion?.teamName || 'Champion'}
                            size={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div
                          className={cn(
                            'absolute -bottom-1 -right-1 rounded-full p-1 text-black shadow-sm transition-transform duration-300',
                            isExpanded
                              ? 'bg-yellow-500 scale-110'
                              : 'bg-slate-600 scale-100 group-hover:bg-slate-500',
                          )}
                        >
                          <Trophy
                            className={cn(
                              'h-3.5 w-3.5',
                              isExpanded ? 'text-yellow-950' : 'text-slate-300',
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <h3
                          className={cn(
                            'text-lg font-bold leading-tight transition-colors',
                            isExpanded ? 'text-slate-100' : 'text-slate-300 group-hover:text-white',
                          )}
                        >
                          {champion?.teamName || 'Desconhecido'}
                        </h3>
                        <p className="flex items-center gap-2 text-sm text-slate-500">
                          <span
                            className={cn(
                              'font-medium',
                              isExpanded ? 'text-yellow-500' : 'text-slate-500',
                            )}
                          >
                            {championStats ? `${championStats.wins} Vitórias` : 'Campeão'}
                          </span>
                          {championStats && (
                            <>
                              <span className="text-slate-700">•</span>
                              <span className="text-slate-600">
                                {championStats.pointsFor.toFixed(0)} pts
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Expand Icon */}
                  <div className="text-slate-500 px-2">
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6" />
                    ) : (
                      <ChevronDown className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px w-full bg-slate-700/50" />
                  <CardContent className="bg-slate-900/30 p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Champion Detailed Stats */}
                      <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-slate-800/50 p-5 shadow-inner">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Crown className="h-24 w-24 text-yellow-500" />
                        </div>

                        <div className="mb-6 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-500/10">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          </div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                            Estatísticas do Título
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Recorde (Reg.)
                            </span>
                            <span className="text-2xl font-black text-slate-200">
                              {championStats?.wins}-{championStats?.losses}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Pontos Totais
                            </span>
                            <span className="text-2xl font-black text-yellow-500 tabular-nums">
                              {championStats?.pointsFor.toFixed(1) || '0.0'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Classificação
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-slate-200">
                                #{championStats?.rank || '-'}
                              </span>
                              {championStats?.rank === 1 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-yellow-500/20 text-yellow-500 text-[10px] border-0 h-5"
                                >
                                  TOP SEED
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                              Aproveitamento
                            </span>
                            <span className="text-2xl font-black text-slate-400 tabular-nums">
                              {championStats
                                ? (
                                    (championStats.wins /
                                      (championStats.wins + championStats.losses)) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Runner Up */}
                      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 p-5">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-700/50">
                            <Medal className="h-5 w-5 text-slate-400" />
                          </div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                            Vice-Campeão
                          </h4>
                        </div>

                        <div className="flex items-center gap-5 mb-8">
                          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-slate-600 shadow-md">
                            <TeamAvatar
                              avatar={runnerUp?.avatar}
                              teamName={runnerUp?.teamName || 'Vice'}
                              size={64}
                              className="h-full w-full object-cover grayscale-[0.3]"
                            />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-slate-300">{runnerUp?.teamName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-slate-500 border-slate-700 font-mono text-xs"
                              >
                                {runnerUpStats?.wins}-{runnerUpStats?.losses}
                              </Badge>
                              <span className="text-xs text-slate-500 font-mono">
                                {runnerUpStats?.pointsFor.toFixed(1)} PTS
                              </span>
                            </div>
                          </div>
                        </div>

                        {championStats && runnerUpStats && (
                          <div className="space-y-3 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                              <span>Comparativo de Pontos</span>
                              <span
                                className={
                                  championStats.pointsFor > runnerUpStats.pointsFor
                                    ? 'text-yellow-500'
                                    : 'text-slate-400'
                                }
                              >
                                +{(championStats.pointsFor - runnerUpStats.pointsFor).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-900">
                              <div
                                className="h-full bg-yellow-500"
                                style={{
                                  width: `${(championStats.pointsFor / (championStats.pointsFor + runnerUpStats.pointsFor)) * 100}%`,
                                }}
                              />
                              <div
                                className="h-full bg-slate-600"
                                style={{
                                  width: `${(runnerUpStats.pointsFor / (championStats.pointsFor + runnerUpStats.pointsFor)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
