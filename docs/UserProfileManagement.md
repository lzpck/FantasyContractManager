# Gerenciamento de Perfil do Usuário

## Visão Geral

Este documento descreve a funcionalidade de edição de perfil implementada no sistema Fantasy Contract Manager, que permite aos usuários autenticados gerenciar seus próprios dados pessoais e alterar suas senhas de forma segura.

## Funcionalidades Implementadas

### 1. Edição de Dados Pessoais

- **Nome**: Usuário pode alterar seu nome completo
- **Email**: Usuário pode alterar seu endereço de email (com validação de unicidade)
- **Campos somente leitura**: Login, perfil (role) e time associado não podem ser alterados pelo usuário

### 2. Alteração de Senha

- **Validação de senha atual**: Sistema exige a senha atual antes de permitir alteração
- **Nova senha**: Mínimo de 6 caracteres
- **Confirmação**: Nova senha deve ser confirmada
- **Hash seguro**: Utiliza bcrypt com salt rounds 12

### 3. Interface do Usuário

- **Design responsivo**: Interface adaptável para desktop e mobile
- **Navegação por abas**: Separação clara entre dados pessoais e alteração de senha
- **Feedback visual**: Mensagens de sucesso e erro
- **Validação em tempo real**: Verificação de dados no frontend

## Arquitetura Técnica

### Endpoints de API

#### `GET /api/profile`

- **Descrição**: Busca dados do perfil do usuário autenticado
- **Autenticação**: Requerida
- **Resposta**: Dados do usuário (sem senha)

#### `PATCH /api/profile`

- **Descrição**: Atualiza dados do perfil ou altera senha
- **Autenticação**: Requerida
- **Tipos de operação**:
  - `type: 'profile'`: Atualização de dados pessoais
  - `type: 'password'`: Alteração de senha

### Estrutura de Arquivos

```
src/
├── app/
│   ├── api/profile/
│   │   ├── route.ts              # Endpoints de API
│   │   └── route.test.ts         # Testes unitários
│   └── profile/
│       └── page.tsx              # Página de edição de perfil
├── hooks/
│   └── useProfile.ts             # Hook para operações de perfil
└── components/layout/
    └── AuthNavigation.tsx        # Navegação com link para perfil
```

### Validação de Dados

Utiliza a biblioteca **Zod** para validação:

```typescript
// Validação de perfil
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional(),
});

// Validação de senha
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Nova senha e confirmação não coincidem',
    path: ['confirmPassword'],
  });
```

## Segurança

### Medidas Implementadas

1. **Autenticação obrigatória**: Todos os endpoints requerem sessão válida
2. **Verificação de senha atual**: Alteração de senha exige confirmação da senha atual
3. **Hash seguro**: Senhas são hasheadas com bcrypt (12 salt rounds)
4. **Validação de unicidade**: Email não pode ser duplicado no sistema
5. **Sanitização de dados**: Validação rigorosa de entrada com Zod
6. **Isolamento de usuário**: Usuário só pode editar seus próprios dados

### Fluxo de Segurança para Alteração de Senha

1. Usuário fornece senha atual, nova senha e confirmação
2. Sistema valida formato dos dados
3. Sistema busca hash da senha atual no banco
4. Sistema verifica se senha atual está correta
5. Sistema gera hash da nova senha
6. Sistema atualiza senha no banco
7. Sistema retorna confirmação (sem dados sensíveis)

## Como Usar

### Acesso à Funcionalidade

1. **Login**: Usuário deve estar autenticado
2. **Navegação**: Clicar no dropdown do usuário no header
3. **Menu**: Selecionar "Meu Perfil"
4. **Edição**: Escolher entre "Dados Pessoais" ou "Alterar Senha"

### Fluxo de Edição de Dados

1. Acessar aba "Dados Pessoais"
2. Modificar nome e/ou email
3. Clicar em "Salvar Alterações"
4. Sistema valida e atualiza dados
5. Página recarrega com dados atualizados

### Fluxo de Alteração de Senha

1. Acessar aba "Alterar Senha"
2. Inserir senha atual
3. Inserir nova senha (mínimo 6 caracteres)
4. Confirmar nova senha
5. Clicar em "Alterar Senha"
6. Sistema valida e atualiza senha
7. Formulário é limpo após sucesso

## Testes

### Cobertura de Testes

Os testes unitários cobrem:

- ✅ Busca de dados do perfil
- ✅ Atualização de dados pessoais
- ✅ Alteração de senha
- ✅ Validação de dados de entrada
- ✅ Verificação de autenticação
- ✅ Tratamento de erros
- ✅ Validação de unicidade de email
- ✅ Verificação de senha atual

### Executar Testes

```bash
npm test src/app/api/profile/route.test.ts
```

## Mensagens de Commit Recomendadas

```bash
# Commit principal da feature
git commit -m "feat: implementa funcionalidade de edição de perfil do usuário

- Adiciona endpoint /api/profile para GET e PATCH de dados pessoais
- Implementa alteração segura de senha com validação
- Cria página /profile com interface intuitiva e responsiva
- Adiciona validação com Zod para dados de entrada
- Implementa hook useProfile para gerenciar operações
- Adiciona link 'Meu Perfil' na navegação do usuário
- Inclui testes unitários completos para o endpoint
- Garante segurança com verificação de senha atual
- Feedback visual de sucesso/erro para o usuário"

# Commits adicionais (se necessário)
git commit -m "fix: corrige validação de email na edição de perfil"
git commit -m "test: adiciona testes de integração para edição de perfil"
git commit -m "docs: atualiza documentação da funcionalidade de perfil"
```

## Considerações Futuras

### Melhorias Possíveis

1. **Upload de avatar**: Permitir que usuário faça upload de foto de perfil
2. **Histórico de alterações**: Log de mudanças no perfil para auditoria
3. **Notificação por email**: Enviar email quando dados importantes forem alterados
4. **Autenticação de dois fatores**: Adicionar 2FA para maior segurança
5. **Política de senhas**: Implementar regras mais rigorosas para senhas
6. **Sessões múltiplas**: Invalidar outras sessões após alteração de senha

### Integração com Outras Funcionalidades

- **Auditoria**: Registrar alterações de perfil no sistema de logs
- **Notificações**: Integrar com sistema de notificações do app
- **Permissões**: Considerar diferentes níveis de edição baseados no role

## Troubleshooting

### Problemas Comuns

1. **Email já em uso**: Verificar se outro usuário já possui o email
2. **Senha atual incorreta**: Confirmar que usuário está digitando senha correta
3. **Validação falha**: Verificar se dados atendem aos critérios mínimos
4. **Sessão expirada**: Usuário precisa fazer login novamente

### Logs de Debug

O sistema registra logs para:

- Tentativas de alteração de dados
- Erros de validação
- Falhas de autenticação
- Atualizações bem-sucedidas

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0  
**Responsável**: Sistema Fantasy Contract Manager
