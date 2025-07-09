# Integração com ChatGPT - Fantasy Contract Manager

## 📋 Visão Geral

Este documento explica como configurar um GPT customizado para se comunicar com a API do Fantasy Contract Manager, permitindo que o ChatGPT consulte informações de jogadores e contratos para auxiliar nas negociações.

## 🔧 Configuração da API

### 1. Acesso Público

**✅ Simplificado:** Os endpoints do ChatGPT agora são públicos e não requerem autenticação via API Key.

**Motivos:**

- O GPT customizado já é limitado por natureza
- Os endpoints não expõem dados sensíveis
- Facilita a configuração e uso
- Mantém a segurança através de limitações de dados retornados

### 2. Endpoints Disponíveis

A API oferece dois endpoints principais para o ChatGPT:

#### 🏈 `/api/gpt/players`

- **GET**: Busca jogadores por nome, posição ou ID do Sleeper
- **POST**: Busca avançada de múltiplos jogadores

#### 📄 `/api/gpt/contracts`

- **GET**: Busca contratos por jogador, time ou liga
- **POST**: Análise detalhada de contratos para negociação

## 🤖 Configuração do GPT Customizado

### 1. Criando o GPT

1. Acesse [ChatGPT](https://chat.openai.com)
2. Vá em "Explore GPTs" → "Create a GPT"
3. Configure o GPT com as seguintes informações:

### 2. Configuração Básica

**Nome:** Fantasy Contract Negotiator

**Descrição:** Assistente especializado em negociações de contratos de fantasy football, com acesso direto aos dados do Fantasy Contract Manager.

### 3. Instruções (Instructions)

```
Você é um assistente especializado em negociações de contratos de fantasy football. Você tem acesso direto à API do Fantasy Contract Manager para consultar informações atualizadas sobre jogadores e contratos.

Suas principais funções:
1. Consultar salários atuais de jogadores
2. Analisar contratos para extensões, tags ou cortes
3. Fornecer recomendações baseadas em dados reais
4. Explicar as regras da liga de forma clara

Sempre use dados atualizados da API antes de fazer recomendações. Seja preciso com números e transparente sobre as limitações dos contratos.

Quando consultar a API, sempre inclua informações de contratos (includeContracts=true) para ter dados completos.
```

### 4. Configuração de Actions

Na seção "Actions", adicione as seguintes configurações:

#### Schema OpenAPI

```yaml
openapi: 3.1.0
info:
  title: Fantasy Contract Manager API
  version: 1.0.0
  description: API para consultar jogadores, contratos e salários em ligas de fantasy football
servers:
  - url: https://fcm-desenv.vercel.app/
    description: Servidor de produção
paths:
  /api/gpt/players:
    get:
      operationId: getPlayers
      summary: Buscar jogadores
      description: Busca jogadores por nome, posição ou ID do Sleeper
      parameters:
        - name: name
          in: query
          description: Nome do jogador (busca parcial)
          schema:
            type: string
        - name: sleeperPlayerId
          in: query
          description: ID específico do Sleeper
          schema:
            type: string
        - name: position
          in: query
          description: Posição do jogador (QB, RB, WR, TE, etc.)
          schema:
            type: string
        - name: includeContracts
          in: query
          description: Incluir informações de contratos e salários do jogador
          schema:
            type: boolean
            default: true
      responses:
        '200':
          description: Lista de jogadores encontrados
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  count:
                    type: integer
                  players:
                    type: array
                    items:
                      type: object
  /api/gpt/players/search:
    post:
      operationId: searchPlayers
      summary: Busca avançada de jogadores
      description: Busca múltiplos jogadores de uma vez, podendo comparar contratos
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                players:
                  type: array
                  items:
                    type: string
                includeContracts:
                  type: boolean
                  default: true
                leagueId:
                  type: string
      responses:
        '200':
          description: Resultados da busca
  /api/gpt/contracts:
    get:
      operationId: getContracts
      summary: Buscar contratos
      description: Busca contratos por jogador, time ou liga
      parameters:
        - name: playerName
          in: query
          description: Nome do jogador
          schema:
            type: string
        - name: teamId
          in: query
          description: ID do time
          schema:
            type: string
        - name: leagueId
          in: query
          description: ID da liga
          schema:
            type: string
        - name: status
          in: query
          description: Status do contrato (ACTIVE, EXPIRED, EXTENDED, TAGGED)
          schema:
            type: string
            enum: [ACTIVE, EXPIRED, EXTENDED, TAGGED]
        - name: includePlayer
          in: query
          description: Incluir dados do jogador
          schema:
            type: boolean
            default: true
        - name: includeTeam
          in: query
          description: Incluir dados do time
          schema:
            type: boolean
            default: true
      responses:
        '200':
          description: Lista de contratos encontrados
  /api/gpt/contracts/analysis:
    post:
      operationId: analyzeContract
      summary: Análise de contratos
      description: Análise detalhada para negociação (extensão, tag, corte, etc)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                playerName:
                  type: string
                leagueId:
                  type: string
                analysisType:
                  type: string
                  enum: [extension, tag, trade, cut]
      responses:
        '200':
          description: Resultado da análise do contrato
# Sem autenticação necessária - endpoints públicos
```

#### Configuração de Autenticação

**✅ Não é necessária configuração de autenticação!**

Os endpoints são públicos e podem ser acessados diretamente pelo ChatGPT sem headers especiais.

## 📝 Exemplos de Uso

### 1. Consultar Salário de um Jogador

**Prompt para o GPT:**

```
"Qual é o salário atual do Josh Allen?"
```

**O GPT fará uma chamada:**

```
GET /api/gpt/players?name=Josh Allen&includeContracts=true
```

### 2. Analisar Extensão de Contrato

**Prompt para o GPT:**

```
"Posso estender o contrato do Patrick Mahomes? Qual seria o custo?"
```

**O GPT fará uma chamada:**

```
POST /api/gpt/contracts/analysis
{
  "playerName": "Patrick Mahomes",
  "analysisType": "extension"
}
```

### 3. Comparar Múltiplos Jogadores

**Prompt para o GPT:**

```
"Compare os contratos de Josh Allen, Patrick Mahomes e Lamar Jackson"
```

**O GPT fará uma chamada:**

```
POST /api/gpt/players/search
{
  "players": ["Josh Allen", "Patrick Mahomes", "Lamar Jackson"],
  "includeContracts": true
}
```

## 🔒 Segurança

### Medidas de Segurança Implementadas

1. **Endpoints Somente Leitura:** Apenas consultas, sem modificações
2. **Dados Não Sensíveis:** Não expõem emails ou informações pessoais
3. **Limitação de Resultados:** Máximo de 50-100 resultados por consulta
4. **Rate Limiting:** Considere implementar se necessário
5. **Logs:** Monitore as chamadas da API para detectar uso indevido

### Justificativa para Acesso Público

- **Dados Públicos:** Informações de contratos são transparentes na liga
- **GPT Limitado:** O ChatGPT já possui limitações próprias
- **Facilidade de Uso:** Simplifica a configuração e manutenção
- **Sem Operações Críticas:** Apenas consultas de dados existentes

## 🚀 Deploy e Configuração

### 1. Variáveis de Ambiente no Vercel

Se você está usando Vercel, adicione a variável de ambiente:

1. Vá no dashboard do Vercel
2. Selecione seu projeto
3. Vá em "Settings" → "Environment Variables"
4. Adicione:
   - **Name:** `GPT_API_KEY`
   - **Value:** `sua_chave_secreta_aqui_123456`
   - **Environment:** Production, Preview, Development

### 2. Testando a Integração

Você pode testar os endpoints diretamente:

```bash
# Testar busca de jogador
curl -H "X-API-Key: sua_chave_secreta_aqui_123456" \
     "https://seu-dominio.vercel.app/api/gpt/players?name=Josh Allen&includeContracts=true"

# Testar análise de contrato
curl -X POST \
     -H "X-API-Key: sua_chave_secreta_aqui_123456" \
     -H "Content-Type: application/json" \
     -d '{"playerName":"Josh Allen","analysisType":"extension"}' \
     "https://seu-dominio.vercel.app/api/gpt/contracts/analysis"
```

## 🎯 Casos de Uso Avançados

### 1. Negociação de Extensão

```
"Estou negociando a extensão do Tyreek Hill. Ele está no último ano de um contrato de 4 anos/$80M. Qual seria uma oferta justa para 3 anos?"
```

### 2. Análise de Salary Cap

```
"Meu time está com 85% do salary cap usado. Quais jogadores eu poderia cortar para liberar espaço?"
```

### 3. Comparação de Posições

```
"Mostre-me todos os quarterbacks com contratos ativos e seus salários atuais"
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro 401 - Unauthorized**
   - Verifique se a API Key está correta
   - Confirme se a variável de ambiente está configurada

2. **Erro 404 - Not Found**
   - Verifique se o nome do jogador está correto
   - Confirme se o jogador tem contrato ativo

3. **Erro 500 - Internal Server Error**
   - Verifique os logs do servidor
   - Confirme se o banco de dados está acessível

### Logs e Monitoramento

Todos os erros são logados no console. Para produção, considere usar um serviço de monitoramento como Sentry ou LogRocket.

## 📚 Referências

- [OpenAI GPT Actions Documentation](https://platform.openai.com/docs/actions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Nota:** Esta integração permite que o ChatGPT acesse dados em tempo real do seu sistema, tornando as negociações mais precisas e baseadas em informações atualizadas.
