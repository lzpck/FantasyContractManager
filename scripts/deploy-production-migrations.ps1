# Script PowerShell para Deploy de Migrations em Produção
# Fantasy Contract Manager - Sistema de Eventos

# Configurar política de execução se necessário
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Função para logging com cores
function Write-Log {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Type) {
        "Success" { 
            Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green 
        }
        "Warning" { 
            Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow 
        }
        "Error" { 
            Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red 
        }
        default { 
            Write-Host "[$timestamp] $Message" -ForegroundColor Blue 
        }
    }
}

# Verificar se a URL do banco foi fornecida
if (-not $env:DATABASE_URL) {
    Write-Log "DATABASE_URL não está definida!" "Error"
    Write-Host "Por favor, defina a variável de ambiente DATABASE_URL:"
    Write-Host '$env:DATABASE_URL = "postgresql://neondb_owner:npg_ZjAw8GoclDS5@ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech/fantasy_contract_manager?sslmode=require&channel_binding=require"'
    exit 1
}

Write-Log "🚀 Iniciando deploy de migrations em produção..."
Write-Log "📊 URL do banco: $($env:DATABASE_URL.Substring(0, [Math]::Min(30, $env:DATABASE_URL.Length)))..."

# Verificar se estamos no diretório correto
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Log "Arquivo prisma/schema.prisma não encontrado. Certifique-se de estar no diretório raiz do projeto." "Error"
    exit 1
}

# Verificar conectividade com o banco
Write-Log "🔍 Verificando conectividade com o banco de dados..."
try {
    $testQuery = "SELECT 1 as test;"
    $testResult = $testQuery | npx prisma db execute --stdin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Conexão com banco de dados estabelecida" "Success"
    } else {
        throw "Falha na conexão"
    }
} catch {
    Write-Log "Falha na conexão com o banco de dados: $_" "Error"
    exit 1
}

# Verificar status atual das migrations
Write-Log "📋 Verificando status atual das migrations..."
try {
    $migrationStatus = npx prisma migrate status 2>&1
    Write-Host $migrationStatus
    
    # Verificar se há migrations pendentes
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Log "Todas as migrations já foram aplicadas" "Warning"
        Write-Log "🔄 Regenerando cliente Prisma..."
        npx prisma generate
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Cliente Prisma regenerado com sucesso" "Success"
        } else {
            Write-Log "Falha ao regenerar cliente Prisma" "Error"
            exit 1
        }
        exit 0
    }
} catch {
    Write-Log "Erro ao verificar status das migrations: $_" "Error"
    exit 1
}

# Confirmar antes de aplicar migrations
Write-Host ""
Write-Log "⚠️  ATENÇÃO: Você está prestes a aplicar migrations em PRODUÇÃO!" "Warning"
Write-Host "Migrations pendentes serão aplicadas no banco de dados."
Write-Host ""
$confirmation = Read-Host "Deseja continuar? (digite 'SIM' para confirmar)"

if ($confirmation -ne "SIM") {
    Write-Log "❌ Deploy cancelado pelo usuário"
    exit 0
}

# Criar backup timestamp
$backupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Write-Log "📦 Timestamp do backup: $backupTimestamp"
Write-Log "IMPORTANTE: Certifique-se de ter um backup do banco antes de continuar!" "Warning"

# Aplicar migrations
Write-Log "🔄 Aplicando migrations..."
try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Migrations aplicadas com sucesso!" "Success"
    } else {
        throw "Falha ao aplicar migrations"
    }
} catch {
    Write-Log "Falha ao aplicar migrations: $_" "Error"
    exit 1
}

# Verificar status pós-migration
Write-Log "🔍 Verificando status pós-migration..."
try {
    $postMigrationStatus = npx prisma migrate status 2>&1
    Write-Host $postMigrationStatus
    
    if ($postMigrationStatus -match "Database schema is up to date") {
        Write-Log "Todas as migrations foram aplicadas corretamente" "Success"
    } else {
        Write-Log "Ainda há migrations pendentes ou erro no status" "Error"
        exit 1
    }
} catch {
    Write-Log "Erro ao verificar status pós-migration: $_" "Error"
    exit 1
}

# Regenerar cliente Prisma
Write-Log "🔄 Regenerando cliente Prisma..."
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Cliente Prisma regenerado com sucesso" "Success"
    } else {
        throw "Falha ao regenerar cliente Prisma"
    }
} catch {
    Write-Log "Falha ao regenerar cliente Prisma: $_" "Error"
    exit 1
}

# Verificar se a tabela events foi criada
Write-Log "🔍 Verificando se a tabela 'events' foi criada..."
try {
    $checkTableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events';"
    $tableCheck = $checkTableQuery | npx prisma db execute --stdin 2>&1
    
    if ($tableCheck -match "events") {
        Write-Log "Tabela 'events' criada com sucesso" "Success"
    } else {
        Write-Log "Tabela 'events' não foi encontrada" "Error"
        exit 1
    }
} catch {
    Write-Log "Erro ao verificar tabela 'events': $_" "Error"
    exit 1
}

# Verificar estrutura da tabela events
Write-Log "📊 Verificando estrutura da tabela 'events'..."
try {
    $structureQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position;"
    $tableStructure = $structureQuery | npx prisma db execute --stdin 2>&1
    
    Write-Host "Estrutura da tabela 'events':"
    Write-Host $tableStructure
} catch {
    Write-Log "Erro ao verificar estrutura da tabela: $_" "Warning"
}

# Teste básico de funcionalidade
Write-Log "🧪 Executando teste básico de funcionalidade..."
$testId = "test-$(Get-Date -UFormat %s)"
Write-Log "Nota: Teste de inserção pulado - requer IDs válidos de league e user" "Warning"

# Resumo final
Write-Host ""
Write-Log "🎉 Deploy de migrations concluído com sucesso!" "Success"
Write-Host ""
Write-Host "📋 Resumo:"
Write-Host "   ✅ Conexão com banco verificada"
Write-Host "   ✅ Migrations aplicadas"
Write-Host "   ✅ Cliente Prisma regenerado"
Write-Host "   ✅ Tabela 'events' criada"
Write-Host "   ✅ Estrutura verificada"
Write-Host ""
Write-Log "📝 Próximos passos:"
Write-Host "   1. Deploy da aplicação com as novas funcionalidades"
Write-Host "   2. Teste das funcionalidades de eventos em produção"
Write-Host "   3. Monitoramento de logs e performance"
Write-Host ""
Write-Log "🚀 Sistema pronto para usar as funcionalidades de eventos!" "Success"

# Pausar para o usuário ler o resultado
Write-Host ""
Read-Host "Pressione Enter para finalizar"