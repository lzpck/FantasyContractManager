import React from 'react';

interface SummaryCardProps {
  /** Título do card */
  title: string;
  /** Valor principal a ser exibido */
  value: string;
  /** Ícone para representar o card */
  icon: React.ComponentType<{ className?: string }>;
  /** Informações de tendência (opcional) */
  trend?: {
    /** Valor da tendência (em porcentagem ou número) */
    value: number;
    /** Se a tendência é positiva ou negativa */
    isPositive: boolean;
  };
  /** Função de clique (opcional) */
  onClick?: () => void;
  /** Percentual para mini gráfico de barra (opcional) */
  progressPercentage?: number;
  /** Informação adicional (opcional) */
  subtitle?: string;
  /** Se o card tem alerta (opcional) */
  hasAlert?: boolean;
}

/**
 * Componente de card de resumo para o dashboard
 *
 * Exibe informações importantes de forma visual e compacta,
 * incluindo título, valor, ícone, tendência opcional, mini gráfico e clique.
 */
export function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  onClick,
  progressPercentage,
  subtitle,
  hasAlert,
}: SummaryCardProps) {
  const cardClasses = `bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 transition-all duration-200 min-h-[140px] sm:min-h-[160px] ${
    onClick
      ? 'cursor-pointer hover:bg-slate-750 hover:border-slate-600 hover:shadow-2xl hover:scale-[1.02]'
      : ''
  } ${hasAlert ? 'ring-2 ring-orange-500 ring-opacity-50' : ''}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">{value}</p>

          {/* Subtítulo */}
          {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}

          {/* Mini gráfico de progresso */}
          {progressPercentage !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Utilização</span>
                <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progressPercentage > 90
                      ? 'bg-red-500'
                      : progressPercentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Indicador de tendência */}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'}
                <span className="ml-1">
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
              </span>
              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">vs. mês anterior</span>
            </div>
          )}
        </div>

        {/* Ícone com alerta */}
        <div className="flex-shrink-0 relative ml-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 rounded-xl flex items-center justify-center">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          </div>
          {hasAlert && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
