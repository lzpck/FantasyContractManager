# 🧪 Testando Endpoints da API GPT

## 📋 Configuração Inicial

### Base URL Local

```
http://localhost:3000
```

### Headers Necessários

```json
{
  "Content-Type": "application/json"
}
```

**Nota:** Os endpoints da API GPT são públicos e não requerem autenticação.

---

## 🏈 Endpoints de Jogadores

### 1. GET /api/gpt/players

**Descrição:** Busca jogadores por nome, posição ou ID do Sleeper

**URL:** `GET http://localhost:3000/api/gpt/players`

**Parâmetros de Query:**

- `name` (string, opcional): Nome do jogador (busca parcial)
- `sleeperPlayerId` (string, opcional): ID específico do Sleeper
- `position` (string, opcional): Posição do jogador (QB, RB, WR, TE, etc.)
- `includeContracts` (boolean, opcional): Incluir informações de contratos (default: true)

**Exemplos de Requisições:**

```bash
# Buscar jogadores com nome "Josh"
GET http://localhost:3000/api/gpt/players?name=Josh&includeContracts=true

# Buscar quarterbacks
GET http://localhost:3000/api/gpt/players?position=QB&includeContracts=false

# Buscar por ID específico do Sleeper
GET http://localhost:3000/api/gpt/players?sleeperPlayerId=4046&includeContracts=true
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "count": 2,
  "players": [
    {
      "id": "player-uuid",
      "name": "Josh Allen",
      "position": "QB",
      "team": "BUF",
      "sleeperPlayerId": "4046",
      "contracts": [
        {
          "id": "contract-uuid",
          "currentSalary": 25000000,
          "yearsRemaining": 3,
          "status": "ACTIVE",
          "hasBeenExtended": false,
          "hasBeenTagged": false,
          "team": {
            "id": "team-uuid",
            "name": "Buffalo Bills Fantasy",
            "league": {
              "id": "league-uuid",
              "name": "Liga Exemplo"
            }
          }
        }
      ]
    }
  ]
}
```

### 2. POST /api/gpt/players/search

**Descrição:** Busca avançada de múltiplos jogadores simultaneamente

**URL:** `POST http://localhost:3000/api/gpt/players/search`

**Body da Requisição:**

```json
{
  "players": ["Josh Allen", "Patrick Mahomes", "Lamar Jackson"],
  "includeContracts": true,
  "leagueId": "league-uuid-opcional"
}
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "count": 3,
  "players": [
    {
      "id": "player-uuid-1",
      "name": "Josh Allen",
      "position": "QB",
      "team": "BUF",
      "contracts": [...]
    },
    {
      "id": "player-uuid-2",
      "name": "Patrick Mahomes",
      "position": "QB",
      "team": "KC",
      "contracts": [...]
    }
  ]
}
```

---

## 📄 Endpoints de Contratos

### 3. GET /api/gpt/contracts

**Descrição:** Busca contratos por jogador, time ou liga

**URL:** `GET http://localhost:3000/api/gpt/contracts`

**Parâmetros de Query:**

- `playerName` (string, opcional): Nome do jogador
- `teamId` (string, opcional): ID do time
- `leagueId` (string, opcional): ID da liga
- `status` (string, opcional): Status do contrato (ACTIVE, EXPIRED, EXTENDED, TAGGED)
- `includePlayer` (boolean, opcional): Incluir dados do jogador (default: true)
- `includeTeam` (boolean, opcional): Incluir dados do time (default: true)

**Exemplos de Requisições:**

```bash
# Buscar contratos de um jogador específico
GET http://localhost:3000/api/gpt/contracts?playerName=Josh Allen&includePlayer=true&includeTeam=true

# Buscar contratos ativos de uma liga
GET http://localhost:3000/api/gpt/contracts?leagueId=league-uuid&status=ACTIVE

# Buscar contratos de um time específico
GET http://localhost:3000/api/gpt/contracts?teamId=team-uuid&includePlayer=true
```

**Exemplo de Resposta:**

```json
{
  "success": true,
  "count": 1,
  "contracts": [
    {
      "id": "contract-uuid",
      "originalSalary": 20000000,
      "currentSalary": 25000000,
      "originalYears": 4,
      "yearsRemaining": 2,
      "status": "ACTIVE",
      "hasBeenExtended": false,
      "hasBeenTagged": false,
      "acquisitionType": "DRAFT",
      "player": {
        "id": "player-uuid",
        "name": "Josh Allen",
        "position": "QB",
        "team": "BUF"
      },
      "team": {
        "id": "team-uuid",
        "name": "Buffalo Bills Fantasy",
        "league": {
          "id": "league-uuid",
          "name": "Liga Exemplo",
          "salaryCap": 279000000
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 4. POST /api/gpt/contracts/analysis

**Descrição:** Análise detalhada de contratos para negociação

**URL:** `POST http://localhost:3000/api/gpt/contracts/analysis`

**Body da Requisição:**

```json
{
  "playerName": "Josh Allen",
  "leagueId": "league-uuid-opcional",
  "analysisType": "extension"
}
```

**Tipos de Análise Disponíveis:**

- `extension`: Análise para extensão de contrato
- `tag`: Análise para franchise tag
- `trade`: Análise para negociação
- `cut`: Análise para corte do jogador

