# 🔒 Diretrizes de Segurança - Fantasy Contract Manager

## 📋 Índice

- [🎯 Objetivo](#-objetivo)
- [🚨 Regras Críticas](#-regras-críticas)
- [🔐 Gerenciamento de Credenciais](#-gerenciamento-de-credenciais)
- [📁 Estrutura de Arquivos de Ambiente](#-estrutura-de-arquivos-de-ambiente)
- [🛡️ Boas Práticas de Desenvolvimento](#️-boas-práticas-de-desenvolvimento)
- [🔍 Auditoria e Monitoramento](#-auditoria-e-monitoramento)
- [🚀 Deploy Seguro](#-deploy-seguro)
- [📝 Checklist de Segurança](#-checklist-de-segurança)

---

## 🎯 Objetivo

Este documento estabelece as diretrizes de segurança obrigatórias para o desenvolvimento e manutenção do Fantasy Contract Manager, com foco especial na proteção de credenciais e informações sensíveis.

---

## 🚨 Regras Críticas

### ❌ **NUNCA FAÇA**

1. **Commitar credenciais reais** em qualquer arquivo do repositório
2. **Hardcodar senhas, tokens ou chaves** diretamente no código
3. **Compartilhar arquivos `.env`** via chat, email ou outros meios inseguros
4. **Usar credenciais de produção** em ambiente de desenvolvimento
5. **Deixar logs com informações sensíveis** em produção

### ✅ **SEMPRE FAÇA**

1. **Use variáveis de ambiente** para todas as credenciais
2. **Mantenha o `.gitignore` atualizado** com padrões de arquivos sensíveis
3. **Rotacione credenciais** imediatamente após exposição
4. **Valide configurações** antes de fazer deploy
5. **Documente mudanças** de segurança no changelog

---

## 🔐 Gerenciamento de Credenciais

### **Tipos de Credenciais**

| Tipo                | Exemplo                          | Nível de Risco | Ação Requerida     |
| ------------------- | -------------------------------- | -------------- | ------------------ |
| **Database URLs**   | `postgresql://user:pass@host/db` | 🔴 CRÍTICO     | Rotação imediata   |
| **API Keys**        | `sk-1234567890abcdef`            | 🔴 CRÍTICO     | Rotação imediata   |
| **JWT Secrets**     | `NEXTAUTH_SECRET`                | 🟡 ALTO        | Rotação em 24h     |
| **OAuth Tokens**    | `github_pat_123`                 | 🟡 ALTO        | Revogação imediata |
| **Encryption Keys** | `AES256_KEY`                     | 🔴 CRÍTICO     | Rotação imediata   |

### **Geração de Secrets Seguros**

```bash
# NextAuth Secret (32 bytes)
openssl rand -base64 32

# Encryption Key (256-bit)
openssl rand -hex 32

# JWT Secret (recomendado)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# UUID v4 (para IDs únicos)
node -e "console.log(require('crypto').randomUUID())"
```

### **Rotação de Credenciais**

1. **Gere nova credencial** usando métodos seguros
2. **Atualize variável de ambiente** no serviço de deploy
3. **Teste a aplicação** com nova credencial
4. **Revogue credencial antiga** no provedor
5. **Documente a rotação** no log de segurança

---

## 📁 Estrutura de Arquivos de Ambiente

### **Arquivos Permitidos no Repositório**

```
✅ .env.example          # Template com valores de exemplo
✅ .env.template         # Template alternativo
✅ .gitignore           # Deve incluir padrões .env*
```

### **Arquivos PROIBIDOS no Repositório**

```
❌ .env                 # Arquivo de produção
❌ .env.local           # Arquivo de desenvolvimento
❌ .env.production      # Credenciais de produção
❌ .env.development     # Credenciais de desenvolvimento
❌ .env.staging         # Credenciais de staging
❌ config/secrets.json  # Arquivos de configuração com secrets
❌ *.key               # Chaves privadas
❌ *.pem               # Certificados
```

### **Padrões do .gitignore**

```gitignore
# Arquivos de ambiente
.env*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Arquivos de segurança
*.key
*.pem
*.p12
*.pfx
secrets/
config/production.json
config/staging.json

# Logs sensíveis
*.log
logs/

# Backups
*.backup
*.bak
*.sql
*.dump
```

---

## 🛡️ Boas Práticas de Desenvolvimento

### **Configuração de Ambiente**

1. **Use o arquivo `.env.example`** como base
2. **Copie para `.env.local`** para desenvolvimento
3. **Configure valores reais** apenas localmente
4. **Nunca commite** arquivos `.env` reais

```bash
# Configuração correta
cp .env.example .env.local
# Edite .env.local com valores reais
```

### **Validação de Configuração**

```typescript
// Exemplo de validação de ambiente
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente ${envVar} é obrigatória`);
  }
});
```

### **Logs Seguros**

```typescript
// ❌ NUNCA faça isso
console.log('Database URL:', process.env.DATABASE_URL);

// ✅ Faça isso
console.log('Database connected:', !!process.env.DATABASE_URL);

// ✅ Ou isso (mascarando)
const maskedUrl = process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@');
console.log('Database URL:', maskedUrl);
```

---

## 🔍 Auditoria e Monitoramento

### **Ferramentas de Auditoria**

```bash
# Buscar possíveis credenciais expostas
git log --all --full-history -- "*.env*"

# Verificar histórico de commits
git log -p --grep="password\|secret\|key\|token"

# Buscar padrões suspeitos
grep -r "postgresql://.*:.*@" . --exclude-dir=node_modules
grep -r "sk-[a-zA-Z0-9]" . --exclude-dir=node_modules
```

### **Scripts de Verificação**

```bash
#!/bin/bash
# check-security.sh

echo "🔍 Verificando exposição de credenciais..."

# Verificar se .env está no .gitignore
if ! grep -q "\.env" .gitignore; then
  echo "❌ .env não está no .gitignore"
  exit 1
fi

# Verificar se não há arquivos .env commitados
if git ls-files | grep -q "\.env$"; then
  echo "❌ Arquivo .env encontrado no repositório"
  exit 1
fi

echo "✅ Verificação de segurança passou"
```

### **Monitoramento Contínuo**

1. **GitHub Secret Scanning**: Ative no repositório
2. **Pre-commit Hooks**: Valide antes de commits
3. **CI/CD Checks**: Verifique em pipelines
4. **Dependency Scanning**: Monitore vulnerabilidades

---

## 🚀 Deploy Seguro

### **Variáveis de Ambiente em Produção**

#### **Vercel**

```bash
# Configurar via CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production

# Ou via dashboard
# https://vercel.com/dashboard/project/settings/environment-variables
```

#### **Docker**

```dockerfile
# Nunca inclua secrets no Dockerfile
# Use docker-compose.yml ou runtime env vars
```

#### **Kubernetes**

```yaml
# Use Secrets do Kubernetes
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: <base64-encoded-value>
```

### **Validação Pré-Deploy**

```bash
#!/bin/bash
# pre-deploy-check.sh

echo "🚀 Verificação pré-deploy..."

# Verificar se todas as env vars estão definidas
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Variável $var não está definida"
    exit 1
  fi
done

echo "✅ Todas as variáveis estão configuradas"
```

---

## 📝 Checklist de Segurança

### **Desenvolvimento**

- [ ] `.env.example` está atualizado com todas as variáveis necessárias
- [ ] `.gitignore` inclui todos os padrões de arquivos sensíveis
- [ ] Não há credenciais hardcoded no código
- [ ] Logs não expõem informações sensíveis
- [ ] Validação de variáveis de ambiente implementada

### **Deploy**

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Credenciais de produção são diferentes das de desenvolvimento
- [ ] Secrets são gerados com entropia suficiente
- [ ] Backup das configurações está seguro
- [ ] Monitoramento de segurança está ativo

### **Manutenção**

- [ ] Credenciais são rotacionadas regularmente
- [ ] Logs de acesso são monitorados
- [ ] Dependências são atualizadas
- [ ] Auditoria de segurança é executada mensalmente
- [ ] Documentação de segurança está atualizada

---

## 🆘 Resposta a Incidentes

### **Em Caso de Exposição de Credenciais**

1. **🚨 AÇÃO IMEDIATA**
   - Rotacione todas as credenciais expostas
   - Revogue tokens e chaves comprometidas
   - Monitore logs de acesso suspeito

2. **🔍 INVESTIGAÇÃO**
   - Identifique escopo da exposição
   - Verifique histórico de commits
   - Analise logs de acesso

3. **🛠️ REMEDIAÇÃO**
   - Remova credenciais do histórico Git
   - Atualize documentação
   - Implemente medidas preventivas

4. **📋 DOCUMENTAÇÃO**
   - Registre o incidente
   - Documente lições aprendidas
   - Atualize procedimentos

---

## 📞 Contatos de Emergência

- **Administrador do Sistema**: [contato-admin]
- **Equipe de Segurança**: [contato-security]
- **Suporte Vercel**: https://vercel.com/support
- **Suporte Neon**: https://neon.tech/docs/introduction/support

---

**Última atualização**: Janeiro 2025  
**Próxima revisão**: Abril 2025

> ⚠️ **Lembre-se**: A segurança é responsabilidade de todos. Em caso de dúvida, sempre opte pela opção mais segura.
