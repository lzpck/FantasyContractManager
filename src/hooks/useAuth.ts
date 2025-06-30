import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return {
    user: user
      ? {
          id: user.id || '',
          name: user.name || '',
          email: user.email || '',
          avatar: user.image,
          role: user.role || 'USER',
          isActive: true,
          isCommissioner: user.role === 'COMMISSIONER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : null,
    isAuthenticated: !!user,
    isLoading: status === 'loading',
  
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
