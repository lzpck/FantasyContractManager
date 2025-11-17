'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlayerWithContract, League } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerWithContract: PlayerWithContract;
  league: League | null;
}

export default function ExtensionModal({ isOpen, onClose, playerWithContract, league }: Props) {
  const [extensionSalary, setExtensionSalary] = useState<string>('');
  const [extensionYears, setExtensionYears] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const eligible =
    !!playerWithContract.contract &&
    playerWithContract.contract.yearsRemaining === 1 &&
    !playerWithContract.contract.hasBeenExtended;

  useEffect(() => {
    if (isOpen) {
      setExtensionSalary('');
      setExtensionYears('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!extensionSalary || Number(extensionSalary) <= 0)
      next.extensionSalary = 'Informe o salário';
    if (!extensionYears || Number(extensionYears) < 1 || Number(extensionYears) > 4)
      next.extensionYears = 'Anos deve ser entre 1 e 4';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    if (!playerWithContract.contract) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${playerWithContract.contract.teamId}/contracts/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: playerWithContract.contract.id,
          newSalary: extensionSalary,
          additionalYears: extensionYears,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao aplicar extensão');
      }
      const data = await res.json();
      toast.success('Extensão aplicada com sucesso');
      onClose();
      window.dispatchEvent(
        new CustomEvent('contractExtended', { detail: { contract: data.contract } }),
      );
    } catch (e: any) {
      toast.error(e.message || 'Erro ao aplicar extensão');
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
                id={`extension-modal-${playerWithContract.player.id}`}
                className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-slate-100">
                    Extensão de Contrato
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                {!eligible ? (
                  <div className="py-8 text-center text-slate-400">
                    Jogador não elegível para extensão.
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Novo Salário *</label>
                        <input
                          type="number"
                          value={extensionSalary}
                          onChange={e => setExtensionSalary(e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 ${errors.extensionSalary ? 'border-red-500' : 'border-slate-600'}`}
                        />
                        {errors.extensionSalary && (
                          <p className="text-red-400 text-xs mt-1">{errors.extensionSalary}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">
                          Anos de Extensão *
                        </label>
                        <select
                          value={extensionYears}
                          onChange={e => setExtensionYears(e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 ${errors.extensionYears ? 'border-red-500' : 'border-slate-600'}`}
                        >
                          <option value="">Selecione</option>
                          <option value="1">1 ano</option>
                          <option value="2">2 anos</option>
                          <option value="3">3 anos</option>
                          <option value="4">4 anos</option>
                        </select>
                        {errors.extensionYears && (
                          <p className="text-red-400 text-xs mt-1">{errors.extensionYears}</p>
                        )}
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
                          className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                          disabled={loading}
                        >
                          Aplicar Extensão
                        </button>
                      </div>
                    </form>
                    <ConfirmationModal
                      isOpen={confirmOpen}
                      onClose={() => setConfirmOpen(false)}
                      onConfirm={handleConfirm}
                      title="Confirmar extensão"
                      message="Confirma aplicar a extensão?"
                      confirmText="Confirmar"
                      cancelText="Cancelar"
                      type="info"
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
