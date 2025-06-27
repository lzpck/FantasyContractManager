'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      name: 'Times',
      href: '/teams',
      icon: '👥',
      description: 'Gerenciar times',
    },
    {
      name: 'Contratos',
      href: '/contracts',
      icon: '📋',
      description: 'Contratos ativos',
    },
    {
      name: 'Jogadores',
      href: '/players',
      icon: '🏃‍♂️',
      description: 'Base de jogadores',
    },
    {
      name: 'Draft',
      href: '/draft',
      icon: '🎯',
      description: 'Rookie Draft',
    },
    {
      name: 'Análises',
      href: '/analytics',
      icon: '📈',
      description: 'Relatórios e gráficos',
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: '⚙️',
      description: 'Configurações do sistema',
    },
  ];

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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-4 py-6">
          {/* Logo/Header */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🏈</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Fantasy CM</h1>
                <p className="text-xs text-gray-500">Contract Manager</p>
              </div>
            )}

            {/* Botão de colapsar */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`ml-auto p-1 rounded-md hover:bg-gray-100 transition-colors ${
                isCollapsed ? 'ml-0' : ''
              }`}
            >
              <span className="text-gray-500">{isCollapsed ? '→' : '←'}</span>
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigationItems.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                      isActiveItem(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 truncate">{item.description}</div>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Navegação mobile (placeholder) */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏈</span>
            <h1 className="text-lg font-semibold text-gray-900">Fantasy CM</h1>
          </div>
          <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100">☰</button>
        </div>
      </div>
    </>
  );
}
