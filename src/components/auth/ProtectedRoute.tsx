'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@prisma/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
  fallbackUrl?: string;
}

/**
 * Componente para proteger rotas baseado em autenticação e permissões
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requireAuth = true,
  fallbackUrl = '/unauthorized',
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Verificar se requer autenticação
    if (requireAuth && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    // Verificar role específico
    if (requiredRole && user?.role !== requiredRole) {
      // Para comissário, verificar se é pelo menos manager
      if (requiredRole === UserRole.MANAGER && user?.role === UserRole.COMMISSIONER) {
        return; // Comissário pode acessar rotas de manager
      }

      router.push(fallbackUrl);
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, requireAuth, router, fallbackUrl]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar se deve renderizar o conteúdo
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Permitir comissário acessar rotas de manager
    if (!(requiredRole === UserRole.MANAGER && user?.role === UserRole.COMMISSIONER)) {
      return null;
    }
  }

  return <>{children}</>;
}

/**
 * HOC para proteger páginas
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>,
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * HOC para proteger páginas que requerem role de comissário
 */
export function withCommissionerAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, { requiredRole: UserRole.COMMISSIONER });
}

/**
 * HOC para proteger páginas que requerem pelo menos role de manager
 */
export function withManagerAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, { requiredRole: UserRole.MANAGER });
}
