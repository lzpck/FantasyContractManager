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
import { TopSpendingTeams } from '@/components/dashboard/TopSpendingTeams';
import { TopCapSpaceTeams } from '@/components/dashboard/TopCapSpaceTeams';
import { FranchiseTagValues } from '@/components/dashboard/FranchiseTagValues';

import { getNFLState } from '@/services/nflStateService';
import { ContractStatus } from '@/types';
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
  const { user: authUser, isAuthenticated, isCommissioner } = useAuth();
  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  const { teams, loading: teamsLoading, error: teamsError } = useUserTeams();
  const { contracts, loading: contractsLoading } = useContracts();
  const { salaryCapData, loading: salaryCapLoading } = useSalaryCap();
  const [nflState, setNflState] = useState<{ season: string; week: number } | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

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

  // Definir liga selecionada automaticamente
  useEffect(() => {
    if (leagues.length > 0 && !selectedLeagueId) {
      // Filtrar apenas ligas onde o usuário é GM ou comissário
      const userLeagues = leagues.filter(league => 
        league.ownerId === authUser?.id || 
        league.commissioners?.includes(authUser?.id || '')
      );
      if (userLeagues.length > 0) {
        setSelectedLeagueId(userLeagues[0].id);
      }
    }
  }, [leagues, selectedLeagueId, authUser?.id]);

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

  // Filtrar contratos pela liga selecionada
  const selectedLeagueContracts = selectedLeagueId 
    ? contracts.filter(contract => {
        // Buscar o time do contrato e verificar se pertence à liga selecionada
        const contractTeam = teams.find(team => team.id === contract.teamId);
        return contractTeam?.leagueId === selectedLeagueId;
      })
    : [];

  // Contratos ativos: filtrar apenas contratos com status ACTIVE da liga selecionada
  const activeContracts = selectedLeagueContracts.filter(
    contract => contract.status === ContractStatus.ACTIVE,
  ).length;

  // Contratos vencendo: filtrar contratos com yearsRemaining = 1 da liga selecionada
  const expiringContracts = selectedLeagueContracts.filter(
    contract => contract.status === ContractStatus.ACTIVE && contract.yearsRemaining === 1,
  ).length;

  // Verificar alertas
  const hasExpiringAlert = expiringContracts > 0;

  // Filtrar ligas onde o usuário é GM ou comissário
  const userManagedLeagues = leagues.filter(league => 
    league.ownerId === authUser?.id || 
    league.commissioners?.includes(authUser?.id || '')
  );

  // Dados fictícios para as novas seções (serão substituídos por dados reais posteriormente)
  const mockTopSalaries = [
    { id: '1', playerName: 'Josh Allen', position: 'QB', teamName: 'Buffalo Bills', salary: 43000000, yearsRemaining: 3 },
    { id: '2', playerName: 'Christian McCaffrey', position: 'RB', teamName: 'San Francisco 49ers', salary: 38000000, yearsRemaining: 2 },
    { id: '3', playerName: 'Cooper Kupp', position: 'WR', teamName: 'Los Angeles Rams', salary: 35000000, yearsRemaining: 4 },
    { id: '4', playerName: 'Travis Kelce', position: 'TE', teamName: 'Kansas City Chiefs', salary: 32000000, yearsRemaining: 1 },
    { id: '5', playerName: 'Aaron Donald', position: 'DT', teamName: 'Los Angeles Rams', salary: 31000000, yearsRemaining: 2 },
  ];

  const mockPositionSalaries = [
    {
      position: 'QB',
      players: [
        { id: '1', playerName: 'Josh Allen', teamName: 'Buffalo Bills', salary: 43000000, yearsRemaining: 3 },
        { id: '2', playerName: 'Patrick Mahomes', teamName: 'Kansas City Chiefs', salary: 41000000, yearsRemaining: 4 },
        { id: '3', playerName: 'Lamar Jackson', teamName: 'Baltimore Ravens', salary: 40000000, yearsRemaining: 2 },
      ]
    },
    {
      position: 'RB',
      players: [
        { id: '4', playerName: 'Christian McCaffrey', teamName: 'San Francisco 49ers', salary: 38000000, yearsRemaining: 2 },
        { id: '5', playerName: 'Derrick Henry', teamName: 'Tennessee Titans', salary: 25000000, yearsRemaining: 1 },
        { id: '6', playerName: 'Dalvin Cook', teamName: 'Minnesota Vikings', salary: 24000000, yearsRemaining: 3 },
      ]
    },
    {
      position: 'WR',
      players: [
        { id: '7', playerName: 'Cooper Kupp', teamName: 'Los Angeles Rams', salary: 35000000, yearsRemaining: 4 },
        { id: '8', playerName: 'Davante Adams', teamName: 'Las Vegas Raiders', salary: 34000000, yearsRemaining: 2 },
        { id: '9', playerName: 'Tyreek Hill', teamName: 'Miami Dolphins', salary: 33000000, yearsRemaining: 3 },
      ]
    },
  ];

  const mockTopSpendingTeams = [
    { id: '1', teamName: 'Team Alpha', ownerName: 'João Silva', totalSalary: 250000000, activeContracts: 15, salaryCap: 279000000, usedPercentage: 89.6 },
    { id: '2', teamName: 'Team Beta', ownerName: 'Maria Santos', totalSalary: 240000000, activeContracts: 14, salaryCap: 279000000, usedPercentage: 86.0 },
    { id: '3', teamName: 'Team Gamma', ownerName: 'Pedro Costa', totalSalary: 235000000, activeContracts: 16, salaryCap: 279000000, usedPercentage: 84.2 },
    { id: '4', teamName: 'Team Delta', ownerName: 'Ana Oliveira', totalSalary: 230000000, activeContracts: 13, salaryCap: 279000000, usedPercentage: 82.4 },
    { id: '5', teamName: 'Team Epsilon', ownerName: 'Carlos Lima', totalSalary: 225000000, activeContracts: 12, salaryCap: 279000000, usedPercentage: 80.6 },
  ];

  const mockTopCapSpaceTeams = [
    { id: '1', teamName: 'Team Zeta', ownerName: 'Lucas Ferreira', availableCapSpace: 80000000, salaryCap: 279000000, usedPercentage: 71.3, totalSalary: 199000000 },
    { id: '2', teamName: 'Team Eta', ownerName: 'Fernanda Rocha', availableCapSpace: 75000000, salaryCap: 279000000, usedPercentage: 73.1, totalSalary: 204000000 },
    { id: '3', teamName: 'Team Theta', ownerName: 'Roberto Alves', availableCapSpace: 70000000, salaryCap: 279000000, usedPercentage: 74.9, totalSalary: 209000000 },
    { id: '4', teamName: 'Team Iota', ownerName: 'Juliana Mendes', availableCapSpace: 65000000, salaryCap: 279000000, usedPercentage: 76.7, totalSalary: 214000000 },
    { id: '5', teamName: 'Team Kappa', ownerName: 'Ricardo Souza', availableCapSpace: 60000000, salaryCap: 279000000, usedPercentage: 78.5, totalSalary: 219000000 },
  ];

  const mockFranchiseTagValues = [
    { position: 'QB', tagValue: 45000000, averageTop10: 45000000, calculationMethod: 'average' as const, playerCount: 12 },
    { position: 'RB', tagValue: 28000000, averageTop10: 28000000, calculationMethod: 'average' as const, playerCount: 15 },
    { position: 'WR', tagValue: 32000000, averageTop10: 32000000, calculationMethod: 'average' as const, playerCount: 18 },
    { position: 'TE', tagValue: 22000000, averageTop10: 22000000, calculationMethod: 'average' as const, playerCount: 10 },
    { position: 'K', tagValue: 5000000, averageTop10: 5000000, calculationMethod: 'average' as const, playerCount: 8 },
    { position: 'DEF', tagValue: 18000000, averageTop10: 18000000, calculationMethod: 'average' as const, playerCount: 12 },
  ];

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
              value={selectedLeagueId ? activeContracts.toString() : '-'}
              subtitle={selectedLeagueId ? undefined : 'Selecione uma liga'}
              icon={DocumentTextIcon}
              onClick={selectedLeagueId ? handleActiveContractsClick : undefined}
              hasAlert={false}
            />
            <SummaryCard
              title="Contratos Vencendo"
              value={selectedLeagueId ? expiringContracts.toString() : '-'}
              subtitle={selectedLeagueId ? undefined : 'Selecione uma liga'}
              icon={ClockIcon}
              onClick={selectedLeagueId ? handleExpiringContractsClick : undefined}
              hasAlert={hasExpiringAlert && selectedLeagueId}
            />
          </div>

          {/* Seletor de Liga */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Análise Financeira da Liga</h2>
              <LeagueSelector 
                leagues={userManagedLeagues}
                selectedLeagueId={selectedLeagueId}
                onLeagueChange={setSelectedLeagueId}
                loading={isLoading}
              />
            </div>
          </div>

          {/* Grid principal com as novas seções analíticas */}
          <div className="space-y-6">
            {/* Primeira linha: Top 5 Salários e Maiores Salários por Posição */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopSalaries 
                topSalaries={mockTopSalaries}
                loading={isLoading}
              />
              <TopSalariesByPosition 
                positionSalaries={mockPositionSalaries}
                loading={isLoading}
              />
            </div>

            {/* Segunda linha: Times com Mais Salário e Times com Mais Cap Space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopSpendingTeams 
                topSpendingTeams={mockTopSpendingTeams}
                loading={isLoading}
              />
              <TopCapSpaceTeams 
                topCapSpaceTeams={mockTopCapSpaceTeams}
                loading={isLoading}
              />
            </div>

            {/* Terceira linha: Valores de Franchise Tag */}
            <div className="grid grid-cols-1 gap-6">
              <FranchiseTagValues 
                franchiseTagValues={mockFranchiseTagValues}
                loading={isLoading}
              />
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
