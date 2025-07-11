'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useTeams } from '@/hooks/useTeams';
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
  UserGroupIcon,
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
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [nflState, setNflState] = useState<{ season: string; week: number } | null>(null);

  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams(selectedLeagueId);
  const { contracts, loading: contractsLoading } = useContracts();
  const { salaryCapData, loading: salaryCapLoading } = useSalaryCap();

  // Definir liga selecionada baseada no ID
  const selectedLeague = selectedLeagueId
    ? leagues.find(league => league.id === selectedLeagueId)
    : null;

  // Estados de carregamento
  const isLoading = leaguesLoading || teamsLoading || contractsLoading || salaryCapLoading;
  const error = leaguesError || teamsError;

  // Cálculos dinâmicos baseados em dados reais da liga
  const totalLeagues = leagues.length;

  // Filtrar contratos pela liga selecionada (todos os times da liga)
  const selectedLeagueContracts = selectedLeagueId
    ? contracts.filter(contract => {
        // Usar leagueId diretamente para pegar todos os contratos da liga
        return contract.leagueId === selectedLeagueId;
      })
    : [];

  // Contratos ativos: todos os contratos ACTIVE da liga selecionada
  const activeContracts = selectedLeagueContracts.filter(
    contract => contract.status === ContractStatus.ACTIVE,
  ).length;

  // Contratos vencendo: todos os contratos ACTIVE com 1 ano restante da liga selecionada
  const expiringContracts = selectedLeagueContracts.filter(
    contract => contract.status === ContractStatus.ACTIVE && contract.yearsRemaining === 1,
  ).length;

  // Total de times na liga selecionada
  const totalTeamsInLeague = selectedLeagueId
    ? teams.filter(team => team.leagueId === selectedLeagueId).length
    : 0;

  // Verificar alertas
  const hasExpiringAlert = expiringContracts > 0;

  // Filtrar ligas onde o usuário é GM ou comissário
  const userManagedLeagues = leagues.filter(league => {
    // Verificar se é comissário da liga
    const isCommissioner = league.commissionerId === authUser?.id;

    // Para agora, mostrar todas as ligas (pode ser refinado depois)
    return isCommissioner || true;
  });

  // Top 5 maiores salários da liga selecionada
  const topSalaries = selectedLeagueId
    ? selectedLeagueContracts
        .filter(contract => contract.status === ContractStatus.ACTIVE)
        .sort((a, b) => b.currentSalary - a.currentSalary)
        .slice(0, 5)
        .map(contract => {
          // Processar fantasyPositions (array de posições)
          let positions = 'N/A';
          if (contract.player?.fantasyPositions && contract.player.fantasyPositions.length > 0) {
            positions = contract.player.fantasyPositions.join(', ');
          }

          return {
            id: contract.id,
            playerName: contract.player?.name || 'Jogador Desconhecido',
            position: positions || contract.player?.position || 'N/A',
            teamName: contract.team?.name || 'Time Desconhecido',
            salary: contract.currentSalary,
            yearsRemaining: contract.yearsRemaining,
          };
        })
    : [];

  // Calcular maiores salários por posição da liga selecionada
  const positionSalaries = selectedLeagueId
    ? (() => {
        // Filtrar contratos ativos da liga selecionada
        const activeContracts = selectedLeagueContracts.filter(
          contract => contract.status === ContractStatus.ACTIVE,
        );

        // Agrupar por posição
        const positionGroups: Record<string, any[]> = {};

        activeContracts.forEach(contract => {
          if (!contract.player) return;

          // Processar fantasyPositions para agrupamento
          let positions: string[] = [];
          if (contract.player.fantasyPositions && contract.player.fantasyPositions.length > 0) {
            positions = contract.player.fantasyPositions;
          } else if (contract.player.position) {
            positions = [contract.player.position];
          }

          // Se não tiver posições válidas, usar 'FLEX'
          if (positions.length === 0) {
            positions = ['FLEX'];
          }

          // Adicionar o jogador a cada posição que ele pode jogar
          positions.forEach(position => {
            if (!positionGroups[position]) {
              positionGroups[position] = [];
            }

            positionGroups[position].push({
              id: contract.id,
              playerName: contract.player?.name || 'Jogador Desconhecido',
              teamName: contract.team?.name || 'Time Desconhecido',
              salary: contract.currentSalary,
              yearsRemaining: contract.yearsRemaining,
            });
          });
        });

        // Ordenar cada grupo por salário e pegar os top 3
        return Object.entries(positionGroups)
          .map(([position, players]) => ({
            position,
            players: players.sort((a, b) => b.salary - a.salary).slice(0, 3),
          }))
          .filter(group => group.players.length > 0)
          .sort((a, b) => {
            // Ordenar posições por prioridade (QB, RB, WR, TE, K, DEF, outras)
            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
            const aIndex = positionOrder.indexOf(a.position);
            const bIndex = positionOrder.indexOf(b.position);

            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            } else if (aIndex !== -1) {
              return -1;
            } else if (bIndex !== -1) {
              return 1;
            } else {
              return a.position.localeCompare(b.position);
            }
          });
      })()
    : [];

  // Calcular dados reais dos times com mais salário alocado
  const topSpendingTeams = useMemo(() => {
    if (!selectedLeague) return [];

    // Filtrar contratos ativos da liga selecionada
    const activeContracts = contracts.filter(
      contract =>
        contract.leagueId === selectedLeague.id && contract.status === ContractStatus.ACTIVE,
    );

    // Agrupar contratos por time
    const teamSalaries = new Map<
      string,
      {
        team: any;
        totalSalary: number;
        activeContracts: number;
      }
    >();

    activeContracts.forEach(contract => {
      const teamId = contract.teamId;
      const team = teams.find(t => t.id === teamId);

      if (team) {
        const current = teamSalaries.get(teamId) || {
          team,
          totalSalary: 0,
          activeContracts: 0,
        };

        current.totalSalary += contract.currentSalary || 0;
        current.activeContracts += 1;
        teamSalaries.set(teamId, current);
      }
    });

    // Converter para array e ordenar por salário total (maior para menor)
    const sortedTeams = Array.from(teamSalaries.values())
      .map(({ team, totalSalary, activeContracts }) => {
        const salaryCap = selectedLeague.salaryCap || 279000000; // Default NFL salary cap
        const usedPercentage = (totalSalary / salaryCap) * 100;

        return {
          id: team.id,
          teamName: team.name,
          ownerName: team.ownerDisplayName || 'Manager não definido',
          totalSalary,
          activeContracts,
          salaryCap,
          usedPercentage,
        };
      })
      .sort((a, b) => b.totalSalary - a.totalSalary)
      .slice(0, 5); // Top 5

    return sortedTeams;
  }, [selectedLeague, contracts, teams]);

  // Calcular dados reais dos times com mais cap space disponível
  const topCapSpaceTeams = useMemo(() => {
    if (!selectedLeague) return [];

    // Filtrar contratos ativos da liga selecionada
    const activeContracts = contracts.filter(
      contract =>
        contract.leagueId === selectedLeague.id && contract.status === ContractStatus.ACTIVE,
    );

    // Agrupar contratos por time
    const teamSalaries = new Map<
      string,
      {
        team: any;
        totalSalary: number;
        activeContracts: number;
      }
    >();

    activeContracts.forEach(contract => {
      const teamId = contract.teamId;
      const team = teams.find(t => t.id === teamId);

      if (team) {
        const current = teamSalaries.get(teamId) || {
          team,
          totalSalary: 0,
          activeContracts: 0,
        };

        current.totalSalary += contract.currentSalary || 0;
        current.activeContracts += 1;
        teamSalaries.set(teamId, current);
      }
    });

    // Incluir times sem contratos
    const leagueTeams = teams.filter(team => team.leagueId === selectedLeague.id);

    leagueTeams.forEach(team => {
      if (!teamSalaries.has(team.id)) {
        teamSalaries.set(team.id, {
          team,
          totalSalary: 0,
          activeContracts: 0,
        });
      }
    });

    // Converter para array e ordenar por cap space disponível (maior para menor)
    const sortedTeams = Array.from(teamSalaries.values())
      .map(({ team, totalSalary, activeContracts }) => {
        const salaryCap = selectedLeague.salaryCap || 279000000; // Default NFL salary cap
        const availableCapSpace = salaryCap - totalSalary;
        const usedPercentage = (totalSalary / salaryCap) * 100;

        return {
          id: team.id,
          teamName: team.name,
          ownerName: team.ownerDisplayName || 'Manager não definido',
          totalSalary,
          activeContracts,
          salaryCap,
          availableCapSpace,
          usedPercentage,
        };
      })
      .sort((a, b) => b.availableCapSpace - a.availableCapSpace)
      .slice(0, 5); // Top 5

    return sortedTeams;
  }, [selectedLeague, contracts, teams]);

  // Verificar se o usuário é comissário
  // Removido: verificação de acesso restrito a comissionários
  // Dashboard agora está disponível para todos os usuários autenticados

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
    if (leagues.length > 0 && !selectedLeagueId && authUser?.id) {
      // Filtrar apenas ligas onde o usuário é comissário (por enquanto)
      const userLeagues = leagues.filter(league => {
        // Verificar se é comissário da liga
        const isCommissioner = league.commissionerId === authUser.id;

        // Para agora, mostrar todas as ligas (pode ser refinado depois)
        return isCommissioner || true;
      });

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

  // Calcular valores reais de Franchise Tag baseado nos contratos da liga selecionada
  const franchiseTagValues = useMemo(() => {
    if (!selectedLeague) return [];

    // Filtrar contratos ativos da liga selecionada
    const activeContracts = contracts.filter(
      contract =>
        contract.leagueId === selectedLeague.id &&
        contract.status === ContractStatus.ACTIVE &&
        contract.player?.fantasyPositions,
    );

    // Agrupar contratos por posição
    const contractsByPosition = new Map<string, number[]>();

    activeContracts.forEach(contract => {
      if (!contract.player?.fantasyPositions) return;

      // Processar posições (array de PlayerPosition)
      let positions: string[] = [];
      if (contract.player.fantasyPositions && contract.player.fantasyPositions.length > 0) {
        positions = contract.player.fantasyPositions;
      }

      // Adicionar salário para cada posição do jogador
      positions.forEach(position => {
        if (!contractsByPosition.has(position)) {
          contractsByPosition.set(position, []);
        }
        contractsByPosition.get(position)!.push(contract.currentSalary || 0);
      });
    });

    // Calcular valores de franchise tag para cada posição
    const tagValues = [];

    // Ordem específica das posições
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

    // Obter todas as posições que existem nos contratos + posições principais
    const mainPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];
    const allPositions = new Set([...mainPositions, ...contractsByPosition.keys()]);

    // Ordenar posições pela ordem específica
    const sortedPositions = Array.from(allPositions).sort((a, b) => {
      const indexA = positionOrder.indexOf(a);
      const indexB = positionOrder.indexOf(b);

      // Se ambas estão na ordem específica, usar a ordem
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // Se apenas uma está na ordem específica, ela vem primeiro
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Se nenhuma está na ordem específica, ordenar alfabeticamente
      return a.localeCompare(b);
    });

    for (const position of sortedPositions) {
      const salaries = contractsByPosition.get(position) || [];

      if (salaries.length === 0) {
        // Se não há jogadores na posição, usar valor mínimo
        tagValues.push({
          position,
          tagValue: 1000000, // $1M mínimo
          averageTop10: 1000000,
          calculationMethod: 'average' as const,
          playerCount: 0,
        });
        continue;
      }

      // Ordenar salários do maior para o menor
      const sortedSalaries = salaries.sort((a, b) => b - a);

      // Pegar os top 10 (ou todos se houver menos de 10)
      const top10Salaries = sortedSalaries.slice(0, Math.min(10, sortedSalaries.length));

      // Calcular média dos top 10
      const averageTop10 =
        top10Salaries.reduce((sum, salary) => sum + salary, 0) / top10Salaries.length;

      // Valor da franchise tag é a média dos top 10
      // (A regra de salário + 15% seria aplicada individualmente para cada jogador)
      const tagValue = Math.round(averageTop10);

      tagValues.push({
        position,
        tagValue,
        averageTop10: Math.round(averageTop10),
        calculationMethod: 'average' as const,
        playerCount: salaries.length,
      });
    }

    return tagValues;
  }, [selectedLeague, contracts]);

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
              subtitle={selectedLeagueId ? 'Total na liga' : 'Selecione uma liga'}
              icon={DocumentTextIcon}
              onClick={selectedLeagueId ? handleActiveContractsClick : undefined}
              hasAlert={false}
            />
            <SummaryCard
              title="Contratos Vencendo"
              value={selectedLeagueId ? expiringContracts.toString() : '-'}
              subtitle={selectedLeagueId ? 'Total na liga' : 'Selecione uma liga'}
              icon={ClockIcon}
              onClick={selectedLeagueId ? handleExpiringContractsClick : undefined}
              hasAlert={hasExpiringAlert && !!selectedLeagueId}
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
              <TopSalaries topSalaries={topSalaries} loading={isLoading} />
              <TopSalariesByPosition positionSalaries={positionSalaries} loading={isLoading} />
            </div>

            {/* Segunda linha: Times com Mais Salário e Times com Mais Cap Space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopSpendingTeams topSpendingTeams={topSpendingTeams} loading={isLoading} />
              <TopCapSpaceTeams topCapSpaceTeams={topCapSpaceTeams} loading={isLoading} />
            </div>

            {/* Terceira linha: Valores de Franchise Tag */}
            <div className="grid grid-cols-1 gap-6">
              <FranchiseTagValues franchiseTagValues={franchiseTagValues} loading={isLoading} />
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
