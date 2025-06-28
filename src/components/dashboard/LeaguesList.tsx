'use client';

import { useRouter } from 'next/navigation';
import { League, LeagueStatus } from '@/types';

interface LeaguesListProps {
  /** Lista de ligas para exibir */
  leagues: League[];
}

/**
 * Componente de lista de ligas gerenciadas
 *
 * Exibe as ligas do usuário com informações básicas e ações disponíveis.
 */
export function LeaguesList({ leagues }: LeaguesListProps) {
  const router = useRouter();
  // Função para obter a cor do status da liga
  const getStatusColor = (status: LeagueStatus) => {
    switch (status) {
      case LeagueStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case LeagueStatus.OFFSEASON:
        return 'bg-slate-600 text-slate-200';
      case LeagueStatus.ARCHIVED:
        return 'bg-slate-700 text-slate-100';
      default:
        return 'bg-slate-700 text-slate-100';
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status: LeagueStatus) => {
    switch (status) {
      case LeagueStatus.ACTIVE:
        return 'Ativa';
      case LeagueStatus.OFFSEASON:
        return 'Off-season';
      case LeagueStatus.ARCHIVED:
        return 'Arquivada';
      default:
        return 'Desconhecido';
    }
  };

  // Função para formatar o salary cap
  const formatSalaryCap = (cap: number) => {
    return `$${(cap / 1000000).toFixed(0)}M`;
  };

  if (leagues.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-slate-400 mb-2">Nenhuma liga encontrada</p>
        <p className="text-sm text-slate-500">Crie ou participe de uma liga para começar</p>
        <button className="mt-4 px-4 py-2 bg-slate-700 text-slate-100 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600">
          Criar Liga
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leagues.map(league => (
        <div
          key={league.id}
          className="border border-slate-700 rounded-xl p-4 hover:shadow-xl transition-shadow bg-slate-800"
        >
          {/* Header da liga */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-100 text-sm">{league.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Temporada {league.season}</p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                league.status,
              )}`}
            >
              {getStatusText(league.status)}
            </span>
          </div>

          {/* Informações da liga */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <span className="text-slate-400">Times:</span>
              <span className="ml-1 font-medium">{league.totalTeams}</span>
            </div>
            <div>
              <span className="text-slate-400">Salary Cap:</span>
              <span className="ml-1 font-medium">{formatSalaryCap(league.salaryCap)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/leagues/${league.id}`)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver Liga
            </button>
            <button className="flex-1 px-3 py-2 border border-slate-700 text-slate-100 text-xs rounded-xl hover:bg-slate-700 transition-colors bg-slate-800">
              Gerenciar
            </button>
          </div>
        </div>
      ))}

      {/* Botão para adicionar nova liga */}
      <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-slate-600 transition-colors bg-slate-800">
        <button className="w-full text-slate-400 hover:text-slate-100 transition-colors">
          <div className="text-2xl mb-1">+</div>
          <p className="text-sm">Adicionar Nova Liga</p>
        </button>
      </div>
    </div>
  );
}
