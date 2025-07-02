# Guia de Migração de Datas para ISO 8601

## Visão Geral

Este documento descreve a migração do sistema de datas do formato timestamp (DATETIME) para o formato ISO 8601 (string), implementada para melhorar a legibilidade, compatibilidade universal e facilitar integrações com outros sistemas.

## Motivação

### Problemas do Sistema Anterior

- **Timestamps ilegíveis**: Datas armazenadas como DATETIME eram difíceis de interpretar em consultas manuais
- **Complexidade de formatação**: Necessidade de middleware complexo para formatar datas
- **Incompatibilidade**: Dificuldades na integração com APIs externas que esperam ISO 8601
- **Manutenção**: Código complexo para conversão entre formatos

### Benefícios do Novo Sistema

- **Legibilidade**: Datas em formato ISO 8601 são facilmente legíveis (ex: `2024-01-15T10:30:00.000Z`)
- **Universalidade**: Padrão internacional amplamente suportado
- **Simplicidade**: Menos código de conversão necessário
- **Compatibilidade**: Integração direta com APIs REST e sistemas externos
- **Auditoria**: Consultas SQL mais claras e relatórios mais legíveis

## Mudanças Implementadas

### 1. Schema do Banco de Dados

**Antes:**

```sql
CREATE TABLE "users" (
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
```

**Depois:**

```sql
CREATE TABLE "users" (
  "createdAt" TEXT NOT NULL DEFAULT '',
  "updatedAt" TEXT NOT NULL DEFAULT ''
);
```

### 2. Schema Prisma

**Antes:**

```prisma
model User {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Depois:**

```prisma
model User {
  createdAt String @default("")
  updatedAt String @default("")
}
```

### 3. Tipos TypeScript

**Antes:**

```typescript
interface User {
  createdAt: Date;
  updatedAt: Date;
}
```

**Depois:**

```typescript
interface User {
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}
```

## Funções Utilitárias

### Novas Funções em `formatUtils.ts`

```typescript
// Converte Date para ISO 8601
export function toISOString(date: Date | string = new Date()): string;

// Verifica se string é ISO 8601 válida
export function isValidISOString(isoString: string): boolean;

// Converte ISO 8601 para Date
export function fromISOString(isoString: string): Date | null;

// Formata ISO 8601 para padrão brasileiro
export function formatISOToBrazilian(isoString: string, includeTime?: boolean): string;
```

### Funções em `prisma.ts`

```typescript
// Converte Date para ISO 8601
export const toISOString = (date: Date = new Date()): string

// Converte ISO 8601 para Date
export const fromISOString = (isoString: string): Date | null

// Formata ISO 8601 para padrão brasileiro
export const formatISOToBrazilian = (isoString: string, includeTime?: boolean): string
```

## Middleware Prisma Atualizado

O middleware agora automatiza a criação de timestamps ISO 8601:

```typescript
prisma.$use(async (params, next) => {
  const now = toISOString();

  if (params.action === 'create') {
    params.args.data.createdAt = now;
    params.args.data.updatedAt = now;
  }

  if (params.action === 'update' || params.action === 'updateMany') {
    params.args.data.updatedAt = now;
  }

  return next(params);
});
```

## Exemplos de Uso

### 1. Criando Registros

**Antes:**

```typescript
const user = await prisma.user.create({
  data: {
    name: 'João',
    email: 'joao@email.com',
    // createdAt e updatedAt eram automáticos
  },
});
```

**Depois:**

```typescript
const user = await prisma.user.create({
  data: {
    name: 'João',
    email: 'joao@email.com',
    // createdAt e updatedAt são automaticamente definidos pelo middleware
  },
});

// Resultado:
// {
//   id: 'cuid...',
//   name: 'João',
//   email: 'joao@email.com',
//   createdAt: '2024-01-15T10:30:00.000Z',
//   updatedAt: '2024-01-15T10:30:00.000Z'
// }
```

### 2. Formatando Datas para Exibição

```typescript
import { formatISOToBrazilian } from '@/utils/formatUtils';

const user = await prisma.user.findFirst();

// Exibe: "15/01/2024 10:30:00"
console.log(formatISOToBrazilian(user.createdAt));

// Exibe: "15/01/2024"
console.log(formatISOToBrazilian(user.createdAt, false));
```

### 3. Consultas com Filtros de Data

```typescript
// Buscar usuários criados após uma data específica
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: '2024-01-01T00:00:00.000Z',
    },
  },
});

