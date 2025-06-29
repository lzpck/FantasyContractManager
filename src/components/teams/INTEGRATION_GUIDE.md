# Guia de Integração - Sistema de Contratos

## Visão Geral

Este guia explica como usar o sistema completo de gerenciamento de contratos, incluindo todos os componentes, hooks e funcionalidades integradas.

## Componentes Principais

### 1. PlayerContractsManager

**Componente principal** que integra toda a funcionalidade de contratos:

```tsx
import { PlayerContractsManager } from '@/components/teams/PlayerContractsManager';

function TeamPage() {
  const { players, team, league, refreshContracts } = useTeamData();

  return (
    <PlayerContractsManager
      players={players}
      team={team}
      league={league}
      onContractsUpdate={refreshContracts}
      title="Elenco do Time"
      showCapStats={true}
    />
  );
}
```

**Props:**
- `players`: Lista de jogadores com contratos
- `team`: Informações do time
- `league`: Informações da liga
- `onContractsUpdate`: Callback para atualizar dados
- `title`: Título personalizado (opcional)
- `showCapStats`: Mostrar estatísticas do salary cap (opcional)

### 2. ContractModal

**Modal para criar/editar contratos** com validações automáticas:

```tsx
import ContractModal from '@/components/teams/ContractModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleSave = (contractData) => {
    console.log('Contrato salvo:', contractData);
  };

  return (
    <ContractModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      player={selectedPlayer}
      team={team}
      league={league}
      contract={existingContract} // null para novo contrato
      onSave={handleSave}
      isCommissioner={true}
    />
  );
}
```

### 3. ContractActionsModal

**Modal para ações de contrato** (editar, estender, franchise tag, cortar):

```tsx
import ContractActionsModal from '@/components/teams/ContractActionsModal';

function PlayerActions() {
  return (
    <ContractActionsModal
      isOpen={isActionsModalOpen}
      onClose={() => setIsActionsModalOpen(false)}
      player={selectedPlayerWithContract}
      team={team}
      league={league}
      onAction={handleAction}
      isCommissioner={isCommissioner}
    />
  );
}
```

## Hooks Disponíveis

### 1. useContractModal

**Hook para gerenciar estado do modal de contratos:**

```tsx
import { useContractModal } from '@/hooks/useContractModal';

function MyComponent() {
  const { isOpen, openModal, closeModal } = useContractModal();
  
  return (
    <div>
      <button onClick={openModal}>Abrir Modal</button>
      <ContractModal isOpen={isOpen} onClose={closeModal} />
    </div>
  );
}
```

### 2. useContractOperations

**Hook para operações de contrato** (CRUD e validações):

```tsx
import { useContractOperations } from '@/hooks/useContractOperations';

function ContractManager() {
  const {
    isLoading,
    error,
    createContract,
    updateContract,
    extendContract,
    applyFranchiseTag,
    cutPlayer,
    clearError
  } = useContractOperations({
    team,
    league,
    onUpdate: refreshData
  });
  
  const handleCreateContract = async (player, contractData) => {
    const result = await createContract(player, contractData);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Erro: ${result.message}`);
    }
  };
}
```

## Fluxo de Uso Completo

### 1. Configuração Inicial

```tsx
// pages/teams/[teamId]/contracts.tsx
import { PlayerContractsManager } from '@/components/teams/PlayerContractsManager';
import { useTeamData } from '@/hooks/useTeamData';
import { useAuth } from '@/hooks/useAuth';

export default function TeamContractsPage() {
  const { user } = useAuth();
  const { players, team, league, refreshContracts, isLoading } = useTeamData();
  
  if (isLoading) return <div>Carregando...</div>;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PlayerContractsManager
        players={players}
        team={team}
        league={league}
        onContractsUpdate={refreshContracts}
        title={`Contratos - ${team.name}`}
        showCapStats={true}
      />
    </div>
  );
}
```

### 2. Integração com Dados

```tsx
// hooks/useTeamData.ts
import { useState, useEffect } from 'react';
import { PlayerWithContract, Team, League } from '@/types';

