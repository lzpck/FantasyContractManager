'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Team, League, PlayerWithContract, Contract, ContractStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatCapUsage, getCurrencyClasses } from '@/utils/formatUtils';
import { useMemo } from 'react';

// Interface para registros de dead money da API
interface DeadMoneyRecord {
  id: string;
  teamId: string;
  playerId: string;
  contractId?: string;
  amount: number;
  year: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    id: string;
    name: string;
    position: string;
    sleeperPlayerId: string;
  };
  contract?: {
    id: string;
    currentSalary: number;
    originalYears: number;
    signedSeason: number;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface TeamHeaderProps {
  team: Team;
  league: League;
  players: PlayerWithContract[];
  contracts?: Contract[]; // Contratos ativos do time (opcional para compatibilidade)
  deadMoneyRecords?: DeadMoneyRecord[]; // Registros de dead money (opcional para compatibilidade)
  onBack?: () => void;
}

export default function TeamHeader({
  team,
  league,
  players,
  contracts,
  deadMoneyRecords,
  onBack,
}: TeamHeaderProps) {
  const router = useRouter();

  // Cálculos dinâmicos baseados na temporada atual
  const calculations = useMemo(() => {
    const currentYear = league.season;
    const nextYear = league.season + 1;

    // Validação dos arrays para evitar erros
    const safeDeadMoneyRecords = deadMoneyRecords || [];
    const safeContracts = contracts || [];

    // 1. Dead Money do time (ano atual e próxima temporada)
    // Calcula dead money dos registros específicos
    const currentYearDeadMoney = safeDeadMoneyRecords
      .filter(dm => dm.teamId === team.id && dm.year === currentYear)
      .reduce((sum, dm) => sum + dm.amount, 0);

    const nextYearDeadMoney = safeDeadMoneyRecords
      .filter(dm => dm.teamId === team.id && dm.year === nextYear)
      .reduce((sum, dm) => sum + dm.amount, 0);

    // Usa os valores calculados ou fallback para os valores do team
    const totalDeadMoney =
      currentYearDeadMoney > 0 ? currentYearDeadMoney : team.currentDeadMoney || 0;
    const nextSeasonDeadMoney =
      nextYearDeadMoney > 0 ? nextYearDeadMoney : team.nextSeasonDeadMoney || 0;

    // 2. Salary Cap Usado - Contratos ativos para o ano atual
    // Se não há contratos, usa os dados dos players como fallback
    const totalSalaries =
      safeContracts.length > 0
        ? safeContracts
            .filter(
              c =>
                c.teamId === team.id &&
                c.status === ContractStatus.ACTIVE &&
                c.signedSeason <= currentYear &&
                c.signedSeason + c.originalYears - 1 >= currentYear,
            )
            .reduce((sum, c) => sum + c.currentSalary, 0)
        : players
            .filter(p => p.contract)
            .reduce((sum, player) => sum + (player.contract?.currentSalary || 0), 0);

    const capUsed = totalSalaries + totalDeadMoney;

    // 3. Salary Cap Disponível
    const availableCap = league.salaryCap - capUsed;

    // 4. Estatísticas do elenco - apenas contratos ativos (não cortados)
    const playersWithContracts = players.filter(p => p.contract && p.contract.status !== ContractStatus.CUT);
    const contractsExpiring = playersWithContracts.filter(
      p => p.contract?.yearsRemaining === 1,
    ).length;
    const playersTagged = playersWithContracts.filter(
      p => p.contract?.hasBeenTagged === true,
    ).length;

    return {
      totalDeadMoney,
      nextSeasonDeadMoney,
      totalSalaries,
      capUsed,
      availableCap,
      playersWithContracts,
      contractsExpiring,
      playersTagged,
    };
  }, [team.id, league.season, league.salaryCap, contracts, deadMoneyRecords, players]);

  // Calcula informações do salary cap com formatação e status
  const capInfo = formatCapUsage(calculations.capUsed, league.salaryCap);

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
          <p className={`text-2xl font-bold ${getCurrencyClasses(calculations.availableCap)}`}>
            {formatCurrency(calculations.availableCap)}
          </p>
        </div>

        {/* Dead Money */}
        <div className="bg-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Dead Money</h3>
          <p className="text-2xl font-bold text-slate-100">
            {formatCurrency(calculations.totalDeadMoney)}
          </p>
          {calculations.nextSeasonDeadMoney > 0 && (
            <p className="text-sm text-slate-400">
              Próxima temporada: {formatCurrency(calculations.nextSeasonDeadMoney)}
            </p>
          )}
        </div>
      </div>

      {/* Estatísticas do Elenco */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {calculations.playersWithContracts.length}
            </p>
            <p className="text-sm text-slate-400">Jogadores Contratados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{calculations.contractsExpiring}</p>
            <p className="text-sm text-slate-400">Contratos Expirando</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{calculations.playersTagged}</p>
            <p className="text-sm text-slate-400">Franchise Tags Usadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">
              {formatCurrency(
                calculations.totalSalaries / calculations.playersWithContracts.length || 0,
              )}
            </p>
            <p className="text-sm text-slate-400">Salário Médio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
