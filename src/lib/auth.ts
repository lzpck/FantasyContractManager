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
            team: true, // Incluir dados do time associado
          },
        });

        if (!user) {
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
          login: user.login,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as UserRole,
          teamId: user.teamId,
          team: user.team,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.login = user.login;
        token.teamId = user.teamId;
        token.team = user.team;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.login = token.login as string;
        session.user.teamId = token.teamId as string;
        session.user.team = token.team;
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
