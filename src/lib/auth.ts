import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/database';

/**
 * Configuração do NextAuth.js para autenticação
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Login ou Email', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Buscar usuário por login ou email
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ login: credentials.identifier }, { email: credentials.identifier }],
          },
          include: {
            // Removido 'team' - não existe relação direta via teamId
            teams: {
              include: {
                league: true, // Incluir dados da liga dos times que o usuário possui
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }
        return {
          id: user.id,
          login: user.login || user.email, // Garantir que login seja sempre string
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
          teamId: user.teamId,
          // Removido 'team' - não existe relação direta via teamId
          teams: user.teams, // Incluir todos os teams que o usuário possui
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.login = user.login;
        token.teamId = user.teamId;
        token.team = user.team;
        token.teams = user.teams; // Incluir array de teams que o usuário possui
      }

      // Sempre re-buscar o teamId do banco para garantir sincronização
      // Isso é executado em cada renovação do token (ex: mudança de página)
      if (token.sub) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { teamId: true },
          });
          if (currentUser) {
            token.teamId = currentUser.teamId;
          }
        } catch {
          // Em caso de erro, mantém o valor existente do token
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.login = token.login as string;
        session.user.teamId = token.teamId as string | null;
        session.user.team = token.team;
        session.user.teams = token.teams; // Incluir array de teams que o usuário possui
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

/**
 * Função para hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Função para verificar senha
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
