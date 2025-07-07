# 🌍 Configuração de Múltiplos Ambientes

## Visão Geral

O Fantasy Contract Manager suporta múltiplos ambientes de banco de dados para facilitar o desenvolvimento e deploy. Utilizamos a plataforma **Neon** com branches separadas para cada ambiente.

## 📁 Estrutura de Arquivos

```
├── .env                 # Configuração ativa (copiada de um dos ambientes)
├── .env.development     # Banco de desenvolvimento (Neon branch development)
├── .env.production      # Banco de produção (Neon branch main)
└── docs/
    └── MultiEnvironmentSetup.md  # Este arquivo
```

## 🗄️ Bancos Configurados

### Produção (Main Branch)
- **Host**: `ep-old-violet-acwdosej-pooler.sa-east-1.aws.neon.tech`
- **Database**: `fantasy_contract_manager`
- **Uso**: Deploy em produção, testes finais

### Desenvolvimento (Development Branch)
- **Host**: `ep-tight-mountain-ac5ljfzf-pooler.sa-east-1.aws.neon.tech`
- **Database**: `fantasy_contract_manager_development`
- **Uso**: Desenvolvimento local, testes de features

## 🚀 Como Usar

### Método 1: Scripts NPM (Recomendado)

```bash
# Desenvolvimento
npm run dev:development          # Inicia servidor de desenvolvimento
npm run db:push:development      # Aplica schema ao banco de desenvolvimento
npm run db:seed:development      # Popula banco de desenvolvimento
npm run db:reset:development     # Reset completo do banco de desenvolvimento

# Produção
npm run dev:production           # Inicia servidor com banco de produção
npm run db:push:production       # Aplica schema ao banco de produção
npm run db:seed:production       # Popula banco de produção
npm run db:reset:production      # Reset completo do banco de produção
```

### Método 2: Cópia Manual

```bash
# Para desenvolvimento (Windows)
copy .env.development .env
npm run dev

# Para desenvolvimento (Linux/Mac)
cp .env.development .env
npm run dev

# Para produção (Windows)
copy .env.production .env
npm run dev

# Para produção (Linux/Mac)
cp .env.production .env
npm run dev
```

### Método 3: Edição Direta

Edite o arquivo `.env` e copie o conteúdo do ambiente desejado:
- De `.env.development` para desenvolvimento
- De `.env.production` para produção

## 🔧 Comandos Úteis

### Verificar Conexão
```bash
# Verificar qual banco está ativo
npx prisma db pull

# Visualizar dados no Prisma Studio
npx prisma studio
```

### Sincronização de Schema
```bash
# Aplicar mudanças no schema (development)
npm run db:push:development

# Aplicar mudanças no schema (production)
npm run db:push:production
```

### Backup e Restore
```bash
# Fazer backup dos dados (manual via Prisma Studio ou pg_dump)
# Restaurar dados (manual via psql ou Prisma Studio)
```

## ⚠️ Boas Práticas

1. **Sempre use desenvolvimento para testes**
   - Nunca teste features diretamente em produção
   - Use `npm run dev:development` para desenvolvimento local

2. **Confirme o ambiente antes de operações críticas**
   - Verifique o arquivo `.env` antes de fazer seed ou reset
   - Use os scripts específicos para evitar erros

3. **Mantenha os ambientes sincronizados**
   - Aplique mudanças de schema em ambos os ambientes
   - Teste migrações primeiro em desenvolvimento

4. **Backup regular**
   - Faça backup do banco de produção regularmente
   - Mantenha backups antes de mudanças importantes

## 🔐 Segurança

- As credenciais estão nos arquivos `.env*` que são ignorados pelo Git
- Nunca commite credenciais de banco no repositório
- Use variáveis de ambiente no deploy (Vercel, Railway, etc.)

## 🆘 Troubleshooting

### Erro de Conexão
```bash
# Verificar se o arquivo .env está correto
cat .env | grep DATABASE_URL

# Testar conexão
npx prisma db pull
```

### Schema Desatualizado
```bash
# Regenerar cliente Prisma
npx prisma generate

# Aplicar schema
npx prisma db push
```

### Dados Corrompidos
```bash
# Reset completo (CUIDADO!)
npm run db:reset:development  # Só em desenvolvimento!
```

## 📞 Suporte

Em caso de problemas:
1. Verifique este documento
2. Consulte a documentação do Prisma
3. Verifique os logs do Neon
4. Entre em contato com a equipe de desenvolvimento