**Exemplos de Requisições:**

```json
// Análise de Extensão
{
  "playerName": "Josh Allen",
  "analysisType": "extension"
}

// Análise de Franchise Tag
{
  "playerName": "Saquon Barkley",
  "analysisType": "tag",
  "leagueId": "league-uuid"
}

// Análise de Trade
{
  "playerName": "Cooper Kupp",
  "analysisType": "trade"
}

// Análise de Corte
{
  "playerName": "Russell Wilson",
  "analysisType": "cut"
}
```

**Exemplo de Resposta (Extension):**

```json
{
  "success": true,
  "analysis": {
    "player": {
      "name": "Josh Allen",
      "position": "QB",
      "team": "BUF"
    },
    "contract": {
      "id": "contract-uuid",
      "currentSalary": 25000000,
      "yearsRemaining": 1,
      "status": "ACTIVE",
      "hasBeenExtended": false,
      "hasBeenTagged": false,
      "team": {
        "id": "team-uuid",
        "name": "Buffalo Bills Fantasy",
        "league": {
          "id": "league-uuid",
          "name": "Liga Exemplo"
        }
      }
    },
    "analysisType": "extension",
    "timestamp": "2024-01-15T15:30:00.000Z",
    "result": {
      "eligible": true,
      "reason": "Jogador elegível para extensão (último ano de contrato e não foi estendido)",
      "recommendation": "Considere estender o contrato se o jogador tem bom desempenho",
      "estimatedCost": 30000000
    }
  }
}
```

**Exemplo de Resposta (Trade):**

```json
{
  "success": true,
  "analysis": {
    "player": {...},
    "contract": {...},
    "analysisType": "trade",
    "result": {
      "eligible": true,
      "attractiveness": "Alta",
      "reason": "Contrato com 3 ano(s) restante(s) e salário de $12,000,000",
      "recommendation": "Bom momento para negociar - contrato atrativo",
      "marketValue": 12000000
    }
  }
}
```

---

## 🔧 Configuração no Insomnia

### 1. Criar Nova Collection

1. Abra o Insomnia
2. Clique em "Create" → "Request Collection"
3. Nome: "Fantasy Contract Manager - API GPT"

### 2. Configurar Environment

1. Clique no dropdown de Environment
2. Selecione "Manage Environments"
3. Crie um novo environment:

```json
{
  "base_url": "http://localhost:3000",
  "content_type": "application/json"
}
```

### 3. Criar Requests

Para cada endpoint, crie uma nova request:

**GET Players:**

- Method: GET
- URL: `{{ _.base_url }}/api/gpt/players`
- Query: `name=Josh&includeContracts=true`

**POST Players Search:**

- Method: POST
- URL: `{{ _.base_url }}/api/gpt/players/search`
- Headers: `Content-Type: {{ _.content_type }}`
- Body (JSON):

```json
{
  "players": ["Josh Allen", "Patrick Mahomes"],
  "includeContracts": true
}
```

**GET Contracts:**

- Method: GET
- URL: `{{ _.base_url }}/api/gpt/contracts`
- Query: `playerName=Josh Allen&includePlayer=true&includeTeam=true`

**POST Contract Analysis:**

- Method: POST
- URL: `{{ _.base_url }}/api/gpt/contracts/analysis`
- Headers: `Content-Type: {{ _.content_type }}`
- Body (JSON):

```json
{
  "playerName": "Josh Allen",
  "analysisType": "extension"
}
```

---

## 🚨 Tratamento de Erros

### Códigos de Status HTTP

- `200`: Sucesso
- `400`: Erro de validação (parâmetros inválidos)
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Exemplos de Respostas de Erro

**400 - Bad Request:**

```json
{
  "error": "Nome do jogador é obrigatório"
}
```

**404 - Not Found:**

```json
{
  "error": "Jogador não encontrado"
}
```

**500 - Internal Server Error:**

```json
{
  "error": "Erro interno do servidor"
}
```

---

## 📝 Dicas para Testes

1. **Inicie o servidor local:** `npm run dev`
2. **Verifique se o banco está populado** com dados de teste
3. **Use nomes reais de jogadores** para obter resultados
4. **Teste diferentes combinações** de parâmetros
5. **Verifique os logs do servidor** para debugging
6. **Teste cenários de erro** (nomes inexistentes, parâmetros inválidos)

### Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Verificar logs em tempo real
# (os logs aparecerão no terminal onde o servidor está rodando)

# Resetar banco de dados (se necessário)
npx prisma db push --force-reset
npx prisma db seed
```

---

## 🎯 Casos de Teste Recomendados

### Cenários Positivos

1. Buscar jogador existente com contratos
2. Buscar múltiplos jogadores simultaneamente
3. Analisar extensão de contrato elegível
4. Analisar trade de jogador com contrato atrativo

### Cenários de Erro

1. Buscar jogador inexistente
2. Enviar tipo de análise inválido
3. Enviar body malformado
4. Buscar contrato sem especificar critérios

### Cenários Edge Case

1. Jogador sem contratos ativos
2. Análise de jogador já estendido
3. Busca com caracteres especiais
4. Parâmetros vazios ou nulos

Esta documentação deve cobrir todos os cenários necessários para testar a API GPT localmente usando o Insomnia ou qualquer outro cliente HTTP.
