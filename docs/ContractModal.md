# Modal de Contratos - Documentação

## Visão Geral

O Modal de Contratos é um componente completo para gerenciamento de contratos de jogadores no sistema de fantasy football. Ele permite aos comissários adicionar novos contratos e editar contratos existentes, seguindo todas as regras da liga.

## Componentes Criados

### 1. `ContractModal.tsx`

Componente principal do modal com formulário completo para contratos.

### 2. `useContractModal.ts`

Hook personalizado para gerenciar estado e operações do modal.

### 3. `ContractManagement.tsx`

Componente de exemplo mostrando integração completa.

## Funcionalidades

### Modo Adição

- **Anos de Contrato**: Select de 1 a 4 anos
- **Valor Anual Inicial**: Input numérico com validação de salário mínimo
- **Tipo de Aquisição**: Radio buttons para diferentes tipos
- **Opção de Quarto Ano**: Checkbox para rookies
- **Projeção de Valores**: Tabela automática com aumentos anuais

### Modo Edição

Todos os campos do modo adição, mais:

- **Já foi tagueado**: Checkbox para franchise tag
- **Já foi estendido**: Checkbox para extensões
- **Opção de quarto ano ativada**: Checkbox para rookies
- **Anos restantes**: Campo somente leitura
- **Temporada assinada**: Campo somente leitura

### Validações

- Salário não pode ser menor que o mínimo da liga
- Anos de contrato entre 1 e 4
- Tipo de aquisição obrigatório
- Campos específicos para rookies

## Como Usar

### Integração Básica

```tsx
import ContractModal from '@/components/teams/ContractModal';
import { useContractModal } from '@/hooks/useContractModal';

function MyComponent() {
  const contractModal = useContractModal();

  const handleAddContract = (player, team, league) => {
    contractModal.openModal(player, team, league);
  };

  const handleEditContract = (player, team, league, contract) => {
    contractModal.openModal(player, team, league, contract);
  };

  return (
    <>
      {/* Seus botões/componentes */}
      <button onClick={() => handleAddContract(player, team, league)}>Adicionar Contrato</button>

      {/* Modal */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={contractModal.saveContract}
        isCommissioner={true}
      />
    </>
  );
}
```

### Usando o Hook de Permissões

```tsx
import { useCanManageContracts } from '@/hooks/useContractModal';

function MyComponent() {
  const canManage = useCanManageContracts();

  if (!canManage) {
    return <div>Acesso negado</div>;
  }

  // Resto do componente...
}
```

### Integração Completa

Veja o arquivo `ContractManagement.tsx` para um exemplo completo de como integrar:

- Lista de jogadores com e sem contrato
- Botões de ação
- Estados de loading e erro
- Recarregamento automático após mudanças

## Estrutura de Dados

### ContractFormData

```typescript
interface ContractFormData {
  contractYears: number; // 1-4 anos
  annualSalary: number; // Em milhões
  acquisitionType: AcquisitionType; // Tipo de aquisição
  hasFourthYearOption: boolean; // Opção de 4º ano (rookies)
  hasBeenTagged: boolean; // Já foi tagueado
  hasBeenExtended: boolean; // Já foi estendido
  fourthYearOptionActivated: boolean; // 4º ano ativado
}
```

### Tipos de Aquisição

- `AUCTION`: Leilão
- `FAAB`: FAAB/Waiver
- `ROOKIE_DRAFT`: Rookie Draft
- `TRADE`: Trade
- `UNDISPUTED`: Não Disputado

## Regras de Negócio Implementadas

### Validações

1. **Salário Mínimo**: Não pode ser menor que `league.minimumSalary`
2. **Anos de Contrato**: Entre 1 e 4 anos obrigatoriamente
3. **Tipo de Aquisição**: Campo obrigatório
4. **Opção de Quarto Ano**: Apenas para rookies

### Cálculos Automáticos

1. **Projeção de Valores**: Aplica aumento anual da liga automaticamente
2. **Valor Total**: Soma todos os anos do contrato
3. **Preenchimento Automático**: teamId, playerId, temporada

### Permissões

- Apenas comissários podem ver e usar o modal
- Verificação via `user.isCommissioner` ou `user.role`

## Integração com API

### Usuário Demo

Para usuários demo, simula operações com delay e logs no console.

### Usuários Reais

Faz chamadas HTTP para:

- `POST /api/contracts` (novo contrato)
- `PUT /api/contracts/:id` (editar contrato)

### Payload da API

```json
{
  "playerId": "string",
  "teamId": "string",
  "leagueId": "string",
  "originalSalary": "number",
  "currentSalary": "number",
  "originalYears": "number",
  "yearsRemaining": "number",
  "acquisitionType": "string",
  "hasFourthYearOption": "boolean",
  "hasBeenTagged": "boolean",
  "hasBeenExtended": "boolean",
  "fourthYearOptionActivated": "boolean",
  "signedSeason": "number",
  "status": "active"
}
```

## Eventos Customizados

O sistema dispara um evento `contractUpdated` quando um contrato é salvo:

```typescript
window.addEventListener('contractUpdated', event => {
  const { player, team, league, isEdit } = event.detail;
  // Recarregar dados ou atualizar UI
});
```

## Estados de Loading e Erro

O hook `useContractModal` fornece:

- `isLoading`: Estado de carregamento durante salvamento
- `error`: Mensagem de erro se algo der errado

## Customização

### Estilos

O modal usa classes TailwindCSS e pode ser customizado alterando as classes nos componentes.

### Validações Adicionais

Adicione validações no método `validateForm()` do `ContractModal.tsx`.

### Campos Extras

Para adicionar novos campos:

1. Atualize a interface `ContractFormData`
2. Adicione o campo no formulário
3. Inclua na validação e payload da API

## Próximos Passos

1. **Integração com Backend**: Implementar endpoints da API
2. **Testes**: Adicionar testes unitários e de integração
3. **Validações Avançadas**: Verificar salary cap, regras específicas
4. **Histórico**: Manter log de alterações em contratos
5. **Notificações**: Sistema de notificações para mudanças

## Troubleshooting

### Modal não abre

- Verificar se `isCommissioner` é `true`
- Verificar se todos os dados obrigatórios foram passados

### Erro ao salvar

- Verificar conexão com API
- Verificar formato dos dados enviados
- Verificar logs do console para detalhes

### Validações não funcionam

- Verificar se `league.minimumSalary` está definido
- Verificar se os tipos de dados estão corretos
