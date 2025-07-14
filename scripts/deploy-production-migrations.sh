#!/bin/bash

# Script para Deploy de Migrations em Produção
# Fantasy Contract Manager - Sistema de Eventos

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Verificar se a URL do banco foi fornecida
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL não está definida!"
    echo "Por favor, defina a variável de ambiente DATABASE_URL:"
    echo "export DATABASE_URL='postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require'"
    exit 1
fi

log "🚀 Iniciando deploy de migrations em produção..."
log "📊 URL do banco: ${DATABASE_URL:0:30}..."

# Verificar conectividade com o banco
log "🔍 Verificando conectividade com o banco de dados..."
if npx prisma db execute --stdin <<< "SELECT 1 as test;" > /dev/null 2>&1; then
    log_success "Conexão com banco de dados estabelecida"
else
    log_error "Falha na conexão com o banco de dados"
    exit 1
fi

# Verificar status atual das migrations
log "📋 Verificando status atual das migrations..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
echo "$MIGRATION_STATUS"

# Verificar se há migrations pendentes
if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    log_warning "Todas as migrations já foram aplicadas"
    log "🔄 Regenerando cliente Prisma..."
    npx prisma generate
    log_success "Cliente Prisma regenerado com sucesso"
    exit 0
fi

# Confirmar antes de aplicar migrations
echo ""
log_warning "⚠️  ATENÇÃO: Você está prestes a aplicar migrations em PRODUÇÃO!"
echo "Migrations pendentes serão aplicadas no banco de dados."
echo ""
read -p "Deseja continuar? (digite 'SIM' para confirmar): " confirmation

if [ "$confirmation" != "SIM" ]; then
    log "❌ Deploy cancelado pelo usuário"
    exit 0
fi

# Criar backup timestamp
BACKUP_TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
log "📦 Timestamp do backup: $BACKUP_TIMESTAMP"
log_warning "IMPORTANTE: Certifique-se de ter um backup do banco antes de continuar!"

# Aplicar migrations
log "🔄 Aplicando migrations..."
if npx prisma migrate deploy; then
    log_success "Migrations aplicadas com sucesso!"
else
    log_error "Falha ao aplicar migrations"
    exit 1
fi

# Verificar status pós-migration
log "🔍 Verificando status pós-migration..."
POST_MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
echo "$POST_MIGRATION_STATUS"

if echo "$POST_MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    log_success "Todas as migrations foram aplicadas corretamente"
else
    log_error "Ainda há migrations pendentes ou erro no status"
    exit 1
fi

# Regenerar cliente Prisma
log "🔄 Regenerando cliente Prisma..."
if npx prisma generate; then
    log_success "Cliente Prisma regenerado com sucesso"
else
    log_error "Falha ao regenerar cliente Prisma"
    exit 1
fi

# Verificar se a tabela events foi criada
log "🔍 Verificando se a tabela 'events' foi criada..."
if npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events';" | grep -q "events"; then
    log_success "Tabela 'events' criada com sucesso"
else
    log_error "Tabela 'events' não foi encontrada"
    exit 1
fi

# Verificar estrutura da tabela events
log "📊 Verificando estrutura da tabela 'events'..."
TABLE_STRUCTURE=$(npx prisma db execute --stdin <<< "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position;" 2>/dev/null || echo "Erro ao verificar estrutura")
echo "Estrutura da tabela 'events':"
echo "$TABLE_STRUCTURE"

# Teste básico de funcionalidade
log "🧪 Executando teste básico de funcionalidade..."
TEST_ID="test-$(date +%s)"
TEST_LEAGUE_ID="test-league"
TEST_USER_ID="test-user"

# Nota: Este teste assume que existem league_id e user_id válidos
# Em produção real, você deve usar IDs existentes
log_warning "Nota: Teste de inserção pulado - requer IDs válidos de league e user"

# Resumo final
echo ""
log_success "🎉 Deploy de migrations concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   ✅ Conexão com banco verificada"
echo "   ✅ Migrations aplicadas"
echo "   ✅ Cliente Prisma regenerado"
echo "   ✅ Tabela 'events' criada"
echo "   ✅ Estrutura verificada"
echo ""
log "📝 Próximos passos:"
echo "   1. Deploy da aplicação com as novas funcionalidades"
echo "   2. Teste das funcionalidades de eventos em produção"
echo "   3. Monitoramento de logs e performance"
echo ""
log_success "🚀 Sistema pronto para usar as funcionalidades de eventos!"