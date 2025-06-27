import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from '@/types/database';

/**
 * Middleware para proteger rotas baseado em autenticação e permissões
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Rotas que requerem autenticação de comissário
    const commissionerRoutes = [
      '/admin',
      '/settings',
      '/leagues/import',
      '/api/leagues/import',
      '/auth/signup',
    ];

    // Rotas que requerem pelo menos manager ou comissário
    const managerRoutes = ['/dashboard', '/leagues', '/teams'];

    // Verificar se é uma rota de comissário
    if (commissionerRoutes.some(route => pathname.startsWith(route))) {
      if (token?.role !== UserRole.COMMISSIONER && token?.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Verificar se é uma rota de manager
    if (managerRoutes.some(route => pathname.startsWith(route))) {
      if (!token?.role || token.role === UserRole.USER) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir acesso às rotas de autenticação (exceto signup)
        if (pathname.startsWith('/auth/') && !pathname.startsWith('/auth/signup')) {
          return true;
        }

        // Permitir acesso à página inicial e páginas públicas
        if (pathname === '/' || pathname.startsWith('/public')) {
          return true;
        }

        // Todas as outras rotas requerem autenticação
        return !!token;
      },
    },
  },
);

/**
 * Configuração das rotas que o middleware deve processar
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
