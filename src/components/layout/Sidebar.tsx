'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

/**
 * Componente de navegação lateral (sidebar)
 *
 * Fornece navegação principal para as diferentes seções do sistema.
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Itens de navegação
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      description: 'Visão geral',
    },
    {
      name: 'Ligas',
      href: '/leagues',
      icon: '🏆',
      description: 'Gerenciar ligas',
    },
    {
      name: 'Jogadores',
      href: '/players',
      icon: '🏃‍♂️',
      description: 'Base de jogadores',
    },
    {
      name: 'Informações',
      href: '/informacoes',
      icon: 'ℹ️',
      description: 'Regras, contato e suporte',
    },
  ];

  // Função para logout
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Verificar se o item está ativo
  const isActiveItem = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Sidebar para desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 border-r border-slate-700 px-4 py-6">
          {/* Logo/Header */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🏈</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-slate-100">Fantasy CM</h1>
                <p className="text-xs text-slate-400">Contract Manager</p>
              </div>
            )}

            {/* Botão de colapsar */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`ml-auto p-1 rounded-md hover:bg-slate-700 transition-colors ${
                isCollapsed ? 'ml-0' : ''
              }`}
            >
              <span className="text-slate-400">{isCollapsed ? '→' : '←'}</span>
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigationItems.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex gap-x-3 rounded-xl p-2 text-sm leading-6 font-semibold transition-colors ${
                      isActiveItem(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-100 hover:text-blue-400 hover:bg-slate-800'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.name}</div>
                        <div className="text-xs text-slate-400 truncate">{item.description}</div>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
              
              {/* Botão de Logout */}
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group flex gap-x-3 rounded-xl p-2 text-sm leading-6 font-semibold transition-colors text-slate-100 hover:text-red-400 hover:bg-slate-800 w-full"
                  title={isCollapsed ? 'Logout' : undefined}
                >
                  <span className="text-lg flex-shrink-0">🚪</span>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate">Logout</div>
                      <div className="text-xs text-slate-400 truncate">Sair do sistema</div>
                    </div>
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Navegação mobile (placeholder) */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 px-4 py-3">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏈</span>
            <h1 className="text-lg font-semibold text-slate-100">Fantasy CM</h1>
          </div>
          <button className="p-2 rounded-md text-slate-400 hover:bg-slate-700">☰</button>
        </div>
      </div>
    </>
  );
}
