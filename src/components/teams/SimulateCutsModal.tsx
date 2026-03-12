'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  ScissorsIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { League, PlayerWithContract, DeadMoneyConfig, ContractStatus } from '@/types';
import { formatCurrency, getCurrencyClasses } from '@/utils/formatUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-interfaces internas
// ─────────────────────────────────────────────────────────────────────────────

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
}

interface SimulateCutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerWithContract[];
  league: League;
  currentCapUsed: number;
  deadMoneyRecords?: DeadMoneyRecord[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar simples
// ─────────────────────────────────────────────────────────────────────────────

const PlayerAvatar = ({ sleeperId, name }: { sleeperId: string; name: string }) => {
  const [error, setError] = useState(false);

  return (
    <div className="relative mr-3 h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-slate-700">
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de cálculo (alinhados às regras da liga)
// ─────────────────────────────────────────────────────────────────────────────

function calcDeadMoneyForCut(
  contract: PlayerWithContract['contract'],
  rosterStatus: string | undefined,
  deadMoneyConfig: DeadMoneyConfig | undefined,
  annualIncreasePercentage: number,
): { deadMoneyCurrent: number; deadMoneyNext: number } {
  if (!contract) return { deadMoneyCurrent: 0, deadMoneyNext: 0 };

  if (rosterStatus === 'taxi') {
    return { deadMoneyCurrent: contract.currentSalary * 0.25, deadMoneyNext: 0 };
  }

  const currentSeasonPercent = deadMoneyConfig?.currentSeason ?? 1;
  const deadMoneyCurrent = contract.currentSalary * currentSeasonPercent;

  let deadMoneyNext = 0;
  const { yearsRemaining } = contract;

  if (yearsRemaining >= 1) {
    const annualIncreaseRate = 1 + annualIncreasePercentage / 100;
    const nextYearSalary = contract.currentSalary * annualIncreaseRate;
    const yearsKey = Math.min(yearsRemaining, 4).toString() as '1' | '2' | '3' | '4';
    const nextYearPercent = deadMoneyConfig?.futureSeasons?.[yearsKey] ?? 0;
    deadMoneyNext = nextYearSalary * nextYearPercent;
  }

  return { deadMoneyCurrent, deadMoneyNext };
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function SimulateCutsModal({
  isOpen,
  onClose,
  players,
  league,
  currentCapUsed,
  deadMoneyRecords = [],
}: SimulateCutsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Suprime warning de variável não usada — deadMoneyRecords fica disponível
  // para extensões futuras (ex.: exibir dead money já existente junto à simulação).
  void deadMoneyRecords;

  const deadMoneyConfig = useMemo<DeadMoneyConfig | undefined>(() => {
    if (!league.deadMoneyConfig) return undefined;
    try {
      return typeof league.deadMoneyConfig === 'string'
        ? JSON.parse(league.deadMoneyConfig)
        : (league.deadMoneyConfig as unknown as DeadMoneyConfig);
    } catch {
      return undefined;
    }
  }, [league.deadMoneyConfig]);

  const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

  const getFirstPosition = (player: PlayerWithContract['player']): string => {
    const fp = player.fantasyPositions as unknown;
    if (Array.isArray(fp) && fp.length > 0) return fp[0] as string;
    if (typeof fp === 'string' && fp.trim() !== '') {
      return fp.split(',')[0]?.trim() ?? player.position;
    }
    return player.position;
  };

  const eligiblePlayers = useMemo(() => {
    const filtered = players.filter(
      p => p.contract && p.contract.status !== ContractStatus.CUT && p.rosterStatus !== 'cut',
    );

    return filtered.sort((a, b) => {
      const posA = getFirstPosition(a.player);
      const posB = getFirstPosition(b.player);
      const idxA = POSITION_ORDER.indexOf(posA);
      const idxB = POSITION_ORDER.indexOf(posB);
      const orderA = idxA === -1 ? POSITION_ORDER.length : idxA;
      const orderB = idxB === -1 ? POSITION_ORDER.length : idxB;

      if (orderA !== orderB) return orderA - orderB;
      return a.player.name.localeCompare(b.player.name);
    });
  }, [players]);

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(eligiblePlayers.map(p => p.player.id)));
  const clearAll = () => setSelectedIds(new Set());

  const simulation = useMemo(() => {
    const selected = eligiblePlayers.filter(p => selectedIds.has(p.player.id));

    const salaryReleased = selected.reduce((sum, p) => sum + (p.contract?.currentSalary ?? 0), 0);

    const deadMoneyGenerated = selected.reduce((sum, p) => {
      const { deadMoneyCurrent } = calcDeadMoneyForCut(
        p.contract,
        p.rosterStatus,
        deadMoneyConfig,
        league.annualIncreasePercentage,
      );
      return sum + deadMoneyCurrent;
    }, 0);

    const deadMoneyNextSeason = selected.reduce((sum, p) => {
      const { deadMoneyNext } = calcDeadMoneyForCut(
        p.contract,
        p.rosterStatus,
        deadMoneyConfig,
        league.annualIncreasePercentage,
      );
      return sum + deadMoneyNext;
    }, 0);

    const netCapImpact = salaryReleased - deadMoneyGenerated;
    const newCapUsed = currentCapUsed - netCapImpact;
    const newAvailableCap = league.salaryCap - newCapUsed;

    return {
      selected,
      salaryReleased,
      deadMoneyGenerated,
      deadMoneyNextSeason,
      netCapImpact,
      newCapUsed,
      newAvailableCap,
    };
  }, [
    eligiblePlayers,
    selectedIds,
    deadMoneyConfig,
    league.annualIncreasePercentage,
    league.salaryCap,
    currentCapUsed,
  ]);

  const currentAvailableCap = league.salaryCap - currentCapUsed;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulate-cuts-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel do modal */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[90vh]">
        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20">
              <ScissorsIcon className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 id="simulate-cuts-title" className="text-xl font-bold text-slate-100">
                Simulador de Cortes
              </h2>
              <p className="text-sm text-slate-400">
                Selecione os jogadores para simular o impacto no salary cap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Painel de resumo do Cap ── */}
        <div className="border-b border-slate-700 bg-slate-800/60 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="mb-1 text-xs font-medium text-slate-400">Cap Total</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(league.salaryCap)}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="mb-1 text-xs font-medium text-slate-400">Cap Usado (atual)</p>
              <p className="text-lg font-bold text-slate-100">{formatCurrency(currentCapUsed)}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="mb-1 text-xs font-medium text-slate-400">Cap Disponível (atual)</p>
              <p className={`text-lg font-bold ${getCurrencyClasses(currentAvailableCap)}`}>
                {formatCurrency(currentAvailableCap)}
              </p>
            </div>
            <div
              className={`rounded-xl p-3 ring-2 transition-all ${
                selectedIds.size > 0
                  ? simulation.newAvailableCap >= 0
                    ? 'bg-emerald-900/30 ring-emerald-600/50'
                    : 'bg-red-900/30 ring-red-600/50'
                  : 'bg-slate-800 ring-transparent'
              }`}
            >
              <p className="mb-1 text-xs font-medium text-slate-400">Cap Disponível (simulado)</p>
              <p
                className={`text-lg font-bold transition-colors ${
                  selectedIds.size > 0
                    ? getCurrencyClasses(simulation.newAvailableCap)
                    : 'text-slate-500'
                }`}
              >
                {selectedIds.size > 0 ? formatCurrency(simulation.newAvailableCap) : '—'}
              </p>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Salários liberados:</span>
                <span className="font-semibold text-emerald-400">
                  +{formatCurrency(simulation.salaryReleased)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                <span className="text-slate-400">Dead money gerado:</span>
                <span className="font-semibold text-red-400">
                  -{formatCurrency(simulation.deadMoneyGenerated)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-slate-400">Dead money (próx. temp.):</span>
                <span className="font-semibold text-orange-400">
                  -{formatCurrency(simulation.deadMoneyNextSeason)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${simulation.netCapImpact >= 0 ? 'bg-blue-400' : 'bg-red-400'}`}
                />
                <span className="text-slate-400">Impacto líquido no cap:</span>
                <span
                  className={`font-semibold ${simulation.netCapImpact >= 0 ? 'text-blue-400' : 'text-red-400'}`}
                >
                  {simulation.netCapImpact >= 0 ? '+' : ''}
                  {formatCurrency(simulation.netCapImpact)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Aviso sobre cap hell ── */}
        {selectedIds.size > 0 && simulation.newAvailableCap < 0 && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-red-700/60 bg-red-900/20 p-4">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">Atenção: Cap Hell!</p>
              <p className="mt-0.5 text-sm text-red-400">
                Esta combinação de cortes gera mais dead money do que cap space. O time ficaria{' '}
                acima do teto em{' '}
                <strong>{formatCurrency(Math.abs(simulation.newAvailableCap))}</strong> — o que
                bloquearia novas adições ao roster.
              </p>
            </div>
          </div>
        )}

        {/* ── Controles de seleção ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4">
          <p className="text-sm text-slate-400">
            {selectedIds.size === 0
              ? 'Nenhum jogador selecionado'
              : `${selectedIds.size} jogador${selectedIds.size > 1 ? 'es' : ''} selecionado${selectedIds.size > 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-600 hover:text-slate-100"
            >
              Selecionar todos
            </button>
            <button
              onClick={clearAll}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-600 hover:text-slate-100"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* ── Lista de jogadores (scrollável) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {eligiblePlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <InformationCircleIcon className="mb-3 h-12 w-12 text-slate-600" />
              <p className="text-slate-400">Nenhum jogador elegível para corte.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligiblePlayers.map(playerWithContract => {
                const { player, contract, rosterStatus } = playerWithContract;
                const isSelected = selectedIds.has(player.id);

                const { deadMoneyCurrent, deadMoneyNext } = calcDeadMoneyForCut(
                  contract,
                  rosterStatus,
                  deadMoneyConfig,
                  league.annualIncreasePercentage,
                );

                const netImpact = (contract?.currentSalary ?? 0) - deadMoneyCurrent;

                const rosterLabel =
                  rosterStatus === 'ir' ? 'IR' : rosterStatus === 'taxi' ? 'TS' : 'Ativo';

                const rosterBadgeClass =
                  rosterStatus === 'ir'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : rosterStatus === 'taxi'
                      ? 'bg-purple-900/50 text-purple-400'
                      : 'bg-emerald-900/50 text-emerald-400';

                const firstPosition = Array.isArray(player.fantasyPositions)
                  ? (player.fantasyPositions[0] ?? player.position)
                  : typeof player.fantasyPositions === 'string'
                    ? ((player.fantasyPositions as string).split(',')[0]?.trim() ?? player.position)
                    : player.position;

                return (
                  <label
                    key={player.id}
                    htmlFor={`cut-player-${player.id}`}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-red-600/60 bg-red-900/20 ring-1 ring-red-600/40'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-750'
                    }`}
                  >
                    <input
                      id={`cut-player-${player.id}`}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePlayer(player.id)}
                      className="h-4 w-4 flex-shrink-0 cursor-pointer accent-red-500"
                      aria-label={`Selecionar ${player.name} para corte simulado`}
                    />

                    <PlayerAvatar sleeperId={player.sleeperPlayerId} name={player.name} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-100">
                          {player.name}
                        </span>
                        <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                          {firstPosition}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${rosterBadgeClass}`}
                        >
                          {rosterLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                        <span>
                          Salário:{' '}
                          <strong className="text-slate-200">
                            {formatCurrency(contract?.currentSalary ?? 0)}
                          </strong>
                        </span>
                        <span>
                          {contract?.yearsRemaining ?? 0} ano
                          {(contract?.yearsRemaining ?? 0) !== 1 ? 's' : ''} restante
                          {(contract?.yearsRemaining ?? 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="hidden flex-shrink-0 flex-col items-end gap-0.5 text-xs sm:flex">
                      <span className="text-slate-400">
                        Dead money:{' '}
                        <strong className="text-red-400">{formatCurrency(deadMoneyCurrent)}</strong>
                      </span>
                      {deadMoneyNext > 0 && (
                        <span className="text-slate-400">
                          Próx. temp.:{' '}
                          <strong className="text-orange-400">
                            {formatCurrency(deadMoneyNext)}
                          </strong>
                        </span>
                      )}
                      <span
                        className={`font-semibold ${netImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        Líquido: {netImpact >= 0 ? '+' : ''}
                        {formatCurrency(netImpact)}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div className="border-t border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              Esta é apenas uma simulação. Nenhuma alteração será salva.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
