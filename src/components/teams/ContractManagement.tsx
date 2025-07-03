'use client';

import { useState, useEffect, useCallback } from 'react';
import { Player, Team, League, PlayerWithContract } from '@/types';
import { useContractModal, useCanManageContracts } from '@/hooks/useContractModal';
import ContractModal from './ContractModal';
import { PlusIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';

interface ContractManagementProps {
  team: Team;
  league: League;
  players: Player[]; // Jogadores disponíveis para contrato
  playersWithContracts: PlayerWithContract[]; // Jogadores que já têm contrato
  onDataUpdate?: () => void; // Callback para recarregar dados
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

/**
 * Componente para gerenciamento de contratos
 *
 * Permite aos comissários:
 * - Visualizar jogadores com e sem contrato
 * - Adicionar novos contratos
 * - Editar contratos existentes
 * - Integração com o modal de contratos
 */
export default function ContractManagement({
  team,
  league,
  players,
  playersWithContracts,
  onDataUpdate,
}: ContractManagementProps) {
  const canManageContracts = useCanManageContracts();
  const contractModal = useContractModal();

  const [activeTab, setActiveTab] = useState<'with-contract' | 'without-contract'>('with-contract');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Filtrar jogadores sem contrato
  const playersWithoutContract = players.filter(
    player => !playersWithContracts.some(pwc => pwc.player.id === player.id),
  );

  // Filtrar jogadores baseado na busca
  const filteredPlayersWithContracts = playersWithContracts.filter(
    pwc =>
      pwc.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pwc.player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pwc.player.nflTeam.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredPlayersWithoutContract = playersWithoutContract.filter(
    player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nflTeam.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Função para adicionar toast
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, message };

    setToasts(prev => [...prev, newToast]);

    // Remover toast após 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Função para remover toast manualmente
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Gerenciar eventos de atualização de contrato e toast
  useEffect(() => {
    const handleContractUpdate = (event: CustomEvent) => {
      console.log('Contrato atualizado, recarregando dados...', event.detail);

      // Chamar callback para recarregar dados se fornecido
      if (onDataUpdate) {
        onDataUpdate();
      }
    };

    const handleShowToast = (event: CustomEvent) => {
      const { type, message } = event.detail;
      addToast(type, message);
    };

    window.addEventListener('contractUpdated', handleContractUpdate as EventListener);
    window.addEventListener('showToast', handleShowToast as EventListener);

    return () => {
      window.removeEventListener('contractUpdated', handleContractUpdate as EventListener);
      window.removeEventListener('showToast', handleShowToast as EventListener);
    };
  }, [onDataUpdate, addToast]);

  const handleAddContract = (player: Player) => {
    contractModal.openModal(player, team, league);
  };

  const handleEditContract = (playerWithContract: PlayerWithContract) => {
    contractModal.openModal(
      playerWithContract.player,
      team,
      league,
      playerWithContract.contract || undefined,
    );
  };

  // Se não for comissário, não mostrar controles de gerenciamento
  if (!canManageContracts) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <p className="text-slate-400 text-center">Apenas comissários podem gerenciar contratos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Gerenciamento de Contratos</h2>
            <p className="text-slate-400 text-sm mt-1">
              {team.name} • {league.name} • Temporada {league.season}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Salary Cap Disponível</div>
            <div className="text-lg font-semibold text-slate-100">
              {formatCurrency(team.availableCap)}
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar jogadores..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('with-contract')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'with-contract'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Com Contrato ({filteredPlayersWithContracts.length})
            </button>
            <button
              onClick={() => setActiveTab('without-contract')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'without-contract'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sem Contrato ({filteredPlayersWithoutContract.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        {activeTab === 'with-contract' && (
          <div>
            {/* Header da tabela */}
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-medium text-slate-100">Jogadores com Contrato</h3>
            </div>

            {/* Lista de jogadores com contrato */}
            <div className="divide-y divide-slate-700">
              {filteredPlayersWithContracts.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-400">
                  {searchTerm ? 'Nenhum jogador encontrado.' : 'Nenhum jogador com contrato.'}
                </div>
              ) : (
                filteredPlayersWithContracts.map(playerWithContract => (
                  <div
                    key={playerWithContract.player.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {playerWithContract.player.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {playerWithContract.player.position} • {playerWithContract.player.nflTeam}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-100">
                          {formatCurrency(playerWithContract.contract?.currentSalary ?? 0)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {playerWithContract.contract?.yearsRemaining} ano(s) restante(s)
                        </div>
                      </div>

                      <button
                        onClick={() => handleEditContract(playerWithContract)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors"
                        title="Editar contrato"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'without-contract' && (
          <div>
            {/* Header da tabela */}
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-medium text-slate-100">Jogadores sem Contrato</h3>
              <p className="text-sm text-slate-400 mt-1">
                Clique no botão + para adicionar um contrato
              </p>
            </div>

            {/* Lista de jogadores sem contrato */}
            <div className="divide-y divide-slate-700">
              {filteredPlayersWithoutContract.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-400">
                  {searchTerm ? 'Nenhum jogador encontrado.' : 'Todos os jogadores têm contrato.'}
                </div>
              ) : (
                filteredPlayersWithoutContract.map(player => (
                  <div
                    key={player.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm font-medium text-slate-100">{player.name}</div>
                        <div className="text-xs text-slate-400">
                          {player.position} • {player.nflTeam}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddContract(player)}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded-lg transition-colors"
                      title="Adicionar contrato"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Contrato */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={contractModal.saveContract}
        isCommissioner={canManageContracts}
      />

      {/* Loading/Error States */}
      {contractModal.isLoading && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-100">Salvando contrato...</p>
          </div>
        </div>
      )}

      {contractModal.error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <p className="font-medium">Erro</p>
          <p className="text-sm">{contractModal.error}</p>
        </div>
      )}

      {/* Sistema de Toast */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center px-6 py-3 rounded-xl shadow-lg text-white transition-all duration-300 transform ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <XCircleIcon className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">{toast.type === 'success' ? 'Sucesso' : 'Erro'}</p>
                <p className="text-sm">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
