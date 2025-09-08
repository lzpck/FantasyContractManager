'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useSidebar } from '@/contexts/SidebarContext';

/**
 * Componente de navegação lateral (sidebar)
 *
 * Fornece navegação principal para as diferentes seções do sistema.
 * Adapta o menu conforme o perfil do usuário (comissário vs usuário comum).
 */
export function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { isCommissioner, isAuthenticated } = useAuth();
  const { teams } = useUserTeams();

  // Para manter compatibilidade com o código existente
  const isCollapsed = !isExpanded;

  // Obter o primeiro time do usuário para o atalho "Meu Time"
  const userTeam = teams && teams.length > 0 ? teams[0] : null;

  // Itens de navegação - Dashboard agora disponível para todos os usuários autenticados
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      description: 'Analytics da Liga',
    },
    // Atalho "Meu Time" - aparece apenas se o usuário tiver um time associado
    ...(userTeam
      ? [
          {
            name: 'Meu Time',
            href: `/leagues/${userTeam.leagueId}/teams/${userTeam.id}`,
            icon: '⭐',
            description: userTeam.name,
            isUserTeam: true,
          },
        ]
      : []),
    {
      name: 'Ligas',
      href: '/leagues',
      icon: '🏆',
      description: 'Gerenciar ligas',
    },
    {
      name: 'Eventos',
      href: '/events',
      icon: '📅',
      description: 'Eventos das ligas',
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

  // Verificar se o item está ativo
  const isActiveItem = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Sidebar para desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div
          className={`flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 border-r border-slate-700 py-6 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          {/* Logo/Header */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : ''}`}>
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
              onClick={toggleSidebar}
              className={`p-2 rounded-md hover:bg-slate-700 transition-colors ${
                isCollapsed ? 'w-full flex justify-center' : 'ml-auto'
              }`}
              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              <span className="text-slate-400 text-lg">{isCollapsed ? '→' : '←'}</span>
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex flex-1 flex-col">
            <ul
              role="list"
              className={`flex flex-1 flex-col gap-y-2 ${isCollapsed ? 'items-center' : ''}`}
            >
              {navigationItems.map(item => {
                // Estilo especial para o item "Meu Time"
                const isUserTeamItem = 'isUserTeam' in item && item.isUserTeam;
                const baseClasses = `group flex rounded-xl p-2 text-sm leading-6 font-semibold transition-colors ${isCollapsed ? 'justify-center items-center min-h-[44px]' : 'gap-x-3'}`;

                let itemClasses;
                if (isActiveItem(item.href)) {
                  itemClasses = isUserTeamItem
                    ? 'bg-amber-600 text-white' // Cor dourada para "Meu Time" quando ativo
                    : 'bg-blue-600 text-white';
                } else {
                  itemClasses = isUserTeamItem
                    ? 'text-slate-100 hover:text-amber-400 hover:bg-slate-800' // Hover dourado para "Meu Time"
                    : 'text-slate-100 hover:text-blue-400 hover:bg-slate-800';
                }

                return (
                  <li key={item.name} className={isCollapsed ? 'w-full' : ''}>
                    <Link
                      href={item.href}
                      className={`${baseClasses} ${itemClasses}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <span className={`text-lg flex-shrink-0 ${isCollapsed ? 'text-xl' : ''}`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{item.name}</div>
                          <div className="text-xs text-slate-400 truncate">{item.description}</div>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
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
