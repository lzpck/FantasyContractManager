# Fluxo de Gerenciamento de Usuários com Associação de Times

## Visão Geral

Este documento descreve o fluxo completo de criação e edição de usuários no sistema, incluindo a funcionalidade de associação de usuários a times, gerenciamento de permissões de liga e auditoria de alterações.

## Estrutura de Dados

### Modelos Principais

- **User**: Usuário do sistema
- **Team**: Time de uma liga
- **League**: Liga/campeonato
- **LeagueUser**: Associação de usuários às ligas como membros

### Relacionamentos

- Um usuário pode ser proprietário de **apenas um time** por vez
- Um time pode ter **apenas um proprietário** (ownerId)
- Um usuário pode ser **membro de múltiplas ligas** através do modelo LeagueUser
- Comissários têm acesso a **todas as ligas que gerenciam**

## Fluxo de Criação de Usuário

### Descrição

O processo de criação de usuários é restrito a comissários e permite a associação imediata a um time durante o cadastro.

### Passos do Fluxo

1. **Validação de Permissões**
   - Apenas usuários com role `COMMISSIONER` podem criar novos usuários
   - Verificação de autenticação via middleware

2. **Preenchimento do Formulário**
   - Nome completo
   - Login único (não pode ser alterado posteriormente)
   - Email único
   - Senha (mínimo 6 caracteres)
   - Role: `USER` ou `COMMISSIONER`
   - Seleção de time (obrigatório para usuários, opcional para comissários)

3. **Validações**
   - Unicidade de email e login
   - Força da senha
   - Disponibilidade do time selecionado
   - Obrigatoriedade de time para usuários comuns

4. **Criação do Usuário**
   - Hash da senha com bcrypt
   - Criação do registro na tabela `users`
   - Timestamps automáticos (createdAt, updatedAt)

5. **Associação ao Time** (se selecionado)
   - Atualização do campo `teams.ownerId` com o ID do usuário
   - Criação de registro em `LeagueUser` para dar acesso à liga
   - Log de auditoria da operação

### Exemplo de Payload (Request)

```json
{
  "name": "João Silva",
  "login": "joao.silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "role": "USER",
  "teamId": "team_123"
}
```

### Exemplo de Response (Sucesso)

