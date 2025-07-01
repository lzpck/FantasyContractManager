# Refatoração do TeamHeader.tsx - Cálculos Dinâmicos em Tempo Real

## Resumo das Mudanças

O componente `TeamHeader.tsx` foi refatorado para calcular dinamicamente todos os valores relacionados ao Salary Cap, utilizando dados em tempo real do banco de dados ao invés de valores agregados persistidos.

## Principais Alterações

### 1. Interface Atualizada (Compatível com Código Existente)

```typescript
interface TeamHeaderProps {
  team: Team;
  league: League;
  players: PlayerWithContract[];
  contracts?: Contract[]; // NOVO: Contratos ativos do time (opcional)
  deadMoneyRecords?: DeadMoneyRecord[]; // NOVO: Registros de dead money (opcional)
  onBack?: () => void;
}
```

**Compatibilidade**: Os novos props são opcionais. Se não fornecidos, o componente usa fallbacks baseados nos dados existentes do `team` e `players`.

### 2. Sistema de Fallback para Compatibilidade

O componente implementa um sistema inteligente de fallback:

```typescript
// Dead Money: usa registros detalhados ou valores agregados do team
const totalDeadMoney = safeDeadMoneyRecords.length > 0
  ? safeDeadMoneyRecords
      .filter(dm => dm.teamId === team.id && dm.year === currentYear)
      .reduce((sum, dm) => sum + dm.amount, 0)
  : team.currentDeadMoney || 0;

// Contratos: usa dados detalhados ou calcula dos players
const totalSalaries = safeContracts.length > 0
  ? safeContracts
      .filter(c => /* filtros de temporada */)
      .reduce((sum, c) => sum + c.currentSalary, 0)
  : players
      .filter(p => p.contract)
      .reduce((sum, player) => sum + (player.contract?.currentSalary || 0), 0);
```

### 3. Cálculos Dinâmicos

Todos os valores são calculados em tempo real usando `useMemo`:

#### Dead Money por Temporada

```typescript
const totalDeadMoney = deadMoneyRecords
  .filter(dm => dm.teamId === team.id && dm.year === currentYear)
  .reduce((sum, dm) => sum + dm.amount, 0);

const nextSeasonDeadMoney = deadMoneyRecords
  .filter(dm => dm.teamId === team.id && dm.year === nextYear)
  .reduce((sum, dm) => sum + dm.amount, 0);
```

#### Contratos Ativos

```typescript
const totalSalaries = contracts
  .filter(
    c =>
      c.teamId === team.id &&
      c.status === 'ACTIVE' &&
      c.signedSeason <= currentYear &&
      c.signedSeason + c.originalYears - 1 >= currentYear,
  )
  .reduce((sum, c) => sum + c.currentSalary, 0);
```

#### Salary Cap Usado e Disponível

```typescript
const capUsed = totalSalaries + totalDeadMoney;
const availableCap = league.salaryCap - capUsed;
```

### 3. Hook Personalizado para Busca de Dados

Criado `useTeamFinancials` para buscar dados em tempo real:

```typescript
const { contracts, deadMoneyRecords, isLoading, error, revalidateFinancials } = useTeamFinancials(
  team.id,
  league.id,
);
```

### 4. APIs Criadas

#### Contratos do Time

- **GET** `/api/teams/[teamId]/contracts`
- **POST** `/api/teams/[teamId]/contracts`

#### Dead Money Records

- **GET** `/api/teams/[teamId]/dead-money`
  - Parâmetros opcionais: `year`, `currentYearOnly`, `nextYearOnly`
- **POST** `/api/teams/[teamId]/dead-money`

## Como Usar

### Opção 1: Usando o Hook (Recomendado)

```typescript
import TeamHeaderExample from '@/components/teams/TeamHeaderExample';

// Em sua página/componente
<TeamHeaderExample
  team={team}
  league={league}
  players={players}
  onBack={handleBack}
/>
```

