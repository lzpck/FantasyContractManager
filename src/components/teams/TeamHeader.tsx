'use client';

import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Team, League, PlayerWithContract } from '@/types';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatCapUsage, getCurrencyClasses } from '@/utils/formatUtils';

interface TeamHeaderProps {
  team: Team;
  league: League;
  players: PlayerWithContract[];
  onAddPlayer: () => void;
}

export default function TeamHeader({ team, league, players, onAddPlayer }: TeamHeaderProps) {
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

  // Calcula informações do salary cap
  const capInfo = formatCapUsage(totalSalaries + team.currentDeadMoney, league.salaryCap);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      {/* Navegação e Título */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/leagues/${league.id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar para Liga
          </button>
          <div className="h-6 border-l border-gray-300"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <p className="text-gray-600">
              {league.name} • {league.season}
            </p>
          </div>
        </div>
        <button
          onClick={onAddPlayer}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Adicionar Jogador
        </button>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Salary Cap */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Salary Cap Total</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(league.salaryCap)}</p>
        </div>

        {/* Cap Usado */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Cap Usado</h3>
          <p className={`text-2xl font-bold ${capInfo.statusClass}`}>{capInfo.formattedUsed}</p>
          <p className="text-sm font-medium text-gray-500">
            {capInfo.formattedPercentage} usado • {capInfo.statusText}
          </p>
        </div>

        {/* Cap Disponível */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Cap Disponível</h3>
          <p className={`text-2xl font-bold ${getCurrencyClasses(availableCap)}`}>
            {formatCurrency(availableCap)}
          </p>
        </div>

        {/* Dead Money */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Dead Money</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(team.currentDeadMoney)}
          </p>
          {team.nextSeasonDeadMoney > 0 && (
            <p className="text-sm text-gray-600">
              Próxima temporada: {formatCurrency(team.nextSeasonDeadMoney)}
            </p>
          )}
        </div>
      </div>

      {/* Estatísticas do Elenco */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{playersWithContracts.length}</p>
            <p className="text-sm text-gray-600">Jogadores Contratados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{contractsExpiring}</p>
            <p className="text-sm text-gray-600">Contratos Expirando</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{team.franchiseTagsUsed}</p>
            <p className="text-sm text-gray-600">Franchise Tags Usadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {formatCurrency(totalSalaries / playersWithContracts.length || 0)}
            </p>
            <p className="text-sm text-gray-600">Salário Médio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
