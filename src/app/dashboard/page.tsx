'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useContracts } from '@/hooks/useContracts';
import { useSalaryCap } from '@/hooks/useSalaryCap';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { LeagueSelector } from '@/components/dashboard/LeagueSelector';
import { TopSalaries } from '@/components/dashboard/TopSalaries';
import { TopSalariesByPosition } from '@/components/dashboard/TopSalariesByPosition';
import { FranchiseTagValues } from '@/components/dashboard/FranchiseTagValues';

import { getNFLState } from '@/services/nflStateService';
import { ContractStatus } from '@/types';
import {
  TrophyIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * Dashboard Analytics do FantasyContractManager
 *
 * Funcionalidades:
 * - Seleção de liga para análise específica
 * - Estatísticas de contratos ativos e vencendo por liga
 * - Top 5 maiores salários da liga selecionada
 * - Top 3 maiores salários por posição
 * - Valores de Franchise Tag por posição
 *
 * Regras de negócio:
 * - Apenas comissários podem acessar o dashboard
 * - Dados são calculados dinamicamente baseados na liga selecionada
 * - Estados vazios são exibidos quando nenhuma liga está selecionada
 * - Alertas são exibidos apenas para contratos vencendo da liga selecionada
 * - Redirecionamento automático para páginas específicas ao clicar nos cards (quando aplicável)
 */
function DashboardContent() {
  const router = useRouter();
  const { state, setUser } = useAppContext();
  const { user: authUser, isAuthenticated, isCommissioner } = useAuth();
  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  const { teams, loading: teamsLoading, error: teamsError } = useUserTeams();
  const { contracts, loading: contractsLoading } = useContracts();
  const { salaryCapData, loading: salaryCapLoading } = useSalaryCap();
  const [nflState, setNflState] = useState<{ season: string; week: number } | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);

  // Dados para os novos componentes analytics (estrutura preparada para integração futura)
  const [topSalariesData, setTopSalariesData] = useState<any[]>([]);
  const [topSalariesByPositionData, setTopSalariesByPositionData] = useState<any[]>([]);
  const [franchiseTagData, setFranchiseTagData] = useState<any[]>([]);

  // Verificar se o usuário é comissário
  useEffect(() => {
    if (isAuthenticated && !isCommissioner) {
      router.replace('/unauthorized?reason=not-commissioner');
      return;
    }
  }, [isAuthenticated, isCommissioner, router]);

  // Inicializar dados do usuário autenticado
  useEffect(() => {
    if (isAuthenticated && authUser && !state.user) {
      setUser({
        id: authUser.id,
        name: authUser.name || 'Usuário',
        email: authUser.email || '',
        avatar: authUser.image || undefined,
        role: authUser.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [isAuthenticated, authUser, state.user, setUser]);

  // Buscar estado atual da NFL
  useEffect(() => {
    const fetchNFLState = async () => {
      try {
        const state = await getNFLState();
        if (state) {
          setNflState({
            season: state.season,
            week: state.week,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar estado da NFL:', error);
      }
    };

    fetchNFLState();
  }, []);

  // Filtrar ligas onde o usuário é GM ou comissário
  const userManagedLeagues = leagues.filter(league => {
    // TODO: Implementar lógica para verificar se o usuário é GM ou comissário da liga
    // Por enquanto, retorna todas as ligas (estrutura preparada para integração futura)
    return true;
  });

  // Handler para seleção de liga
  const handleLeagueSelect = (league: any) => {
    setSelectedLeague(league);
    // TODO: Carregar dados específicos da liga selecionada
    // - Top 5 maiores salários da liga
    // - Top 3 maiores salários por posição
    // - Valores de Franchise Tag por posição
  };

  // Efeito para carregar dados quando liga é selecionada
  useEffect(() => {
    if (selectedLeague) {
      // TODO: Implementar carregamento de dados da liga selecionada
      // Por enquanto, mantém arrays vazios (estrutura preparada para integração futura)
      setTopSalariesData([]);
      setTopSalariesByPositionData([]);
      setFranchiseTagData([]);
    }
  }, [selectedLeague]);

  // Estados de carregamento
  const isLoading = leaguesLoading || teamsLoading || contractsLoading || salaryCapLoading;
  const error = leaguesError || teamsError;

  // Renderização condicional baseada no tipo de usuário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Mensagem para usuários sem dados
  if (!hasLeagues) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-4">Nenhuma liga encontrada</h2>
          <p className="text-slate-400 mb-6">
            Você ainda não possui ligas cadastradas. Importe uma liga do Sleeper para começar!
          </p>
          <button
            onClick={() => router.push('/leagues')}
            className="bg-slate-700 text-slate-100 px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
          >
            Importar Liga
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-700 text-slate-100 px-6 py-2 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Cálculos dinâmicos baseados na liga selecionada
  const totalLeagues = userManagedLeagues.length;

  // Contratos ativos: filtrar apenas contratos da liga selecionada com status ACTIVE
  const activeContracts = selectedLeague
    ? contracts.filter(
        contract =>
          contract.status === ContractStatus.ACTIVE &&
          contract.teamId &&
          teams.find(team => team.id === contract.teamId)?.leagueId === selectedLeague.id,
      ).length
    : 0;

  // Contratos vencendo: filtrar contratos da liga selecionada com yearsRemaining = 1
  const expiringContracts = selectedLeague
    ? contracts.filter(
        contract =>
          contract.status === ContractStatus.ACTIVE &&
          contract.yearsRemaining === 1 &&
          contract.teamId &&
          teams.find(team => team.id === contract.teamId)?.leagueId === selectedLeague.id,
      ).length
    : 0;

  // Verificar alertas apenas para a liga selecionada
  const hasExpiringAlert = selectedLeague && expiringContracts > 0;

  // Handlers para navegação
  const handleActiveContractsClick = () => {
    router.push('/contracts?status=active');
  };

  const handleExpiringContractsClick = () => {
    router.push('/contracts?yearsRemaining=1');
  };

  // Removido indicador de modo demo

  return (
    <div className="min-h-screen bg-background">
      {/* Conteúdo principal */}
      <div>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Removido indicador de modo demo */}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Analytics</h1>
            <p className="mt-2 text-slate-400">Análise financeira e estratégica das suas ligas</p>
          </div>

          {/* Seletor de Liga */}
          <LeagueSelector
            leagues={userManagedLeagues}
            selectedLeague={selectedLeague}
            onLeagueSelect={handleLeagueSelect}
            loading={leaguesLoading}
          />

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <SummaryCard
              title="Total de Ligas"
              value={totalLeagues.toString()}
              subtitle={
                nflState ? `Temporada ${nflState.season} - Semana ${nflState.week}` : undefined
              }
              icon={TrophyIcon}
            />
            <SummaryCard
              title="Contratos Ativos"
              value={selectedLeague ? activeContracts.toString() : '—'}
              subtitle={selectedLeague ? undefined : 'Selecione uma liga'}
              icon={DocumentTextIcon}
              onClick={
                selectedLeague && activeContracts > 0 ? handleActiveContractsClick : undefined
              }
              hasAlert={false}
            />
            <SummaryCard
              title="Contratos Vencendo"
              value={selectedLeague ? expiringContracts.toString() : '—'}
              subtitle={selectedLeague ? undefined : 'Selecione uma liga'}
              icon={ClockIcon}
              onClick={
                selectedLeague && expiringContracts > 0 ? handleExpiringContractsClick : undefined
              }
              hasAlert={hasExpiringAlert}
            />
          </div>

          {/* Grid principal com componentes analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Top 5 Maiores Salários */}
            <div className="lg:col-span-1">
              <TopSalaries
                players={topSalariesData}
                title="Top 5 Maiores Salários"
                maxPlayers={5}
              />
            </div>

            {/* Top 3 por Posição */}
            <div className="lg:col-span-1">
              <TopSalariesByPosition
                positionData={topSalariesByPositionData}
                title="Top 3 por Posição"
                maxPlayersPerPosition={3}
              />
            </div>

            {/* Valores Franchise Tag */}
            <div className="lg:col-span-2 xl:col-span-1">
              <FranchiseTagValues tagData={franchiseTagData} title="Valores Franchise Tag" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal do Dashboard com proteção de autenticação
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
