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

export default function EditContractModal({ isOpen, onClose, playerWithContract, league }: Props) {
  const [currentSalary, setCurrentSalary] = useState<string>('');
  const [yearsRemaining, setYearsRemaining] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const c = playerWithContract.contract;
      setCurrentSalary(c ? String(c.currentSalary) : '');
      setYearsRemaining(c ? String(c.yearsRemaining) : '');
      setErrors({});
    }
  }, [isOpen, playerWithContract]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!currentSalary || Number(currentSalary) <= 0) next.currentSalary = 'Informe o salário';
    if (!yearsRemaining || Number(yearsRemaining) < 1) next.yearsRemaining = 'Informe anos válidos';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    if (!playerWithContract.contract) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${playerWithContract.contract.teamId}/contracts/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: playerWithContract.contract.id,
          currentSalary,
          yearsRemaining,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao atualizar contrato');
      }
      const data = await res.json();
      toast.success('Contrato atualizado com sucesso');
      onClose();
      window.dispatchEvent(
        new CustomEvent('contractUpdated', { detail: { contract: data.contract } }),
      );
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar contrato');
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
                id={`edit-contract-modal-${playerWithContract.player.id}`}
                className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-slate-100">
                    Editar Contrato
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mb-4 text-slate-400 text-sm">
                  {playerWithContract.player.name} • {playerWithContract.player.position}
                  {playerWithContract.contract && (
                    <span className="ml-2">
                      • {formatCurrency(playerWithContract.contract.currentSalary)} •{' '}
                      {playerWithContract.contract.yearsRemaining} ano(s)
                    </span>
                  )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Salário Atual *</label>
                    <input
                      type="number"
                      value={currentSalary}
                      onChange={e => setCurrentSalary(e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 ${errors.currentSalary ? 'border-red-500' : 'border-slate-600'}`}
                    />
                    {errors.currentSalary && (
                      <p className="text-red-400 text-xs mt-1">{errors.currentSalary}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Anos Restantes *</label>
                    <select
                      value={yearsRemaining}
                      onChange={e => setYearsRemaining(e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 ${errors.yearsRemaining ? 'border-red-500' : 'border-slate-600'}`}
                    >
                      <option value="">Selecione</option>
                      <option value="1">1 ano</option>
                      <option value="2">2 anos</option>
                      <option value="3">3 anos</option>
                      <option value="4">4 anos</option>
                    </select>
                    {errors.yearsRemaining && (
                      <p className="text-red-400 text-xs mt-1">{errors.yearsRemaining}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                      disabled={loading}
                    >
                      Salvar
                    </button>
                  </div>
                </form>
                <ConfirmationModal
                  isOpen={confirmOpen}
                  onClose={() => setConfirmOpen(false)}
                  onConfirm={handleConfirm}
                  title="Confirmar atualização"
                  message="Esta ação atualizará o contrato imediatamente."
                  confirmText="Confirmar"
                  cancelText="Cancelar"
                  type="info"
                  loading={loading}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
