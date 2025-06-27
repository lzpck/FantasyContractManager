import { PrismaClient } from '@prisma/client';

/**
 * Instância global do Prisma Client
 * Evita múltiplas conexões durante o desenvolvimento
 *
 * Inclui middleware para formatação de datas no padrão brasileiro
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria uma nova instância do Prisma Client com middleware para formatação de datas
const createPrismaClient = () => {
  const prisma = new PrismaClient();

  // Adiciona middleware para formatar datas no padrão brasileiro
  prisma.$use(async (params, next) => {
    // Executa a operação original
    const result = await next(params);

    // Se não houver resultado, retorna
    if (!result) return result;

    // Função para formatar data no padrão brasileiro
    const formatDateToBrazilian = (date: Date): string => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    };

    // Função recursiva para processar objetos e arrays
    const processObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      // Se for um array, processa cada item
      if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
      }

      // Se for um objeto Date, formata para string no padrão brasileiro
      if (obj instanceof Date) {
        return formatDateToBrazilian(obj);
      }

      // Para outros objetos, processa cada propriedade
      const processed: any = {};
      for (const key in obj) {
        const value = obj[key];

        // Se for uma data, converte para string no formato brasileiro
        if (value instanceof Date) {
          processed[key] = formatDateToBrazilian(value);
        }
        // Se for um objeto ou array, processa recursivamente
        else if (value && typeof value === 'object') {
          processed[key] = processObject(value);
        }
        // Outros tipos mantém como estão
        else {
          processed[key] = value;
        }
      }

      return processed;
    };

    // Processa o resultado para formatar datas
    return processObject(result);
  });

  return prisma;
};

// Usa a instância global ou cria uma nova
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Em desenvolvimento, mantém a instância global
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
