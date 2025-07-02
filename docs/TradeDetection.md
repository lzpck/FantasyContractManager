# Sistema de Detecção e Processamento de Trades

## Visão Geral

O Fantasy Contract Manager agora possui um sistema robusto para detectar e processar trades automaticamente durante a sincronização com a API do Sleeper. Este sistema garante que:

- ✅ Contratos existentes sejam atualizados (não duplicados)
- ✅ O campo `acquisitionType` seja definido como `TRADE`
- ✅ O histórico do contrato seja preservado
- ✅ Logs detalhados sejam gerados para auditoria
- ✅ Estatísticas sejam coletadas e reportadas

## Como Funciona

### 1. Detecção de Trade

Durante a sincronização de rosters, o sistema verifica se um jogador:
- Já possui um contrato ativo (`status: 'ACTIVE'`)
- Em outro time da mesma liga
- Diferente do time atual no Sleeper

Se essas condições forem atendidas, uma trade é detectada.

### 2. Processamento da Trade

Quando uma trade é detectada:

```typescript
// Atualizar contrato existente
await prisma.contract.update({
  where: { id: existingContract.id },
  data: {
    teamId: newTeamId,           // Novo time
    acquisitionType: 'TRADE',    // Marcar como trade
    updatedAt: new Date().toISOString(),
  },
});
```

### 3. Preservação do Histórico

Os seguintes campos do contrato são **preservados**:
- `originalSalary` - Salário original
- `originalYears` - Duração original
- `signedSeason` - Temporada de assinatura
- `currentSalary` - Salário atual
- `yearsRemaining` - Anos restantes
- Todas as flags de status (`hasBeenTagged`, `hasBeenExtended`, etc.)

## Arquitetura do Sistema

### Função Principal: `processPlayerTrade`

```typescript
async function processPlayerTrade(
  playerId: string,
  newTeamId: string,
  leagueId: string,
): Promise<TradeProcessResult>
```

**Parâmetros:**
- `playerId` - ID do jogador
- `newTeamId` - ID do novo time
- `leagueId` - ID da liga

**Retorno:**
```typescript
interface TradeProcessResult {
  isTraded: boolean;
  fromTeam?: string;
  toTeam?: string;
  playerName?: string;
  contractId?: string;
}
```

### Integração com Sincronização

A função é chamada durante `syncTeamRosters`:

```typescript
// Verificar e processar possível trade
const tradeResult = await processPlayerTrade(player.id, team.id, team.leagueId);

if (tradeResult.isTraded) {
  stats.tradesProcessed.push(tradeResult);
  console.log(`✅ Trade processada: ${tradeResult.playerName} de ${tradeResult.fromTeam} para ${tradeResult.toTeam}`);
}
```

## Estatísticas e Logs

### Coleta de Estatísticas

O sistema coleta as seguintes estatísticas durante a sincronização:

```typescript
interface SyncStats {
  tradesProcessed: TradeProcessResult[];
  playersAdded: number;
  playersRemoved: number;
}
```

### Logs de Auditoria

**Durante o processamento:**
```
🔄 TRADE PROCESSADA: Player Name transferido de Team A para Team B
```

**Resumo final:**
```
🔄 2 trade(s) processada(s):
   - Player 1: Team A → Team B
   - Player 2: Team C → Team D

📊 Estatísticas da sincronização:
   - Trades processadas: 2
   - Jogadores adicionados: 5
   - Jogadores removidos: 3
```

### Resposta da API

A API de sincronização agora retorna informações sobre trades:

```json
{
  "success": true,
  "message": "Liga 'My League' sincronizada com sucesso! 2 trade(s) processada(s).",
  "league": { ... },
  "teams": [ ... ],
  "tradesProcessed": [
    {
      "isTraded": true,
      "fromTeam": "Team A",
      "toTeam": "Team B",
      "playerName": "Player Name",
      "contractId": "contract-123"
    }
  ]
}
```

## Cenários de Teste

### 1. Trade Simples

