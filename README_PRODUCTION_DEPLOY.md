# 🚀 Guia de Deploy em Produção - Sistema de Eventos

## 📋 Resumo

Este guia fornece instruções completas para aplicar as migrations do sistema de eventos em produção de forma segura e eficiente.

### ✨ Funcionalidades Adicionadas

- ✅ Sistema completo de gerenciamento de eventos
- ✅ Modal de criação/edição de eventos
- ✅ Modal de confirmação de exclusão
- ✅ Componente `ConfirmationModal` reutilizável
- ✅ API endpoints para CRUD de eventos
- ✅ Hook `useEvents` para gerenciamento de estado
- ✅ Integração com `@headlessui/react`

### 🗄️ Mudanças no Banco de Dados

- **Nova tabela**: `events`
- **Operação**: Apenas adição (sem modificação de dados existentes)
- **Segurança**: ✅ Zero risco de perda de dados
- **Downtime**: ✅ Zero downtime

---

## 🛠️ Opções de Deploy

### Opção 1: Script Automatizado (Recomendado)

#### Para Windows (PowerShell):

```powershell
# 1. Definir variável de ambiente
$env:DATABASE_URL = "postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require"

# 2. Executar script
.\scripts\deploy-production-migrations.ps1
```

#### Para Linux/Mac (Bash):

```bash
# 1. Definir variável de ambiente
export DATABASE_URL="postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require"

# 2. Dar permissão e executar
chmod +x scripts/deploy-production-migrations.sh
./scripts/deploy-production-migrations.sh
```

### Opção 2: Comandos Manuais

```bash
# 1. Definir variável de ambiente
export DATABASE_URL="postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require"

# 2. Verificar status atual
npx prisma migrate status

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. Regenerar cliente Prisma
npx prisma generate

# 5. Verificar resultado
npx prisma migrate status
```

---

## 🔍 Verificações Pós-Deploy

### 1. Verificar Tabela Criada

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'events';
```

### 2. Verificar Estrutura

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

### 3. Verificar Índices

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'events';
```

---

## 📊 Estrutura da Tabela Events

```sql
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE INDEX "events_leagueId_idx" ON "events"("leagueId");
CREATE INDEX "events_startDate_idx" ON "events"("startDate");

-- Chaves estrangeiras
ALTER TABLE "events" ADD CONSTRAINT "events_leagueId_fkey"
FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events" ADD CONSTRAINT "events_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 🧪 Teste de Funcionalidade

### 1. Teste de Inserção

```javascript
// Exemplo de uso da API
const response = await fetch('/api/leagues/[leagueId]/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Evento Teste',
    description: 'Descrição do evento',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(), // +1 dia
  }),
});
```

### 2. Teste de Listagem

```javascript
// Listar eventos da liga
const events = await fetch('/api/leagues/[leagueId]/events');
const eventsData = await events.json();
```

---

## 🔧 Troubleshooting

### Problema: Migration já aplicada

```bash
# Solução: Apenas regenerar cliente
npx prisma generate
```

### Problema: Erro de conexão

```bash
# Verificar conectividade
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Problema: Permissões insuficientes

```bash
# Verificar usuário atual
npx prisma db execute --stdin <<< "SELECT current_user, session_user;"
```

### Problema: Tabela não encontrada

```bash
# Verificar se migration foi aplicada
npx prisma migrate status

# Reaplicar se necessário
npx prisma migrate deploy
```

---

## 🔄 Rollback (Se Necessário)

**⚠️ CUIDADO**: O rollback removerá TODOS os dados de eventos!

```sql
-- Remover tabela (IRREVERSÍVEL)
DROP TABLE IF EXISTS "events" CASCADE;

-- Remover entrada da migration (se necessário)
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20250714170754_adiciona_tabela_events';
```

---

## 📈 Monitoramento Pós-Deploy

### 1. Logs da Aplicação

- Verificar se não há erros relacionados à tabela `events`
- Monitorar performance das consultas

### 2. Métricas do Banco

- Verificar uso de espaço em disco
- Monitorar performance dos índices

### 3. Funcionalidades

- Testar criação de eventos
- Testar edição de eventos
- Testar exclusão de eventos
- Verificar modais de confirmação

---

## 📝 Checklist de Deploy

- [ ] Backup do banco de dados realizado
- [ ] Variável `DATABASE_URL` configurada
- [ ] Conectividade com banco verificada
- [ ] Status das migrations verificado
- [ ] Migrations aplicadas com sucesso
- [ ] Cliente Prisma regenerado
- [ ] Tabela `events` criada e verificada
- [ ] Índices criados corretamente
- [ ] Chaves estrangeiras funcionando
- [ ] Teste básico de funcionalidade realizado
- [ ] Aplicação deployada com novas funcionalidades
- [ ] Monitoramento ativo

---

## 🎉 Próximos Passos

1. **Deploy da Aplicação**: Fazer deploy do código com as novas funcionalidades
2. **Teste em Produção**: Verificar todas as funcionalidades de eventos
3. **Documentação**: Atualizar documentação para usuários finais
4. **Treinamento**: Orientar usuários sobre as novas funcionalidades
5. **Monitoramento**: Acompanhar métricas e logs por alguns dias

---

## 📞 Suporte

Em caso de problemas durante o deploy:

1. Verificar logs detalhados dos scripts
2. Consultar seção de troubleshooting
3. Verificar documentação do Prisma
4. Em último caso, considerar rollback

---

**Data**: $(date)
**Versão**: 1.0
**Migration**: `20250714170754_adiciona_tabela_events`
**Status**: ✅ Pronto para produção