### Opção 2: Busca Manual de Dados

```typescript
import TeamHeader from '@/components/teams/TeamHeader';
import { useTeamFinancials } from '@/hooks/useTeamFinancials';

function MyTeamPage({ team, league, players }) {
  const { contracts, deadMoneyRecords, isLoading } = useTeamFinancials(team.id, league.id);

  if (isLoading) return <LoadingSpinner />;

  return (
    <TeamHeader
      team={team}
      league={league}
      players={players}
      contracts={contracts}
      deadMoneyRecords={deadMoneyRecords}
    />
  );
}
```

### Revalidação Após Mudanças

```typescript
import { useRevalidateTeamFinancials } from '@/components/teams/TeamHeaderExample';

function PlayerActions({ teamId }) {
  const { revalidateAfterCapChange } = useRevalidateTeamFinancials(teamId);

  const handleCutPlayer = async () => {
    // Lógica para cortar jogador
    await cutPlayerAPI();

    // Revalida os dados financeiros
    revalidateAfterCapChange();
  };
}
```

## Benefícios da Refatoração

### ✅ Dados Sempre Atualizados

- Todos os valores refletem o estado real do banco de dados
- Nenhum valor fica "desatualizado" após operações

### ✅ Cálculos por Temporada

- Dead Money é calculado corretamente por ano (`league.season` e `league.season + 1`)
- Contratos ativos são filtrados pela temporada atual

### ✅ Performance Otimizada

- `useMemo` evita recálculos desnecessários
- SWR/React Query para cache inteligente

### ✅ Flexibilidade

- Fácil mudança de temporada (altera `league.season`)
- Suporte a filtros nas APIs

## Estrutura de Dados

### DeadMoneyRecord

```typescript
interface DeadMoneyRecord {
  id: string;
  teamId: string;
  playerId: string;
  contractId?: string;
  amount: number;
  year: number; // Ano específico (league.season ou league.season + 1)
  reason?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Exemplo de Uso das APIs

```typescript
// Buscar dead money do ano atual
GET /api/teams/123/dead-money?currentYearOnly=true

// Buscar dead money do próximo ano
GET /api/teams/123/dead-money?nextYearOnly=true

// Buscar dead money de um ano específico
GET /api/teams/123/dead-money?year=2024

// Buscar todos os contratos ativos
GET /api/teams/123/contracts
```

## Migração de Código Existente

### Opção 1: Migração Imediata (Sem Mudanças)

O código existente continua funcionando sem alterações:

```typescript
// Código existente - continua funcionando
<TeamHeader
  team={team}
  league={league}
  players={players}
  onBack={onBack}
/>
```

### Opção 2: Migração com Dados em Tempo Real

```typescript
// Nova versão com dados dinâmicos
<TeamHeaderExample
  team={team}
  league={league}
  players={players}
  onBack={onBack}
/>
```

### Opção 3: Migração Manual com Props

```typescript
// Controle total dos dados
const { contracts, deadMoneyRecords } = useTeamFinancials(team.id, league.id);

<TeamHeader
  team={team}
  league={league}
  players={players}
  contracts={contracts}
  deadMoneyRecords={deadMoneyRecords}
  onBack={onBack}
/>
```

## Considerações Importantes

1. **Cache**: Os dados são cacheados pelo SWR, mas sempre revalidados quando necessário
2. **Performance**: Para times com muitos contratos, considere paginação nas APIs
3. **Consistência**: Sempre use `league.season` como referência para cálculos
4. **Revalidação**: Chame `revalidateFinancials()` após operações que afetam o salary cap

## Próximos Passos

1. Atualizar todas as páginas que usam `TeamHeader` para usar `TeamHeaderExample`
2. Implementar testes unitários para os cálculos dinâmicos
3. Adicionar loading states mais elaborados
4. Considerar implementar WebSockets para atualizações em tempo real