// Buscar contratos atualizados na última semana
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);

const contracts = await prisma.contract.findMany({
  where: {
    updatedAt: {
      gte: lastWeek.toISOString(),
    },
  },
});
```

### 4. APIs REST

```typescript
// GET /api/users
export async function GET() {
  const users = await prisma.user.findMany();

  return Response.json({
    users: users.map(user => ({
      ...user,
      // Datas já estão em formato ISO 8601, prontas para JSON
      createdAt: user.createdAt, // '2024-01-15T10:30:00.000Z'
      updatedAt: user.updatedAt, // '2024-01-15T10:30:00.000Z'
    })),
  });
}
```

## Migração de Dados Existentes

### Migração SQL Manual

Alternativamente, execute a migração SQL em `prisma/migrations/20250103000000_convert_dates_to_iso8601/migration.sql`:

```bash
# Aplicar migração
npx prisma migrate deploy
```

## Verificação Pós-Migração

### 1. Consultas de Verificação

```sql
-- Verificar formato das datas
SELECT createdAt, updatedAt FROM users LIMIT 5;
-- Resultado esperado: '2024-01-15T10:30:00.000Z'

-- Verificar se todas as datas foram convertidas
SELECT COUNT(*) FROM users WHERE createdAt NOT LIKE '%T%Z';
-- Resultado esperado: 0
```

### 2. Testes Automatizados

```typescript
import { isValidISOString, formatISOToBrazilian } from '@/utils/formatUtils';

describe('Date Migration', () => {
  test('should have valid ISO 8601 dates', async () => {
    const user = await prisma.user.findFirst();

    expect(isValidISOString(user.createdAt)).toBe(true);
    expect(isValidISOString(user.updatedAt)).toBe(true);
  });

  test('should format dates correctly', () => {
    const isoDate = '2024-01-15T10:30:00.000Z';
    const formatted = formatISOToBrazilian(isoDate);

    expect(formatted).toBe('15/01/2024 10:30:00');
  });
});
```

## Boas Práticas

### 1. Sempre Use ISO 8601

```typescript
// ✅ Correto
const now = new Date().toISOString();
const contract = await prisma.contract.create({
  data: {
    // ... outros campos
    createdAt: now,
    updatedAt: now,
  },
});

// ❌ Evitar
const contract = await prisma.contract.create({
  data: {
    // ... outros campos
    createdAt: new Date(), // Não é string ISO 8601
  },
});
```

### 2. Validação de Entrada

```typescript
import { isValidISOString } from '@/utils/formatUtils';

export async function POST(request: Request) {
  const { createdAt } = await request.json();

  if (createdAt && !isValidISOString(createdAt)) {
    return Response.json({ error: 'Data deve estar no formato ISO 8601' }, { status: 400 });
  }

  // ... resto da lógica
}
```

### 3. Formatação para UI

```typescript
// Em componentes React
function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>Criado em: {formatISOToBrazilian(user.createdAt, false)}</p>
      <p>Atualizado em: {formatISOToBrazilian(user.updatedAt)}</p>
    </div>
  );
}
```

## Troubleshooting

### Problemas Comuns

1. **Erro: "Invalid date format"**
   - Verifique se a string está no formato ISO 8601
   - Use `isValidISOString()` para validar

2. **Datas não aparecem formatadas**
   - Certifique-se de usar `formatISOToBrazilian()` na UI
   - Verifique se a data não é `null` ou `undefined`

3. **Consultas SQL não funcionam**
   - Lembre-se que datas agora são strings
   - Use comparação de strings: `WHERE createdAt >= '2024-01-01T00:00:00.000Z'`

### Rollback (Se Necessário)

Caso seja necessário reverter:

1. Restaurar backup das tabelas
2. Reverter schema Prisma
3. Reverter tipos TypeScript
4. Remover funções utilitárias ISO 8601

## Conclusão

A migração para ISO 8601 simplifica significativamente o gerenciamento de datas no sistema, oferecendo:

- ✅ **Legibilidade**: Datas facilmente interpretáveis
- ✅ **Compatibilidade**: Padrão universal
- ✅ **Simplicidade**: Menos código de conversão
- ✅ **Manutenibilidade**: Código mais limpo e direto
- ✅ **Auditoria**: Consultas e relatórios mais claros

Todas as funcionalidades existentes continuam funcionando, mas agora com melhor performance e clareza.
