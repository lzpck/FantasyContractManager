# Fantasy Contract Manager

Sistema avançado de gerenciamento de contratos e salary cap para ligas de fantasy football, inspirado nas regras da liga _The Bad Place_.

## 📋 Sobre o Projeto

Este sistema automatiza todo o ciclo de vida dos contratos de jogadores em ligas de fantasy football, promovendo realismo, estratégia e diversão, além de eliminar planilhas manuais e processos trabalhosos.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 15 + React 19
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS 4
- **Linting**: ESLint
- **Versionamento**: Git

## 🎯 Funcionalidades Principais

- ✅ Gerenciamento completo de contratos de jogadores
- ✅ Sistema de salary cap automático
- ✅ Cálculo de dead money
- ✅ Extensões de contrato e franchise tags
- ✅ Rookie draft com contratos automáticos
- ✅ Sistema de waivers e free agency
- ✅ Integração com plataforma Sleeper
- ✅ Relatórios e análises detalhadas

## 🛠️ Instalação e Execução

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd FantasyContractManager
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 👥 Usuários Padrão

Após executar `npm run db:seed`, o sistema cria automaticamente dois usuários
para facilitar o primeiro acesso:

- **Administrador**: `admin@admin.com` / senha `admin`
- **Demonstração**: `demo@demo.com` / senha `demo`

Utilize a conta de administrador para realizar o primeiro login e cadastrar
novos usuários reais.

## 📁 Estrutura do Projeto

```
src/
├── app/                 # App Router do Next.js
├── components/          # Componentes reutilizáveis
├── lib/                 # Utilitários e configurações
├── types/               # Definições de tipos TypeScript
└── styles/              # Estilos globais
```

## 🎮 Regras da Liga

O sistema segue fielmente as regras detalhadas no arquivo `project_rules.md`, incluindo:

- Contratos de 1-4 anos com aumentos automáticos de 15%
- Sistema de salary cap com dead money
- Extensões de contrato e franchise tags
- Rookie draft com tabela salarial oficial
- Waivers via FAAB

## 🛠️ Qualidade de Código

O projeto utiliza ferramentas modernas para garantir consistência e qualidade:

### **Formatação e Linting**

- **Prettier**: Formatação automática de código
- **ESLint**: Análise estática e detecção de problemas
- **Husky + lint-staged**: Hooks de pre-commit automáticos

### **Scripts Disponíveis**

```bash
# Formatação
npm run format          # Formatar todos os arquivos
npm run format:check    # Verificar formatação

# Linting
npm run lint           # Executar ESLint com correções automáticas
npm run lint:check     # Verificar problemas sem corrigir
```

### **Configurações**

- **`.prettierrc`**: Regras de formatação (single quotes, trailing commas, etc.)
- **`eslint.config.mjs`**: Configuração do ESLint integrada com Prettier
- **`.husky/pre-commit`**: Hook que executa lint e format antes de cada commit

## 🤝 Contribuição

Este projeto segue as melhores práticas de desenvolvimento:

- Commits atômicos e descritivos
- Padrão GitFlow (main/dev/feature branches)
- Código limpo e bem documentado
- Formatação automática via Prettier
- Linting obrigatório via ESLint
- Testes unitários e de integração

## 📄 Licença

Este projeto é privado e destinado ao uso da liga _The Bad Place_.

---

**Desenvolvido com ❤️ para a comunidade de fantasy football**
