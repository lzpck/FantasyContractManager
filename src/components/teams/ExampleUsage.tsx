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
  maxRosterSize: 53,
  minRosterSize: 40,
  franchiseTagValue: {
    QB: 45000000,
    RB: 12000000,
    WR: 18000000,
    TE: 11000000,
    K: 5000000,
    DEF: 15000000
  }
};

const mockTeam: Team = {
  id: 'team_1',
  name: 'Los Angeles Rams',
  abbreviation: 'LAR',
  leagueId: 'league_1',
  ownerId: 'user_1',
  currentSalaryCap: 180000000,
  currentDeadMoney: 5000000,
  availableCap: 15000000,
  rosterSize: 45
};

const mockPlayers: PlayerWithContract[] = [
  {
    player: {
      id: 'player_1',
      name: 'Matthew Stafford',
      position: 'QB',
      nflTeam: 'LAR',
      age: 35,
      experience: 14
    },
    contract: {
      id: 'contract_1',
      playerId: 'player_1',
      teamId: 'team_1',
      leagueId: 'league_1',
      totalValue: 160000000,
      years: 4,
      guaranteedMoney: 130000000,
      currentSalary: 40000000,
      averageAnnualValue: 40000000,
      bonuses: 5000000,
      incentives: 2000000,
      status: ContractStatus.ACTIVE,
      signedDate: new Date('2022-03-15'),
      startYear: 2022,
      endYear: 2025,
      yearsRemaining: 2,
      paidGuaranteed: 80000000,
      capHit: 45000000,
      deadMoney: 50000000,
      isRookieContract: false,
      canExtend: true,
      canTag: false,
      notes: 'Contrato de extensão assinado em 2022'
    }
  },
  {
    player: {
      id: 'player_2',
      name: 'Cooper Kupp',
      position: 'WR',
      nflTeam: 'LAR',
      age: 30,
      experience: 7
    },
    contract: {
      id: 'contract_2',
      playerId: 'player_2',
      teamId: 'team_1',
      leagueId: 'league_1',
      totalValue: 80000000,
      years: 3,
      guaranteedMoney: 75000000,
      currentSalary: 26000000,
      averageAnnualValue: 26666667,
      bonuses: 3000000,
      incentives: 1000000,
      status: ContractStatus.ACTIVE,
      signedDate: new Date('2022-09-07'),
      startYear: 2022,
      endYear: 2024,
      yearsRemaining: 1,
      paidGuaranteed: 50000000,
      capHit: 29000000,
      deadMoney: 25000000,
      isRookieContract: false,
      canExtend: true,
      canTag: true,
      notes: 'Contrato após temporada MVP'
    }
  },
  {
    player: {
      id: 'player_3',
      name: 'Aaron Donald',
      position: 'DT',
      nflTeam: 'LAR',
      age: 32,
      experience: 10
    },
    contract: {
      id: 'contract_3',
      playerId: 'player_3',
      teamId: 'team_1',
      leagueId: 'league_1',
      totalValue: 95000000,
      years: 3,
      guaranteedMoney: 65000000,
      currentSalary: 31000000,
      averageAnnualValue: 31666667,
      bonuses: 10000000,
      incentives: 5000000,
      status: ContractStatus.ACTIVE,
      signedDate: new Date('2022-06-13'),
      startYear: 2022,
      endYear: 2024,
      yearsRemaining: 1,
      paidGuaranteed: 40000000,
      capHit: 41000000,
      deadMoney: 25000000,
      isRookieContract: false,
      canExtend: true,
      canTag: false,
      notes: 'Extensão após ameaça de aposentadoria'
    }
  },
  {
    player: {
      id: 'player_4',
      name: 'Cam Akers',
      position: 'RB',
      nflTeam: 'LAR',
      age: 24,
      experience: 4
    },
    contract: {
      id: 'contract_4',
      playerId: 'player_4',
      teamId: 'team_1',
      leagueId: 'league_1',
      totalValue: 5200000,
      years: 4,
      guaranteedMoney: 2800000,
      currentSalary: 1300000,
      averageAnnualValue: 1300000,
      bonuses: 500000,
      incentives: 1000000,
      status: ContractStatus.ACTIVE,
      signedDate: new Date('2020-07-25'),
      startYear: 2020,
      endYear: 2023,
      yearsRemaining: 0, // Contrato expirando
      paidGuaranteed: 2800000,
      capHit: 1800000,
      deadMoney: 0,
      isRookieContract: true,
      canExtend: true,
      canTag: true,
      notes: 'Contrato rookie - 2ª rodada do draft 2020'
    }
  },
  {
    player: {
      id: 'player_5',
      name: 'Van Jefferson',
      position: 'WR',
      nflTeam: 'LAR',
      age: 27,
      experience: 4
    },
    contract: null // Jogador sem contrato - agente livre
  }
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
          addNotification(`${detail.player.name} foi cortado - Dead money: ${formatCurrency(detail.deadMoney)}`);
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
      'playerCut'
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
  const totalContracts = players.filter(p => p.contract).length;
  const totalSalaries = players.reduce((sum, p) => sum + (p.contract?.currentSalary || 0), 0);
  const expiring = players.filter(p => p.contract?.yearsRemaining === 0).length;
  const freeAgents = players.filter(p => !p.contract).length;
  
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
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(totalSalaries)}
            </div>
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
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                isCommissioner ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
              }`}>
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
                <li>• Clique em "Ações" para gerenciar contratos</li>
                <li>• Use "Editar Contrato" para modificar termos</li>
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
            <p>• <strong>Matthew Stafford:</strong> Contrato de $160M por 4 anos (2 anos restantes)</p>
            <p>• <strong>Cooper Kupp:</strong> Contrato de $80M por 3 anos (1 ano restante - elegível para extensão)</p>
            <p>• <strong>Aaron Donald:</strong> Contrato de $95M por 3 anos (1 ano restante)</p>
            <p>• <strong>Cam Akers:</strong> Contrato rookie expirando (elegível para franchise tag)</p>
            <p>• <strong>Van Jefferson:</strong> Agente livre (sem contrato)</p>
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