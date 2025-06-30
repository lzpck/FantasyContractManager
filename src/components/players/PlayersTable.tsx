'use client';

import { Player, PlayerPosition } from '@/types';

interface PlayersTableProps {
  players: Player[];
}

/**
 * Componente de tabela de jogadores
 *
 * Exibe lista de jogadores com informações básicas como nome, posições fantasy,
 * time da NFL e status de atividade.
 *
 * IMPORTANTE: Sempre exibe fantasyPositions ao invés de position para mostrar
 * os slots fantasy específicos da plataforma Sleeper.
 */
export function PlayersTable({ players }: PlayersTableProps) {
  // Função para obter cor do badge de posição fantasy
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      QB: 'bg-purple-600 text-purple-100',
      RB: 'bg-green-600 text-green-100',
      WR: 'bg-blue-600 text-blue-100',
      TE: 'bg-yellow-600 text-yellow-100',
      K: 'bg-slate-600 text-slate-100',
      DEF: 'bg-red-600 text-red-100',
    };
    return colors[position] || 'bg-slate-600 text-slate-100';
  };

  // Função para renderizar as posições fantasy do jogador
  const renderFantasyPositions = (player: Player) => {
    // Prioriza fantasyPositions, usa position como fallback
    let positions: string[] = [];

    if (player.fantasyPositions) {
      // Se fantasyPositions é array, usa diretamente
      if (Array.isArray(player.fantasyPositions)) {
        positions = player.fantasyPositions.filter(pos => pos && pos.trim() !== '');
      }
      // Se fantasyPositions é string, converte para array
      else if (
        typeof player.fantasyPositions === 'string' &&
        player.fantasyPositions.trim() !== ''
      ) {
        positions = player.fantasyPositions
          .split(',')
          .map(pos => pos.trim())
          .filter(pos => pos !== '');
      }
    }

    // Se não há posições fantasy válidas, usa position como fallback
    if (positions.length === 0) {
      positions = [player.position];
    }

    return (
      <div className="flex flex-wrap gap-1">
        {positions.map((pos, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(pos)}`}
          >
            {pos}
          </span>
        ))}
      </div>
    );
  };

  // Função para obter cor do status
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100';
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏈</div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Nenhum jogador encontrado</h3>
        <p className="text-slate-400">Não há jogadores que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Jogador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Posições Fantasy
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Time NFL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-800 divide-y divide-slate-700">
          {players.map(player => (
            <tr key={player.id} className="hover:bg-slate-700 transition-colors">
              {/* Jogador */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-100">
                        {player.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-100">{player.name}</div>
                    <div className="text-sm text-slate-400">ID: {player.id.slice(-6)}</div>
                  </div>
                </div>
              </td>

              {/* Posições Fantasy */}
              <td className="px-6 py-4 whitespace-nowrap">{renderFantasyPositions(player)}</td>

              {/* Time NFL */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-100">
                  {player.nflTeam || 'Free Agent'}
                </div>
                {player.nflTeam && <div className="text-sm text-slate-400">NFL</div>}
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
      <div className="bg-slate-900 px-6 py-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-400">
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
