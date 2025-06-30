'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { League, LeagueStatus, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getSleeperLeagueStatus } from '@/services/sleeperService';

interface LeaguesListProps {
  /** Lista de ligas para exibir */
  leagues: League[];
}

interface LeagueWithStatus extends League {
  /** Status atualizado da API do Sleeper */
  apiStatus?: string;
  /** Se está carregando o status */
  loadingStatus?: boolean;
}

/**
 * Componente de lista de ligas gerenciadas
 *
 * Exibe as ligas do usuário com informações básicas, status atualizado da API
 * e ações disponíveis (incluindo gerenciamento para comissários).
 */
export function LeaguesList({ leagues }: LeaguesListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [leaguesWithStatus, setLeaguesWithStatus] = useState<LeagueWithStatus[]>(
    leagues.map(league => ({ ...league, loadingStatus: true })),
  );

  // Buscar status das ligas via API do Sleeper
  useEffect(() => {
    async function fetchLeagueStatuses() {
      const updatedLeagues = await Promise.all(
        leagues.map(async league => {
          if (!league.sleeperLeagueId) {
            return { ...league, loadingStatus: false };
          }

          try {
            const status = await getSleeperLeagueStatus(league.sleeperLeagueId);
            return {
              ...league,
              apiStatus: status,
              loadingStatus: false,
            };
          } catch (error) {
            console.error(`Erro ao buscar status da liga ${league.id}:`, error);
            return { ...league, loadingStatus: false };
          }
        }),
      );

      setLeaguesWithStatus(updatedLeagues);
    }

    if (leagues.length > 0) {
      fetchLeagueStatuses();
    }
  }, [leagues]);
  // Função para obter a cor do status da liga
  const getStatusColor = (league: LeagueWithStatus) => {
    const status = league.apiStatus || league.status;

    if (league.loadingStatus) {
      return 'bg-slate-600 text-slate-300';
    }

    switch (status) {
      case 'in_season':
      case LeagueStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case 'pre_draft':
      case 'drafting':
        return 'bg-blue-100 text-blue-800';
      case 'post_season':
      case LeagueStatus.OFFSEASON:
        return 'bg-yellow-100 text-yellow-800';
      case LeagueStatus.ARCHIVED:
        return 'bg-slate-600 text-slate-200';
      default:
        return 'bg-slate-700 text-slate-100';
    }
  };

  // Função para obter o texto do status
  const getStatusText = (league: LeagueWithStatus) => {
    if (league.loadingStatus) {
      return 'Carregando...';
    }

    const status = league.apiStatus || league.status;

    switch (status) {
      case 'in_season':
        return 'Em Temporada';
      case 'pre_draft':
        return 'Pré-Draft';
      case 'drafting':
        return 'Draftando';
      case 'post_season':
        return 'Pós-Temporada';
      case LeagueStatus.ACTIVE:
        return 'Ativa';
      case LeagueStatus.OFFSEASON:
        return 'Off-season';
      case LeagueStatus.ARCHIVED:
        return 'Arquivada';
      default:
        return 'Status Desconhecido';
    }
  };

  // Função para formatar o salary cap
  const formatSalaryCap = (cap: number) => {
    return `$${(cap / 1000000).toFixed(0)}M`;
  };

  // Verificar se o usuário é comissário
  const isCommissioner = (league: League) => {
    return (
      user?.role === UserRole.COMMISSIONER ||
      
      league.commissionerId === user?.id
    );
  };

  // Função para abrir modal de gerenciamento (placeholder)
  const handleManageLeague = (league: League) => {
    // TODO: Implementar modal de gerenciamento da liga
    console.log('Gerenciar liga:', league.name);
  };

  if (leagues.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Nenhuma liga encontrada</h3>
        <p className="text-slate-400 text-sm mb-4">Você ainda não possui ligas cadastradas.</p>
        <button 
          onClick={() => router.push('/leagues')}
          className="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600 text-sm"
        >
          Importar Liga
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Layout Unificado - Cards para Desktop e Mobile */}
      <div className="space-y-3">
        {leaguesWithStatus.map(league => (
          <div
            key={league.id}
            className="bg-slate-750 border border-slate-600 rounded-xl p-5 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 cursor-pointer shadow-lg"
            onClick={() => router.push(`/leagues/${league.id}`)}
          >
            {/* Cabeçalho do Card */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-100 text-lg mb-1 truncate">
                  {league.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>Temporada {league.season}</span>
                  <span>•</span>
                  <span>{league.totalTeams} times</span>
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                    league,
                  )}`}
                >
                  {getStatusText(league)}
                </span>
              </div>
            </div>

            {/* Informações do Card */}
            <div className="grid grid-cols-2 gap-6 mb-5">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Tipo</p>
                <p className="text-base text-slate-200 font-semibold">Dynasty</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Salary Cap</p>
                <p className="text-base text-slate-200 font-semibold">
                  {formatSalaryCap(league.salaryCap)}
                </p>
              </div>
            </div>

            {/* Ações do Card */}
            <div className="flex items-center justify-center space-x-4 pt-4 border-t border-slate-600">
              <button
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/leagues/${league.id}`);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Ver Liga
              </button>
            </div>
          </div>
        ))}

        {/* Botão para gerenciar ligas */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <button
            onClick={() => router.push('/leagues')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Gerenciar</span>
          </button>
        </div>
      </div>
    </>
  );
}
