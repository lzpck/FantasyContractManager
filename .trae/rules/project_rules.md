# 📜 project_rules.md

## CONTEXTO

Este projeto é um sistema avançado de **gerenciamento de contratos e salary cap para ligas de fantasy football**, inspirado nas regras da liga _The Bad Place_ e seguindo padrões modernos de desenvolvimento. O objetivo é automatizar todo o ciclo de vida dos contratos de jogadores, promovendo realismo, estratégia e diversão, além de eliminar planilhas manuais e processos trabalhosos.

A aplicação será construída usando **Next.js, React, TypeScript** e **TailwindCSS**, com integração à plataforma **Sleeper**, persistência em banco de dados ou localStorage e deploy em ambiente cloud.  
O sistema deve refletir fielmente as regras da liga em toda a lógica de negócios, sendo robusto, seguro, escalável e fácil de usar.

---

## TAREFA

- **Desenvolver** o sistema conforme os requisitos e roteiros definidos nos documentos do projeto.
- **Aplicar fielmente todas as regras da liga** no gerenciamento de contratos, salary cap, dead money, waivers, rookie draft, extensões e tags.
- **Manter a qualidade e organização** do código, documentação, versionamento e apresentação.

---

## INSTRUÇÕES ESPECÍFICAS

### 1. **Regras de Contratos**

- Cada jogador adquirido no leilão recebe contrato de **1 a 4 anos** e valor inicial em milhões (leilão, FAAB ou rookie draft).
- **Aumentos salariais automáticos de 15%** a cada virada de temporada (1º de abril).
- Contratos reduzem 1 ano a cada temporada.
- No último ano, jogador pode receber **Extensão de Contrato** (negociação direta) ou **Franchise Tag** (segura por +1 ano, custo máximo entre salário +15% ou média top 10 posição).
- **Contratos são “use ou perca”**: quantidade anual de contratos novos é limitada e não acumulável.

### 2. **Extensão de Contrato**

- Só pode ser aplicada **quando o jogador entra no último ano de contrato**.
- Só pode ser estendido uma vez na carreira.
- A extensão é negociada (1-4 anos), entra em vigor no ano seguinte com novo salário, e segue recebendo 15% de aumento anual.
- Negociações devem ser públicas (transparência no grupo da liga).

### 3. **Franchise Tag**

- Pode ser aplicada após a semana 17 até 1º de abril.
- Só pode ser usada se o jogador nunca foi tagueado antes.
- Valor: maior entre o salário do jogador +15% ou a média dos 10 mais caros da posição.
- Só pode usar 1 tag por temporada (ajustável por configuração).

### 4. **Salary Cap**

- Cada liga define um teto salarial (ex: $279.000.000).
- Todos os contratos, movimentos (trade, FA, draft) e aumentos anuais afetam o cap.
- O saldo de cap é único para todas as operações (não há FAAB separado).

### 5. **Dead Money**

- Ao cortar um jogador, o salário daquele ano vira dead money e pesa no cap.
- Para anos restantes, paga 25% do salário por ano restante na temporada seguinte.
- Jogadores cortados do practice squad: paga só 25% do salário no ano corrente, zero no próximo.
- Dead money some após a temporada seguinte.

### 6. **Rookie Draft**

- 3 rodadas, ordem inversa da classificação.
- Contrato automático de 3 anos (opção de 4º ano para picks do 1º round).
- Salários dos rookies seguem a tabela oficial (ver README ou sistema).
- Ativação do 4º ano: 25% acima do 3º ano, decisão antes do início do 3º ano.

### 7. **Waivers & Free Agency**

- Contratação via FAAB: lance vira o salário do jogador.
- Cap máximo para waiver = cap disponível.
- Jogador não disputado: contrato de $1.000.000.
- Sem cap, sem waiver.

### 8. **Boas Práticas de Código e Versionamento**

- Seguir arquitetura modular, separação de responsabilidades (camadas).
- **Context API para estado global.**
- **Commits atômicos e descritivos**, padrão GitFlow (main/dev/feature branches).
- **Nomenclatura de Branches**: Sempre criar branches seguindo o padrão `tipo/descricao-da-tarefa` (ex: `feature/implementa-autenticacao`, `bugfix/corrige-erro-login`, `refactor/otimiza-calculo-cap`).
- **Fluxo de Trabalho**: Antes de iniciar qualquer modificação no código, deve-se criar uma nova branch seguindo o padrão estabelecido, garantindo que o trabalho seja realizado de forma isolada da branch principal.
- **Documentação detalhada no README.md.**
- **Testes unitários e integração** para funções críticas.
- Tratar erros e exceções (principalmente nas integrações externas).
- Versionamento automático de schema (Prisma ou migrations).
- Transparência e registro de todas as alterações relevantes em contratos (auditoria).

### 9. **Design e Usabilidade**

- Frontend responsivo e acessível (WCAG 2.1).
- Visual moderno (usar TailwindCSS/styled-components).
- Navegação clara (dashboard, ligas, times, contratos, análise, config).
- Feedback ao usuário em todas as ações (sucesso, erro, etc).

### 10. **Segurança**

- Autenticação segura (NextAuth/JWT/multi-fator).
- Criptografia de dados sensíveis.
- Compliance LGPD.

---

## FORMATO DE SAÍDA

- **Todos os cálculos, simulações e movimentos devem respeitar rigorosamente as regras da liga.**
- **Alertas e avisos claros** sobre vencimento de contratos, cap próximo do limite, erros de operação.
- **Relatórios e gráficos** com visão consolidada do salary cap, contratos, dead money e projeções.
- **Exportação de dados** em CSV/PDF opcional.
- **Documentação sempre atualizada** em README.md e project_rules.md.

---

## CRITÉRIOS DE QUALIDADE

- **Conformidade com as regras oficiais** da liga (contratos, aumentos, tags, waivers, rookie, dead money).
- **Cobertura completa dos requisitos técnicos** do edital.
- **Organização do código e documentação** (claridade, modularização, exemplos de uso).
- **Interface amigável e responsiva.**
- **Boas práticas de versionamento** e entrega.
- **Testes cobrindo funcionalidades críticas.**
- **Facilidade de manutenção e escalabilidade**.
- **Segurança e privacidade dos dados.**
- **Capacidade de adaptação futura (ex: novas regras).**

---

> **Atenção**: Quaisquer modificações nas regras do sistema devem ser documentadas e comunicadas ao grupo/produto, com registro no versionamento.

---
