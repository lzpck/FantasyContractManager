import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * Variantes específicas para botões de ação
 */
export type ActionButtonVariant = 'success' | 'danger' | 'warning' | 'info';

interface ActionButtonProps extends Omit<ButtonProps, 'variant'> {
  variant: ActionButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  loadingText?: string;
}

/**
 * Componente de botão padronizado para ações do sistema
 * Fornece variantes consistentes de cor, tamanho e comportamento
 */
export function ActionButton({
  variant,
  icon: Icon,
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  // Mapear variantes customizadas para variantes do Button base
  const getButtonVariant = (): ButtonProps['variant'] => {
    switch (variant) {
      case 'success':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'info':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Classes específicas para cada variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      default:
        return '';
    }
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2 font-medium transition-all duration-200',
        'shadow-sm hover:shadow-md',
        'focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50',
        getVariantClasses(),
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          {loadingText || 'Carregando...'}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  );
}

export default ActionButton;