```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "user_456",
    "name": "João Silva",
    "login": "joao.silva",
    "email": "joao@exemplo.com",
    "role": "USER",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Fluxo de Edição de Usuário

### Descrição

A edição permite alterar todas as informações do usuário, incluindo senha, perfil, status e associação de time, com tratamento automático de permissões de liga.

### Campos Editáveis

- **Nome**: Pode ser alterado
- **Login**: **NÃO** pode ser alterado (campo desabilitado)
- **Email**: Pode ser alterado (com validação de unicidade)
- **Senha**: Opcional - se fornecida, será atualizada
- **Role**: Pode ser alterado entre `USER` e `COMMISSIONER`
- **Status**: Ativo/Inativo
- **Time**: Pode ser alterado, removido ou adicionado

### Passos do Fluxo

1. **Carregamento dos Dados**
   - Busca do usuário existente com times associados
   - Carregamento de times disponíveis (incluindo o atual se houver)

2. **Validações**
   - Permissões de comissário
   - Unicidade de email (se alterado)
   - Força da senha (se fornecida)
   - Disponibilidade do novo time (se selecionado)
   - Prevenção de auto-desativação

3. **Gerenciamento de Associação de Times**

   **Cenário 1: Remoção de Time**
   - Remove `ownerId` do time atual
   - Remove usuário da liga correspondente
   - Log de auditoria

   **Cenário 2: Troca de Time**
   - Remove associação do time anterior
   - Remove usuário da liga anterior
   - Associa ao novo time
   - Adiciona usuário à nova liga
   - Log de auditoria

   **Cenário 3: Mudança para Comissário**
   - Remove associação de qualquer time
   - Mantém acesso às ligas que gerencia

4. **Atualização do Usuário**
   - Hash da nova senha (se fornecida)
   - Atualização dos campos alterados
   - Timestamp de updatedAt

### Exemplo de Payload (Request)

```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@exemplo.com",
  "password": "novaSenha123",
  "role": "USER",
  "isActive": true,
  "teamId": "team_789"
}
```

### Exemplo de Response (Sucesso)

```json
{
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": "user_456",
    "name": "João Silva Santos",
    "login": "joao.silva",
    "email": "joao.santos@exemplo.com",
    "role": "USER",
    "isActive": true,
    "updatedAt": "2024-01-15T14:30:00.000Z",
    "teams": [
      {
        "id": "team_789",
        "name": "Novo Time",
        "league": {
          "id": "league_123",
          "name": "Liga Principal"
        }
      }
    ]
  }
}
```

## Atualização de teams.ownerId e Permissões de Liga

### Processo de Associação

1. **Verificação de Disponibilidade**
   - Time deve existir
   - Time não deve ter outro proprietário
   - Usuário não deve ter outro time (regra de negócio)

2. **Atualização do Time**

   ```sql
   UPDATE teams SET ownerId = 'user_id', updatedAt = NOW() WHERE id = 'team_id'
   ```

3. **Criação/Atualização de Membro da Liga**
   ```sql
   INSERT INTO league_users (leagueId, userId, role, createdAt, updatedAt)
   VALUES ('league_id', 'user_id', 'MEMBER', NOW(), NOW())
   ON CONFLICT (leagueId, userId) DO UPDATE SET updatedAt = NOW()
   ```

### Processo de Desassociação

1. **Remoção do Proprietário**

   ```sql
   UPDATE teams SET ownerId = NULL, updatedAt = NOW() WHERE ownerId = 'user_id'
   ```

2. **Remoção da Liga** (se não for comissário)
   ```sql
   DELETE FROM league_users WHERE userId = 'user_id' AND leagueId IN (team_leagues)
   ```

## Tratamento de Múltiplos Comissários e Status de Usuário

### Comissários

- **Acesso Total**: Comissários têm acesso a todas as ligas que gerenciam
- **Sem Restrição de Time**: Podem não ter time associado
- **Múltiplas Ligas**: Podem gerenciar várias ligas simultaneamente
- **Permissões Especiais**: Criar/editar usuários, importar dados, etc.

### Status de Usuário

- **Ativo**: Pode fazer login e acessar o sistema
- **Inativo**: Login bloqueado, mas dados preservados
- **Proteção**: Usuário não pode desativar a si mesmo

### Regras de Negócio

1. **Um usuário = Um time**: Usuários comuns podem ter apenas um time
2. **Um time = Um proprietário**: Times podem ter apenas um proprietário
3. **Comissários livres**: Comissários não precisam de time associado
4. **Acesso automático**: Associação a time garante acesso à liga
5. **Preservação de dados**: Desativação não remove dados, apenas bloqueia acesso

## Orientações sobre Branch/Versionamento

### Branch Criada

- **Nome**: `feature/implementa-fluxo-usuario-team-association`
- **Base**: `main`
- **Tipo**: Feature branch seguindo GitFlow

### Arquivos Modificados

1. **Schema do Banco**
   - `prisma/schema.prisma`: Adicionado modelo LeagueUser
   - Migração: `20250702162102_adiciona_league_user`

2. **APIs**
   - `src/app/api/auth/register/route.ts`: Criação com associação
   - `src/app/api/users/[id]/route.ts`: Edição completa
   - `src/app/api/teams/[teamId]/associate-user/route.ts`: API auxiliar

3. **Componentes**
   - `src/components/admin/CreateUserForm.tsx`: Formulário de criação
   - `src/components/admin/EditUserForm.tsx`: Formulário de edição (novo)
   - `src/app/admin/page.tsx`: Página administrativa atualizada

4. **Documentação**
   - `docs/FluxoGerenciamentoUsuarios.md`: Este documento

### Processo de Merge

1. **Testes**: Validar todas as funcionalidades
2. **Code Review**: Revisão por outro desenvolvedor
3. **Merge para Develop**: Integração com outras features
4. **Deploy para Staging**: Testes em ambiente similar à produção
5. **Merge para Main**: Release para produção

## Sugestão de Logging/Auditoria

### Logs Implementados

```javascript
// Criação de usuário com time
console.log(
  `[AUDIT] Usuário ${user.id} (${user.name}) criado e associado ao time ${teamId} (${team.name}) na liga ${team.leagueId}`,
);

