import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/database';
import { isDemoUser } from '@/data/demoData';

/**
 * Hook personalizado para gerenciar autenticação e permissões
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = !!session;
  const user = session?.user;
  const isDemo = isDemoUser(user?.email);

  // Verificações de permissão
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCommissioner = user?.role === UserRole.COMMISSIONER;
  const isUser = user?.role === UserRole.USER;

  // Funções de verificação de permissão
  const canManageUsers = isAdmin || isCommissioner;
  const canManageLeagues = isAdmin || isCommissioner;
  const canImportLeague = isAdmin || isCommissioner;
  const canEditSettings = isAdmin || isCommissioner;
  const canManageTeam = isAdmin || isCommissioner || isUser;
  const canViewData = isAuthenticated; // Todos os usuários autenticados podem visualizar

  return {
    // Estado da sessão
    isLoading,
    isAuthenticated,
    user,
    isDemoUser: isDemo,

    // Tipos de usuário
    isAdmin,
    isCommissioner,
    isUser,

    // Permissões específicas
    canManageUsers,
    canManageLeagues,
    canImportLeague,
    canEditSettings,
    canManageTeam,
    canViewData,
  };
}

/**
 * Hook para verificar se o usuário tem uma permissão específica
 */
export function usePermission(permission: string) {
  const auth = useAuth();

  const permissions: Record<string, boolean> = {
    'manage:users': auth.canManageUsers,
    'manage:leagues': auth.canManageLeagues,
    'import:league': auth.canImportLeague,
    'edit:settings': auth.canEditSettings,
    'manage:team': auth.canManageTeam,
    'view:data': auth.canViewData,
  };

  return permissions[permission] || false;
}
