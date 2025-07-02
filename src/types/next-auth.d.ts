import { UserRole } from '@/types/database';
/**
 * Extensão dos tipos do NextAuth para incluir role do usuário
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      login: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      teamId?: string | null;
      team?: any;
    };
  }

  interface User {
    login: string;
    role: UserRole;
    teamId?: string | null;
    team?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    login: string;
    teamId?: string | null;
    team?: any;
  }
}
