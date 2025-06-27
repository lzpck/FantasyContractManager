import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Handler do NextAuth para todas as rotas de autenticação
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
