# Modal de Contratos - Guia de Implementação

## Visão Geral

Este diretório contém a implementação completa do Modal de Contratos para o sistema de gerenciamento de fantasy football. O modal permite aos comissários adicionar e editar contratos de jogadores seguindo todas as regras da liga.

## Arquivos Incluídos

- `ContractModal.tsx` - Componente principal do modal
- `ContractManagement.tsx` - Exemplo de integração completa
- `useContractModal.ts` - Hook para gerenciamento de estado (em `/hooks`)

## Instalação e Uso

### 1. Importações Necessárias

```tsx
import ContractModal from '@/components/teams/ContractModal';
import { useContractModal, useCanManageContracts } from '@/hooks/useContractModal';
```

### 2. Uso Básico

```tsx
function PlayerCard({ player, team, league }) {
  const contractModal = useContractModal();
  const canManage = useCanManageContracts();
  
  if (!canManage) return <PlayerCardReadOnly />;
  
  return (
    <div className="player-card">
      <h3>{player.name}</h3>
      
      <button 
        onClick={() => contractModal.openModal(player, team, league)}
        className="btn-primary"
      >
        Adicionar Contrato
      </button>
      
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        onSave={contractModal.saveContract}
        isCommissioner={canManage}
      />
    </div>
  );
}
```

### 3. Edição de Contratos Existentes

```tsx
function ContractRow({ playerWithContract, team, league }) {
  const contractModal = useContractModal();
  
  const handleEdit = () => {
    contractModal.openModal(
      playerWithContract.player,
      team,
      league,
      playerWithContract.contract // Passa o contrato para edição
    );
  };
  
  return (
    <tr>
      <td>{playerWithContract.player.name}</td>
      <td>{formatCurrency(playerWithContract.contract.currentSalary)}</td>
      <td>
        <button onClick={handleEdit}>Editar</button>
      </td>
    </tr>
  );
}
```

## Funcionalidades Principais

### Campos do Formulário

#### Modo Adição
- **Anos de Contrato**: 1-4 anos (obrigatório)
- **Valor Anual**: Em milhões, validado contra salário mínimo
- **Tipo de Aquisição**: Leilão, FAAB, Rookie Draft, etc.
- **Opção 4º Ano**: Apenas para rookies

#### Modo Edição
Todos os campos acima, mais:
- **Já foi tagueado**: Controle de franchise tag
- **Já foi estendido**: Controle de extensões
- **4º ano ativado**: Para rookies com opção
- **Anos restantes**: Somente leitura
- **Temporada assinada**: Somente leitura

### Validações Automáticas

```typescript
// Exemplos de validações implementadas
const validations = {
  minimumSalary: formData.annualSalary >= league.minimumSalary,
  contractYears: formData.contractYears >= 1 && formData.contractYears <= 4,
  acquisitionType: !!formData.acquisitionType,
  rookieOptions: isRookie ? validateRookieFields() : true
};
```

### Projeção de Valores

O modal calcula automaticamente a projeção de valores com aumentos anuais:

```typescript
// Exemplo de cálculo
const projectedValues = [];
let currentValue = initialSalary;

for (let year = 1; year <= contractYears; year++) {
  projectedValues.push(currentValue);
  if (year < contractYears) {
    currentValue *= (1 + league.annualIncreasePercentage / 100);
  }
}
```

## Integração com Estado Global

### Eventos Customizados

O sistema usa eventos para comunicar mudanças:

```typescript
// Escutar atualizações de contratos
useEffect(() => {
  const handleUpdate = (event) => {
    const { player, team, league, isEdit } = event.detail;
    // Recarregar dados ou atualizar cache
    refetchContracts();
  };
  
  window.addEventListener('contractUpdated', handleUpdate);
  return () => window.removeEventListener('contractUpdated', handleUpdate);
}, []);
```

### Context API (Opcional)

Para integração mais robusta, você pode usar Context:

```tsx
// ContractsContext.tsx
const ContractsContext = createContext();

export function ContractsProvider({ children }) {
  const [contracts, setContracts] = useState([]);
  
  const addContract = (contractData) => {
    // Lógica para adicionar contrato
    setContracts(prev => [...prev, newContract]);
  };
  
  const updateContract = (id, contractData) => {
    // Lógica para atualizar contrato
    setContracts(prev => prev.map(c => c.id === id ? updated : c));
  };
  
  return (
    <ContractsContext.Provider value={{ contracts, addContract, updateContract }}>
      {children}
    </ContractsContext.Provider>
  );
}
```

