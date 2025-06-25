'use client';

import { League, LeagueStatus } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface LeagueHeaderProps {
  /** Liga a ser exibida */
  league: League;
  /** Função chamada ao clicar no botão voltar */
  onBack: () => void;
}

/**
 * Componente de cabeçalho da página de detalhes da liga
 *
 * Exibe informações principais da liga como nome, temporada, status,
 * salary cap e configurações básicas.
 */
export function LeagueHeader({ league, onBack }: LeagueHeaderProps) {
  // Função para obter a cor do status da liga
  const getStatusColor = (status: LeagueStatus) => {
    switch (status) {
      case LeagueStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case LeagueStatus.OFFSEASON:
        return 'bg-blue-100 text-blue-800';
      case LeagueStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status: LeagueStatus) => {
    switch (status) {
      case LeagueStatus.ACTIVE:
        return 'Ativa';
      case LeagueStatus.OFFSEASON:
        return 'Off-season';
      case LeagueStatus.ARCHIVED:
        return 'Arquivada';
      default:
        return 'Desconhecido';
    }
  };

  // Função para formatar valores monetários
  const formatMoney = (value: number) => {
    return `$${(value / 1000000).toFixed(0)}M`;
  };

  return (
    <div className="mb-8">
      {/* Botão voltar e título */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Voltar ao Dashboard
        </button>
      </div>

      {/* Informações principais da liga */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{league.name}</h1>
            <p className="text-gray-600">Temporada {league.season}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              league.status,
            )}`}
          >
            {getStatusText(league.status)}
          </span>
        </div>

        {/* Grid com informações da liga */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de times */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">👥</div>
              <div>
                <p className="text-sm text-gray-600">Total de Times</p>
                <p className="text-xl font-semibold text-gray-900">{league.totalTeams}</p>
              </div>
            </div>
          </div>

          {/* Salary Cap */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <p className="text-sm text-gray-600">Salary Cap</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatMoney(league.salaryCap)}
                </p>
              </div>
            </div>
          </div>

          {/* Franchise Tags */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏷️</div>
              <div>
                <p className="text-sm text-gray-600">Max Franchise Tags</p>
                <p className="text-xl font-semibold text-gray-900">
                  {league.settings.maxFranchiseTags}
                </p>
              </div>
            </div>
          </div>

          {/* Aumento Anual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm text-gray-600">Aumento Anual</p>
                <p className="text-xl font-semibold text-gray-900">
                  {league.settings.annualIncreasePercentage}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Salário Mínimo:</span>
              <span className="ml-2 font-medium">{formatMoney(league.settings.minimumSalary)}</span>
            </div>
            <div>
              <span className="text-gray-600">Virada de Temporada:</span>
              <span className="ml-2 font-medium">{league.settings.seasonTurnoverDate}</span>
            </div>
            <div>
              <span className="text-gray-600">Rodadas Rookie Draft:</span>
              <span className="ml-2 font-medium">{league.settings.rookieDraft.rounds}</span>
            </div>
          </div>
        </div>

        {/* ID da liga no Sleeper (se disponível) */}
        {league.sleeperLeagueId && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <span>ID Sleeper:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                {league.sleeperLeagueId}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
