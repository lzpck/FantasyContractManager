/**
 * Utilitário centralizado para cores das posições dos jogadores
 * Mantém consistência visual em todo o sistema
 */

// Cores principais para cada posição - otimizadas para acessibilidade e modo escuro
export const POSITION_COLORS: Record<string, string> = {
  QB: '#4F8EF7', // Azul vibrante
  RB: '#19C37D', // Verde esmeralda
  WR: '#FF9800', // Laranja
  TE: '#9C27B0', // Roxo
  K: '#E53935', // Vermelho
  DL: '#00BCD4', // Ciano
  LB: '#FF5722', // Vermelho-laranja
  DB: '#795548', // Marrom
  DEF: '#607D8B', // Azul-acinzentado
  // Posições adicionais com cores de fallback
  DT: '#3F51B5', // Índigo
  DE: '#009688', // Verde-azulado
  OLB: '#FF6F00', // Âmbar escuro
  ILB: '#8BC34A', // Verde-lima
  CB: '#E91E63', // Rosa
  S: '#673AB7', // Roxo escuro
  FS: '#2196F3', // Azul
  SS: '#FFC107', // Amarelo
};

/**
 * Converte cor hexadecimal para classes Tailwind CSS
 * @param position - Posição do jogador
 * @returns Classes CSS para background e texto
 */
export const getPositionTailwindClasses = (position: string): string => {
  const colorMap: Record<string, string> = {
    QB: 'bg-blue-500 text-blue-100',
    RB: 'bg-green-500 text-green-100',
    WR: 'bg-orange-500 text-orange-100',
    TE: 'bg-purple-500 text-purple-100',
    K: 'bg-red-500 text-red-100',
    DL: 'bg-cyan-500 text-cyan-100',
    LB: 'bg-orange-600 text-orange-100',
    DB: 'bg-amber-700 text-amber-100',
    DEF: 'bg-slate-600 text-slate-100',
    // Posições adicionais
    DT: 'bg-indigo-600 text-indigo-100',
    DE: 'bg-teal-600 text-teal-100',
    OLB: 'bg-amber-600 text-amber-100',
    ILB: 'bg-lime-500 text-lime-100',
    CB: 'bg-pink-600 text-pink-100',
    S: 'bg-purple-700 text-purple-100',
    FS: 'bg-blue-600 text-blue-100',
    SS: 'bg-yellow-500 text-yellow-100',
  };

  return colorMap[position] || 'bg-slate-600 text-slate-100';
};

/**
 * Obtém a cor hexadecimal para uma posição
 * @param position - Posição do jogador
 * @returns Cor em formato hexadecimal
 */
export const getPositionColor = (position: string): string => {
  return POSITION_COLORS[position] || '#9CA3AF'; // Cinza como fallback
};

/**
 * Função legada para compatibilidade com código existente
 * @deprecated Use getPositionTailwindClasses instead
 */
export const getPositionColorLegacy = (position: string): string => {
  const colors: { [key: string]: string } = {
    QB: 'bg-blue-500 text-blue-100',
    RB: 'bg-green-500 text-green-100',
    WR: 'bg-orange-500 text-orange-100',
    TE: 'bg-purple-500 text-purple-100',
    K: 'bg-red-500 text-red-100',
    DEF: 'bg-slate-600 text-slate-100',
  };
  return colors[position] || 'bg-slate-600 text-slate-100';
};