## Customização

### Estilos Personalizados

```tsx
// Exemplo de customização de estilos
const customStyles = {
  modal: "fixed inset-0 bg-custom-dark bg-opacity-75",
  container: "bg-custom-card rounded-2xl shadow-2xl",
  input: "bg-custom-input border-custom-border text-custom-text"
};

<ContractModal
  // ... outras props
  className={customStyles}
/>
```

### Validações Customizadas

```tsx
// Adicionar validações específicas
const customValidations = {
  salaryCapCheck: (salary) => {
    return team.availableCap >= salary;
  },
  positionLimits: (position) => {
    const positionCount = team.players.filter(p => p.position === position).length;
    return positionCount < POSITION_LIMITS[position];
  }
};
```

## Exemplos de Uso Avançado

### 1. Lista de Jogadores com Ações

```tsx
function PlayersTable({ players, team, league }) {
  const contractModal = useContractModal();
  
  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Posição</th>
          <th>Salário</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {players.map(player => (
          <tr key={player.id}>
            <td>{player.name}</td>
            <td>{player.position}</td>
            <td>{player.contract ? formatCurrency(player.contract.currentSalary) : '-'}</td>
            <td>
              {player.contract ? (
                <button onClick={() => contractModal.openModal(player.player, team, league, player.contract)}>
                  Editar
                </button>
              ) : (
                <button onClick={() => contractModal.openModal(player, team, league)}>
                  Adicionar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 2. Dashboard de Contratos

```tsx
function ContractsDashboard({ team, league }) {
  const [activeTab, setActiveTab] = useState('active');
  const contractModal = useContractModal();
  
  const contractsByStatus = {
    active: contracts.filter(c => c.status === 'active'),
    expiring: contracts.filter(c => c.yearsRemaining === 1),
    expired: contracts.filter(c => c.status === 'expired')
  };
  
  return (
    <div>
      <div className="tabs">
        {Object.keys(contractsByStatus).map(status => (
          <button 
            key={status}
            onClick={() => setActiveTab(status)}
            className={activeTab === status ? 'active' : ''}
          >
            {status} ({contractsByStatus[status].length})
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {contractsByStatus[activeTab].map(contract => (
          <ContractCard 
            key={contract.id} 
            contract={contract}
            onEdit={() => contractModal.openModal(/* ... */)}
          />
        ))}
      </div>
      
      <ContractModal {...contractModal} />
    </div>
  );
}
```

## Troubleshooting

### Problemas Comuns

1. **Modal não abre**
   - Verificar permissões de comissário
   - Verificar se dados obrigatórios foram passados

2. **Erro ao salvar**
   - Verificar conexão com API
   - Verificar formato dos dados
   - Verificar logs do console

3. **Validações não funcionam**
   - Verificar se `league.minimumSalary` está definido
   - Verificar tipos de dados

### Debug

```tsx
// Adicionar logs para debug
const contractModal = useContractModal();

useEffect(() => {
  console.log('Contract Modal State:', {
    isOpen: contractModal.isOpen,
    player: contractModal.player,
    team: contractModal.team,
    league: contractModal.league,
    error: contractModal.error
  });
}, [contractModal]);
```

## Performance

### Otimizações

1. **Memoização de cálculos**
```tsx
const projectedValues = useMemo(() => {
  return calculateProjectedValues(formData.annualSalary, formData.contractYears, league.annualIncreasePercentage);
}, [formData.annualSalary, formData.contractYears, league.annualIncreasePercentage]);
```

2. **Debounce em validações**
```tsx
const debouncedValidation = useDebounce(validateForm, 300);
```

3. **Lazy loading do modal**
```tsx
const ContractModal = lazy(() => import('./ContractModal'));
```

## Testes

### Exemplo de Teste

```tsx
// ContractModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ContractModal from './ContractModal';

test('should validate minimum salary', () => {
  const mockLeague = { minimumSalary: 1.0 };
  
  render(
    <ContractModal 
      isOpen={true}
      league={mockLeague}
      // ... outras props
    />
  );
  
  const salaryInput = screen.getByLabelText(/valor anual/i);
  fireEvent.change(salaryInput, { target: { value: '0.5' } });
  
  expect(screen.getByText(/não pode ser menor/i)).toBeInTheDocument();
});
```

## Contribuição

Para contribuir com melhorias:

1. Siga os padrões de código do projeto
2. Adicione testes para novas funcionalidades
3. Atualize a documentação
4. Teste em diferentes cenários de uso