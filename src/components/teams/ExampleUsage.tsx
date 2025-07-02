'use client';

/**
 * EXEMPLO PRÁTICO DE USO DO SISTEMA DE CONTRATOS
 *
 * Este arquivo demonstra como integrar e usar todos os componentes
 * do sistema de gerenciamento de contratos em uma aplicação real.
 */

import { useState, useEffect } from 'react';
import { PlayerWithContract, Team, League, Player, Contract, ContractStatus } from '@/types';
import { PlayerContractsManager } from './PlayerContractsManager';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatUtils';

// Dados mockados para demonstração
const mockLeague: League = {
  id: 'league_1',
  name: 'Fantasy Premier League',
  season: 2024,
  salaryCap: 200000000, // $200M
  totalTeams: 12,
  status: 'active' as any,
  commissionerId: 'user_1',
  maxFranchiseTags: 1,
  annualIncreasePercentage: 15,
  minimumSalary: 1000000,
  seasonTurnoverDate: '2024-04-01',
  settings: {} as any,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTeam: Team = {
  id: 'team_1',
  name: 'Los Angeles Rams',
  abbreviation: 'LAR',
  leagueId: 'league_1',
  ownerId: 'user_1',
  availableCap: 15000000,
  currentDeadMoney: 5000000,
  nextSeasonDeadMoney: 0,
  franchiseTagsUsed: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPlayers: PlayerWithContract[] = [
  {
    player: {
      id: 'player_1',
      sleeperPlayerId: 'sleeper_1',
      name: 'Matthew Stafford',
      position: 'QB' as any,
      fantasyPositions: ['QB'] as any,
      nflTeam: 'LAR',
      jerseyNumber: 9,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    contract: {
      id: 'contract_1',
      playerId: 'player_1',
      teamId: 'team_1',
      leagueId: 'league_1',
      currentSalary: 40000000,
      originalSalary: 40000000,
      yearsRemaining: 2,
      originalYears: 4,
      status: ContractStatus.ACTIVE,
      acquisitionType: 'AUCTION' as any,
      signedSeason: 2022,
      hasBeenTagged: false,
      hasBeenExtended: false,
      hasFourthYearOption: false,
      fourthYearOptionActivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    player: {
      id: 'player_2',
      sleeperPlayerId: 'sleeper_2',
      name: 'Cooper Kupp',
      position: 'WR' as any,
      fantasyPositions: ['WR'] as any,
      nflTeam: 'LAR',
      jerseyNumber: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    contract: {
      id: 'contract_2',
      playerId: 'player_2',
      teamId: 'team_1',
      leagueId: 'league_1',
      currentSalary: 26000000,
      originalSalary: 26000000,
      yearsRemaining: 1,
      originalYears: 3,
      status: ContractStatus.ACTIVE,
      acquisitionType: 'AUCTION' as any,
      signedSeason: 2022,
      hasBeenTagged: false,
      hasBeenExtended: false,
      hasFourthYearOption: false,
      fourthYearOptionActivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    player: {
      id: 'player_3',
      sleeperPlayerId: 'sleeper_3',
      name: 'Aaron Donald',
      position: 'DT' as any,
      fantasyPositions: ['DL'] as any,
      nflTeam: 'LAR',
      jerseyNumber: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    contract: {
      id: 'contract_3',
      playerId: 'player_3',
      teamId: 'team_1',
      leagueId: 'league_1',
      currentSalary: 31000000,
      originalSalary: 31000000,
      yearsRemaining: 1,
      originalYears: 3,
      status: ContractStatus.ACTIVE,
      acquisitionType: 'AUCTION' as any,
      signedSeason: 2022,
      hasBeenTagged: false,
      hasBeenExtended: true,
      hasFourthYearOption: false,
      fourthYearOptionActivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    player: {
      id: 'player_4',
      sleeperPlayerId: 'sleeper_4',
      name: 'Cam Akers',
      position: 'RB' as any,
      fantasyPositions: ['RB'] as any,
      nflTeam: 'LAR',
      jerseyNumber: 23,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    contract: {
      id: 'contract_4',
      playerId: 'player_4',
      teamId: 'team_1',
      leagueId: 'league_1',
      currentSalary: 1300000,
      originalSalary: 1300000,
      yearsRemaining: 0,
      originalYears: 4,
      status: ContractStatus.ACTIVE,
      acquisitionType: 'ROOKIE_DRAFT' as any,
      signedSeason: 2020,
      hasBeenTagged: false,
      hasBeenExtended: false,
      hasFourthYearOption: true,
      fourthYearOptionActivated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    player: {
      id: 'player_5',
      sleeperPlayerId: 'sleeper_5',
      name: 'Van Jefferson',
      position: 'WR' as any,
      fantasyPositions: ['WR'] as any,
      nflTeam: 'LAR',
      jerseyNumber: 12,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    contract: null, // Jogador sem contrato - agente livre
  },
];

/**
 * Componente de exemplo mostrando uso completo do sistema
 */
export function ContractSystemExample() {
  const [players, setPlayers] = useState<PlayerWithContract[]>(mockPlayers);
  const [team, setTeam] = useState<Team>(mockTeam);
  const [league, setLeague] = useState<League>(mockLeague);
  const [notifications, setNotifications] = useState<string[]>([]);

  const { user } = useAuth();
  const isCommissioner = user?.role === 'COMMISSIONER';

  // Simular carregamento de dados
  const refreshContracts = async () => {
    console.log('Atualizando dados de contratos...');

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Em uma aplicação real, você faria:
    // const response = await fetch(`/api/teams/${team.id}/contracts`);
    // const updatedData = await response.json();
    // setPlayers(updatedData.players);
    // setTeam(updatedData.team);

    addNotification('Dados de contratos atualizados!');
  };

  // Adicionar notificação
  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  // Escutar eventos de contrato
  useEffect(() => {
    const handleContractEvent = (event: CustomEvent) => {
      const { type, detail } = event;

      switch (type) {
        case 'contractCreated':
          addNotification(`Contrato criado para ${detail.player.name}`);
          break;
        case 'contractUpdated':
          addNotification(`Contrato atualizado`);
          break;
        case 'contractExtended':
          addNotification(`Contrato estendido por ${detail.extensionYears} anos`);
          break;
        case 'franchiseTagApplied':
          addNotification(`Franchise tag aplicada para ${detail.player.name}`);
          break;
        case 'playerCut':
          addNotification(
            `${detail.player.name} foi cortado - Dead money: ${formatCurrency(detail.deadMoney)}`,
          );
          break;
      }

      // Atualizar dados após qualquer evento
      refreshContracts();
    };

    // Registrar listeners para todos os eventos
    const events = [
      'contractCreated',
      'contractUpdated',
      'contractExtended',
      'franchiseTagApplied',
      'playerCut',
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleContractEvent as EventListener);
    });

    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleContractEvent as EventListener);
      });
    };
  }, []);

  // Calcular estatísticas
  // Filtrar apenas contratos ativos (não cortados)
  const activeContracts = players.filter(p => p.contract && p.contract.status !== ContractStatus.CUT);
  const totalContracts = activeContracts.length;
  const totalSalaries = activeContracts.reduce(
    (sum, p) => sum + (p.contract?.currentSalary || 0),
    0,
  );
  const expiring = activeContracts.filter(p => p.contract?.yearsRemaining === 0).length;
  const freeAgents = players.filter(p => !p.contract || p.contract.status === ContractStatus.CUT).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-100">
            Sistema de Contratos - Exemplo Prático
          </h1>
          <p className="text-slate-400 mt-2">
            Demonstração completa do sistema de gerenciamento de contratos
          </p>
        </div>
      </div>

      {/* Notificações */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">{totalContracts}</div>
            <div className="text-sm text-slate-400">Contratos Ativos</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(totalSalaries)}</div>
            <div className="text-sm text-slate-400">Total em Salários</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400">{expiring}</div>
            <div className="text-sm text-slate-400">Contratos Expirando</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-red-400">{freeAgents}</div>
            <div className="text-sm text-slate-400">Agentes Livres</div>
          </div>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
          <h3 className="text-lg font-semibold mb-2">Informações do Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Usuário:</span>
              <span className="ml-2 text-slate-100">{user?.name || 'Usuário Teste'}</span>
            </div>
            <div>
              <span className="text-slate-400">Papel:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  isCommissioner ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                {isCommissioner ? 'Comissário' : 'Membro'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Permissões:</span>
              <span className="ml-2 text-slate-100">
                {isCommissioner ? 'Todas as ações' : 'Apenas visualização'}
              </span>
            </div>
          </div>
        </div>

        {/* Sistema Principal */}
        <PlayerContractsManager
          players={players}
          team={team}
          league={league}
          onContractsUpdate={refreshContracts}
          title="Gerenciamento de Contratos"
          showCapStats={true}
        />

        {/* Instruções de Uso */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Como Usar Este Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Para Comissários:</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Clique em &quot;Ações&quot; para gerenciar contratos</li>
                <li>• Use &quot;Editar Contrato&quot; para modificar termos</li>
                <li>• Aplique extensões para jogadores elegíveis</li>
                <li>• Use franchise tag para reter jogadores</li>
                <li>• Corte jogadores quando necessário</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Para Todos os Usuários:</h4>
              <ul className="space-y-1 text-slate-300">
                <li>• Visualize todos os contratos e estatísticas</li>
                <li>• Use filtros para encontrar jogadores específicos</li>
                <li>• Ordene por diferentes critérios</li>
                <li>• Monitore o uso do salary cap</li>
                <li>• Acompanhe contratos expirando</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dados de Exemplo */}
        <div className="mt-6 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Dados de Exemplo</h3>
          <div className="text-sm text-slate-300 space-y-2">
            <p>
              • <strong>Matthew Stafford:</strong> Contrato de $160M por 4 anos (2 anos restantes)
            </p>
            <p>
              • <strong>Cooper Kupp:</strong> Contrato de $80M por 3 anos (1 ano restante - elegível
              para extensão)
            </p>
            <p>
              • <strong>Aaron Donald:</strong> Contrato de $95M por 3 anos (1 ano restante)
            </p>
            <p>
              • <strong>Cam Akers:</strong> Contrato rookie expirando (elegível para franchise tag)
            </p>
            <p>
              • <strong>Van Jefferson:</strong> Agente livre (sem contrato)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EXEMPLO DE INTEGRAÇÃO EM UMA PÁGINA
 *
 * ```tsx
 * // pages/example.tsx
 * import { ContractSystemExample } from '@/components/teams/ExampleUsage';
 *
 * export default function ExamplePage() {
 *   return <ContractSystemExample />;
 * }
 * ```
 */

export default ContractSystemExample;
