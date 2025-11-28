import React, { useState } from 'react';
import Image from 'next/image';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { getPositionTailwindClasses } from '@/utils/positionColors';

interface Player {
  id: string;
  sleeperPlayerId: string;
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
 * - Ordenação decrescente APENAS por valor do salário (não por posição)
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
  const PlayerAvatar = ({ sleeperId, name }: { sleeperId: string; name: string }) => {
    const [error, setError] = useState(false);

    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-700 border border-slate-600">
        <Image
          src={
            error
              ? 'https://sleepercdn.com/images/v2/icons/player_default.webp'
              : `https://sleepercdn.com/content/nfl/players/${sleeperId}.jpg`
          }
          alt={name}
          fill
          className="object-cover"
          unoptimized
          onError={() => setError(true)}
        />
      </div>
    );
  };

  // Ordenar jogadores apenas por salário (maior para menor)
  const sortedPlayers = [...players].sort((a, b) => {
    return b.salary - a.salary;
  });

  const displayPlayers = sortedPlayers.slice(0, maxPlayers);

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-600"
      data-testid="top-salaries-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-900/30 rounded-lg">
            <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
          {displayPlayers.length} {displayPlayers.length === 1 ? 'jogador' : 'jogadores'}
        </div>
      </div>

      {/* Lista de jogadores - área flexível */}
      <div className="flex-1 flex flex-col">
        {displayPlayers.length > 0 ? (
          <div className="space-y-3 flex-1">
            {displayPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 hover:border-slate-500 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-green-600 to-green-700 rounded-full text-xs font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  <PlayerAvatar sleeperId={player.sleeperPlayerId} name={player.name} />
                  <div>
                    <div className="font-medium text-foreground">{player.name}</div>
                    <div className="text-sm text-slate-400">
                      {player.position} • {player.team}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400 text-lg">
                    ${(player.salary / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>
            ))}

            {/* Espaço decorativo se houver poucos jogadores */}
            {displayPlayers.length < maxPlayers && (
              <div className="flex-1 flex items-end justify-center pb-4">
                <div className="text-center text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-2 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-xs">Mais contratos em breve</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
              <p className="text-sm text-slate-500 mt-1">
                Selecione uma liga para visualizar os maiores salários
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com dica */}
      <div className="mt-4 pt-3 border-t border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Salários aumentam 15% por temporada</span>
        </div>
      </div>
    </div>
  );
}
