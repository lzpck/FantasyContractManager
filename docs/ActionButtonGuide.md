# Guia do Componente ActionButton

## Visão Geral

O `ActionButton` é um componente padronizado para ações do sistema que fornece consistência visual e de UX em toda a aplicação. Ele estende o componente `Button` base com variantes específicas para diferentes tipos de ações.

## Características

- **Variantes padronizadas**: `success`, `danger`, `warning`, `info`
- **Estados de loading**: Indicador visual automático durante operações assíncronas
- **Ícones integrados**: Suporte nativo para ícones do Lucide React
- **Acessibilidade**: Segue padrões WCAG com foco e estados adequados
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## Uso Básico

```tsx
import { ActionButton } from '@/components/ui/action-button';
import { Plus, Trash2, Edit, Info } from 'lucide-react';

// Botão de sucesso (adicionar)
<ActionButton variant="success" icon={Plus}>
  Adicionar Item
</ActionButton>

// Botão de perigo (remover)
<ActionButton variant="danger" icon={Trash2}>
  Remover Item
</ActionButton>

// Botão com estado de loading
<ActionButton 
  variant="success" 
  icon={Plus}
  loading={isLoading}
  loadingText="Salvando..."
>
  Salvar
</ActionButton>
```

## Variantes Disponíveis

### Success (Verde)
- **Uso**: Ações positivas como adicionar, salvar, confirmar
- **Cor**: Verde (#16a34a)
- **Exemplo**: Adicionar contrato, salvar dados

### Danger (Vermelho)
- **Uso**: Ações destrutivas como remover, deletar, cortar
- **Cor**: Vermelho (#dc2626)
- **Exemplo**: Adicionar dead money, cortar jogador

### Warning (Amarelo)
- **Uso**: Ações que requerem atenção ou cuidado
- **Cor**: Amarelo (#ca8a04)
- **Exemplo**: Aplicar franchise tag, extensões

### Info (Azul)
- **Uso**: Ações informativas ou neutras
- **Cor**: Azul (#2563eb)
- **Exemplo**: Visualizar detalhes, exportar dados

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `variant` | `'success' \| 'danger' \| 'warning' \| 'info'` | - | **Obrigatório**. Define a variante visual do botão |
| `icon` | `LucideIcon` | - | Ícone a ser exibido no botão |
| `loading` | `boolean` | `false` | Se true, exibe indicador de loading |
| `loadingText` | `string` | `'Carregando...'` | Texto exibido durante o loading |
| `children` | `ReactNode` | - | Conteúdo do botão |
| `className` | `string` | - | Classes CSS adicionais |
| `disabled` | `boolean` | `false` | Se true, desabilita o botão |

## Exemplos de Uso no Sistema

### Transações de Roster

```tsx
// Botão para adicionar contrato (jogador adicionado)
<ActionButton
  variant="success"
  icon={Plus}
  onClick={() => handleAddContract(player)}
  loading={isLoading}
  loadingText="Abrindo..."
>
  Adicionar Contrato
</ActionButton>

// Botão para adicionar dead money (jogador removido)
<ActionButton
  variant="danger"
  icon={Trash2}
  onClick={() => handleAddDeadMoney(player)}
  loading={isLoading}
  loadingText="Adicionando..."
>
  Adicionar Dead Money
</ActionButton>
```

### Gerenciamento de Contratos

```tsx
// Botão para estender contrato
<ActionButton
  variant="warning"
  icon={Edit}
  onClick={handleExtension}
>
  Estender Contrato
</ActionButton>

// Botão para aplicar franchise tag
<ActionButton
  variant="info"
  icon={Tag}
  onClick={handleFranchiseTag}
>
  Aplicar Franchise Tag
</ActionButton>
```

## Integração com Toast

O `ActionButton` funciona perfeitamente com o sistema de notificações toast do Sonner:

```tsx
import { toast } from 'sonner';

const handleAction = async () => {
  try {
    setLoading(true);
    await performAction();
    toast.success('Ação realizada com sucesso!');
  } catch (error) {
    toast.error('Erro ao realizar ação');
  } finally {
    setLoading(false);
  }
};

<ActionButton
  variant="success"
  icon={Check}
  onClick={handleAction}
  loading={loading}
>
  Executar Ação
</ActionButton>
```

## Boas Práticas

1. **Consistência**: Use sempre as variantes apropriadas para cada tipo de ação
2. **Feedback**: Combine com toast notifications para feedback do usuário
3. **Loading States**: Sempre use o estado de loading para operações assíncronas
4. **Ícones**: Use ícones que representem claramente a ação
5. **Textos**: Mantenha textos concisos e descritivos

## Acessibilidade

- Suporte completo a navegação por teclado
- Estados de foco visíveis
- Textos alternativos apropriados
- Contraste adequado para todas as variantes
- Indicadores de loading acessíveis

## Migração de Botões Existentes

Para migrar botões existentes para o `ActionButton`:

```tsx
// Antes
<Button
  onClick={handleAdd}
  disabled={loading}
  size="sm"
  className="bg-green-600 hover:bg-green-700"
>
  <Plus className="h-4 w-4 mr-1" />
  Adicionar
</Button>

// Depois
<ActionButton
  variant="success"
  icon={Plus}
  onClick={handleAdd}
  loading={loading}
>
  Adicionar
</ActionButton>
```

Esta migração resulta em:
- Código mais limpo e legível
- Consistência visual automática
- Melhor manutenibilidade
- Estados de loading padronizados