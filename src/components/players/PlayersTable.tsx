'use client';

import { Player } from '@/types';

interface PlayersTableProps {
  players: Player[];
}

/**
 * Componente de tabela de jogadores
 *
 * Exibe lista de jogadores com informações básicas como nome, posição,
 * time da NFL e status de atividade.
 */
export function PlayersTable({ players }: PlayersTableProps) {
  // Função para obter cor do badge de posição
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      QB: 'bg-purple-100 text-purple-800',
      RB: 'bg-green-100 text-green-800',
      WR: 'bg-blue-100 text-blue-800',
      TE: 'bg-yellow-100 text-yellow-800',
      K: 'bg-gray-100 text-gray-800',
      DEF: 'bg-red-100 text-red-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  // Função para obter cor do status
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏈</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum jogador encontrado</h3>
        <p className="text-gray-600">Não há jogadores que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jogador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Posição
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time NFL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {players.map(player => (
            <tr
              key={player.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Jogador */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {player.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-500">ID: {player.id.slice(-6)}</div>
                  </div>
                </div>
              </td>

              {/* Posição */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}
                >
                  {player.position}
                </span>
              </td>

              {/* Time NFL */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {player.nflTeam || 'Free Agent'}
                </div>
                {player.nflTeam && <div className="text-sm text-gray-500">NFL</div>}
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(player.isActive)}`}
                >
                  {player.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resumo da tabela */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Total de {players.length} jogadores</span>
          <div className="flex space-x-6">
            <span>Ativos: {players.filter(p => p.isActive).length}</span>
            <span>Inativos: {players.filter(p => !p.isActive).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
