# 🇧🇷 Guia de Fuso Horário do Brasil

## Visão Geral

O sistema foi configurado para trabalhar exclusivamente com o fuso horário do Brasil (America/Sao_Paulo), garantindo que todas as datas sejam salvas e exibidas no horário local brasileiro, independentemente do fuso horário do servidor ou do usuário.

## Motivação

### Problema Identificado
- Datas estavam sendo salvas em fuso horário diferente do Brasil
- Inconsistência entre horário de criação/atualização e horário local
- Dificuldade para auditoria e rastreamento de eventos

### Solução Implementada
- Todas as funções de data agora usam o fuso horário `America/Sao_Paulo`
- Conversão automática para ISO 8601 com horário brasileiro
- Formatação consistente em português brasileiro

## Funcionalidades Implementadas

### 1. Funções Principais - CORRIGIDAS

#### `toISOString(date?: Date | string): string` - CORRIGIDA
- Converte qualquer data para ISO 8601 no fuso horário do Brasil
- Usa `Intl.DateTimeFormat` com timeZone 'America/Sao_Paulo' para precisão
- Mantém milissegundos da data original
- Usado automaticamente pelo middleware do Prisma
- Garante consistência em todas as operações de banco

```typescript
// Exemplo de uso
const agora = toISOString(); // Data atual no horário do Brasil
const dataEspecifica = toISOString(new Date('2024-01-01')); // Data específica convertida
```

#### `nowInBrazil(): Date` - CORRIGIDA
- Retorna a data/hora atual no fuso horário do Brasil
- Usa `Intl.DateTimeFormat` para conversão precisa
- Preserva milissegundos para máxima precisão
- Útil para operações que precisam da data atual brasileira

```typescript
// Exemplo de uso
const agoraNoBrasil = nowInBrazil();
console.log(agoraNoBrasil); // Data atual no horário de Brasília/São Paulo
```

#### `formatDate(date: Date | string, includeTime?: boolean): string`
- Formata datas no padrão brasileiro (dd/MM/yyyy hh:mm:ss)
- Usa automaticamente o fuso horário do Brasil
- Opção de incluir ou não o horário

```typescript
// Exemplos de uso
const dataFormatada = formatDate(new Date()); // "29/06/2025 15:30:45"
const apenasData = formatDate(new Date(), false); // "29/06/2025"
```

### 2. Middleware Automático

O Prisma foi configurado com middleware que automaticamente:
- Define `createdAt` e `updatedAt` em operações de criação
- Atualiza `updatedAt` em operações de atualização
- Usa sempre o fuso horário do Brasil

```typescript
// Automático em todas as operações
const usuario = await prisma.user.create({
  data: {
    name: 'João',
    email: 'joao@email.com'
    // createdAt e updatedAt são definidos automaticamente
  }
});
```

### 3. Formatação Consistente

Todas as funções de formatação agora incluem `timeZone: 'America/Sao_Paulo'`:
- `formatDate()` - Formatação geral
- `formatISOToBrazilian()` - Conversão de ISO para padrão brasileiro
- `toLocaleDateString()` e `toLocaleTimeString()` - Com fuso horário brasileiro

## Arquivos Modificados

### 1. `src/lib/prisma.ts`
- ✅ Função `toISOString()` atualizada
- ✅ Nova função `nowInBrazil()`
- ✅ Função `formatISOToBrazilian()` atualizada
- ✅ Middleware do Prisma atualizado

### 2. `src/utils/formatUtils.ts`
- ✅ Função `toISOString()` atualizada
- ✅ Nova função `nowInBrazil()`
- ✅ Função `formatDate()` atualizada
- ✅ Todas as formatações com `timeZone: 'America/Sao_Paulo'`

### 3. `prisma/seed.ts`
- ✅ Import das novas funções
- ✅ Uso de `toISOString(nowInBrazil())` para `emailVerified`

## Correção Implementada

### Problema Identificado
A implementação anterior usava `toLocaleString()` seguido de `toISOString()`, o que causava:
- Conversão dupla de fuso horário
- Datas salvas com 3 horas de diferença
- Inconsistência entre horário exibido e salvo

### Solução Aplicada
Substituição por `Intl.DateTimeFormat` com:
- Conversão direta para fuso horário brasileiro
- Preservação de milissegundos
- Eliminação de conversões duplas
- Precisão total na manipulação de datas

## Benefícios

### 🎯 Consistência
- Todas as datas no sistema seguem o mesmo fuso horário
- Não há mais discrepâncias entre horários

### 🔍 Auditoria
- Timestamps precisos no horário brasileiro
- Facilita rastreamento de eventos e operações

### 👥 Experiência do Usuário
- Datas exibidas sempre no horário local brasileiro
- Formatação familiar (dd/MM/yyyy hh:mm:ss)

### 🛠️ Manutenibilidade
- Funções centralizadas para manipulação de datas
- Fácil manutenção e atualização

### ⚡ Precisão
- Eliminação de erros de conversão de fuso horário

## Exemplos Práticos

### Criação de Usuário
```typescript
// Antes (fuso horário inconsistente)
const usuario = await prisma.user.create({
  data: {
    name: 'João',
    email: 'joao@email.com',
    emailVerified: new Date().toISOString() // UTC
  }
});

// Depois (fuso horário brasileiro)
const usuario = await prisma.user.create({
  data: {
    name: 'João',
    email: 'joao@email.com',
    emailVerified: toISOString(nowInBrazil()) // Horário do Brasil
  }
});
```

### Formatação de Datas
```typescript
// Antes (sem fuso horário específico)
const dataFormatada = new Date().toLocaleDateString('pt-BR');

// Depois (com fuso horário brasileiro)
const dataFormatada = formatDate(nowInBrazil());
// ou
const dataFormatada = new Date().toLocaleDateString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});
```

## Considerações Técnicas

### Horário de Verão
O fuso horário `America/Sao_Paulo` automaticamente considera:
- Horário de verão quando aplicável
- Transições automáticas entre horários
- Compatibilidade com regras brasileiras

### Performance
- Conversões de fuso horário são otimizadas pelo JavaScript
- Middleware do Prisma adiciona overhead mínimo
- Funções são executadas apenas quando necessário

### Compatibilidade
- Funciona em todos os navegadores modernos
- Compatível com Node.js
- Suporte nativo ao fuso horário brasileiro

## Próximos Passos

1. **Testes**: Implementar testes unitários para as novas funções
2. **Validação**: Verificar comportamento durante mudanças de horário
3. **Documentação**: Atualizar documentação da API
4. **Monitoramento**: Acompanhar logs para garantir funcionamento correto

## Troubleshooting

### Problema: Datas ainda aparecem em fuso horário diferente
**Solução**: Verificar se está usando as novas funções `toISOString()` e `formatDate()`

### Problema: Erro de timezone não encontrado
**Solução**: Verificar se o ambiente suporta `America/Sao_Paulo` (deveria ser padrão)

### Problema: Inconsistência em dados antigos
**Solução**: Executar script de migração para converter dados existentes

---

> **Nota**: Todas as novas operações de banco de dados agora usam automaticamente o fuso horário brasileiro. Dados existentes podem precisar de migração manual se necessário.