**Cenário:** Jogador A é tradado do Time 1 para o Time 2

**Antes:**
- Jogador A tem contrato ativo no Time 1
- `acquisitionType: 'AUCTION'`

**Depois:**
- Mesmo contrato, mas `teamId` atualizado para Time 2
- `acquisitionType: 'TRADE'`
- Histórico preservado

### 2. Trade Múltipla

**Cenário:** 3 jogadores envolvidos em trade entre 2 times

**Resultado esperado:**
- Todos os 3 contratos atualizados
- Nenhum contrato duplicado
- Todos marcados como `acquisitionType: 'TRADE'`

### 3. Sincronização Massiva

**Cenário:** Múltiplas trades detectadas durante uma sincronização

**Resultado esperado:**
- Todas as trades processadas corretamente
- Logs detalhados gerados
- Estatísticas precisas coletadas
- Resposta da API com resumo completo

## Validações e Edge Cases

### ✅ Casos Tratados

1. **Jogador sem contrato ativo:** Não é considerado trade
2. **Jogador no mesmo time:** Não é considerado trade
3. **Novo time não encontrado:** Trade não é processada
4. **Erro durante atualização:** Trade falha graciosamente

### ⚠️ Limitações Conhecidas

1. **Trades simultâneas:** O sistema processa trades sequencialmente
2. **Histórico de times anteriores:** Não mantém histórico de times anteriores
3. **Data da trade:** Usa timestamp da sincronização, não data real da trade

## Como Testar

### 1. Teste Manual

1. Configure uma liga com times e jogadores
2. Crie contratos para alguns jogadores
3. Simule uma trade no Sleeper
4. Execute sincronização
5. Verifique logs e banco de dados

### 2. Teste Automatizado

Execute os testes unitários:

```bash
npm test src/utils/tradeDetection.test.ts
```

### 3. Teste de Integração

1. Use dados reais do Sleeper
2. Execute sincronização completa
3. Verifique estatísticas retornadas
4. Confirme que contratos foram atualizados corretamente

## Monitoramento e Debugging

### Logs Importantes

```bash
# Trade detectada e processada
🔄 TRADE PROCESSADA: Player Name transferido de Team A para Team B

# Estatísticas finais
📊 Estatísticas da sincronização:
   - Trades processadas: X
   - Jogadores adicionados: Y
   - Jogadores removidos: Z

# Erros
❌ Erro ao processar trade: [detalhes do erro]
```

### Verificação no Banco de Dados

```sql
-- Verificar contratos com acquisitionType = 'TRADE'
SELECT 
  c.id,
  p.name as player_name,
  t.name as team_name,
  c.acquisitionType,
  c.updatedAt
FROM contracts c
JOIN players p ON c.playerId = p.id
JOIN teams t ON c.teamId = t.id
WHERE c.acquisitionType = 'TRADE'
ORDER BY c.updatedAt DESC;
```

## Próximos Passos

### Melhorias Futuras

1. **Histórico de Times:** Manter registro de times anteriores
2. **Data Real da Trade:** Integrar com API do Sleeper para obter data real
3. **Notificações:** Enviar notificações para usuários sobre trades
4. **Dashboard de Trades:** Interface para visualizar histórico de trades
5. **Validação de Salary Cap:** Verificar impacto no salary cap durante trades

### Considerações de Performance

1. **Índices de Banco:** Adicionar índices para consultas de trade
2. **Cache:** Implementar cache para dados de times e jogadores
3. **Batch Processing:** Processar múltiplas trades em lote

---

## Checklist de Implementação

- ✅ Função `processPlayerTrade` implementada
- ✅ Integração com `syncTeamRosters`
- ✅ Coleta de estatísticas
- ✅ Logs detalhados
- ✅ Preservação do histórico
- ✅ Testes unitários
- ✅ Documentação completa
- ✅ Resposta da API atualizada
- ✅ Validação de edge cases
- ✅ Sistema de auditoria

**Status:** ✅ **IMPLEMENTADO E TESTADO**