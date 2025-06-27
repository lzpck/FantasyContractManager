import { PrismaClient } from '@prisma/client';

/**
 * Instância global do Prisma Client
 * Evita múltiplas conexões durante o desenvolvimento
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
