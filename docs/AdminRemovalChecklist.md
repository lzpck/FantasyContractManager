# Checklist de Remoção do Perfil Administrador

## ✅ Alterações Realizadas

### 1. **Banco de Dados e Schema**
- [x] Criada migration para migrar usuários ADMIN → COMMISSIONER
- [x] Removido valor `ADMIN` do enum `UserRole` no schema Prisma
- [x] Atualizado seed para criar usuário comissário ao invés de administrador

### 2. **Tipos e Enumerações**
- [x] Removido `ADMIN` de `src/types/database.ts`
- [x] Removido `ADMIN` de `src/types/index.ts`
- [x] Removido `ADMIN` de `src/types/next-auth.d.ts` (implícito)

### 3. **Hooks e Autenticação**
- [x] Removido `isAdmin` do hook `useAuth`
- [x] Atualizado todas as verificações de permissão para usar apenas `COMMISSIONER`
- [x] Removido `isAdmin` do retorno do hook `useAuth`

### 4. **APIs e Rotas**
- [x] `src/app/api/users/[id]/route.ts` - Removido verificação ADMIN
- [x] `src/app/api/auth/register/route.ts` - Removido verificação ADMIN
- [x] `src/app/api/users/route.ts` - Removido verificação ADMIN
- [x] `src/app/api/leagues/sync/route.ts` - Removido verificação ADMIN
- [x] `src/app/api/players/import/route.ts` - Removido verificação ADMIN
- [x] `src/middleware.ts` - Removido verificação ADMIN

### 5. **Componentes Frontend**
- [x] `src/app/admin/page.tsx` - Removido ícones, textos e opções ADMIN
- [x] `src/components/admin/CreateUserForm.tsx` - Removido opção ADMIN
- [x] `src/components/layout/AuthNavigation.tsx` - Removido texto ADMIN
- [x] `src/components/dashboard/LeaguesList.tsx` - Removido verificação ADMIN
- [x] `src/components/teams/PlayerContractsManager.tsx` - Removido verificação ADMIN
- [x] `src/components/teams/ExampleUsage.tsx` - Removido verificação ADMIN
- [x] `src/hooks/useContractModal.ts` - Removido verificação ADMIN

### 6. **Páginas de Autenticação**
- [x] `src/app/auth/signin/page.tsx` - Atualizado texto para "comissário"
- [x] `src/app/unauthorized/page.tsx` - Atualizado texto para "comissário"

### 7. **Documentação**
- [x] `README.md` - Atualizado credenciais de acesso
- [x] Criado checklist de verificação

## 🧪 Testes de Verificação

### Testes Automatizados
- [x] Criado script `scripts/test-admin-removal.ts`

### Testes Manuais Necessários

#### 1. **Banco de Dados**
- [ ] Executar migration: `npx prisma migrate dev`
- [ ] Verificar que não há usuários com role ADMIN
- [ ] Verificar que usuários antigos ADMIN foram migrados para COMMISSIONER
- [ ] Executar seed: `npx prisma db seed`
- [ ] Verificar criação do usuário comissário demo

#### 2. **Autenticação e Autorização**
- [ ] Login com usuário COMMISSIONER funciona
- [ ] Login com usuário USER funciona
- [ ] Acesso à página `/admin` permitido apenas para COMMISSIONER
- [ ] Criação de usuários permitida apenas para COMMISSIONER
- [ ] Importação de dados permitida apenas para COMMISSIONER

#### 3. **Interface do Usuário**
- [ ] Não há referências visuais ao perfil "Administrador"
- [ ] Dropdown de criação de usuário não contém opção "Administrador"
- [ ] Navegação mostra corretamente "Comissário" para usuários COMMISSIONER
- [ ] Mensagens de erro mencionam "comissário" ao invés de "administrador"

#### 4. **APIs**
- [ ] `GET /api/users` - Acesso apenas para COMMISSIONER
- [ ] `POST /api/auth/register` - Acesso apenas para COMMISSIONER
- [ ] `PATCH /api/users/[id]` - Acesso apenas para COMMISSIONER
- [ ] `POST /api/leagues/sync` - Acesso apenas para COMMISSIONER
- [ ] `POST /api/players/import` - Acesso apenas para COMMISSIONER

## 📋 Comandos para Execução

```bash
# 1. Aplicar migration
npx prisma migrate dev

# 2. Executar seed
npx prisma db seed

# 3. Executar teste de verificação
npx ts-node scripts/test-admin-removal.ts

# 4. Iniciar aplicação
npm run dev
```

## 🔍 Pontos de Verificação

### Credenciais de Acesso Atualizadas
- **Comissário**: `commissioner@demo.com` / senha `commissioner`
- **Usuário Demo**: `demo@demo.com` / senha `demo`

### Funcionalidades que Devem Funcionar Apenas para COMMISSIONER
1. Gerenciamento de usuários
2. Criação de ligas
3. Sincronização com Sleeper
4. Importação de jogadores
5. Configurações do sistema

### Funcionalidades que Devem Funcionar para COMMISSIONER e USER
1. Gerenciamento de times próprios
2. Visualização de contratos
3. Operações básicas de contratos

## ⚠️ Observações Importantes

1. **Backup**: Certifique-se de ter backup do banco antes de aplicar as migrations
2. **Usuários Existentes**: Todos os usuários ADMIN serão automaticamente migrados para COMMISSIONER
3. **Permissões**: O sistema agora opera com apenas dois níveis: COMMISSIONER (admin) e USER (básico)
4. **Compatibilidade**: Verifique se não há código externo que dependa do perfil ADMIN

## 🎯 Resultado Esperado

Após a conclusão:
- ✅ Nenhum usuário possui perfil ADMIN
- ✅ Todas as funcionalidades administrativas são acessíveis apenas por COMMISSIONER
- ✅ Interface não mostra referências ao perfil "Administrador"
- ✅ APIs rejeitam tentativas de acesso não autorizadas
- ✅ Sistema funciona normalmente com dois perfis: COMMISSIONER e USER