interface SummaryCardProps {
  /** Título do card */
  title: string;
  /** Valor principal a ser exibido */
  value: string;
  /** Ícone emoji para representar o card */
  icon: string;
  /** Informações de tendência (opcional) */
  trend?: {
    /** Valor da tendência (em porcentagem ou número) */
    value: number;
    /** Se a tendência é positiva ou negativa */
    isPositive: boolean;
  };
}

/**
 * Componente de card de resumo para o dashboard
 *
 * Exibe informações importantes de forma visual e compacta,
 * incluindo título, valor, ícone e tendência opcional.
 */
export function SummaryCard({ title, value, icon, trend }: SummaryCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>

          {/* Indicador de tendência */}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'}
                <span className="ml-1">
                  {trend.value > 0 ? '+' : ''}
                  {trend.value}%
                </span>
              </span>
              <span className="text-xs text-slate-400 ml-2">vs. mês anterior</span>
            </div>
          )}
        </div>

        {/* Ícone */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
