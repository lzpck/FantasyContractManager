# Fantasy Contract Manager

Sistema avançado de gerenciamento de contratos e salary cap para ligas de fantasy football, inspirado nas regras da liga *The Bad Place*.

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

## 🤝 Contribuição

Este projeto segue as melhores práticas de desenvolvimento:

- Commits atômicos e descritivos
- Padrão GitFlow (main/dev/feature branches)
- Código limpo e bem documentado
- Testes unitários e de integração

## 📄 Licença

Este projeto é privado e destinado ao uso da liga *The Bad Place*.

---

**Desenvolvido com ❤️ para a comunidade de fantasy football**
