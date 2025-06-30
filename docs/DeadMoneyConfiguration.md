# Configuração de Dead Money por Liga

## Visão Geral

O sistema de configuração de dead money permite que cada liga customize as regras de penalidade financeira aplicadas quando um jogador é cortado antes do fim do contrato. Esta funcionalidade substitui as regras fixas anteriores por um sistema flexível e configurável.

## Como Funciona

### Conceito de Dead Money

Dead money é a penalidade financeira aplicada quando um jogador é cortado antes do término natural do contrato. O valor é dividido em duas categorias:

- **Temporada Atual**: Percentual do salário atual que vira dead money imediatamente
- **Temporadas Futuras**: Percentual aplicado aos salários dos anos restantes, pago na próxima temporada

### Configuração Padrão

Por padrão, todas as ligas começam com a seguinte configuração:

```json
{
  "currentSeason": 1.0,
  "futureSeasons": {
    "1": 0.25,
    "2": 0.25,
    "3": 0.25,
    "4": 0.25
  }
}
```

Isso significa:

- **100%** do salário atual vira dead money
- **25%** do salário de cada ano restante vira dead money na próxima temporada

### Regras Especiais

- **Practice Squad**: Sempre 25% do salário atual, independente da configuração
- **Valores**: Devem estar entre 0.0 (0%) e 1.0 (100%)
- **Anos Futuros**: Suporta até 4 anos de configuração

## Como Configurar

### 1. Acesso às Configurações

1. Navegue até a página da liga
2. Clique em "Configurações" no menu
3. Selecione a aba "Dead Money"

### 2. Editando Percentuais

- **Temporada Atual**: Use o slider ou digite o valor diretamente
- **Temporadas Futuras**: Configure percentuais para 1-4 anos restantes
- **Preview**: Visualize o impacto com exemplos práticos

### 3. Salvando Alterações

- Apenas comissários podem alterar as configurações
- As alterações são aplicadas imediatamente
- Um histórico de mudanças é mantido para auditoria

## Exemplos Práticos

### Exemplo 1: Configuração Conservadora

```json
{
  "currentSeason": 0.5,
  "futureSeasons": {
    "1": 0.1,
    "2": 0.1,
    "3": 0.1,
    "4": 0.1
  }
}
```

**Impacto**: Jogador com $10M/ano e 3 anos restantes

- Dead money atual: $5M (50%)
- Dead money futuro: $2M (10% × 2 anos × $10M)
- **Total**: $7M

### Exemplo 2: Configuração Agressiva

```json
{
  "currentSeason": 1.0,
  "futureSeasons": {
    "1": 0.5,
    "2": 0.4,
    "3": 0.3,
    "4": 0.2
  }
}
```

**Impacto**: Jogador com $10M/ano e 3 anos restantes

- Dead money atual: $10M (100%)
- Dead money futuro: $9M (50% + 40% × $10M)
- **Total**: $19M

### Exemplo 3: Configuração Progressiva

```json
{
  "currentSeason": 0.75,
  "futureSeasons": {
    "1": 0.4,
    "2": 0.3,
    "3": 0.2,
    "4": 0.1
  }
}
```

**Impacto**: Penalidade diminui conforme os anos restantes

## Implementação Técnica

### Estrutura de Dados

```typescript
interface DeadMoneyConfig {
  /** Percentual aplicado ao salário da temporada atual (0.0 - 1.0) */
  currentSeason: number;
  /** Percentuais aplicados aos anos restantes de contrato */
  futureSeasons: {
    [years: string]: number; // "1", "2", "3", "4"
  };
}
```

### Armazenamento

- Configuração armazenada como JSON string no campo `deadMoneyConfig` da tabela `League`
- Fallback automático para configuração padrão em caso de erro
- Validação de tipos e limites na API

### Cálculo

```typescript
function calculateDeadMoney(
  contract: Contract,
  rosterStatus: PlayerRosterStatus,
  config: DeadMoneyConfig,
): DeadMoneyResult {
  // Lógica de cálculo baseada na configuração
}
```

## API Endpoints

### GET `/api/leagues/[leagueId]/dead-money-config`

Retorna a configuração atual de dead money da liga.

**Resposta**:

```json
{
  "config": {
    "currentSeason": 1.0,
    "futureSeasons": {
      "1": 0.25,
      "2": 0.25,
      "3": 0.25,
      "4": 0.25
    }
  }
}
```

### PUT `/api/leagues/[leagueId]/dead-money-config`

Atualiza a configuração de dead money da liga.

**Corpo da Requisição**:

```json
{
  "config": {
    "currentSeason": 0.8,
    "futureSeasons": {
      "1": 0.3,
      "2": 0.25,
      "3": 0.2,
      "4": 0.15
    }
  }
}
```

## Validações

### Frontend

- Valores entre 0.0 e 1.0
- Feedback visual em tempo real
- Preview de impacto financeiro

### Backend

- Validação de tipos
- Verificação de permissões (apenas comissários)
- Sanitização de dados

## Migração

### Ligas Existentes

Ligas criadas antes desta funcionalidade:

1. Recebem automaticamente a configuração padrão
2. Mantêm o comportamento anterior (100% atual + 25% futuro)
3. Podem ser customizadas a qualquer momento pelo comissário

### Compatibilidade

O sistema é totalmente compatível com:

- Cálculos existentes de salary cap
- Relatórios financeiros
- Exportação de dados
- Integrações externas

## Considerações de Performance

- Configuração carregada uma vez por sessão
- Cache local para evitar requisições desnecessárias
- Fallback rápido para configuração padrão
- Validação assíncrona para não bloquear a UI

## Segurança

- Apenas comissários podem alterar configurações
- Validação de permissões em todas as operações
- Auditoria de mudanças
- Sanitização de dados de entrada

## Troubleshooting

### Problemas Comuns

1. **Configuração não salva**
   - Verificar se o usuário é comissário
   - Validar formato dos percentuais
   - Verificar conexão com a API

2. **Cálculo incorreto**
   - Verificar se a configuração foi aplicada
   - Confirmar status do jogador (practice squad vs regular)
   - Validar dados do contrato

3. **Interface não carrega**
   - Verificar permissões do usuário
   - Confirmar ID da liga
   - Verificar logs do console

### Logs e Debugging

```javascript
// Habilitar logs detalhados
localStorage.setItem('debug-dead-money', 'true');

// Verificar configuração atual
console.log('Dead Money Config:', league.deadMoneyConfig);

// Testar cálculo
const result = calculateDeadMoney(contract, rosterStatus, config);
console.log('Dead Money Result:', result);
```

## Roadmap

### Funcionalidades Futuras

- [ ] Templates de configuração pré-definidos
- [ ] Histórico de mudanças na configuração
- [ ] Simulador de impacto em massa
- [ ] Exportação de relatórios personalizados
- [ ] Configuração por posição
- [ ] Regras condicionais (ex: rookies vs veteranos)

### Melhorias Planejadas

- [ ] Interface mais intuitiva
- [ ] Validação em tempo real
- [ ] Comparação entre configurações
- [ ] Alertas de impacto significativo
- [ ] Integração com ferramentas de análise

---

## Suporte

Para dúvidas ou problemas relacionados à configuração de dead money:

1. Consulte esta documentação
2. Verifique os logs do console
3. Entre em contato com o suporte técnico
4. Reporte bugs no repositório do projeto

---

_Última atualização: Janeiro 2025_
