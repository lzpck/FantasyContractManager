# 🗄️ Configuração de Banco de Dados Local

## Visão Geral

Este guia explica como configurar e usar um banco de dados SQLite local para desenvolvimento e testes, permitindo trabalhar offline sem depender dos bancos remotos PostgreSQL.

## 📁 Arquivos Criados

### `.env.local`
```env
# Configuração para banco de dados local SQLite (para testes)
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-for-local-development"
NEXTAUTH_URL="http://localhost:3000"

# Configuração local para desenvolvimento
NODE_ENV="development"
```

### `prisma/schema.prisma.local`
Versão do schema Prisma configurada para SQLite, mantendo toda a estrutura do banco mas usando SQLite como provider.

## 🚀 Scripts NPM Disponíveis

### Desenvolvimento Local
```bash
# Iniciar aplicação com banco local
npm run dev:local
```

### Gerenciamento do Banco Local
```bash
# Aplicar schema no banco local
npm run db:push:local

# Criar usuário administrador no banco local
npm run db:seed:local

# Resetar banco local (apaga tudo e recria)
npm run db:reset:local

# Abrir Prisma Studio para banco local
npm run db:studio:local
```

### Restaurar Schema Original
```bash
# Restaurar schema.prisma original (PostgreSQL)
npm run restore:schema
```

## 🔄 Como Funciona

Cada script local executa as seguintes ações:
1. **Copia `.env.local` para `.env`** - Define configuração SQLite
2. **Copia `schema.prisma.local` para `schema.prisma`** - Usa schema SQLite
3. **Executa o comando Prisma** - Aplica a operação no banco local

## 📊 Banco de Dados

### Localização
- **Arquivo do banco**: `./dev.db` (raiz do projeto)
- **Tipo**: SQLite
- **Estrutura**: Idêntica ao PostgreSQL remoto

### Usuário Administrador Padrão
- **Login**: `admin`
- **Email**: `admin@system.com`
- **Senha**: `admin123`
- **Função**: `COMMISSIONER`

## 🛠️ Casos de Uso

### 1. Desenvolvimento Offline
```bash
# Configurar banco local
npm run db:reset:local

# Iniciar aplicação
npm run dev:local
```

### 2. Testes Locais
```bash
# Resetar dados para teste limpo
npm run db:reset:local

# Executar testes
npm test
```

### 3. Explorar Dados
```bash
# Abrir interface visual do banco
npm run db:studio:local
```

### 4. Voltar para Desenvolvimento Remoto
```bash
# Restaurar configuração original
npm run restore:schema

# Usar ambiente de desenvolvimento
npm run dev:development
```

## ⚠️ Importantes

### Diferenças SQLite vs PostgreSQL
- **Tipos de dados**: SQLite é mais flexível com tipos
- **Constraints**: Algumas constraints podem se comportar diferente
- **Performance**: SQLite é adequado para desenvolvimento, não produção

### Arquivos Temporários
- O comando local modifica `schema.prisma` e `.env`
- Use `npm run restore:schema` para voltar ao estado original
- Considere fazer commit antes de usar banco local

### Gitignore
- `dev.db` já está no `.gitignore`
- `.env.local` deve ser mantido local (não commitado)

## 🔧 Troubleshooting

### Erro: "Database file not found"
```bash
# Recriar banco do zero
npm run db:reset:local
```

### Erro: "Schema out of sync"
```bash
# Forçar sincronização
npm run db:push:local
```

### Erro: "Cannot find schema.prisma"
```bash
# Restaurar schema original
npm run restore:schema
```

### Voltar para PostgreSQL
```bash
# Restaurar schema
npm run restore:schema

# Usar ambiente desejado
npm run dev:development  # ou dev:production
```

## 📝 Próximos Passos

1. **Testar funcionalidades**: Use o banco local para testar novas features
2. **Desenvolver offline**: Trabalhe sem conexão com internet
3. **Testes automatizados**: Configure testes para usar banco local
4. **Backup de dados**: Considere fazer backup do `dev.db` se necessário

---

> **Dica**: O banco local é perfeito para desenvolvimento e testes. Para produção, sempre use PostgreSQL remoto.