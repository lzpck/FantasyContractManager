'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SeasonHistory } from '@/services/sleeperService';
import { Trophy, ChevronUp, ChevronDown, Filter, Medal, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AnnualStandingsProps {
  history: SeasonHistory[];
}

type SortField = 'position' | 'name' | 'wins' | 'losses' | 'pct' | 'pointsFor' | 'pointsAgainst';

function TeamAvatar({
  avatar,
  teamName,
  className,
}: {
  avatar?: string;
  teamName: string;
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
      width={40}
      height={40}
      className={cn('bg-slate-800', className)}
      onError={() => {
        setSrc('https://sleepercdn.com/images/v2/icons/player_default.webp');
      }}
      unoptimized
    />
  );
}

export function AnnualStandings({ history }: AnnualStandingsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    history[0]?.year || new Date().getFullYear(),
  );
  const [sortBy, setSortBy] = useState<SortField>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const currentSeasonData = history.find(h => h.year === selectedYear);
  const rawStandings = currentSeasonData?.standings || [];

  // Dados do campeão e vice para a temporada selecionada
  const championRosterId = currentSeasonData?.champion?.rosterId;
  const runnerUpRosterId = currentSeasonData?.runnerUp?.rosterId;

  // 1. Processar dados (adicionar PCT, etc)
  const processedStandings = rawStandings.map(team => {
    const totalGames = team.wins + team.losses + team.ties;
    const pct = totalGames > 0 ? team.wins / totalGames : 0;

    return {
      ...team,
      pct,
    };
  });

  // 3. Ordenar
  const sortedStandings = [...processedStandings].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'position':
        comparison = a.rank - b.rank;
        break;
      case 'name':
        comparison = a.teamName.localeCompare(b.teamName);
        break;
      case 'wins':
        comparison = a.wins - b.wins;
        break;
      case 'losses':
        comparison = a.losses - b.losses;
        break;
      case 'pct':
        comparison = a.pct - b.pct;
        break;
      case 'pointsFor':
        comparison = a.pointsFor - b.pointsFor;
        break;
      case 'pointsAgainst':
        comparison = a.pointsAgainst - b.pointsAgainst;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      // Padrão desc para stats, asc para rank/nome
      if (['name', 'position'].includes(field)) {
        setSortOrder('asc');
      } else {
        setSortOrder('desc');
      }
    }
  };

  const renderSortIcon = (column: SortField) => {
    if (sortBy !== column) {
      return <div className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    );
  };

  const SortableHeader = ({
    column,
    children,
    className = '',
    align = 'left',
  }: {
    column: SortField;
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
  }) => (
    <th
      className={cn(
        'px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 hover:bg-slate-800/50 transition-colors select-none',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
      onClick={() => handleSort(column)}
    >
      <div
        className={cn(
          'flex items-center gap-1.5',
          align === 'center' && 'justify-center',
          align === 'right' && 'justify-end',
        )}
      >
        <span>{children}</span>
        {renderSortIcon(column)}
      </div>
    </th>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 leading-tight">Classificação</h2>
            <p className="text-sm text-slate-500">Histórico anual detalhado</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[200px]">
            <select
              className="w-full appearance-none h-11 pl-11 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
              value={selectedYear.toString()}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              {history.map(season => (
                <option key={season.year} value={season.year.toString()}>
                  Temporada {season.year}
                </option>
              ))}
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 shadow-xl shadow-black/20">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full divide-y divide-slate-800">
            <thead>
              <tr className="bg-slate-900/80">
                <SortableHeader column="position" className="pl-6 w-16" align="center">
                  Pos
                </SortableHeader>
                <SortableHeader column="name" className="pl-6">
                  Time
                </SortableHeader>
                <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-[20%] hidden md:table-cell">
                  Manager
                </th>
                <SortableHeader column="wins" align="center" className="w-[8%]">
                  V
                </SortableHeader>
                <SortableHeader column="losses" align="center" className="w-[8%]">
                  D
                </SortableHeader>
                <th className="px-4 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-[8%]">
                  E
                </th>
                <SortableHeader column="pct" align="center" className="w-[10%]">
                  PCT
                </SortableHeader>
                <SortableHeader column="pointsFor" align="right">
                  PF
                </SortableHeader>
                <SortableHeader column="pointsAgainst" align="right" className="pr-6">
                  PA
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedStandings.map(standing => {
                const isChampion = championRosterId === standing.rosterId;
                const isRunnerUp = runnerUpRosterId === standing.rosterId;

                return (
                  <tr
                    key={standing.rosterId}
                    className={cn(
                      'group transition-all duration-200 hover:bg-slate-800/60',
                      isChampion ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : '',
                      isRunnerUp ? 'bg-slate-700/5 hover:bg-slate-700/10' : '',
                    )}
                  >
                    {/* Pos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {isChampion ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 ring-1 ring-yellow-500/50 shadow-[0_0_10px_-3px_rgba(234,179,8,0.3)]">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          </div>
                        ) : isRunnerUp ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/30 ring-1 ring-slate-500/50">
                            <Medal className="h-4 w-4 text-slate-400" />
                          </div>
                        ) : (
                          <span
                            className={cn(
                              'text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full',
                              standing.rank <= 4
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-slate-500',
                            )}
                          >
                            {standing.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time: Avatar + Nome */}
                    <td className="px-4 py-4 whitespace-nowrap pl-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2 transition-all group-hover:scale-105',
                            isChampion
                              ? 'ring-yellow-500 shadow-lg shadow-yellow-500/20'
                              : isRunnerUp
                                ? 'ring-slate-400'
                                : 'ring-slate-700 group-hover:ring-slate-600',
                          )}
                        >
                          <TeamAvatar
                            avatar={standing.avatar}
                            teamName={standing.teamName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'font-bold text-sm',
                                isChampion
                                  ? 'text-yellow-500'
                                  : isRunnerUp
                                    ? 'text-slate-200'
                                    : 'text-slate-200',
                              )}
                            >
                              {standing.teamName}
                            </span>
                            {isChampion && (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-500/20 text-yellow-500 border-0 text-[10px] h-4 px-1"
                              >
                                CAMPEÃO
                              </Badge>
                            )}
                            {isRunnerUp && (
                              <Badge
                                variant="outline"
                                className="border-slate-600 text-slate-400 text-[10px] h-4 px-1"
                              >
                                VICE
                              </Badge>
                            )}
                          </div>
                          {/* Mobile Manager Name */}
                          <span className="text-xs text-slate-500 md:hidden">
                            {standing.ownerDisplayName || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Manager (Desktop) */}
                    <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                        {standing.ownerDisplayName || 'N/A'}
                      </div>
                    </td>

                    {/* Wins */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-slate-200">{standing.wins}</span>
                    </td>

                    {/* Losses */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-slate-500">
                        {standing.losses}
                      </span>
                    </td>

                    {/* Ties */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="text-xs font-medium text-slate-600">
                        {standing.ties > 0 ? standing.ties : '-'}
                      </span>
                    </td>

                    {/* PCT */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            standing.pct >= 0.5 ? 'text-green-400' : 'text-red-400',
                          )}
                        >
                          {(standing.pct * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* PF */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-slate-300 tabular-nums font-mono">
                        {standing.pointsFor.toFixed(1)}
                      </span>
                    </td>

                    {/* PA */}
                    <td className="px-4 py-4 whitespace-nowrap text-right pr-6">
                      <span className="text-sm text-slate-500 tabular-nums font-mono group-hover:text-slate-400 transition-colors">
                        {standing.pointsAgainst.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {sortedStandings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <TrendingUp className="h-8 w-8 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">
                        Nenhum dado encontrado
                      </h3>
                      <p className="text-slate-500 max-w-sm">
                        Não encontramos registros de classificação para a temporada ou filtros
                        selecionados.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Legend */}
        <div className="bg-slate-900/80 border-t border-slate-800 px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400 uppercase tracking-wider">Legenda:</span>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span>Campeão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Medal className="h-3 w-3 text-slate-400" />
              <span>Vice-Campeão</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-green-400">PCT</span>
              <span>Aproveitamento {'>'}= 50%</span>
            </div>
            <div className="ml-auto flex items-center gap-1 italic text-slate-600">
              <span>* Apenas Temp. Regular</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
