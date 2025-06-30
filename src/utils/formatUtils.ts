/**
 * Utilitários para formatação de valores monetários e datas
 * Segue padrão pt-BR com separadores corretos e destaque para valores negativos
 */

/**
 * Converte uma data para formato ISO 8601 no fuso horário do Brasil (America/Sao_Paulo)
 * @param date - Data a ser convertida (Date ou string)
 * @returns String no formato ISO 8601 com fuso horário do Brasil
 */
export function toISOString(date: Date | string = new Date()): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    // Se já for uma string ISO válida, converte para Date primeiro
    if (isValidISOString(date)) {
      dateObj = new Date(date);
    } else {
      // Tenta converter string para Date
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
    }
  } else {
    dateObj = date;
  }

  // Converte para o fuso horário do Brasil usando Intl
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;

  // Adiciona os milissegundos da data original
  const ms = dateObj.getMilliseconds().toString().padStart(3, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}Z`;
}

/**
 * Cria uma nova data no fuso horário do Brasil
 * @returns Nova data no fuso horário de São Paulo/Brasília
 */
export function nowInBrazil(): Date {
  const now = new Date();

  // Converte para o fuso horário do Brasil
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second, now.getMilliseconds());
}

/**
 * Verifica se uma string está no formato ISO 8601 válido
 * @param isoString - String a ser verificada
 * @returns Boolean indicando se é válida
 */
export function isValidISOString(isoString: string): boolean {
  if (!isoString) return false;

  try {
    const date = new Date(isoString);
    return !isNaN(date.getTime()) && isoString === date.toISOString();
  } catch {
    return false;
  }
}

/**
 * Converte uma string ISO 8601 para objeto Date
 * @param isoString - String no formato ISO 8601
 * @returns Objeto Date ou null se inválido
 */
export function fromISOString(isoString: string): Date | null {
  if (!isoString) return null;

  try {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Formata uma data (Date, string ISO ou string) para o padrão brasileiro (dd/MM/yyyy hh:mm:ss)
 * @param date - Data a ser formatada (Date, string ISO ou string)
 * @param includeTime - Se deve incluir o horário na formatação
 * @returns String formatada no padrão brasileiro
 */
export function formatDate(date: Date | string, includeTime: boolean = true): string {
  if (!date) return '';

  let dateObj: Date;

  if (typeof date === 'string') {
    // Se for string ISO, converte diretamente
    if (isValidISOString(date)) {
      dateObj = new Date(date);
    } else {
      // Tenta converter outros formatos de string
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';

  // Formata a data no padrão brasileiro com fuso horário do Brasil
  if (includeTime) {
    // Formata data e hora separadamente e combina para evitar a vírgula
    const datePart = dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });

    const timePart = dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    });

    return `${datePart} ${timePart}`;
  } else {
    // Apenas data
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
  }
}

/**
 * Formata especificamente uma string ISO 8601 para exibição no padrão brasileiro
 * @param isoString - String no formato ISO 8601
 * @param includeTime - Se deve incluir o horário
 * @returns String formatada no padrão brasileiro
 */
export function formatISOToBrazilian(isoString: string, includeTime: boolean = true): string {
  const date = fromISOString(isoString);
  if (!date) return '';

  return formatDate(date, includeTime);
}

/**
 * Converte uma string de data no formato brasileiro (dd/MM/yyyy) para objeto Date
 * @param dateString - String de data no formato brasileiro
 * @returns Objeto Date ou null se inválido
 */
export function parseBrazilianDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Verifica se a string está no formato esperado (dd/MM/yyyy ou dd/MM/yyyy hh:mm:ss)
  const hasTime = dateString.includes(':');

  // Verifica o formato básico da string usando regex
  const dateRegex = hasTime
    ? /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/
    : /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  if (!dateRegex.test(dateString)) return null;

  let day,
    month,
    year,
    hours = 0,
    minutes = 0,
    seconds = 0;

  if (hasTime) {
    // Formato com hora (dd/MM/yyyy hh:mm:ss)
    const [datePart, timePart] = dateString.split(' ');
    [day, month, year] = datePart.split('/').map(Number);
    [hours, minutes, seconds] = timePart.split(':').map(Number);
  } else {
    // Formato apenas data (dd/MM/yyyy)
    [day, month, year] = dateString.split('/').map(Number);
  }

  // Validação básica de valores
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1000 || year > 9999) return null;

  // Validação de dias por mês
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return null;

  // Validação de horas, minutos e segundos
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59)
    return null;

  // Mês em JavaScript é 0-indexed (0-11)
  const date = new Date(year, month - 1, day, hours, minutes, seconds);

  // Verificação final se a data é válida
  return isNaN(date.getTime()) ? null : date;
}

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
    positive = 'text-slate-100',
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
      return 'bg-slate-700 text-slate-100';
    case 'pre_draft':
    case 'pre-draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-slate-700 text-slate-100';
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
