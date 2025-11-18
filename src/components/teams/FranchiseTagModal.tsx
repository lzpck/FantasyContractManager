'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlayerWithContract, League, ContractWithPlayer } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useLeagueContracts } from '@/hooks/useContracts';
import { calculateFranchiseTagValue } from '@/utils/contractUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerWithContract: PlayerWithContract;
  league: League | null;
  isCommissioner: boolean;
}

export default function FranchiseTagModal({
  isOpen,
  onClose,
  playerWithContract,
  league,
  isCommissioner,
}: Props) {
  const [tagValue, setTagValue] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const eligible =
    !!playerWithContract.contract &&
    playerWithContract.contract.yearsRemaining === 1 &&
    !playerWithContract.contract.hasBeenTagged;

  const { contracts: leagueContracts } = useLeagueContracts(league?.id ?? '');

  const recommended = useMemo(() => {
    const c = playerWithContract.contract;
    if (!c) return 0;
    const season = league?.season ?? new Date().getFullYear();
    const contractsWithPlayers = leagueContracts.map((lc: ContractWithPlayer) => ({
      contract: lc,
      player: lc.player,
    }));
    const calc = calculateFranchiseTagValue(
      playerWithContract.player,
      c,
      contractsWithPlayers,
      season,
    );
    return calc.finalTagValue;
  }, [playerWithContract, leagueContracts, league?.season]);

  useEffect(() => {
    if (isOpen) {
      setTagValue(String(recommended || ''));
      setErrors({});
    }
  }, [isOpen, recommended]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (isCommissioner) {
      if (!tagValue || Number(tagValue) <= 0) next.tagValue = 'Informe o valor da tag';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    if (!playerWithContract.contract) return;
    try {
      setLoading(true);
      const valueToSend = isCommissioner ? tagValue : String(recommended);
      const res = await fetch(`/api/teams/${playerWithContract.contract.teamId}/contracts/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: playerWithContract.contract.id,
          tagValue: valueToSend,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao aplicar franchise tag');
      }
      const data = await res.json();
      toast.success('Franchise tag aplicada com sucesso');
      onClose();
      window.dispatchEvent(
        new CustomEvent('franchiseTagApplied', { detail: { contract: data.contract } }),
      );
    } catch (e: any) {
      toast.error(e.message || 'Erro ao aplicar franchise tag');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirmOpen(true);
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                id={`franchise-tag-modal-${playerWithContract.player.id}`}
                className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-slate-100">
                    Franchise Tag
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                {!eligible ? (
                  <div className="py-8 text-center text-slate-400">
                    Jogador não elegível para franchise tag.
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-slate-400 text-sm">
                      {playerWithContract.player.name} • {playerWithContract.player.position}
                      <span className="ml-2">
                        • {formatCurrency(playerWithContract.contract!.currentSalary)} •{' '}
                        {playerWithContract.contract!.yearsRemaining} ano(s)
                      </span>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg mb-4">
                      <div className="text-sm text-slate-300">Valor recomendado</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(recommended)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Maior entre salário +15% ou média top 10 da posição
                      </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isCommissioner ? (
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">
                            Valor da Tag *
                          </label>
                          <input
                            type="number"
                            value={tagValue}
                            onChange={e => setTagValue(e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 ${errors.tagValue ? 'border-red-500' : 'border-slate-600'}`}
                          />
                          {errors.tagValue && (
                            <p className="text-red-400 text-xs mt-1">{errors.tagValue}</p>
                          )}
                        </div>
                      ) : null}
                      <div className="bg-yellow-900/20 border border-yellow-700 p-3 rounded-lg text-yellow-300 text-sm">
                        A franchise tag só pode ser usada uma vez por jogador e uma vez por
                        temporada.
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-slate-300"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-yellow-600 text-white rounded-lg disabled:opacity-50"
                          disabled={loading}
                        >
                          Aplicar Tag
                        </button>
                      </div>
                    </form>
                    <ConfirmationModal
                      isOpen={confirmOpen}
                      onClose={() => setConfirmOpen(false)}
                      onConfirm={handleConfirm}
                      title="Confirmar franchise tag"
                      message="Confirma aplicar a franchise tag?"
                      confirmText="Confirmar"
                      cancelText="Cancelar"
                      type="warning"
                      loading={loading}
                    />
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
