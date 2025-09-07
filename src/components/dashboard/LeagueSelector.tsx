import React, { useEffect } from 'react';
import { ChevronDownIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface League {
  id: string;
  name: string;
  season: number;
  totalTeams: number;
  salaryCap: number;
}

interface LeagueSelectorProps {
  /** Lista de ligas disponíveis (apenas onde o usuário é GM ou comissário) */
  leagues: League[];
  /** Liga atualmente selecionada */
  selectedLeague: League | null;
  /** Função chamada quando uma liga é selecionada */
  onLeagueSelect: (league: League) => void;
  /** Estado de carregamento */
  loading?: boolean;
}

/**
 * Componente seletor de liga para o dashboard analytics
 *
 * Regra de negócio:
 * - Exibe apenas ligas onde o usuário é GM ou comissário
 * - Permite seleção de uma liga para filtrar os dados do dashboard
 * - Mostra informações básicas da liga (nome, temporada, salary cap)
 * - Interface dropdown responsiva
 *
 * Integração futura:
 * - Filtrar ligas baseado no papel do usuário (GM/comissário)
 * - Conectar com Context API para persistir seleção
 * - Atualizar todos os componentes do dashboard quando liga muda
 * - Carregar dados específicos da liga selecionada
 */
export function LeagueSelector({
  leagues = [],
  selectedLeague,
  onLeagueSelect,
  loading = false,
}: LeagueSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Selecionar automaticamente a primeira liga disponível quando não há seleção
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeague && !loading) {
      onLeagueSelect(leagues[0]);
    }
  }, [leagues, selectedLeague, onLeagueSelect, loading]);

  const handleLeagueSelect = (league: League) => {
    onLeagueSelect(league);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 animate-pulse">
        <div className="h-6 bg-slate-600 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 mb-6"
      data-testid="league-selector"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrophyIcon className="h-6 w-6 text-yellow-400" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Liga Selecionada</h3>
            <p className="text-sm text-slate-400">
              Escolha uma liga para visualizar dados analíticos
            </p>
          </div>
        </div>

        {/* Dropdown de seleção */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-foreground transition-colors min-w-[200px] justify-between"
            disabled={leagues.length === 0}
          >
            <div className="text-left flex-1">
              {selectedLeague ? (
                <div>
                  <div className="font-medium text-sm">{selectedLeague.name}</div>
                  <div className="text-xs text-slate-400">
                    {selectedLeague.season} • ${(selectedLeague.salaryCap / 1000000).toFixed(0)}M
                    cap
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  {leagues.length > 0 ? 'Selecionar liga...' : 'Nenhuma liga disponível'}
                </div>
              )}
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 text-slate-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown menu */}
          {isOpen && leagues.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-b-0 ${
                    selectedLeague?.id === league.id ? 'bg-slate-600' : ''
                  }`}
                >
                  <div className="font-medium text-foreground text-sm">{league.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {league.season} • {league.totalTeams} times • $
                    {(league.salaryCap / 1000000).toFixed(0)}M cap
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informação adicional quando nenhuma liga está selecionada */}
      {!selectedLeague && leagues.length > 0 && (
        <div className="mt-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-blue-400">Dica:</span> Selecione uma liga acima para
            visualizar:
          </p>
          <ul className="text-xs text-slate-400 mt-2 space-y-1 ml-4">
            <li>• Top 5 maiores salários da liga</li>
            <li>• Top 3 maiores salários por posição</li>
            <li>• Valores de Franchise Tag por posição</li>
          </ul>
        </div>
      )}

      {/* Mensagem quando não há ligas disponíveis */}
      {leagues.length === 0 && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700 rounded-lg">
          <p className="text-sm text-amber-200">
            <span className="font-medium">Atenção:</span> Você precisa ser GM ou comissário de pelo
            menos uma liga para acessar os dados analíticos.
          </p>
        </div>
      )}
    </div>
  );
}
