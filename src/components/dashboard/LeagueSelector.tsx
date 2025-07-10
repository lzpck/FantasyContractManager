'use client';

import { League } from '@/types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface LeagueSelectorProps {
  /** Lista de ligas disponíveis para seleção */
  leagues: League[];
  /** Liga atualmente selecionada */
  selectedLeagueId: string;
  /** Callback para mudança de liga */
  onLeagueChange: (leagueId: string) => void;
  /** Se está carregando */
  loading?: boolean;
}

/**
 * Componente seletor de liga para o dashboard analítico
 * 
 * Permite ao usuário escolher qual liga visualizar nos dados analíticos.
 * Mostra apenas ligas onde o usuário é GM ou comissário.
 */
export function LeagueSelector({ 
  leagues, 
  selectedLeagueId, 
  onLeagueChange, 
  loading = false 
}: LeagueSelectorProps) {
  const selectedLeague = leagues.find(league => league.id === selectedLeagueId);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 bg-slate-600 rounded w-32"></div>
          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedLeagueId}
        onChange={(e) => onLeagueChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-10 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[200px]"
      >
        {leagues.map((league) => (
          <option key={league.id} value={league.id} className="bg-slate-800">
            {league.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}