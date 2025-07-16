# Guia de Aplicação de Migrations em Produção

## Resumo das Mudanças

A migration `20250714170754_adiciona_tabela_events` adiciona uma nova tabela `events` ao banco de dados sem modificar ou remover dados existentes. Esta é uma operação **SEGURA** que não causará perda de dados.

### O que será criado:

- Tabela `events` com campos para gerenciamento de eventos da liga
- Índices para otimização de consultas
- Chaves estrangeiras para integridade referencial

## Pré-requisitos

1. **Backup do banco de dados** (altamente recomendado)
2. **Acesso ao ambiente de produção**
3. **Variáveis de ambiente configuradas**

## Passo a Passo para Produção

### 1. Configurar Variável de Ambiente

```bash
# Defina a URL do banco de produção
export DATABASE_URL="postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require"
```

### 2. Verificar Status Atual das Migrations

```bash
# Verificar quais migrations já foram aplicadas
npx prisma migrate status
```

### 3. Aplicar as Migrations

```bash
# Aplicar todas as migrations pendentes
npx prisma migrate deploy
```

### 4. Verificar Aplicação

```bash
# Confirmar que todas as migrations foram aplicadas
npx prisma migrate status

# Verificar se a tabela foi criada corretamente
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events';"
```

### 5. Regenerar Cliente Prisma

```bash
# Regenerar o cliente Prisma para incluir os novos modelos
npx prisma generate
```

## Comando Completo para Produção

```bash
# Execute este comando único em produção
DATABASE_URL="postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require" npx prisma migrate deploy && npx prisma generate
```

## Verificações Pós-Migration

### 1. Verificar Estrutura da Tabela

```sql
-- Conecte ao banco e execute:
\d events

-- Ou usando Prisma:
npx prisma db execute --stdin <<< "\d events"
```

### 2. Testar Inserção de Dados

```sql
-- Teste básico de inserção (substitua os IDs por valores reais)
INSERT INTO events (id, "leagueId", name, description, "startDate", "endDate", "createdBy")
VALUES ('test-event-id', 'sua-league-id', 'Evento Teste', 'Descrição do teste', NOW(), NOW() + INTERVAL '1 day', 'seu-user-id');

-- Verificar se foi inserido
SELECT * FROM events WHERE name = 'Evento Teste';

-- Remover o teste
DELETE FROM events WHERE name = 'Evento Teste';
```

## Rollback (Se Necessário)

**⚠️ ATENÇÃO**: Como esta migration apenas adiciona uma tabela, o rollback é simples mas **IRREVERSÍVEL**:

```sql
-- CUIDADO: Isso removerá TODOS os dados da tabela events
DROP TABLE IF EXISTS events CASCADE;
```

## Considerações Importantes

### ✅ Segurança da Migration

- **Sem perda de dados**: Apenas adiciona nova tabela
- **Sem downtime**: Operação não bloqueia tabelas existentes
- **Reversível**: Pode ser desfeita removendo a tabela

### 🔧 Monitoramento

- Monitore logs da aplicação após deploy
- Verifique se as funcionalidades de eventos estão funcionando
- Confirme que não há erros relacionados ao banco de dados

### 📊 Performance

- A nova tabela não afeta performance de consultas existentes
- Índices foram criados para otimizar consultas de eventos

## Troubleshooting

### Erro: "Migration already applied"

```bash
# Se a migration já foi aplicada, apenas regenere o cliente
npx prisma generate
```

### Erro de Conexão

```bash
# Verifique se a URL está correta e acessível
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Erro de Permissões

```bash
# Verifique se o usuário tem permissões para criar tabelas
npx prisma db execute --stdin <<< "SELECT current_user, session_user;"
```

## Próximos Passos

1. **Deploy da aplicação** com as novas funcionalidades de eventos
2. **Teste das funcionalidades** em produção
3. **Monitoramento** de logs e performance
4. **Documentação** para usuários finais sobre as novas funcionalidades

---

**Data de criação**: $(date)
**Migration**: `20250714170754_adiciona_tabela_events`
**Status**: Pronto para produção ✅
