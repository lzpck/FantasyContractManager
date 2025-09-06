'use client';

import { useState } from 'react';
import { TeamWithLeague } from '@/types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Componente para seleção de múltiplas equipes
 * Permite adicionar, remover e visualizar equipes vinculadas a um usuário
 */
interface MultiTeamSelectorProps {
  /** Lista de equipes disponíveis para seleção */
  availableTeams: TeamWithLeague[];
  /** Lista de equipes atualmente selecionadas */
  selectedTeams: TeamWithLeague[];
  /** Callback chamado quando a seleção de equipes muda */
  onTeamsChange: (teams: TeamWithLeague[]) => void;
  /** Se o componente está carregando dados */
  loading?: boolean;
  /** Se o componente está desabilitado */
  disabled?: boolean;
  /** Texto de ajuda personalizado */
  helpText?: string;
}

export function MultiTeamSelector({
  availableTeams,
  selectedTeams,
  onTeamsChange,
  loading = false,
  disabled = false,
  helpText,
}: MultiTeamSelectorProps) {
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  /**
   * Adiciona uma nova equipe à seleção
   */
  const handleAddTeam = () => {
    if (!selectedTeamId) return;

    const teamToAdd = availableTeams.find(team => team.id === selectedTeamId);
    if (!teamToAdd) return;

    // Verifica se a equipe já está selecionada
    const isAlreadySelected = selectedTeams.some(team => team.id === selectedTeamId);
    if (isAlreadySelected) return;

    // Adiciona a nova equipe à lista
    const updatedTeams = [...selectedTeams, teamToAdd];
    onTeamsChange(updatedTeams);

    // Reset do formulário
    setSelectedTeamId('');
    setShowAddTeam(false);
  };

  /**
   * Remove uma equipe da seleção
   */
  const handleRemoveTeam = (teamId: string) => {
    const updatedTeams = selectedTeams.filter(team => team.id !== teamId);
    onTeamsChange(updatedTeams);
  };

  /**
   * Cancela a adição de uma nova equipe
   */
  const handleCancelAdd = () => {
    setSelectedTeamId('');
    setShowAddTeam(false);
  };

  // Filtra equipes disponíveis que ainda não foram selecionadas
  const unselectedTeams = availableTeams.filter(
    team => !selectedTeams.some(selected => selected.id === team.id),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-100">Equipes Vinculadas</label>
        {!showAddTeam && unselectedTeams.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddTeam(true)}
            disabled={disabled || loading}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-100 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Equipe
          </button>
        )}
      </div>

      {/* Lista de equipes selecionadas */}
      {selectedTeams.length > 0 ? (
        <div className="space-y-2">
          {selectedTeams.map(team => (
            <div
              key={team.id}
              className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-100">{team.name}</div>
                <div className="text-xs text-slate-400">
                  {team.league?.name} ({team.league?.season})
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTeam(team.id)}
                disabled={disabled}
                className="ml-3 inline-flex items-center p-1 border border-transparent rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remover equipe"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed border-slate-600 rounded-lg">
          <div className="text-sm text-slate-400">Nenhuma equipe vinculada</div>
          <div className="text-xs text-slate-500 mt-1">
            Clique em &quot;Adicionar Equipe&quot; para vincular uma equipe ao usuário
          </div>
        </div>
      )}

      {/* Formulário para adicionar nova equipe */}
      {showAddTeam && (
        <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-100">
              Selecionar Nova Equipe
            </label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              disabled={loading}
              className="block w-full px-3 py-2 border border-slate-600 bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100"
            >
              <option value="">Escolha uma equipe...</option>
              {unselectedTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.league?.name} ({team.league?.season})
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-600 rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddTeam}
                disabled={!selectedTeamId}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Texto de ajuda */}
      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}

      {/* Estados de loading e vazio */}
      {loading && <p className="text-xs text-slate-400">Carregando equipes disponíveis...</p>}

      {!loading && availableTeams.length === 0 && (
        <p className="text-xs text-red-400">Nenhuma equipe disponível no momento.</p>
      )}

      {!loading && unselectedTeams.length === 0 && selectedTeams.length > 0 && (
        <p className="text-xs text-slate-400">Todas as equipes disponíveis já foram vinculadas.</p>
      )}
    </div>
  );
}
