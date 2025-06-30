import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Função utilitária para combinar classes CSS de forma inteligente
 * Utiliza clsx para concatenação condicional e tailwind-merge para resolver conflitos
 * 
 * @param inputs - Classes CSS a serem combinadas
 * @returns String com as classes CSS combinadas e otimizadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Função para formatar valores monetários em formato brasileiro
 * 
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Função para formatar valores monetários em formato americano (para salary cap)
 * 
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda americana
 */
export function formatSalaryCap(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Função para formatar datas no padrão brasileiro
 * 
 * @param date - Data a ser formatada
 * @returns String formatada como data brasileira
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
}

/**
 * Função para capitalizar a primeira letra de uma string
 * 
 * @param str - String a ser capitalizada
 * @returns String com a primeira letra maiúscula
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}