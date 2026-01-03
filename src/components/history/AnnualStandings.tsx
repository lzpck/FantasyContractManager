'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SeasonHistory } from '@/services/sleeperService';
import { TrophyIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Trophy } from 'lucide-react';

interface AnnualStandingsProps {
  history: SeasonHistory[];
}

type SortField = 'position' | 'name' | 'wins' | 'losses' | 'pct' | 'pointsFor' | 'pointsAgainst';

function TeamAvatar({ avatar, teamName }: { avatar: string; teamName: string }) {
  const [src, setSrc] = useState(`https://sleepercdn.com/avatars/thumbs/${avatar}`);

  return (
    <Image
      src={src}
      alt={teamName}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
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
      return <ChevronUpIcon className="w-4 h-4 text-slate-500" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 text-blue-400" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 text-blue-400" />
    );
  };

  const SortableHeader = ({
    column,
    children,
    className = '',
  }: {
    column: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:text-slate-100 transition-colors ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {renderSortIcon(column)}
      </div>
    </th>
  );

  return (
    <div className="space-y-0">
      {/* Card do Filtro de Ano */}
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl p-4 border-b-0">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-slate-100">Classificação Histórica</h2>
          </div>
          <div>
            <select
              className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedYear.toString()}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              {history.map(season => (
                <option key={season.year} value={season.year.toString()}>
                  Temporada {season.year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Tabela */}
      <div className="bg-slate-800 border border-slate-700 border-t-0 rounded-b-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-700">
              <tr>
                <SortableHeader column="position">Pos</SortableHeader>
                <SortableHeader column="name">Time</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Manager
                </th>
                <SortableHeader column="wins">V</SortableHeader>
                <SortableHeader column="losses">D</SortableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  E
                </th>
                <SortableHeader column="pct">PCT</SortableHeader>
                <SortableHeader column="pointsFor">PF</SortableHeader>
                <SortableHeader column="pointsAgainst">PA</SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-600">
              {sortedStandings.map(standing => {
                const isChampion = championRosterId === standing.rosterId;
                const isRunnerUp = runnerUpRosterId === standing.rosterId;

                return (
                  <tr
                    key={standing.rosterId}
                    className={`
                      hover:bg-slate-700 transition-colors
                      ${isChampion ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : ''}
                      ${isRunnerUp ? 'bg-slate-500/10 hover:bg-slate-500/20' : ''}
                    `}
                  >
                    {/* Pos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {isChampion ? (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-500">
                            <Trophy className="h-5 w-5" />
                          </div>
                        ) : isRunnerUp ? (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-400/20 text-slate-400">
                            <Trophy className="h-5 w-5" />
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-slate-300 pl-2">
                            {standing.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time: Avatar + Nome */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-10 w-10 ${
                            isChampion
                              ? 'ring-2 ring-yellow-500 rounded-full'
                              : isRunnerUp
                                ? 'ring-2 ring-slate-400 rounded-full'
                                : ''
                          }`}
                        >
                          {standing.avatar ? (
                            <TeamAvatar avatar={standing.avatar} teamName={standing.teamName} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-200">
                                {standing.teamName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-sm font-medium ${
                                isChampion
                                  ? 'text-yellow-400'
                                  : isRunnerUp
                                    ? 'text-slate-300'
                                    : 'text-slate-100'
                              }`}
                            >
                              {standing.teamName}
                            </div>
                            {isChampion && (
                              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                                Campeão
                              </span>
                            )}
                            {isRunnerUp && (
                              <span className="inline-flex items-center rounded-full bg-slate-400/10 px-2 py-0.5 text-xs font-medium text-slate-400">
                                Vice
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {standing.ownerDisplayName || 'N/A'}
                      </div>
                    </td>

                    {/* Wins */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-400">{standing.wins}</span>
                    </td>

                    {/* Losses */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-red-400">{standing.losses}</span>
                    </td>

                    {/* Ties */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-400">{standing.ties}</span>
                    </td>

                    {/* PCT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-400">
                        {(standing.pct * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* PF */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-100">
                        {standing.pointsFor.toFixed(2)}
                      </span>
                    </td>

                    {/* PA */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {standing.pointsAgainst.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {sortedStandings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-slate-100 mb-2">
                      Nenhum dado encontrado
                    </h3>
                    <p className="text-slate-400">Não há dados para esta temporada ou filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legenda (Simplificada) */}
        <div className="p-4 bg-slate-700/50 border-t border-slate-600">
          <h4 className="text-sm font-medium text-slate-200 mb-2">Legenda:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span>Campeão da Temporada</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 text-slate-400" />
              <span>Vice-campeão</span>
            </div>
            <div>
              <strong>PF/PA:</strong> Pontos Feitos/Pontos Contra
            </div>
            <div>
              <strong>PCT:</strong> Porcentagem de Vitórias
            </div>
            <div className="col-span-full mt-2 pt-2 border-t border-slate-600/50 text-slate-500 italic">
              * Estatísticas e classificação consideram apenas a Temporada Regular.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