export function useTeamData(teamId: string) {
  const [players, setPlayers] = useState<PlayerWithContract[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const refreshContracts = async () => {
    try {
      // Buscar dados atualizados da API
      const [playersData, teamData, leagueData] = await Promise.all([
        fetch(`/api/teams/${teamId}/players`).then(r => r.json()),
        fetch(`/api/teams/${teamId}`).then(r => r.json()),
        fetch(`/api/leagues/${teamData.leagueId}`).then(r => r.json())
      ]);
      
      setPlayers(playersData);
      setTeam(teamData);
      setLeague(leagueData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshContracts();
  }, [teamId]);
  
  return {
    players,
    team,
    league,
    refreshContracts,
    isLoading
  };
}
```

## Eventos Customizados

O sistema dispara eventos customizados para comunicação entre componentes:

```tsx
// Escutar eventos de contrato
useEffect(() => {
  const handleContractUpdate = (event) => {
    console.log('Contrato atualizado:', event.detail);
    refreshData();
  };
  
  const handleContractCreated = (event) => {
    console.log('Contrato criado:', event.detail);
    refreshData();
  };
  
  window.addEventListener('contractUpdated', handleContractUpdate);
  window.addEventListener('contractCreated', handleContractCreated);
  
  return () => {
    window.removeEventListener('contractUpdated', handleContractUpdate);
    window.removeEventListener('contractCreated', handleContractCreated);
  };
}, []);
```

**Eventos disponíveis:**
- `contractCreated`: Novo contrato criado
- `contractUpdated`: Contrato editado
- `contractExtended`: Contrato estendido
- `franchiseTagApplied`: Franchise tag aplicada
- `playerCut`: Jogador cortado

## Validações Automáticas

O sistema inclui validações automáticas:

### Validações de Contrato
- Valor total > 0
- Duração entre 1-10 anos
- Dinheiro garantido ≤ valor total
- Salário atual ≤ 30% do salary cap

### Validações de Extensão
- Extensão entre 1-5 anos
- Valor da extensão > 0
- Contrato não pode estar expirado

### Validações de Franchise Tag
- Valor da tag > 0
- Jogador elegível para tag

## Cálculos Automáticos

O sistema calcula automaticamente:

- **Salário médio anual**: `valor total / anos`
- **Cap hit**: `salário atual + bônus`
- **Dead money**: `dinheiro garantido - pago garantido`
- **Valor da franchise tag**: Baseado na posição
- **Projeções de salary cap**

## Permissões

O sistema respeita permissões de usuário:

```tsx
// Apenas comissários podem:
- Criar novos contratos
- Editar contratos existentes
- Aplicar franchise tags
- Cortar jogadores
- Aprovar extensões

// Todos os usuários podem:
- Visualizar contratos
- Ver estatísticas do salary cap
- Filtrar e ordenar jogadores
```

## Customização

### Estilos

Todos os componentes usam Tailwind CSS e podem ser customizados:

```tsx
// Exemplo de customização de cores
const customTheme = {
  primary: 'bg-purple-600 hover:bg-purple-700',
  secondary: 'bg-gray-600 hover:bg-gray-700',
  success: 'bg-green-600 hover:bg-green-700',
  danger: 'bg-red-600 hover:bg-red-700'
};
```

### Validações Customizadas

```tsx
// Adicionar validações customizadas
const customValidations = {
  maxContractValue: 50000000, // $50M
  maxContractYears: 8,
  rookieMaxValue: 10000000 // $10M para rookies
};
```

## Troubleshooting

### Problemas Comuns

1. **Modal não abre**
   - Verificar se `isOpen` está sendo passado corretamente
   - Verificar se há erros no console

2. **Dados não atualizam**
   - Verificar se `onContractsUpdate` está sendo chamado
   - Verificar se os eventos customizados estão sendo disparados

3. **Validações não funcionam**
   - Verificar se os dados estão no formato correto
   - Verificar se as props `team` e `league` estão sendo passadas

4. **Permissões não funcionam**
   - Verificar se `isCommissioner` está sendo calculado corretamente
   - Verificar se o hook `useAuth` está funcionando

### Debug

```tsx
// Ativar logs de debug
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Contract data:', contractData);
  console.log('Validation errors:', validationErrors);
  console.log('User permissions:', { isCommissioner });
}
```

## Próximos Passos

1. **Integração com API real**
2. **Testes automatizados**
3. **Otimizações de performance**
4. **Funcionalidades avançadas**:
   - Histórico de contratos
   - Comparação de contratos
   - Relatórios de salary cap
   - Projeções futuras

## Suporte

Para dúvidas ou problemas:
1. Verificar este guia
2. Consultar a documentação dos componentes individuais
3. Verificar os exemplos de uso
4. Abrir issue no repositório