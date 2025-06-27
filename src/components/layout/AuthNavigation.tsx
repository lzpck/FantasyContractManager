'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  UserIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/**
 * Componente de navegação com informações de autenticação
 */
export function AuthNavigation() {
  const { user, isAuthenticated, isCommissioner, canManageUsers } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/signin"
          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
        >
          Entrar
        </Link>
        <Link
          href="/auth/signup"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Cadastrar
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500 flex items-center">
              {isCommissioner && <ShieldCheckIcon className="h-3 w-3 mr-1" />}
              {user.role === 'ADMIN' && 'Administrador'}
              {user.role === 'COMMISSIONER' && 'Comissário'}
              {user.role === 'USER' && 'Usuário'}
            </p>
          </div>
        </div>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isDropdownOpen && (
        <>
          {/* Overlay para fechar o dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />

          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* Informações do usuário */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {user.role === 'ADMIN' && 'Administrador'}
                  {user.role === 'COMMISSIONER' && 'Comissário'}
                  {user.role === 'USER' && 'Usuário'}
                </span>
              </div>

              {/* Links do menu */}
              <div className="py-1">
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  Dashboard
                </Link>

                {canManageUsers && (
                  <Link
                    href="/admin"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserGroupIcon className="h-4 w-4 mr-3" />
                    Gerenciar Usuários
                  </Link>
                )}

                {isCommissioner && (
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3" />
                    Configurações
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
