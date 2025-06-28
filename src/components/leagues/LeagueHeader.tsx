'use client';

import { League } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency, getStatusColor, getStatusText } from '@/utils/formatUtils';

interface LeagueHeaderProps {
  league: League;
  onBack: () => void;
  totalTeams?: number;
  onSync?: () => Promise<void>;
}

export default function LeagueHeader({ league, onBack, totalTeams, onSync }: LeagueHeaderProps) {
  return (
    <div className="mb-8">
      {/* Header/Topbar da página */}
      <div className="sticky top-0 bg-slate-900 z-10 shadow-md border-b border-slate-800 px-6 py-4 mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-slate-200 transition-colors mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            <span className="text-slate-400 hover:text-slate-200">Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center">
            <h1 className="text-slate-100 font-semibold text-xl">{league.name}</h1>
            <span className="text-slate-400 ml-2">• Temporada {league.season}</span>
          </div>
        </div>
      </div>

      {/* Informações principais da liga */}
      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Resumo da Liga</h2>
            <p className="text-slate-400">Informações financeiras e configurações</p>
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
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">👥</div>
              <div>
                <p className="text-sm text-slate-400">Total de Times</p>
                <p className="text-xl font-semibold text-slate-100">
                  {totalTeams ?? league.totalTeams}
                </p>
              </div>
            </div>
          </div>

          {/* Salary Cap */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <p className="text-sm text-slate-400">Salary Cap</p>
                <p className="text-xl font-semibold text-slate-100">
                  {formatCurrency(league.salaryCap)}
                </p>
              </div>
            </div>
          </div>

          {/* Franchise Tags */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏷️</div>
              <div>
                <p className="text-sm text-slate-400">Max Franchise Tags</p>
                <p className="text-xl font-semibold text-slate-100">
                  {league.settings.maxFranchiseTags}
                </p>
              </div>
            </div>
          </div>

          {/* Aumento Anual */}
          <div className="bg-slate-700 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📈</div>
              <div>
                <p className="text-sm text-slate-400">Aumento Anual</p>
                <p className="text-xl font-semibold text-slate-100">
                  {league.settings.annualIncreasePercentage}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 pt-6 border-t border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Salário Mínimo:</span>
              <span className="ml-2 font-medium text-slate-100">
                {formatCurrency(league.settings.minimumSalary)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Virada de Temporada:</span>
              <span className="ml-2 font-medium text-slate-100">
                {league.settings.seasonTurnoverDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Rodadas Rookie Draft:</span>
              <span className="ml-2 font-medium text-slate-100">
                {league.settings.rookieDraft.rounds}
              </span>
            </div>
          </div>
        </div>

        {/* ID da liga no Sleeper (se disponível) */}
        {league.sleeperLeagueId && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-slate-400">
                <span>ID Sleeper:</span>
                <code className="ml-2 px-2 py-1 bg-slate-700 text-slate-100 rounded text-xs font-mono">
                  {league.sleeperLeagueId}
                </code>
              </div>
              {onSync && (
                <button
                  onClick={onSync}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-md"
                >
                  Sincronizar com Sleeper
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
