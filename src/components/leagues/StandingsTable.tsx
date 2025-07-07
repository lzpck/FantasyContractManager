'use client';

import { useState } from 'react';
import { TeamStanding, StandingsSortBy, League } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  TrophyIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/Tooltip';

interface StandingsTableProps {
  /** Lista de classificação dos times */
  standings: TeamStanding[];
  /** Função chamada ao clicar em um time */
  onTeamClick: (teamId: string) => void;
  /** Informações da liga */
  league: League;
  /** Função para ordenar classificação */
  onSort: (sortBy: StandingsSortBy, order: 'asc' | 'desc') => void;
  /** Estado de carregamento */
  loading?: boolean;
}

/**
 * Componente de tabela de classificação
 * 
 * Exibe a classificação dos times com vitórias, derrotas, pontos,
 * salary cap e destaque para zona de playoffs.
 */
export function StandingsTable({ 
  standings, 
  onTeamClick, 
  league, 
  onSort, 
  loading = false 
}: StandingsTableProps) {
  const [sortBy, setSortBy] = useState<StandingsSortBy>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchText, setSearchText] = useState('');

  // Filtrar standings por texto de busca
  const filteredStandings = standings.filter(standing => {
    if (!searchText.trim()) return true;
    
    const search = searchText.toLowerCase();
    return (
      standing.team.name.toLowerCase().includes(search) ||
      standing.team.ownerDisplayName?.toLowerCase().includes(search) ||
      standing.team.abbreviation.toLowerCase().includes(search)
    );
  });

  /**
   * Manipula ordenação da tabela
   */
  const handleSort = (newSortBy: StandingsSortBy) => {
    let newOrder: 'asc' | 'desc' = 'desc';
    
    // Se já está ordenando pela mesma coluna, inverte a ordem
    if (sortBy === newSortBy) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    // Para posição, ordem padrão é crescente
    else if (newSortBy === 'position' || newSortBy === 'name') {
      newOrder = 'asc';
    }

    setSortBy(newSortBy);
    setSortOrder(newOrder);
    onSort(newSortBy, newOrder);
  };

  /**
   * Renderiza ícone de ordenação
   */
  const renderSortIcon = (column: StandingsSortBy) => {
    if (sortBy !== column) {
      return <ChevronUpIcon className="w-4 h-4 text-slate-500" />;
    }
    
    return sortOrder === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-400" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-400" />;
  };

  /**
   * Renderiza badge de zona de playoffs
   */
  const renderPlayoffBadge = (standing: TeamStanding) => {
    if (!standing.isPlayoffTeam) return null;

    return (
      <Tooltip content="Zona de Playoffs (Top 6)">
        <Badge variant="default" className="bg-green-600 text-green-100 ml-2">
          <TrophyIcon className="w-3 h-3 mr-1" />
          Playoffs
        </Badge>
      </Tooltip>
    );
  };

  /**
   * Renderiza indicador de streak
   */
  const renderStreak = (streak: string) => {
    if (!streak || streak === '-') {
      return <span className="text-slate-500">-</span>;
    }

    const isWinStreak = streak.startsWith('W');
    const isLossStreak = streak.startsWith('L');
    
    let className = 'px-2 py-1 rounded text-xs font-medium';
    if (isWinStreak) {
      className += ' bg-green-600/20 text-green-400';
    } else if (isLossStreak) {
      className += ' bg-red-600/20 text-red-400';
    } else {
      className += ' bg-slate-600/20 text-slate-400';
    }

    return <span className={className}>{streak}</span>;
  };

  /**
   * Renderiza cabeçalho ordenável
   */
  const SortableHeader = ({ 
    column, 
    children, 
    className = '' 
  }: { 
    column: StandingsSortBy; 
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-300">Carregando classificação...</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Classificação não disponível</h3>
        <p className="text-slate-400">
          Não foi possível carregar os dados de classificação.
          <br />
          Verifique se a liga possui ID do Sleeper configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar time ou manager..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabela de classificação */}
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
              <SortableHeader column="pointsFor">PF</SortableHeader>
              <SortableHeader column="pointsAgainst">PA</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Streak
              </th>
              <SortableHeader column="availableCap">Cap Disponível</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-600">
            {filteredStandings.map((standing) => {
              const winPercentage = standing.wins + standing.losses + standing.ties > 0 
                ? (standing.wins / (standing.wins + standing.losses + standing.ties) * 100).toFixed(1)
                : '0.0';

              return (
                <tr
                  key={standing.team.id}
                  className={`hover:bg-slate-700 transition-colors cursor-pointer ${
                    standing.isPlayoffTeam ? 'bg-green-900/10 border-l-4 border-green-500' : ''
                  }`}
                  onClick={() => onTeamClick(standing.team.id)}
                >
                  {/* Posição */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-lg font-bold ${
                        standing.isPlayoffTeam ? 'text-green-400' : 'text-slate-300'
                      }`}>
                        {standing.position}
                      </span>
                      {standing.position <= 3 && (
                        <span className="ml-2 text-yellow-400">
                          {standing.position === 1 ? '🥇' : standing.position === 2 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-200">
                            {standing.team.abbreviation}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-slate-100">
                            {standing.team.name}
                          </div>
                          {renderPlayoffBadge(standing)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {winPercentage}% de vitórias
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Manager */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">
                      {standing.team.ownerDisplayName || 'N/A'}
                    </div>
                  </td>

                  {/* Vitórias */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-400">
                      {standing.wins}
                    </span>
                  </td>

                  {/* Derrotas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-red-400">
                      {standing.losses}
                    </span>
                  </td>

                  {/* Empates */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-400">
                      {standing.ties}
                    </span>
                  </td>

                  {/* Pontos Feitos */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-100">
                      {standing.pointsFor.toFixed(2)}
                    </span>
                  </td>

                  {/* Pontos Contra */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">
                      {standing.pointsAgainst.toFixed(2)}
                    </span>
                  </td>

                  {/* Streak */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStreak(standing.streak)}
                  </td>

                  {/* Cap Disponível */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-medium ${
                        standing.financialSummary.availableCap < 0 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {formatCurrency(standing.financialSummary.availableCap)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {((standing.financialSummary.totalSalaries / league.salaryCap) * 100).toFixed(1)}% usado
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {standing.isPlayoffTeam && (
                        <Badge variant="default" className="bg-green-600 text-green-100 text-xs">
                          Playoffs
                        </Badge>
                      )}
                      {standing.financialSummary.availableCap < 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Over Cap
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-slate-200 mb-2">Legenda:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-400">
          <div><strong>Pos:</strong> Posição na classificação</div>
          <div><strong>V/D/E:</strong> Vitórias/Derrotas/Empates</div>
          <div><strong>PF/PA:</strong> Pontos Feitos/Pontos Contra</div>
          <div><strong>Streak:</strong> Sequência atual (W=Vitória, L=Derrota)</div>
          <div><strong>Cap Disponível:</strong> Salary cap restante</div>
          <div><strong>🏆 Playoffs:</strong> Top 6 times classificados</div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <strong>Critério de desempate:</strong> 1º Vitórias, 2º Pontos Feitos
        </div>
      </div>
    </div>
  );
}