# Fluxo de Gerenciamento de Proprietários de Times

## Visão Geral

Este documento descreve o fluxo correto de preenchimento dos campos `sleeperOwnerId` e `ownerId` na tabela de times, garantindo a separação adequada entre dados do Sleeper e associações manuais de usuários locais.

## Campos da Tabela Team

### `sleeperOwnerId`

- **Origem**: API do Sleeper
- **Preenchimento**: Automático durante importação/sincronização
- **Valor**: ID do usuário proprietário do time no Sleeper
- **Quando é preenchido**:
  - Durante a importação inicial da liga
  - Durante sincronizações periódicas com o Sleeper
- **Nunca deve**: Ser alterado manualmente ou ficar em branco se o time existe no Sleeper

### `ownerId`

- **Origem**: Sistema local (usuários cadastrados)
- **Preenchimento**: Manual através de associação de usuário
- **Valor**: ID do usuário local associado ao time (opcional)
- **Quando é preenchido**:
  - Quando um usuário local é associado manualmente ao time
  - Durante cadastro de novo usuário com associação a time
  - Durante edição de perfil de usuário com associação a time
- **Nunca deve**: Ser preenchido automaticamente durante importação/sincronização

## Fluxos de Operação

### 1. Importação de Liga do Sleeper

```typescript
// ✅ CORRETO - sleeperService.ts
return {
  name: teamName,
  leagueId,
  ownerId: null, // Campo vazio até associação manual
  sleeperOwnerId: user?.user_id, // ID do Sleeper
  ownerDisplayName: user?.display_name,
  sleeperTeamId: roster.roster_id.toString(),
  // ... outros campos
};
```

```typescript
// ✅ CORRETO - API de importação
prisma.team.create({
  data: {
    name: team.name,
    leagueId: createdLeague.id,
    ownerId: null, // Campo vazio até associação manual
    sleeperTeamId: team.sleeperTeamId,
    sleeperOwnerId: team.sleeperOwnerId, // Vem do Sleeper
    ownerDisplayName: team.ownerDisplayName,
  },
});
```

### 2. Sincronização com Sleeper

```typescript
// ✅ CORRETO - Atualizar time existente
prisma.team.update({
  where: { id: existingTeam.id },
  data: {
    name: team.name,
    ownerDisplayName: team.ownerDisplayName,
    sleeperOwnerId: team.sleeperOwnerId, // Atualizar do Sleeper
    // ownerId NÃO é alterado - mantém associação manual
    updatedAt: new Date(),
  },
});
```

```typescript
// ✅ CORRETO - Criar novo time durante sincronização
prisma.team.create({
  data: {
    name: team.name,
    leagueId: leagueId,
    ownerId: null, // Campo vazio até associação manual
    sleeperTeamId: team.sleeperTeamId,
    ownerDisplayName: team.ownerDisplayName,
    sleeperOwnerId: team.sleeperOwnerId,
  },
});
```

### 3. Associação Manual de Usuário

```typescript
// ✅ CORRETO - Associar usuário local ao time
prisma.team.update({
  where: { id: teamId },
  data: {
    ownerId: userId, // Preenchido apenas aqui
    updatedAt: new Date(),
  },
});

// Também associar usuário à liga como membro
prisma.leagueUser.create({
  data: {
    leagueId: team.leagueId,
    userId: userId,
    role: 'MEMBER',
  },
});
```

## Regras Importantes

### ❌ O que NUNCA fazer:

1. **Preencher `ownerId` automaticamente durante importação**

   ```typescript
   // ❌ ERRADO
   ownerId: commissionerId, // Não associar comissário automaticamente
   ownerId: roster.owner_id, // Não usar ID do Sleeper
   ```

2. **Alterar `ownerId` durante sincronização**

   ```typescript
   // ❌ ERRADO - não sobrescrever associação manual
   data: {
     ownerId: newUserId, // Pode quebrar associação existente
   }
   ```

3. **Deixar `sleeperOwnerId` em branco se o time existe no Sleeper**
   ```typescript
   // ❌ ERRADO
   sleeperOwnerId: null, // Deve sempre refletir o Sleeper
   ```

### ✅ Boas Práticas:

1. **Separação clara de responsabilidades**
   - `sleeperOwnerId`: Sempre reflete o estado atual no Sleeper
   - `ownerId`: Apenas para associações manuais no sistema local

2. **Preservar associações manuais**
   - Sincronizações nunca devem alterar `ownerId`
   - Apenas operações manuais de usuário podem modificar este campo

3. **Múltiplos comissários**
   - Uma liga pode ter vários comissários
   - Não assumir que o comissário é proprietário de algum time
   - Comissários podem ou não ter times na liga

4. **Associação à liga**
   - Ao associar usuário a um time, também associá-lo à liga
   - Verificar se o usuário já é membro antes de criar nova associação

## Exemplo de Fluxo Completo

1. **Importação**: Liga importada do Sleeper
   - `sleeperOwnerId`: Preenchido com IDs do Sleeper
   - `ownerId`: `null` para todos os times

2. **Usuário se cadastra**: João cria conta no sistema
   - Ainda não está associado a nenhum time
   - `ownerId` continua `null` para todos os times

3. **Associação manual**: João é associado ao "Time dos Campeões"
   - `ownerId` do "Time dos Campeões" = ID do João
   - João é adicionado como membro da liga
   - `sleeperOwnerId` permanece inalterado

4. **Sincronização**: Sistema sincroniza com Sleeper
   - `sleeperOwnerId` pode ser atualizado se mudou no Sleeper
   - `ownerId` do João permanece inalterado
   - Novos times podem ser criados com `ownerId` = `null`

## Schema do Banco de Dados

```prisma
model Team {
  // ... outros campos

  // Proprietário no Sleeper (sempre reflete o Sleeper)
  sleeperOwnerId   String?
  ownerDisplayName String?

  // Proprietário local (usuário do sistema) - opcional até associação manual
  ownerId   String?
  owner     User?  @relation("TeamOwner", fields: [ownerId], references: [id])

  // ... outros campos
}
```

## Versionamento

Todas as alterações relacionadas a este fluxo devem ser feitas em branches seguindo o padrão GitFlow:

- `feature/implementa-associacao-usuario-time`
- `bugfix/corrige-fluxo-owner-id-sleeper`
- `refactor/otimiza-sincronizacao-sleeper`

Este documento deve ser atualizado sempre que houver mudanças no fluxo de gerenciamento de proprietários.