// Edição - Desassociação
console.log(`[AUDIT] Usuário ${userId} (${existingUser.name}) desassociado de todos os times`);

// Edição - Nova associação
console.log(
  `[AUDIT] Usuário ${userId} (${existingUser.name}) associado ao time ${teamId} (${newTeam.name}) na liga ${newTeam.leagueId}`,
);
```

### Melhorias Futuras

1. **Tabela de Auditoria**

   ```sql
   CREATE TABLE audit_logs (
     id VARCHAR PRIMARY KEY,
     userId VARCHAR,
     action VARCHAR, -- 'CREATE_USER', 'UPDATE_USER', 'ASSOCIATE_TEAM', etc.
     entityType VARCHAR, -- 'USER', 'TEAM', 'LEAGUE'
     entityId VARCHAR,
     oldValues JSON,
     newValues JSON,
     timestamp TIMESTAMP,
     performedBy VARCHAR
   );
   ```

2. **Middleware de Auditoria**
   - Interceptar todas as operações sensíveis
   - Registrar automaticamente em tabela estruturada
   - Incluir IP, user-agent, etc.

3. **Dashboard de Auditoria**
   - Interface para visualizar logs
   - Filtros por usuário, ação, período
   - Exportação de relatórios

## Exemplos de Uso

### Cenário 1: Criação de Usuário Comum

```bash
# Request
POST /api/auth/register
{
  "name": "Maria Santos",
  "login": "maria.santos",
  "email": "maria@exemplo.com",
  "password": "senha123",
  "role": "USER",
  "teamId": "team_abc"
}

# Resultado:
# 1. Usuário criado na tabela users
# 2. Campo teams.ownerId atualizado para team_abc
# 3. Registro criado em league_users
# 4. Log de auditoria gerado
```

### Cenário 2: Edição com Troca de Time

```bash
# Request
PATCH /api/users/user_456
{
  "name": "João Silva Santos",
  "teamId": "team_xyz"
}

# Resultado:
# 1. Remove ownerId do time anterior
# 2. Remove usuário da liga anterior
# 3. Associa ao novo time (team_xyz)
# 4. Adiciona usuário à nova liga
# 5. Logs de auditoria para ambas operações
```

### Cenário 3: Promoção para Comissário

```bash
# Request
PATCH /api/users/user_456
{
  "role": "COMMISSIONER",
  "teamId": null
}

# Resultado:
# 1. Remove associação de time
# 2. Remove da liga como membro
# 3. Mantém acesso como comissário (se aplicável)
# 4. Log de auditoria da mudança de role
```

## Critérios de Qualidade Atendidos

✅ **Associação Correta**: Time selecionado recebe ownerId do usuário

✅ **Regra de Um Time**: Usuário pode ter apenas um time, troca desassocia do anterior

✅ **Permissão Automática**: Usuário ganha acesso à liga do time automaticamente

✅ **Edição Completa**: Perfis, status, senha e time podem ser alterados

✅ **Branch Nova**: Todas as alterações em feature branch

✅ **Logging/Auditoria**: Logs estruturados para todas as operações sensíveis

✅ **Validação de Importação**: APIs de importação/sincronização não alteram ownerId

## Considerações de Segurança

1. **Autenticação**: Todas as operações requerem login
2. **Autorização**: Apenas comissários podem gerenciar usuários
3. **Validação**: Dados validados antes de persistir
4. **Hash de Senha**: bcrypt com salt rounds 12
5. **Prevenção de Auto-sabotagem**: Usuário não pode se desativar
6. **Logs de Auditoria**: Rastreabilidade de todas as alterações

## Próximos Passos

1. **Testes Automatizados**: Criar testes unitários e de integração
2. **Interface Melhorada**: Aprimorar UX dos formulários
3. **Validações Avançadas**: Regras de negócio mais complexas
4. **Notificações**: Alertas por email para mudanças importantes
5. **Relatórios**: Dashboard com métricas de usuários e times
6. **API de Auditoria**: Endpoint para consultar logs de auditoria
