'use client';

import { useState, useEffect } from 'react';
import { PlayerWithContract, Player, Team, League, Contract } from '@/types';
import { XMarkIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';
import { useContractModal } from '@/hooks/useContractModal';
import { useContractOperations } from '@/hooks/useContractOperations';
import ContractModal from './ContractModal';

interface ContractActionData {
  action: string;
  player: PlayerWithContract;
  formData: {
    newSalary: string;
    newYears: string;
    extensionSalary: string;
    extensionYears: string;
  };
  calculatedValues: {
    deadMoney: number;
    tagValue: number;
  };
}

interface ContractActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithContract | null;
  team: Team;
  league: League;
  onAction: (action: string, data: ContractActionData) => void;
  isCommissioner: boolean;
}

export default function ContractActionsModal({
  isOpen,
  onClose,
  player,
  team,
  league,
  onAction,
  isCommissioner,
}: ContractActionsModalProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'extend' | 'tag' | 'cut'>('edit');
  const [formData, setFormData] = useState({
    newSalary: '',
    newYears: '',
    extensionSalary: '',
    extensionYears: '',
  });

  const contractModal = useContractModal();
  
  const {
    createContract,
    updateContract,
    extendContract,
    applyFranchiseTag,
    cutPlayer,
    isLoading,
    error: operationError,
    clearError,
  } = useContractOperations({
    team,
    league,
    onUpdate: () => {
      // Callback para atualizar dados após operação
    },
  });

  const handleContractSave = async (formData: any) => {
    try {
      // Transformar dados do formulário para o formato esperado pelo hook
      const contractData = {
        totalValue: formData.annualSalary * formData.contractYears,
        years: formData.contractYears,
        currentSalary: formData.annualSalary,
        originalSalary: formData.annualSalary,
        originalYears: formData.contractYears,
        yearsRemaining: formData.contractYears,
        guaranteedMoney: formData.annualSalary * formData.contractYears, // Por padrão, todo o contrato é garantido
        acquisitionType: formData.acquisitionType,
        hasFourthYearOption: formData.hasFourthYearOption,
        hasBeenTagged: formData.hasBeenTagged,
        hasBeenExtended: formData.hasBeenExtended,
        fourthYearOptionActivated: formData.fourthYearOptionActivated,
        signedSeason: new Date().getFullYear(),
      };
      
      let result;
      
      if (player.contract) {
        result = await updateContract(player.contract, contractData);
      } else {
        result = await createContract(player.player, contractData);
      }
      
      if (result.success) {
        alert(result.message);
        onClose();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    }
  };

  useEffect(() => {
    if (isOpen && player && player.contract) {
      // Configurar os dados do formulário apenas se tem contrato
      setFormData({
          newSalary: player.contract.currentSalary.toString(),
          newYears: player.contract.yearsRemaining.toString(),
          extensionSalary: '',
          extensionYears: '',
        });
    }
  }, [isOpen, player]);

  // Calcular dead money
  const calculateDeadMoney = () => {
    if (!player?.contract) return 0;
    const remainingSalary = player.contract.currentSalary * player.contract.yearsRemaining;
    return remainingSalary * 0.25; // 25% do salário restante
  };

  // Calcular valor da franchise tag
  const calculateTagValue = () => {
    if (!player?.contract) return 0;
    const salaryIncrease = player.contract.currentSalary * 1.15;
    const positionAverage = player.contract.currentSalary * 1.2; // Mock da média da posição
    return Math.max(salaryIncrease, positionAverage);
  };

  // Verificar elegibilidade para ações
  const isEligibleForExtension = player?.contract ? 
    player.contract.yearsRemaining === 1 && !player.contract.hasBeenExtended : false;
  const isEligibleForTag = player?.contract ? 
    player.contract.yearsRemaining === 1 && !player.contract.hasBeenTagged : false;

  // Função para abrir modal de edição de contrato
  const handleEditContract = () => {
    if (player && isCommissioner) {
      contractModal.openModal(player.player, team, league, player.contract);
      onClose(); // Fechar o modal de ações
    }
  };
  
  // Função para adicionar novo contrato (para jogadores sem contrato)
  const handleAddContract = () => {
    if (player && isCommissioner) {
      contractModal.openModal(player.player, team, league);
      onClose(); // Fechar o modal de ações
    }
  };
  
  // Função para aplicar extensão de contrato
  const handleExtension = async () => {
    if (!player?.contract || !formData.extensionSalary || !formData.extensionYears) {
      alert('Por favor, preencha o salário e anos da extensão.');
      return;
    }
    
    const result = await extendContract(
      player.contract,
      parseInt(formData.extensionYears),
      parseFloat(formData.extensionSalary),
      0
    );
    
    if (result.success) {
      alert(result.message);
      onClose();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };
  
  // Função para aplicar franchise tag
  const handleFranchiseTag = async () => {
    if (!player) return;
    
    const tagValue = calculateTagValue();
    
    const result = await applyFranchiseTag(player, tagValue);
    
    if (result.success) {
      alert(result.message);
      onClose();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };
  

  
  const handleSubmit = (action: string) => {
    switch (action) {
      case 'edit':
        handleEditContract();
        break;
      case 'extend':
        handleExtension();
        break;
      case 'tag':
        handleFranchiseTag();
        break;
      default:
        console.warn('Ação não reconhecida:', action);
    }
  };

  const tabs = [
    { id: 'edit', label: 'Editar Contrato', enabled: true },
    { id: 'extend', label: 'Extensão', enabled: isEligibleForExtension },
    { id: 'tag', label: 'Franchise Tag', enabled: isEligibleForTag },
  ] as const;

  // Não renderizar se o modal não estiver aberto
  if (!isOpen) {
    return null;
  }

  // Se não há jogador, não renderizar
  if (!player) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div>
              <h3 className="text-lg font-medium text-slate-100">
                Ações de Contrato - {player.player.name}
              </h3>
              <p className="text-sm text-slate-400">
                {player.player.position} • {player.player.nflTeam}
                {player.contract && (
                  <>
                    {' '} • {formatCurrency(player.contract.currentSalary)} • {player.contract.yearsRemaining} ano(s)
                  </>
                )}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <div className="border-b border-slate-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={!tab.enabled}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : tab.enabled
                        ? 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                        : 'border-transparent text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-slate-100 mb-4">
                      Editar Contrato
                    </h4>
                    <p className="text-slate-400 mb-4">
                      Abrir o modal de edição de contrato para fazer alterações detalhadas.
                    </p>
                    <div className="bg-slate-700 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-slate-200 mb-2">Contrato Atual:</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {player.contract ? (
                           <>
                             <div>
                               <span className="text-slate-400">Salário:</span>
                               <span className="ml-2 text-slate-100">
                                 {formatCurrency(player.contract.currentSalary)}
                               </span>
                             </div>
                             <div>
                               <span className="text-slate-400">Anos Restantes:</span>
                               <span className="ml-2 text-slate-100">
                                 {player.contract.yearsRemaining}
                               </span>
                             </div>
                             <div>
                               <span className="text-slate-400">Valor Total:</span>
                               <span className="ml-2 text-slate-100">
                                 {formatCurrency(player.contract.totalValue)}
                               </span>
                             </div>
                             <div>
                               <span className="text-slate-400">Garantido:</span>
                               <span className="ml-2 text-slate-100">
                                 {formatCurrency(player.contract.guaranteedMoney)}
                               </span>
                             </div>
                           </>
                         ) : (
                           <div className="text-center py-4">
                             <span className="text-slate-400">Jogador sem contrato</span>
                           </div>
                         )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSubmit('edit')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      Abrir Editor de Contrato
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'extend' && (
                <div className="space-y-4">
                  {isEligibleForExtension ? (
                    <div>
                      <h4 className="text-lg font-medium text-slate-100 mb-4">
                        Extensão de Contrato
                      </h4>
                      <p className="text-slate-400 mb-4">
                        Estenda o contrato do jogador por mais anos.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Novo Salário Anual
                          </label>
                          <input
                            type="number"
                            value={formData.extensionSalary}
                            onChange={(e) => setFormData({ ...formData, extensionSalary: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 15000000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Anos de Extensão
                          </label>
                          <select
                            value={formData.extensionYears}
                            onChange={(e) => setFormData({ ...formData, extensionYears: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione</option>
                            <option value="1">1 ano</option>
                            <option value="2">2 anos</option>
                            <option value="3">3 anos</option>
                            <option value="4">4 anos</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSubmit('extend')}
                        disabled={!formData.extensionSalary || !formData.extensionYears}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium mt-4"
                      >
                        Aplicar Extensão
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400">
                        Jogador não é elegível para extensão de contrato.
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Extensões só podem ser aplicadas no último ano de contrato.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tag' && (
                <div className="space-y-4">
                  {isEligibleForTag ? (
                    <div>
                      <h4 className="text-lg font-medium text-slate-100 mb-4">
                        Franchise Tag
                      </h4>
                      <p className="text-slate-400 mb-4">
                        Aplicar franchise tag para manter o jogador por mais um ano.
                      </p>
                      <div className="bg-slate-700 p-4 rounded-lg mb-4">
                        <h5 className="font-medium text-slate-200 mb-2">Valor da Tag:</h5>
                        <p className="text-2xl font-bold text-green-400">
                          {formatCurrency(calculateTagValue())}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          Baseado no maior valor entre salário +15% ou média da posição
                        </p>
                      </div>
                      <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg mb-4">
                        <p className="text-yellow-300 text-sm">
                          ⚠️ A franchise tag só pode ser usada uma vez por jogador e uma vez por temporada.
                        </p>
                      </div>
                      <button
                        onClick={() => handleSubmit('tag')}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Aplicar Franchise Tag
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400">
                        Jogador não é elegível para franchise tag.
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Tags só podem ser aplicadas no último ano de contrato.
                      </p>
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>

          {/* Error Display */}
          {operationError && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{operationError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contract Modal */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        onSave={handleContractSave}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        isCommissioner={isCommissioner}
      />
    </div>
  );
}
