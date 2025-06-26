/**
 * Utilitários para formatação de valores monetários
 * Segue padrão pt-BR com separadores corretos e destaque para valores negativos
 */

/**
 * Formata valores monetários de forma consistente
 * @param value - Valor em dólares (número)
 * @param options - Opções de formatação
 * @returns String formatada com o valor monetário
 */
export function formatCurrency(
  value: number,
  options: {
    /** Se deve usar abreviações (M, K) para valores grandes */
    abbreviated?: boolean;
    /** Se deve mostrar centavos para valores pequenos */
    showCents?: boolean;
    /** Classe CSS adicional para valores negativos */
    negativeClass?: string;
  } = {},
): string {
  const { abbreviated = true, showCents = false } = options;

  // Trata valores nulos ou indefinidos
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  let formattedValue: string;

  if (abbreviated) {
    // Formatação com abreviações
    if (absoluteValue >= 1000000000) {
      // Bilhões
      formattedValue = `$${(absoluteValue / 1000000000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}B`;
    } else if (absoluteValue >= 1000000) {
      // Milhões
      formattedValue = `$${(absoluteValue / 1000000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}M`;
    } else if (absoluteValue >= 1000) {
      // Milhares
      formattedValue = `$${(absoluteValue / 1000).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}K`;
    } else {
      // Valores menores que mil
      formattedValue = `$${absoluteValue.toLocaleString('pt-BR', {
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
      })}`;
    }
  } else {
    // Formatação completa sem abreviações
    formattedValue = `$${absoluteValue.toLocaleString('pt-BR', {
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    })}`;
  }

  // Adiciona sinal negativo se necessário
  return isNegative ? `-${formattedValue}` : formattedValue;
}

/**
 * Formata valores monetários para exibição em tabelas
 * Usa formatação abreviada por padrão
 */
export function formatTableCurrency(value: number): string {
  return formatCurrency(value, { abbreviated: true });
}

/**
 * Formata valores monetários para exibição detalhada
 * Usa formatação completa sem abreviações
 */
export function formatDetailCurrency(value: number, showCents: boolean = false): string {
  return formatCurrency(value, { abbreviated: false, showCents });
}

/**
 * Formata porcentagem com padrão pt-BR
 * @param value - Valor decimal (ex: 0.75 para 75%)
 * @param decimals - Número de casas decimais
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${(value * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Retorna classes CSS para valores monetários baseado no valor
 * @param value - Valor monetário
 * @param thresholds - Limites para diferentes estados
 */
export function getCurrencyClasses(
  value: number,
  thresholds: {
    negative?: string;
    warning?: number;
    warningClass?: string;
    danger?: number;
    dangerClass?: string;
    positive?: string;
  } = {},
): string {
  const {
    negative = 'text-red-600 font-medium',
    warning,
    warningClass = 'text-yellow-600',
    danger,
    dangerClass = 'text-red-600',
    positive = 'text-gray-900',
  } = thresholds;

  if (value < 0) {
    return negative;
  }

  if (danger !== undefined && value <= danger) {
    return dangerClass;
  }

  if (warning !== undefined && value <= warning) {
    return warningClass;
  }

  return positive;
}

/**
 * Opções para formatação de moeda
 */
export interface CurrencyFormatOptions {
  abbreviated?: boolean;
  showCents?: boolean;
  thresholds?: {
    warning?: number;
    danger?: number;
  };
}

/**
 * Componente React para exibir valores monetários com formatação e classes apropriadas
 */
export interface CurrencyDisplayProps {
  value: number;
  abbreviated?: boolean;
  showCents?: boolean;
  className?: string;
  thresholds?: {
    warning?: number;
    danger?: number;
  };
}

/**
 * Hook para formatação de moeda com classes CSS
 */
export function useCurrencyDisplay(value: number, options: CurrencyFormatOptions = {}) {
  const { abbreviated = true, showCents = false, thresholds } = options;

  const formattedValue = formatCurrency(value, { abbreviated, showCents });
  const cssClasses = getCurrencyClasses(value, {
    warning: thresholds?.warning,
    danger: thresholds?.danger,
  });

  return {
    formattedValue,
    cssClasses,
    isNegative: value < 0,
    isWarning: thresholds?.warning !== undefined && value <= thresholds.warning && value >= 0,
    isDanger: thresholds?.danger !== undefined && value <= thresholds.danger && value >= 0,
  };
}

/**
 * Constantes para valores comuns
 */
export const CURRENCY_CONSTANTS = {
  MILLION: 1000000,
  THOUSAND: 1000,
  DEFAULT_SALARY_CAP: 279000000, // $279M
  MINIMUM_SALARY: 1000000, // $1M
  ROOKIE_MINIMUM: 750000, // $750K
} as const;

/**
 * Utilitário para calcular porcentagem de uso do salary cap
 */
export function calculateCapUsagePercentage(
  usedCap: number,
  totalCap: number = CURRENCY_CONSTANTS.DEFAULT_SALARY_CAP,
): number {
  if (totalCap === 0) return 0;
  return usedCap / totalCap;
}

/**
 * Formata o uso do salary cap com indicadores visuais
 */
export function formatCapUsage(
  usedCap: number,
  totalCap: number = CURRENCY_CONSTANTS.DEFAULT_SALARY_CAP,
) {
  const percentage = calculateCapUsagePercentage(usedCap, totalCap);
  const formattedUsed = formatCurrency(usedCap);
  const formattedTotal = formatCurrency(totalCap);
  const formattedPercentage = formatPercentage(percentage);

  let statusClass = 'text-green-600';
  let statusText = 'Saudável';

  if (percentage >= 1) {
    statusClass = 'text-red-600 font-bold';
    statusText = 'Acima do Cap!';
  } else if (percentage >= 0.95) {
    statusClass = 'text-red-600';
    statusText = 'Crítico';
  } else if (percentage >= 0.85) {
    statusClass = 'text-yellow-600';
    statusText = 'Atenção';
  }

  return {
    formattedUsed,
    formattedTotal,
    formattedPercentage,
    percentage,
    statusClass,
    statusText,
    isOverCap: percentage >= 1,
  };
}

/**
 * Retorna as classes CSS para o status da liga
 * @param status - Status da liga
 * @returns Classes CSS para o status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'ativa':
      return 'bg-green-100 text-green-800';
    case 'draft':
    case 'rascunho':
      return 'bg-blue-100 text-blue-800';
    case 'complete':
    case 'completa':
      return 'bg-gray-100 text-gray-800';
    case 'pre_draft':
    case 'pre-draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Retorna o texto formatado para o status da liga
 * @param status - Status da liga
 * @returns Texto formatado do status
 */
export function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Ativa';
    case 'draft':
      return 'Draft';
    case 'complete':
      return 'Completa';
    case 'pre_draft':
    case 'pre-draft':
      return 'Pré-Draft';
    default:
      return status;
  }
}
