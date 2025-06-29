'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Team, League, PlayerWithContract } from '@/types';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatCapUsage, getCurrencyClasses } from '@/utils/formatUtils';

interface TeamHeaderProps {
  team: Team;
  league: League;
  players: PlayerWithContract[];
  onBack?: () => void;
}

export default function TeamHeader({ team, league, players, onBack }: TeamHeaderProps) {
  const router = useRouter();

  // Calcula estatísticas do time
  const playersWithContracts = players.filter(p => p.contract);
  const totalSalaries = playersWithContracts.reduce((sum, player) => {
    return sum + (player.contract?.currentSalary || 0);
  }, 0);

  const availableCap = league.salaryCap - totalSalaries - team.currentDeadMoney;
  const contractsExpiring = playersWithContracts.filter(
    p => p.contract?.yearsRemaining === 1,
  ).length;
  
  // Calcula jogadores que já foram tagueados
  const playersTagged = playersWithContracts.filter(
    p => p.contract?.hasBeenTagged === true,
  ).length;

  // Calcula informações do salary cap
  const capInfo = formatCapUsage(totalSalaries + team.currentDeadMoney, league.salaryCap);

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 mb-8">
      {/* Navegação e Título */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/leagues/${league.id}`)}
            className="flex items-center text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar para Liga
          </button>
          <div className="h-6 border-l border-slate-600"></div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{team.name}</h1>
            <p className="text-slate-400">
              {league.name} • {league.season}
            </p>
          </div>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Salary Cap */}
        <div className="bg-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Salary Cap Total</h3>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(league.salaryCap)}</p>
        </div>

        {/* Cap Usado */}
        <div className="bg-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Cap Usado</h3>
          <p className={`text-2xl font-bold ${capInfo.statusClass}`}>{capInfo.formattedUsed}</p>
          <p className="text-sm font-medium text-slate-400">
            {capInfo.formattedPercentage} usado • {capInfo.statusText}
          </p>
        </div>

        {/* Cap Disponível */}
        <div className="bg-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Cap Disponível</h3>
          <p className={`text-2xl font-bold ${getCurrencyClasses(availableCap)}`}>
            {formatCurrency(availableCap)}
          </p>
        </div>

        {/* Dead Money */}
        <div className="bg-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Dead Money</h3>
          <p className="text-2xl font-bold text-slate-100">
            {formatCurrency(team.currentDeadMoney)}
          </p>
          {team.nextSeasonDeadMoney > 0 && (
            <p className="text-sm text-slate-400">
              Próxima temporada: {formatCurrency(team.nextSeasonDeadMoney)}
            </p>
          )}
        </div>
      </div>

      {/* Estatísticas do Elenco */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{playersWithContracts.length}</p>
            <p className="text-sm text-slate-400">Jogadores Contratados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{contractsExpiring}</p>
            <p className="text-sm text-slate-400">Contratos Expirando</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{playersTagged}</p>
            <p className="text-sm text-slate-400">Franchise Tags Usadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency(totalSalaries / playersWithContracts.length || 0)}
            </p>
            <p className="text-sm text-slate-400">Salário Médio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
