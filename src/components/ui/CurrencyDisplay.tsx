'use client';

import React from 'react';
import { formatCurrency, getCurrencyClasses, useCurrencyDisplay } from '@/utils/formatUtils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface CurrencyDisplayProps {
  /** Valor monetário a ser exibido */
  value: number;
  /** Se deve usar abreviações (M, K) para valores grandes */
  abbreviated?: boolean;
  /** Se deve mostrar centavos para valores pequenos */
  showCents?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Limites para diferentes estados visuais */
  thresholds?: {
    /** Valor limite para estado de aviso */
    warning?: number;
    /** Valor limite para estado de perigo */
    danger?: number;
  };
  /** Se deve mostrar ícone de alerta para valores negativos */
  showNegativeIcon?: boolean;
  /** Tamanho do texto */
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  /** Se deve mostrar tooltip com valor completo */
  showTooltip?: boolean;
}

/**
 * Componente para exibir valores monetários com formatação consistente
 *
 * Características:
 * - Formatação automática baseada no valor (M, K, etc.)
 * - Cores indicativas para valores negativos, avisos e perigos
 * - Ícones opcionais para valores negativos
 * - Tooltip com valor completo quando abreviado
 * - Suporte a diferentes tamanhos de texto
 */
export function CurrencyDisplay({
  value,
  abbreviated = true,
  showCents = false,
  className = '',
  thresholds,
  showNegativeIcon = false,
  size = 'base',
  showTooltip = false,
}: CurrencyDisplayProps) {
  const { formattedValue, cssClasses, isNegative, isWarning, isDanger } = useCurrencyDisplay(
    value,
    {
      abbreviated,
      showCents,
      thresholds,
    },
  );

  // Classes de tamanho
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  };

  // Valor completo para tooltip
  const fullValue = formatCurrency(value, { abbreviated: false, showCents: true });
  const shouldShowTooltip = showTooltip && abbreviated && (value >= 1000000 || value <= -1000000);

  const content = (
    <span
      className={`inline-flex items-center gap-1 ${cssClasses} ${sizeClasses[size]} ${className}`}
    >
      {isNegative && showNegativeIcon && (
        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      )}
      {formattedValue}
    </span>
  );

  if (shouldShowTooltip) {
    return (
      <span className="cursor-help" title={`Valor completo: ${fullValue}`}>
        {content}
      </span>
    );
  }

  return content;
}

/**
 * Componente especializado para exibir salary cap com indicadores visuais
 */
export interface CapDisplayProps {
  /** Valor usado do salary cap */
  usedCap: number;
  /** Valor total do salary cap */
  totalCap: number;
  /** Se deve mostrar porcentagem */
  showPercentage?: boolean;
  /** Se deve mostrar status textual */
  showStatus?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

export function CapDisplay({
  usedCap,
  totalCap,
  showPercentage = true,
  showStatus = false,
  className = '',
}: CapDisplayProps) {
  const percentage = totalCap > 0 ? (usedCap / totalCap) * 100 : 0;
  const isOverCap = percentage >= 100;
  const isCritical = percentage >= 95;
  const isWarning = percentage >= 85;

  let statusClass = 'text-green-600';
  let statusText = 'Saudável';
  let bgClass = 'bg-green-50';

  if (isOverCap) {
    statusClass = 'text-red-600 font-bold';
    statusText = 'Acima do Cap!';
    bgClass = 'bg-red-50';
  } else if (isCritical) {
    statusClass = 'text-red-600';
    statusText = 'Crítico';
    bgClass = 'bg-red-50';
  } else if (isWarning) {
    statusClass = 'text-yellow-600';
    statusText = 'Atenção';
    bgClass = 'bg-yellow-50';
  }

  return (
    <div className={`${bgClass} rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <CurrencyDisplay
            value={usedCap}
            className={`font-semibold ${statusClass}`}
            size="lg"
            showTooltip
          />
          <span className="text-gray-500 text-sm ml-1">/ </span>
          <CurrencyDisplay value={totalCap} className="text-gray-700" showTooltip />
        </div>

        {(showPercentage || showStatus) && (
          <div className="text-right">
            {showPercentage && (
              <div className={`text-sm font-medium ${statusClass}`}>{percentage.toFixed(1)}%</div>
            )}
            {showStatus && <div className={`text-xs ${statusClass}`}>{statusText}</div>}
          </div>
        )}
      </div>

      {isOverCap && (
        <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>Time está acima do salary cap!</span>
        </div>
      )}
    </div>
  );
}

/**
 * Componente para exibir diferenças monetárias (positivas/negativas)
 */
export interface CurrencyDifferenceProps {
  /** Valor da diferença */
  value: number;
  /** Texto de contexto (ex: "vs. ano passado") */
  context?: string;
  /** Se deve mostrar seta indicativa */
  showArrow?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

export function CurrencyDifference({
  value,
  context,
  showArrow = true,
  className = '',
}: CurrencyDifferenceProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const colorClass = isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600';

  const arrow = isNeutral ? '→' : isPositive ? '↗' : '↘';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${colorClass} ${className}`}>
      {showArrow && <span className="font-bold">{arrow}</span>}
      <span className="font-medium">
        {sign}
        {formatCurrency(Math.abs(value))}
      </span>
      {context && <span className="text-xs opacity-75">({context})</span>}
    </span>
  );
}

/**
 * Hook para usar formatação de moeda em componentes
 */
export function useCurrency(value: number, options?: Partial<CurrencyDisplayProps>) {
  return useCurrencyDisplay(value, options);
}

export default CurrencyDisplay;
