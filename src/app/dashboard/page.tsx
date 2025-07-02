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
import { SalaryCapChart } from '@/components/dashboard/SalaryCapChart';
import { LeaguesList } from '@/components/dashboard/LeaguesList';

import { getNFLState } from '@/services/nflStateService';
import {
  TrophyIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * Conteúdo principal do Dashboard
 *
 * Exibe uma visão geral das ligas, contratos, salary cap e próximos vencimentos.
 * Para usuário demo, utiliza dados fictícios. Para outros usuários, carrega dados reais.
 */
function DashboardContent() {
  const router = useRouter();
  const { state, setUser } = useAppContext();
  const { user: authUser, isAuthenticated } = useAuth();
  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  const { teams, loading: teamsLoading, error: teamsError } = useUserTeams();
  const { contracts, loading: contractsLoading } = useContracts();
  const { teamSalaryCapData, loading: salaryCapLoading } = useSalaryCap();
  const [nflState, setNflState] = useState<{ season: string; week: number } | null>(null);

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
        isCommissioner: authUser.role === 'COMMISSIONER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [isAuthenticated, authUser, state.user, setUser]);

  // Buscar estado atual da NFL
  useEffect(() => {
    const fetchNFLState = async () => {
      try {
        const state = await getNFLState();
        setNflState({
          season: state.season,
          week: state.week,
        });
      } catch (error) {
        console.error('Erro ao buscar estado da NFL:', error);
      }
    };

    fetchNFLState();
  }, []);

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

  // Cálculos dinâmicos baseados em dados reais
  const totalLeagues = leagues.length;

  // Contratos ativos: filtrar apenas contratos com status ACTIVE
  const activeContracts = contracts.filter(contract => contract.status === 'ACTIVE').length;

  // Contratos vencendo: filtrar contratos com yearsRemaining = 1
  const expiringContracts = contracts.filter(
    contract => contract.status === 'ACTIVE' && contract.yearsRemaining === 1,
  ).length;

  // Cap médio utilizado: calcular média de utilização do cap dos times do usuário
  const userTeams = teams.filter(team => team.ownerId === authUser?.id);
  const averageCapUsed =
    userTeams.length > 0 && teamSalaryCapData
      ? userTeams.reduce((acc, team) => {
          const teamCapData = teamSalaryCapData.find(data => data.teamId === team.id);
          return acc + (teamCapData?.usedPercentage || 0);
        }, 0) / userTeams.length
      : 0;

  // Calcular valor médio em milhões
  const averageCapUsedInMillions =
    userTeams.length > 0 && teamSalaryCapData
      ? userTeams.reduce((acc, team) => {
          const teamCapData = teamSalaryCapData.find(data => data.teamId === team.id);
          const league = leagues.find(l => l.id === team.leagueId);
          const salaryCap = league?.salaryCap || 279000000; // Default $279M
          const usedAmount = ((teamCapData?.usedPercentage || 0) * salaryCap) / 100;
          return acc + usedAmount;
        }, 0) /
        userTeams.length /
        1000000 // Converter para milhões
      : 0;

  // Verificar alertas
  const hasCapAlert =
    teamSalaryCapData &&
    userTeams.some(team => {
      const teamCapData = teamSalaryCapData.find(data => data.teamId === team.id);
      return (teamCapData?.usedPercentage || 0) > 90;
    });

  const hasExpiringAlert = expiringContracts > 0;

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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Bem-vindo de volta, {authUser?.name || 'Usuário'}!
            </p>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
              value={activeContracts.toString()}
              icon={DocumentTextIcon}
              onClick={handleActiveContractsClick}
              hasAlert={false}
            />
            <SummaryCard
              title="Cap Médio Utilizado"
              value={`$${averageCapUsedInMillions.toFixed(1)}M`}
              icon={CurrencyDollarIcon}
              progressPercentage={averageCapUsed}
              subtitle={`${averageCapUsed.toFixed(1)}% do cap total`}
              hasAlert={hasCapAlert}
            />
            <SummaryCard
              title="Contratos Vencendo"
              value={expiringContracts.toString()}
              icon={ClockIcon}
              onClick={handleExpiringContractsClick}
              hasAlert={hasExpiringAlert}
            />
          </div>

          {/* Grid principal com gráfico e lista de ligas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Gráfico de distribuição do salary cap */}
            <div className="xl:col-span-2 order-2 xl:order-1">
              <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Distribuição do Salary Cap por Time
                  </h2>
                  <div className="text-xs text-slate-400 hidden sm:block">
                    Clique nas barras para mais detalhes
                  </div>
                </div>
                <div className="min-h-[300px] sm:min-h-[400px]">
                  <SalaryCapChart leagues={leagues} />
                </div>
              </div>
            </div>

            {/* Lista de ligas */}
            <div className="xl:col-span-1 order-1 xl:order-2">
              <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Suas Ligas</h2>
                  <div className="text-xs text-slate-400">
                    {leagues.length} {leagues.length === 1 ? 'liga' : 'ligas'}
                  </div>
                </div>
                <div className="overflow-hidden">
                  <LeaguesList leagues={leagues} />
                </div>
              </div>
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
