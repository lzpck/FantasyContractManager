'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Página de acesso negado
 */
export default function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Acesso Negado</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isAuthenticated
              ? 'Você não tem permissão para acessar esta página.'
              : 'Você precisa fazer login para acessar esta página.'}
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Seu perfil atual:</p>
              <p>
                {user.name} ({user.email})
              </p>
              <p className="capitalize">Tipo: {user.role.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Voltar ao Dashboard
              </Link>
              <p className="text-xs text-gray-500">
                Se você acredita que deveria ter acesso a esta página, entre em contato com o
                comissário da liga.
              </p>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fazer Login
              </Link>
              <p className="text-sm text-gray-600 text-center">
                Entre em contato com o administrador para criar uma conta.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
