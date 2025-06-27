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

  // Verificações de permissão
  const isCommissioner = user?.role === UserRole.COMMISSIONER;
  const isManager = user?.role === UserRole.MANAGER;
  const isViewer = user?.role === UserRole.VIEWER;

  // Funções de verificação de permissão
  const canManageUsers = isCommissioner;
  const canManageLeagues = isCommissioner;
  const canImportLeague = isCommissioner;
  const canEditSettings = isCommissioner;
  const canManageTeam = isCommissioner || isManager;
  const canViewData = isAuthenticated; // Todos os usuários autenticados podem visualizar

  return {
    // Estado da sessão
    isLoading,
    isAuthenticated,
    user,

    // Tipos de usuário
    isCommissioner,
    isManager,
    isViewer,

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
