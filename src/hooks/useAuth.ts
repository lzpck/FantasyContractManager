import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/database';

/**
 * Hook personalizado para gerenciar autenticação e permissões
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = !!session;
  const user = session?.user;
  const isDemo = false; // Removido sistema demo

  // Verificações de permissão
  const isCommissioner = user?.role === UserRole.COMMISSIONER;
  const isUser = user?.role === UserRole.USER;

  // Funções de verificação de permissão
  const canManageUsers = isCommissioner;
  const canManageLeagues = isCommissioner;
  const canImportLeague = isCommissioner;
  const canEditSettings = isCommissioner;
  const canManageTeam = isCommissioner || isUser;
  const canViewData = isAuthenticated; // Todos os usuários autenticados podem visualizar

  return {
    // Estado da sessão
    isLoading,
    isAuthenticated,
    user,
    // Removido isDemoUser

    // Tipos de usuário
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
