import React from 'react';
import TeamHeader from './TeamHeader';
import { useTeamFinancials } from '@/hooks/useTeamFinancials';
import { Team, League, PlayerWithContract } from '@/types';

interface TeamHeaderExampleProps {
  team: Team;
  league: League;
  players: PlayerWithContract[];
  onBack?: () => void;
}

/**
 * Exemplo de como usar o TeamHeader refatorado com dados em tempo real
 * Este componente demonstra a integração com o hook useTeamFinancials
 */
export default function TeamHeaderExample({
  team,
  league,
  players,
  onBack,
}: TeamHeaderExampleProps) {
  // Busca dados financeiros em tempo real
  const { contracts, deadMoneyRecords, isLoading, error, revalidateFinancials } = useTeamFinancials(
    team.id
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-700 rounded-xl p-4">
                <div className="h-4 bg-slate-600 rounded mb-2"></div>
                <div className="h-8 bg-slate-600 rounded mb-2"></div>
                <div className="h-4 bg-slate-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar dados financeiros do time</p>
          <button
            onClick={revalidateFinancials}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <TeamHeader
      team={team}
      league={league}
      players={players}
      contracts={contracts}
      deadMoneyRecords={deadMoneyRecords}
      onBack={onBack}
    />
  );
}

/**
 * Hook personalizado para revalidar dados após operações que afetam o salary cap
 * Use este hook em componentes que fazem cortes, contratações, etc.
 */
export function useRevalidateTeamFinancials(teamId: string) {
  const { revalidateFinancials } = useTeamFinancials(teamId);

  return {
    /**
     * Chame esta função após:
     * - Cortar um jogador
     * - Assinar um contrato
     * - Fazer um trade
     * - Aplicar franchise tag
     * - Qualquer operação que afete o salary cap
     */
    revalidateAfterCapChange: revalidateFinancials,
  };
}
