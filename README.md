# Fantasy Contract Manager

<div align="center">

![Fantasy Football](https://img.shields.io/badge/Fantasy-Football-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)

**Sistema avançado de gerenciamento de contratos e salary cap para ligas de fantasy football**

_Inspirado nas regras da liga The Bad Place_

</div>

## 📑 Índice

- [📋 Sobre o Projeto](#-sobre-o-projeto)
- [🚀 Stack Tecnológica](#-stack-tecnológica)
- [🎯 Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Instalação e Execução](#️-instalação-e-execução)
- [🔄 Sincronização com Sleeper](#-sincronização-com-sleeper)
- [📊 Gerenciamento de Times](#-gerenciamento-de-times)
- [👥 Usuários Padrão](#-usuários-padrão)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🎮 Regras da Liga](#-regras-da-liga)
- [🛠️ Qualidade de Código](#️-qualidade-de-código)
- [🔒 Segurança e Performance](#-segurança-e-performance)
- [🤝 Contribuição](#-contribuição)
- [🚀 Deploy e Produção](#-deploy-e-produção)
- [🗺️ Roadmap](#️-roadmap)
- [📄 Licença](#-licença)

Uma solução completa que automatiza todo o ciclo de vida dos contratos de jogadores, promovendo realismo, estratégia e diversão.

## 📋 Sobre o Projeto

O Fantasy Contract Manager é uma aplicação web moderna que elimina planilhas manuais e processos trabalhosos no gerenciamento de ligas de fantasy football. O sistema implementa regras complexas de contratos, salary cap, dead money e transações, oferecendo uma experiência profissional similar às ligas reais da NFL.

### 🎯 Principais Diferenciais

- **Automação Completa**: Cálculos automáticos de salary cap, dead money e aumentos salariais
- **Integração Sleeper**: Sincronização automática com a plataforma Sleeper
- **Regras Customizáveis**: Configurações flexíveis para diferentes tipos de liga
- **Interface Moderna**: Design responsivo e intuitivo com tema dark
- **Auditoria Completa**: Histórico detalhado de todas as transações

## 🚀 Stack Tecnológica

### **Frontend & Framework**

- **Next.js 15**: Framework React com App Router e Turbopack
- **React 19**: Biblioteca de interface com hooks modernos
- **TypeScript 5**: Tipagem estática para maior segurança
- **TailwindCSS 4**: Framework CSS utilitário para estilização

### **Backend & Banco de Dados**

- **Prisma 6**: ORM moderno com SQLite
- **NextAuth.js**: Autenticação segura com múltiplos provedores
- **API Routes**: Endpoints RESTful integrados ao Next.js

### **UI & Experiência**

- **Radix UI**: Componentes acessíveis e customizáveis
- **Lucide React**: Ícones modernos e consistentes
- **Recharts**: Gráficos interativos para análises
- **Sonner**: Sistema de notificações elegante
- **Next Themes**: Suporte a temas dark/light

### **Qualidade & Desenvolvimento**

- **ESLint 9**: Análise estática de código
- **Prettier**: Formatação automática
- **Husky**: Git hooks para qualidade
- **Jest**: Testes unitários e integração
- **TypeScript**: Tipagem completa do projeto

## 🎯 Funcionalidades Principais

### **💼 Gerenciamento de Contratos**

- ✅ **Contratos Automáticos**: Criação e gestão de contratos de 1-4 anos
- ✅ **Aumentos Salariais**: Incremento automático de 15% por temporada
- ✅ **Extensões**: Sistema de extensão para jogadores no último ano
- ✅ **Franchise Tags**: Aplicação de tags com cálculo automático de valor
- ✅ **Histórico Completo**: Rastreamento de todas as mudanças contratuais

### **💰 Salary Cap & Finanças**

- ✅ **Salary Cap Dinâmico**: Monitoramento em tempo real do teto salarial
- ✅ **Dead Money Configurável**: Sistema flexível de penalidades por cortes
- ✅ **Projeções Futuras**: Análise de impacto financeiro para próximas temporadas
- ✅ **Relatórios Detalhados**: Gráficos e análises de distribuição salarial

### **🏈 Integração Sleeper**

- ✅ **Sincronização Automática**: Importação de ligas, times e jogadores
- ✅ **Roster Management**: Gestão de elencos ativos, IR e taxi squad
- ✅ **Dados Atualizados**: Informações sempre sincronizadas com a plataforma

### **🎯 Rookie Draft & Aquisições**

- ✅ **Rookie Draft**: Sistema completo com tabela salarial oficial
- ✅ **Opção 4º Ano**: Gestão de opções para picks de primeira rodada
- ✅ **FAAB/Waivers**: Sistema de aquisições via leilão
- ✅ **Trades**: Validação automática de trocas considerando salary cap

### **⚙️ Configurações & Administração**

- ✅ **Regras Customizáveis**: Configuração flexível por liga
- ✅ **Perfis de Usuário**: Sistema de permissões (Comissário/Usuário)
- ✅ **Auditoria**: Log completo de todas as operações
- ✅ **Backup & Restore**: Proteção e recuperação de dados

### **🌐 Experiência do Usuário**

- ✅ **Interface Responsiva**: Design adaptável para desktop e mobile
- ✅ **Tema Dark**: Interface moderna com suporte a temas
- ✅ **Notificações**: Sistema de alertas para ações importantes
- ✅ **Fuso Horário BR**: Todas as datas em horário de Brasília (ISO 8601)

### **🤖 Integração com ChatGPT**

- ✅ **API Dedicada**: Endpoints específicos para consulta de dados
- ✅ **GPT Customizado**: Assistente especializado em negociações
- ✅ **Consultas em Tempo Real**: Acesso direto aos dados atualizados
- ✅ **Análises Automáticas**: Recomendações baseadas em dados reais
- ✅ **Segurança**: Autenticação via API Key para acesso controlado

> 📖 **Documentação Completa**: [ChatGPT Integration Guide](./docs/ChatGPTIntegration.md)

## 🛠️ Instalação e Execução

### **📦 Pré-requisitos**

- Node.js 18+
- npm ou yarn
- Git

### **🚀 Instalação Rápida**

1. **Clone o repositório:**

```bash
git clone <url-do-repositorio>
cd FantasyContractManager
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure o banco de dados:**

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# Popular com dados de demonstração
npm run db:seed
```

4. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
```

5. **Acesse a aplicação:**
   - Abra [http://localhost:3000](http://localhost:3000) no navegador
   - Use as credenciais padrão (ver seção "Usuários Padrão")

### **⚙️ Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento com Turbopack
npm run build            # Build de produção
npm start               # Servidor de produção

# Banco de Dados
npm run db:seed         # Popular banco com dados demo
npm run db:reset        # Reset completo + seed
npx prisma studio       # Interface visual do banco

# Qualidade de Código
npm run lint            # ESLint com correções automáticas
npm run lint:check      # Verificar problemas sem corrigir
npm run format          # Formatar código com Prettier
npm run format:check    # Verificar formatação

# Testes
npm test               # Executar testes
npm run test:watch     # Testes em modo watch

# Integração
npm run sync-sleeper   # Sincronizar dados do Sleeper
```

## 🔄 Sincronização com Sleeper

Para manter os dados atualizados com a plataforma Sleeper:

```bash
# Sincronizar dados de ligas, times e jogadores
npm run sync-sleeper
```

**Recomendação**: Execute este comando regularmente (diário ou semanal) para manter os dados sincronizados.

## 📊 Gerenciamento de Times

### Página de Detalhes do Time

A página `/leagues/[leagueId]/teams/[teamId]` oferece:

- **Cabeçalho Financeiro**: Salary Cap Total, Cap Usado, Cap Disponível, Dead Money
- **Estatísticas**: Jogadores Contratados, Contratos Expirando, Franchise Tags, Salário Médio
- **Gráficos**: Distribuição por Posição e Projeção de Salary Cap
- **Tabela de Jogadores**: Organizada por posição e status (Ativo, IR, Taxi Squad)
- **Ações de Contrato**: Editar, Adicionar Contrato, Liberar Jogador

### Filtros Disponíveis

- **Por Nome**: Busca por nome do jogador ou time NFL
- **Por Posição**: QB, RB, WR, TE, K, DL, LB, DB
- **Por Status**: Elenco Ativo, IR (Injured Reserve), Taxi Squad

### Ações de Contrato

1. **Editar Contrato**: Modificar salário e anos restantes
2. **Liberar Jogador**: Cortar jogador (gera dead money automaticamente)
3. **Estender Contrato**: Disponível apenas no último ano do contrato
4. **Franchise Tag**: Aplicar tag de franquia (limitado por temporada)

## 👥 Usuários Padrão

Após executar `npm run db:seed`, o sistema cria automaticamente dois usuários
para facilitar o primeiro acesso:

- **Comissário**: `commissioner@demo.com` / senha `commissioner`
- **Demonstração**: `demo@demo.com` / senha `demo`

Utilize a conta de comissário para realizar o primeiro login e cadastrar
novos usuários reais.

## 📁 Estrutura do Projeto

### **🏗️ Arquitetura Geral**

O projeto segue uma arquitetura modular baseada no App Router do Next.js 15, com separação clara de responsabilidades:

```
FantasyContractManager/
├── 📁 src/
│   ├── 📁 app/                    # App Router (Next.js 15)
│   │   ├── 📁 api/                # Endpoints da API
│   │   │   ├── 📁 auth/           # Autenticação NextAuth
│   │   │   ├── 📁 contracts/      # Gestão de contratos
│   │   │   ├── 📁 leagues/        # Operações de ligas
│   │   │   ├── 📁 players/        # Dados de jogadores
│   │   │   └── 📁 roster-transactions/ # Transações de elenco
│   │   ├── 📁 admin/              # Painel administrativo
│   │   ├── 📁 auth/               # Páginas de autenticação
│   │   ├── 📁 contracts/          # Interface de contratos
│   │   ├── 📁 dashboard/          # Dashboard principal
│   │   ├── 📁 leagues/            # Gestão de ligas
│   │   ├── 📁 players/            # Catálogo de jogadores
│   │   └── 📁 settings/           # Configurações
│   ├── 📁 components/             # Componentes React reutilizáveis
│   │   ├── 📁 admin/              # Componentes administrativos
│   │   ├── 📁 auth/               # Componentes de autenticação
│   │   ├── 📁 dashboard/          # Componentes do dashboard
│   │   ├── 📁 layout/             # Layout e navegação
│   │   ├── 📁 leagues/            # Componentes de ligas
│   │   ├── 📁 players/            # Componentes de jogadores
│   │   ├── 📁 providers/          # Context providers
│   │   ├── 📁 teams/              # Componentes de times
│   │   └── 📁 ui/                 # Componentes base (Radix UI)
│   ├── 📁 contexts/               # Context API para estado global
│   ├── 📁 hooks/                  # Custom hooks React
│   ├── 📁 lib/                    # Configurações e utilitários
│   ├── 📁 services/               # Serviços externos (Sleeper API)
│   ├── 📁 types/                  # Definições TypeScript
│   └── 📁 utils/                  # Funções utilitárias
├── 📁 prisma/                     # Schema e migrações do banco
├── 📁 scripts/                    # Scripts de manutenção
├── 📁 docs/                       # Documentação técnica
└── 📁 .trae/                      # Regras do projeto
```

### **🔧 Principais Diretórios**

- **`/app`**: Roteamento baseado em arquivos (App Router)
- **`/components`**: Componentes React organizados por funcionalidade
- **`/hooks`**: Lógica de negócio reutilizável
- **`/utils`**: Funções puras para cálculos e formatação
- **`/services`**: Integração com APIs externas
- **`/types`**: Tipagem TypeScript centralizada
- **`/prisma`**: Modelagem e migrações do banco de dados

## 🎮 Regras da Liga

O sistema implementa fielmente as regras complexas de fantasy football, baseadas na liga _The Bad Place_. Todas as regras estão detalhadas no arquivo <mcfile name="project_rules.md" path=".trae/rules/project_rules.md"></mcfile>.

### **📋 Regras Fundamentais**

#### **💼 Sistema de Contratos**

- **Duração**: Contratos de 1 a 4 anos
- **Aumentos Automáticos**: 15% ao ano (1º de abril)
- **Redução**: -1 ano por temporada
- **Limite**: Quantidade anual limitada e não acumulável

#### **🏷️ Extensões e Tags**

- **Extensão de Contrato**: Apenas no último ano, uma vez na carreira
- **Franchise Tag**: Após semana 17 até 1º abril, nunca usado antes
- **Valor da Tag**: Maior entre salário+15% ou média top 10 da posição
- **Limite**: 1 tag por temporada (configurável)

#### **💰 Salary Cap e Dead Money**

- **Teto Salarial**: Configurável por liga (ex: $279M)
- **Dead Money Atual**: 100% do salário do ano (configurável)
- **Dead Money Futuro**: 25% por ano restante (configurável)
- **Practice Squad**: Apenas 25% do salário atual

#### **🎯 Rookie Draft**

- **Formato**: 3 rodadas, ordem inversa da classificação
- **Contratos**: 3 anos automáticos
- **Opção 4º Ano**: Disponível para picks da 1ª rodada
- **Ativação**: 25% acima do 3º ano, decisão antes do 3º ano
- **Tabela Salarial**: Valores oficiais pré-definidos

#### **🔄 Waivers e Free Agency**

- **FAAB**: Lance vira salário do jogador
- **Limite**: Cap disponível do time
- **Não Disputado**: Contrato automático de $1M
- **Sem Cap**: Sem direito a waiver

### **⚙️ Configurações Flexíveis**

O sistema permite customização de várias regras:

- **Dead Money**: Percentuais configuráveis por temporada
- **Franchise Tags**: Limite por temporada
- **Salary Cap**: Valor total por liga
- **Aumentos**: Percentual anual (padrão 15%)
- **Data de Virada**: Quando aplicar aumentos (padrão 1º abril)

## 🛠️ Qualidade de Código

O projeto implementa as melhores práticas de desenvolvimento moderno:

### **🔍 Análise Estática**

- **ESLint 9**: Configuração moderna com regras do Next.js
- **TypeScript**: Tipagem estática completa
- **Prettier**: Formatação consistente e automática
- **Husky**: Git hooks para qualidade automática

### **🧪 Testes**

- **Jest**: Framework de testes unitários
- **ts-jest**: Suporte nativo ao TypeScript
- **Cobertura**: Testes para funções críticas de negócio

### **📋 Padrões de Código**

- **Commits Convencionais**: Mensagens padronizadas
- **GitFlow**: Branches organizadas (main/dev/feature)
- **Nomenclatura**: Padrão `tipo/descricao-da-tarefa`
- **Documentação**: JSDoc em funções complexas

### **⚙️ Configurações**

- <mcfile name=".prettierrc" path=".prettierrc"></mcfile>: Regras de formatação
- <mcfile name="eslint.config.mjs" path="eslint.config.mjs"></mcfile>: Configuração ESLint + Prettier
- <mcfile name=".husky/pre-commit" path=".husky/pre-commit"></mcfile>: Hooks automáticos
- <mcfile name="jest.config.js" path="jest.config.js"></mcfile>: Configuração de testes

## 🔒 Segurança e Performance

### **🛡️ Segurança**

- **NextAuth.js**: Autenticação segura com múltiplos provedores
- **Bcrypt**: Hash seguro de senhas
- **Validação Zod**: Validação de dados de entrada
- **CSRF Protection**: Proteção contra ataques CSRF
- **SQL Injection**: Prevenção via Prisma ORM

### **⚡ Performance**

- **Turbopack**: Build ultra-rápido (Next.js 15)
- **React 19**: Otimizações de renderização
- **SQLite**: Banco de dados leve e rápido
- **Static Generation**: Páginas estáticas quando possível
- **Code Splitting**: Carregamento otimizado de componentes

### **📊 Monitoramento**

- **Error Boundaries**: Captura de erros React
- **Logging**: Sistema de logs estruturado
- **Metrics**: Monitoramento de performance
- **Health Checks**: Verificação de saúde da aplicação

## 🤝 Contribuição

### **🔄 Fluxo de Desenvolvimento**

1. **Fork** o repositório
2. **Crie uma branch** seguindo o padrão: `tipo/descricao-da-tarefa`
   ```bash
   git checkout -b feature/nova-funcionalidade
   git checkout -b bugfix/corrige-erro-calculo
   git checkout -b refactor/otimiza-componente
   ```
3. **Desenvolva** seguindo os padrões do projeto
4. **Teste** suas alterações:
   ```bash
   npm run lint
   npm run format
   npm test
   ```
5. **Commit** com mensagens descritivas:
   ```bash
   git commit -m "feat: adiciona cálculo de franchise tag"
   git commit -m "fix: corrige erro no salary cap"
   ```
6. **Push** e abra um **Pull Request**

### **📋 Padrões de Contribuição**

- **Código**: TypeScript com tipagem completa
- **Testes**: Cobertura para novas funcionalidades
- **Documentação**: Atualizar README quando necessário
- **Commits**: Seguir padrão conventional commits
- **Code Review**: Todas as mudanças passam por revisão

## 🚀 Deploy e Produção

### **☁️ Vercel (Recomendado)**

```bash
# Build otimizado para Vercel
npm run build

# Configurações automáticas:
# - Next.js 15 com App Router
# - SQLite via Turso (produção)
# - Variáveis de ambiente seguras
```

### **🐳 Docker**

```bash
# Build da imagem
docker build -t fantasy-contract-manager .

# Executar container
docker run -p 3000:3000 fantasy-contract-manager
```

### **⚙️ Variáveis de Ambiente**

> ⚠️ **IMPORTANTE**: Nunca commite credenciais reais no repositório!

1. **Copie o arquivo de exemplo:**

```bash
cp .env.example .env.local  # Para desenvolvimento
# ou
cp .env.example .env        # Para produção
```

2. **Configure as variáveis necessárias:**

```env
# Banco de Dados
# Para desenvolvimento local (SQLite)
DATABASE_URL="file:./dev.db"

# Para produção (PostgreSQL) - SUBSTITUA pelos valores reais
# DATABASE_URL="postgresql://usuario:senha@host:porta/fantasy_contract_manager?sslmode=require&channel_binding=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-SUBSTITUA-POR-VALOR-SEGURO"

# Sleeper API
SLEEPER_API_URL="https://api.sleeper.app/v1"

# Ambiente
NODE_ENV="development"
```

3. **Gere um secret seguro para NextAuth:**

```bash
# Use um dos comandos abaixo para gerar um secret seguro
openssl rand -base64 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> 📖 **Mais detalhes**: Consulte o arquivo <mcfile name=".env.example" path=".env.example"></mcfile> para todas as opções disponíveis.

## 🗺️ Roadmap

### **🎯 Próximas Funcionalidades**

- [ ] **Mobile App**: Aplicativo React Native
- [ ] **Notificações Push**: Alertas em tempo real
- [ ] **API Pública**: Endpoints para integrações
- [ ] **Analytics Avançado**: Dashboard de estatísticas
- [ ] **Multi-idioma**: Suporte a inglês e espanhol
- [ ] **Backup Cloud**: Sincronização automática

### **🔧 Melhorias Técnicas**

- [ ] **Redis Cache**: Cache distribuído
- [ ] **PostgreSQL**: Migração para banco robusto
- [ ] **Microservices**: Arquitetura distribuída
- [ ] **GraphQL**: API mais flexível
- [ ] **WebSockets**: Atualizações em tempo real

## 📄 Licença

Este projeto é **privado** e destinado ao uso da liga _The Bad Place_ e comunidades de fantasy football autorizadas.

### **📞 Suporte**

- **Issues**: Reporte bugs via GitHub Issues
- **Documentação**: Consulte a pasta <mcfolder name="docs" path="docs"></mcfolder>
- **Comunidade**: Discord da liga para discussões

---

**Desenvolvido com ❤️ para a comunidade de fantasy football**  
_"Making fantasy football management as addictive as the game itself"_
