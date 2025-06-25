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
        return 'bg-blue-100 text-blue-800';
      case LeagueStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <p className="text-gray-500 mb-2">Nenhuma liga encontrada</p>
        <p className="text-sm text-gray-400">Crie ou participe de uma liga para começar</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Header da liga */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{league.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Temporada {league.season}</p>
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
              <span className="text-gray-500">Times:</span>
              <span className="ml-1 font-medium">{league.totalTeams}</span>
            </div>
            <div>
              <span className="text-gray-500">Salary Cap:</span>
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
            <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors">
              Gerenciar
            </button>
          </div>
        </div>
      ))}

      {/* Botão para adicionar nova liga */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
        <button className="w-full text-gray-500 hover:text-gray-700 transition-colors">
          <div className="text-2xl mb-1">+</div>
          <p className="text-sm">Adicionar Nova Liga</p>
        </button>
      </div>
    </div>
  );
}
