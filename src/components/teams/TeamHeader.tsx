'use client';

import { Team, League, PlayerWithContract } from '@/types';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TeamHeaderProps {
  /** Time a ser exibido */
  team: Team;
  /** Liga do time */
  league: League;
  /** Lista de jogadores com contratos */
  playersWithContracts: PlayerWithContract[];
  /** Função chamada ao clicar no botão voltar */
  onBack: () => void;
  /** Função chamada ao clicar no botão adicionar jogador */
  onAddPlayer: () => void;
}

/**
 * Componente de cabeçalho da página de detalhes do time
 *
 * Exibe informações principais do time como nome, manager,
 * salary cap, dead money e estatísticas do elenco.
 */
export function TeamHeader({
  team,
  league,
  playersWithContracts,
  onBack,
  onAddPlayer,
}: TeamHeaderProps) {
  // Calcular estatísticas do time
  const totalSalaries = playersWithContracts.reduce((sum, p) => sum + p.contract.currentSalary, 0);
  const availableCap = league.salaryCap - totalSalaries - team.currentDeadMoney;
  const capUsagePercentage = ((totalSalaries + team.currentDeadMoney) / league.salaryCap) * 100;
  const contractsExpiring = playersWithContracts.filter(
    p => p.contract.yearsRemaining === 1,
  ).length;

  // Função para formatar valores monetários
  const formatMoney = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Função para obter cor baseada no percentual do cap usado
  const getCapUsageColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600';
    if (percentage >= 85) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      {/* Navegação e Título */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
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
          <p className="text-2xl font-bold text-gray-900">{formatMoney(league.salaryCap)}</p>
        </div>

        {/* Cap Usado */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Cap Usado</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(totalSalaries + team.currentDeadMoney)}
          </p>
          <p className={`text-sm font-medium ${getCapUsageColor(capUsagePercentage)}`}>
            {capUsagePercentage.toFixed(1)}% do cap
          </p>
        </div>

        {/* Cap Disponível */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Cap Disponível</h3>
          <p
            className={`text-2xl font-bold ${availableCap >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatMoney(availableCap)}
          </p>
        </div>

        {/* Dead Money */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Dead Money</h3>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(team.currentDeadMoney)}</p>
          {team.nextSeasonDeadMoney > 0 && (
            <p className="text-sm text-gray-600">
              Próxima temporada: {formatMoney(team.nextSeasonDeadMoney)}
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
              {formatMoney(totalSalaries / playersWithContracts.length || 0)}
            </p>
            <p className="text-sm text-gray-600">Salário Médio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
