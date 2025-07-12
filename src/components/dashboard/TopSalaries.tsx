import React from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
}

interface TopSalariesProps {
  /** Lista dos jogadores com maiores salários */
  players: Player[];
  /** Título do componente */
  title?: string;
  /** Número máximo de jogadores a exibir */
  maxPlayers?: number;
}

/**
 * Componente para exibir os maiores salários da liga selecionada
 *
 * Regra de negócio:
 * - Exibe os top 5 jogadores com maiores salários da liga
 * - Ordenação decrescente por valor do salário
 * - Formatação em milhões de dólares
 * - Inclui posição e time do jogador
 *
 * Integração futura:
 * - Receber dados via props do contexto da liga selecionada
 * - Filtrar apenas contratos ativos
 * - Considerar aumentos salariais anuais de 15%
 */
export function TopSalaries({
  players = [],
  title = 'Top 5 Maiores Salários',
  maxPlayers = 5,
}: TopSalariesProps) {
  const displayPlayers = players.slice(0, maxPlayers);

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full"
      data-testid="top-salaries-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400">
          {displayPlayers.length} {displayPlayers.length === 1 ? 'jogador' : 'jogadores'}
        </div>
      </div>

      {/* Lista de jogadores */}
      <div className="space-y-3">
        {displayPlayers.length > 0 ? (
          displayPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-full text-sm font-medium text-slate-200">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-foreground">{player.name}</div>
                  <div className="text-sm text-slate-400">
                    {player.position} • {player.team}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-400">
                  ${(player.salary / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500 mt-1">
              Selecione uma liga para visualizar os maiores salários
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
