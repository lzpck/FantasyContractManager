/**
 * Utilitário para cores das posições dos jogadores
 * Centraliza as definições de cores para manter consistência visual
 */

// Cores hexadecimais para gráficos (Recharts)
export const POSITION_HEX_COLORS: Record<string, string> = {
  QB: '#3B82F6', // Blue
  RB: '#10B981', // Emerald
  WR: '#F59E0B', // Amber
  TE: '#8B5CF6', // Purple
  K: '#EF4444', // Red
  DEF: '#6B7280', // Slate
  // Posições adicionais
  LB: '#06B6D4', // Cyan
  DB: '#EC4899', // Pink
  DL: '#84CC16', // Lime
  OL: '#F97316', // Orange
  FB: '#8B5CF6', // Purple (similar ao TE)
  P: '#6366F1', // Indigo
  LS: '#14B8A6', // Teal
  // Posições genéricas
  IDP: '#64748B', // Slate
  FLEX: '#A855F7', // Violet
};

// Classes Tailwind para badges (fundo sólido)
export const POSITION_BADGE_COLORS: Record<string, string> = {
  QB: 'bg-blue-600 text-blue-100',
  RB: 'bg-emerald-600 text-emerald-100',
  WR: 'bg-amber-600 text-amber-100',
  TE: 'bg-purple-600 text-purple-100',
  K: 'bg-red-600 text-red-100',
  DEF: 'bg-slate-600 text-slate-100',
  // Posições adicionais
  LB: 'bg-cyan-600 text-cyan-100',
  DB: 'bg-pink-600 text-pink-100',
  DL: 'bg-lime-600 text-lime-100',
  OL: 'bg-orange-600 text-orange-100',
  FB: 'bg-purple-600 text-purple-100',
  P: 'bg-indigo-600 text-indigo-100',
  LS: 'bg-teal-600 text-teal-100',
  IDP: 'bg-slate-600 text-slate-100',
  FLEX: 'bg-violet-600 text-violet-100',
};

// Classes Tailwind para badges (tema escuro com transparência)
export const POSITION_DARK_BADGE_COLORS: Record<string, string> = {
  QB: 'bg-blue-900/30 text-blue-200 border border-blue-700/50',
  RB: 'bg-emerald-900/30 text-emerald-200 border border-emerald-700/50',
  WR: 'bg-amber-900/30 text-amber-200 border border-amber-700/50',
  TE: 'bg-purple-900/30 text-purple-200 border border-purple-700/50',
  K: 'bg-red-900/30 text-red-200 border border-red-700/50',
  DEF: 'bg-slate-900/30 text-slate-200 border border-slate-700/50',
  // Posições adicionais
  LB: 'bg-cyan-900/30 text-cyan-200 border border-cyan-700/50',
  DB: 'bg-pink-900/30 text-pink-200 border border-pink-700/50',
  DL: 'bg-lime-900/30 text-lime-200 border border-lime-700/50',
  OL: 'bg-orange-900/30 text-orange-200 border border-orange-700/50',
  FB: 'bg-purple-900/30 text-purple-200 border border-purple-700/50',
  P: 'bg-indigo-900/30 text-indigo-200 border border-indigo-700/50',
  LS: 'bg-teal-900/30 text-teal-200 border border-teal-700/50',
  IDP: 'bg-slate-900/30 text-slate-200 border border-slate-700/50',
  FLEX: 'bg-violet-900/30 text-violet-200 border border-violet-700/50',
};

/**
 * Obtém a cor hexadecimal para uma posição (para gráficos)
 */
export function getPositionHexColor(position: string): string {
  return POSITION_HEX_COLORS[position] || '#9CA3AF'; // Gray-400 como fallback
}

/**
 * Obtém as classes Tailwind para badge de posição (fundo sólido)
 */
export function getPositionBadgeColor(position: string): string {
  return POSITION_BADGE_COLORS[position] || 'bg-slate-600 text-slate-100';
}

/**
 * Obtém as classes Tailwind para badge de posição (tema escuro)
 */
export function getPositionDarkBadgeColor(position: string): string {
  return POSITION_DARK_BADGE_COLORS[position] || 'bg-slate-900/30 text-slate-200 border border-slate-700/50';
}

/**
 * Ordem oficial das posições para exibição
 * Conforme especificado: QB, RB, WR, TE, K, DL, LB, DB
 */
export const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

/**
 * Lista de todas as posições suportadas
 */
export const ALL_POSITIONS = Object.keys(POSITION_HEX_COLORS);

/**
 * Posições ofensivas
 */
export const OFFENSIVE_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'OL', 'FB'];

/**
 * Posições defensivas
 */
export const DEFENSIVE_POSITIONS = ['DL', 'LB', 'DB', 'DEF', 'IDP'];

/**
 * Posições especiais
 */
export const SPECIAL_POSITIONS = ['K', 'P', 'LS'];

/**
 * Posições flexíveis
 */
export const FLEX_POSITIONS = ['FLEX'];

/**
 * Função para obter o índice de ordenação de uma posição
 */
export function getPositionSortIndex(position: string): number {
  const index = POSITION_ORDER.indexOf(position);
  return index === -1 ? POSITION_ORDER.length : index;
}