import { PrismaClient } from '@prisma/client';

/**
 * Instância global do Prisma Client
 * Evita múltiplas conexões durante o desenvolvimento
 *
 * Configurado para trabalhar com datas em formato ISO 8601
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Converte uma data para formato ISO 8601 no fuso horário do Brasil (America/Sao_Paulo)
 * @param date - Data a ser convertida
 * @returns String no formato ISO 8601 com fuso horário do Brasil
 */
export const toISOString = (date: Date = new Date()): string => {
  // Converte para o fuso horário do Brasil usando Intl
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  const second = parts.find(p => p.type === 'second')?.value;
  
  // Adiciona os milissegundos da data original
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}Z`;
};

/**
 * Cria uma nova data no fuso horário do Brasil
 * @returns Nova data no fuso horário de São Paulo/Brasília
 */
export const nowInBrazil = (): Date => {
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
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second, now.getMilliseconds());
};

/**
 * Converte uma string ISO 8601 para objeto Date
 * @param isoString - String no formato ISO 8601
 * @returns Objeto Date ou null se inválido
 */
export const fromISOString = (isoString: string): Date | null => {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Formata uma string ISO 8601 para exibição no padrão brasileiro com fuso horário do Brasil
 * @param isoString - String no formato ISO 8601
 * @param includeTime - Se deve incluir o horário
 * @returns String formatada no padrão brasileiro
 */
export const formatISOToBrazilian = (isoString: string, includeTime: boolean = true): string => {
  const date = fromISOString(isoString);
  if (!date) return '';
  
  if (includeTime) {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).replace(',', '');
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
  }
};

// Cria uma nova instância do Prisma Client
const createPrismaClient = () => {
  const prisma = new PrismaClient();

  // Middleware para automatizar timestamps em formato ISO 8601 com fuso horário do Brasil
  prisma.$use(async (params, next) => {
    const now = toISOString(nowInBrazil());
    
    // Para operações de criação, adiciona createdAt e updatedAt
    if (params.action === 'create') {
      if (params.args.data) {
        params.args.data.createdAt = now;
        params.args.data.updatedAt = now;
      }
    }
    
    // Para operações de atualização, atualiza updatedAt
    if (params.action === 'update' || params.action === 'updateMany') {
      if (params.args.data) {
        params.args.data.updatedAt = now;
      }
    }
    
    // Para operações de upsert, atualiza ambos os casos
    if (params.action === 'upsert') {
      if (params.args.create) {
        params.args.create.createdAt = now;
        params.args.create.updatedAt = now;
      }
      if (params.args.update) {
        params.args.update.updatedAt = now;
      }
    }
    
    return next(params);
  });

  return prisma;
 };

// Usa a instância global ou cria uma nova
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Em desenvolvimento, mantém a instância global
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
