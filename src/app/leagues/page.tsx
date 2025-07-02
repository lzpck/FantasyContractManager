'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { League, LeagueStatus } from '@/types';
import { useLeagues } from '@/hooks/useLeagues';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getStatusColor, getStatusText } from '@/utils/formatUtils';
import { Toast } from '@/components/ui/Toast';
import LeagueModal from '@/components/leagues/LeagueModal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Página de listagem de ligas
 *
 * Exibe todas as ligas cadastradas em formato de cards responsivos,
 * com funcionalidades de busca, filtros e ações rápidas.
 */
export default function LeaguesPage() {
  const router = useRouter();
  const { leagues, loading, error, refreshLeagues } = useLeagues();
  const { canImportLeague } = useAuth();

  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeagueStatus | 'all'>('all');
  const [salaryCapFilter, setSalaryCapFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  const [syncingLeagues, setSyncingLeagues] = useState<Set<string>>(new Set());

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);

  // Filtrar e buscar ligas
  const filteredLeagues = useMemo(() => {
    return leagues.filter(league => {
      // Filtro de busca por nome
      const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status
      const matchesStatus = statusFilter === 'all' || league.status === statusFilter;

      // Filtro por salary cap
      let matchesSalaryCap = true;
      if (salaryCapFilter !== 'all') {
        const cap = league.salaryCap;
        switch (salaryCapFilter) {
          case 'low':
            matchesSalaryCap = cap < 200000000; // Menos de $200M
            break;
          case 'medium':
            matchesSalaryCap = cap >= 200000000 && cap < 300000000; // $200M - $300M
            break;
          case 'high':
            matchesSalaryCap = cap >= 300000000; // Mais de $300M
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesSalaryCap;
    });
  }, [leagues, searchTerm, statusFilter, salaryCapFilter]);

  // Função para mostrar toast
  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ show: true, message, type });
  };

  // Função para sincronizar liga
  const handleSyncLeague = async (leagueId: string, leagueName: string) => {
    setSyncingLeagues(prev => new Set(prev).add(leagueId));

    try {
      // Simular sincronização (substituir pela lógica real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast(`Liga "${leagueName}" sincronizada com sucesso!`, 'success');
    } catch (error) {
      showToast(`Erro ao sincronizar liga "${leagueName}"`, 'error');
    } finally {
      setSyncingLeagues(prev => {
        const newSet = new Set(prev);
        newSet.delete(leagueId);
        return newSet;
      });
    }
  };

  // Função para navegar para detalhes da liga
  const handleViewLeague = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`);
  };

  // Função para editar liga
  const handleEditLeague = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    if (league) {
      setEditingLeague(league);
      setIsModalOpen(true);
    }
  };

  // Função para adicionar nova liga
  const handleAddLeague = () => {
    setEditingLeague(null);
    setIsModalOpen(true);
  };

  // Função para salvar liga (criar ou editar)
  // Função para atualizar lista de ligas após criação/edição
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLeague(null);
    // Atualizar lista de ligas
    refreshLeagues();
  };

  // Renderizar estado de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-400">Carregando ligas...</span>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar ligas</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={refreshLeagues}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da página */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">Minhas Ligas</h1>
              <p className="text-slate-400">
                Gerencie suas ligas de fantasy football e contratos de jogadores
              </p>
            </div>
            {canImportLeague && (
              <button
                onClick={handleAddLeague}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Nova Liga
              </button>
            )}
          </div>

          {/* Barra de busca e filtros */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo de busca */}
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome da liga..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro por status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as LeagueStatus | 'all')}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value={LeagueStatus.ACTIVE}>Ativa</option>
                  <option value={LeagueStatus.OFFSEASON}>Off-season</option>
                  <option value={LeagueStatus.ARCHIVED}>Arquivada</option>
                </select>
              </div>

              {/* Filtro por salary cap */}
              <div>
                <select
                  value={salaryCapFilter}
                  onChange={e => setSalaryCapFilter(e.target.value as typeof salaryCapFilter)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os caps</option>
                  <option value="low">Baixo (&lt; $200M)</option>
                  <option value="medium">Médio ($200M - $300M)</option>
                  <option value="high">Alto (&gt; $300M)</option>
                </select>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-slate-400 text-sm">
                {filteredLeagues.length} de {leagues.length} ligas encontradas
              </span>
              <button
                onClick={refreshLeagues}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de ligas */}
        {filteredLeagues.length === 0 ? (
          // Estado vazio
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <FunnelIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {leagues.length === 0
                ? 'Nenhuma liga encontrada'
                : 'Nenhuma liga corresponde aos filtros'}
            </h3>
            <p className="text-slate-400 mb-6">
              {leagues.length === 0
                ? 'Comece criando sua primeira liga de fantasy football'
                : 'Tente ajustar os filtros de busca para encontrar suas ligas'}
            </p>
            {leagues.length === 0 && canImportLeague && (
              <button
                onClick={handleAddLeague}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="h-5 w-5" />
                Criar primeira liga
              </button>
            )}
          </div>
        ) : (
          // Grid de cards das ligas
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeagues.map(league => {
              const isSyncing = syncingLeagues.has(league.id);
              const syncStatus = league.sleeperLeagueId ? 'Sincronizado' : 'Não configurado';

              return (
                <div
                  key={league.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all duration-200 hover:shadow-lg"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-100 line-clamp-1 flex-1">
                          {league.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(
                            league.status,
                          )}`}
                        >
                          {getStatusText(league.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações da liga */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Salary Cap:</span>
                      <span className="text-slate-200 font-medium">
                        {formatCurrency(league.salaryCap)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Times:</span>
                      <span className="text-slate-200 font-medium">{league.totalTeams}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Temporada:</span>
                      <span className="text-slate-200 font-medium">{league.season}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Sleeper:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          league.sleeperLeagueId
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}
                      >
                        {syncStatus}
                      </span>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewLeague(league.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Ver
                    </button>
                    {canImportLeague && (
                      <>
                        <button
                          onClick={() => handleEditLeague(league.id)}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                          title="Editar liga"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSyncLeague(league.id, league.name)}
                          disabled={isSyncing}
                          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                          title="Sincronizar com Sleeper"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de criação/edição */}
        <LeagueModal isOpen={isModalOpen} onClose={handleModalClose} league={editingLeague} />

        {/* Toast de feedback */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </div>
    </div>
  );
}
