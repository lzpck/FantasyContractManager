'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
// Removido useUserTeams - dashboard deve mostrar dados agregados da liga, não do usuário
import { useContracts } from '@/hooks/useContracts';
import { useSalaryCap } from '@/hooks/useSalaryCap';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { LeagueSelector } from '@/components/dashboard/LeagueSelector';
import { TopSalaries } from '@/components/dashboard/TopSalaries';
import { TopSalariesByPosition } from '@/components/dashboard/TopSalariesByPosition';
import { FranchiseTagValues } from '@/components/dashboard/FranchiseTagValues';

import { getNFLState } from '@/services/nflStateService';
import { ContractStatus, PlayerPosition, ContractWithPlayer } from '@/types';
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
 * - Todos os membros autenticados da liga podem visualizar o dashboard
 * - Dados são calculados dinamicamente baseados na liga selecionada
 * - Estados vazios são exibidos quando nenhuma liga está selecionada
 * - Alertas são exibidos apenas para contratos vencendo da liga selecionada
 * - Redirecionamento automático para páginas específicas ao clicar nos cards (quando aplicável)
 * - Ações administrativas (editar, configurar, aplicar tags) continuam restritas ao comissário
 */
function DashboardContent() {
  const router = useRouter();
  const { state, setUser } = useAppContext();
  const { user: authUser, isAuthenticated, isCommissioner } = useAuth();
  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  // Removido useUserTeams - dashboard mostra dados agregados da liga
  const { contracts, loading: contractsLoading } = useContracts();
  const { salaryCapData, loading: salaryCapLoading } = useSalaryCap();
  const [nflState, setNflState] = useState<{ season: string; week: number } | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);

  // Dados para os novos componentes analytics (estrutura preparada para integração futura)
  const [topSalariesData, setTopSalariesData] = useState<any[]>([]);
  const [topSalariesByPositionData, setTopSalariesByPositionData] = useState<any[]>([]);
  const [franchiseTagData, setFranchiseTagData] = useState<any[]>([]);

  // Dashboard agora é acessível para todos os membros autenticados da liga
  // Ações administrativas específicas continuam restritas ao comissário nos componentes individuais

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

  // Dashboard mostra dados agregados de qualquer liga selecionada
  // Não filtra por usuário específico - todos podem ver analytics de qualquer liga
  const availableLeagues = leagues;

  // Handler para seleção de liga
  const handleLeagueSelect = useCallback((league: any) => {
    setSelectedLeague(league);
    // TODO: Carregar dados específicos da liga selecionada
    // - Top 5 maiores salários da liga
    // - Top 3 maiores salários por posição
    // - Valores de Franchise Tag por posição
  }, []);

  // Efeito para carregar dados quando liga é selecionada
  useEffect(() => {
    if (selectedLeague && contracts.length > 0) {
      // Filtrar contratos ativos da liga selecionada
      const leagueContracts = contracts.filter(
        (contract: ContractWithPlayer) =>
          contract.status === ContractStatus.ACTIVE &&
          contract.leagueId === selectedLeague.id &&
          contract.player, // Garantir que o contrato tem dados do jogador
      ) as ContractWithPlayer[];

      // Log para verificar dados agregados da liga (múltiplos times)
      const uniqueTeams = new Set(leagueContracts.map(contract => contract.teamId));
      const uniquePlayers = new Set(leagueContracts.map(contract => contract.player.id));
      console.log(`📊 Dashboard Analytics - Liga: ${selectedLeague.name}`);
      console.log(`📈 Contratos ativos: ${leagueContracts.length}`);
      console.log(`🏈 Times únicos: ${uniqueTeams.size}`, Array.from(uniqueTeams));
      console.log(`👥 Jogadores únicos: ${uniquePlayers.size}`);
      console.log(
        `🔍 IDs dos contratos:`,
        leagueContracts.map(c => ({
          id: c.id,
          teamId: c.teamId,
          playerId: c.player.id,
          playerName: c.player.name,
        })),
      );

      // Verificar se há contratos válidos
      if (leagueContracts.length === 0) {
        console.warn('Nenhum contrato ativo encontrado para a liga selecionada');
      }

      // Top 5 Maiores Salários
      const topSalaries = leagueContracts
        .sort((a, b) => b.currentSalary - a.currentSalary)
        .slice(0, 5)
        .map(contract => ({
          id: contract.player.id,
          name: contract.player.name,
          position: contract.player.position,
          fantasyPositions: contract.player.fantasyPositions,
          team: contract.team?.name || 'N/A',
          salary: contract.currentSalary,
        }));

      // Top 3 por Posição
      const positionGroups: Record<string, any[]> = {};
      leagueContracts.forEach(contract => {
        // Garantir que positions seja sempre um array
        const fantasyPositions = contract.player.fantasyPositions;
        const positions =
          Array.isArray(fantasyPositions) && fantasyPositions.length > 0
            ? fantasyPositions
            : [contract.player.position];

        positions.forEach(position => {
          if (!positionGroups[position]) {
            positionGroups[position] = [];
          }
          positionGroups[position].push({
            id: contract.player.id,
            name: contract.player.name,
            position: contract.player.position,
            fantasyPositions: contract.player.fantasyPositions,
            team: contract.team?.name || 'N/A',
            salary: contract.currentSalary || 0,
          });
        });
      });

      const topByPosition = Object.entries(positionGroups).map(([position, players]) => ({
        position,
        players: players.sort((a, b) => b.salary - a.salary).slice(0, 3),
      }));

      // Valores Franchise Tag por Posição
      const franchiseTagValues = Object.entries(positionGroups)
        .map(([position, players]) => {
          // Filtrar jogadores com salários válidos
          const validPlayers = players.filter(
            player =>
              player.salary &&
              typeof player.salary === 'number' &&
              player.salary > 0 &&
              !isNaN(player.salary),
          );

          if (validPlayers.length === 0) {
            return null; // Pular posições sem jogadores válidos
          }

          const sortedPlayers = validPlayers.sort((a, b) => b.salary - a.salary);
          const top10 = sortedPlayers.slice(0, 10);
          const averageTop10 = top10.reduce((sum, player) => sum + player.salary, 0) / top10.length;

          return {
            position,
            averageTop10: Math.round(averageTop10), // Arredondar para evitar decimais longos
          };
        })
        .filter(tag => tag !== null && tag.averageTop10 > 0); // Filtrar apenas posições válidas

      setTopSalariesData(topSalaries);
      setTopSalariesByPositionData(topByPosition);
      setFranchiseTagData(franchiseTagValues);
    } else {
      setTopSalariesData([]);
      setTopSalariesByPositionData([]);
      setFranchiseTagData([]);
    }
  }, [selectedLeague, contracts]);

  // Estados de carregamento
  const isLoading = leaguesLoading || contractsLoading || salaryCapLoading;
  const error = leaguesError;

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
  const totalLeagues = availableLeagues.length;

  // Contratos ativos: filtrar apenas contratos da liga selecionada com status ACTIVE
  const activeContracts = selectedLeague
    ? (() => {
        const filteredContracts = contracts.filter(
          (contract: ContractWithPlayer) =>
            contract.status === ContractStatus.ACTIVE && contract.leagueId === selectedLeague.id,
        );

        return filteredContracts.length;
      })()
    : 0;

  // Contratos vencendo: filtrar contratos da liga selecionada com yearsRemaining = 1
  const expiringContracts = selectedLeague
    ? (() => {
        const filteredContracts = contracts.filter(
          (contract: ContractWithPlayer) =>
            contract.status === ContractStatus.ACTIVE &&
            contract.yearsRemaining === 1 &&
            contract.leagueId === selectedLeague.id,
        );

        return filteredContracts.length;
      })()
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
            <h1 className="text-3xl font-bold text-foreground">Analytics da Liga</h1>
            <p className="mt-2 text-slate-400">
              Visão geral financeira e estatísticas agregadas da liga selecionada
            </p>
          </div>

          {/* Seletor de Liga */}
          <LeagueSelector
            leagues={availableLeagues}
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

          {/* Grid principal com altura fixa */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
            style={{ gridTemplateRows: 'repeat(auto-fit, 600px)' }}
          >
            {/* Top 5 Maiores Salários */}
            <div className="h-[600px]">
              <TopSalaries
                players={topSalariesData}
                title="Top 5 Maiores Salários"
                maxPlayers={5}
              />
            </div>

            {/* Top 3 por Posição */}
            <div className="h-[600px]">
              <TopSalariesByPosition
                positionData={topSalariesByPositionData}
                title="Top 3 por Posição"
                maxPlayersPerPosition={3}
              />
            </div>

            {/* Valores Franchise Tag */}
            <div className="lg:col-span-2 xl:col-span-1 h-[600px]">
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
