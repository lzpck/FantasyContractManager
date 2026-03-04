'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useCurrentLeague } from '@/hooks/useCurrentLeague';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarEventWidget } from './SidebarEventWidget';
import React, { useEffect, useState, useCallback, useMemo } from 'react';

// Definição do tipo para itens de navegação
interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  isLoading?: boolean;
  isError?: boolean;
  isUserTeam?: boolean;
  onRetry?: () => void;
}

/**
 * Componente Sidebar - Menu lateral de navegação
 * Exibe opções de navegação baseadas no estado de autenticação e permissões do usuário
 * Inclui tratamento para loading, erro e estados de hidratação
 * Otimizado com React.memo para evitar re-renderizações desnecessárias
 */
function Sidebar() {
  const { isExpanded, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { isCommissioner, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { teams, loading: teamsLoading, error: teamsError, refetch } = useUserTeams();
  const { league: currentLeague } = useCurrentLeague();
  const [isHydrated, setIsHydrated] = useState(false);

  // Controle de hidratação para evitar problemas de SSR
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Para manter compatibilidade com o código existente
  const isCollapsed = !isExpanded;

  // Estados de loading combinados
  const isLoading = authLoading || teamsLoading || !isHydrated;

  // Obter o time específico do usuário baseado no teamId da sessão
  const userTeam = user?.teamId && teams ? teams.find(team => team.id === user.teamId) : null;

  // Função para criar itens de navegação com tratamento de loading (memoizada)
  const getNavigationItems = useCallback((): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
        description: 'Analytics da Liga',
      },
    ];

    // Prioriza exibir o link do time do usuário quando disponível
    if (userTeam) {
      // Atalho "Meu Time" - aparece apenas se o usuário tiver um time associado
      baseItems.push({
        name: 'Meu Time',
        href: `/leagues/${userTeam.leagueId}/teams/${userTeam.id}`,
        icon: '⭐',
        description: userTeam.name,
        isUserTeam: true,
      });
    } else if (teamsError && isAuthenticated) {
      // Mostra item com erro se houve falha no carregamento
      baseItems.push({
        name: 'Meu Time',
        href: '#',
        icon: '⚠️',
        description: teamsError || 'Erro ao carregar',
        isError: true,
        onRetry: () => {
          refetch(); // Função para tentar recarregar os dados
        },
      });
    } else if (isAuthenticated && (isLoading || !!user?.teamId)) {
      // Garante que "Meu Time" permaneça visível mesmo durante transições de rota/hidratação
      baseItems.push({
        name: 'Meu Time',
        href: '#',
        icon: '⭐',
        description: 'Carregando...',
        isLoading: true,
      });
    }

    // Adiciona os demais itens
    baseItems.push({
      name: 'Liga',
      href: currentLeague ? `/leagues/${currentLeague.id}` : '/leagues',
      icon: '🏆',
      description: currentLeague ? currentLeague.name : 'Configurar liga',
    });

    baseItems.push(
      {
        name: 'Contratos',
        href: '/contracts',
        icon: '📋',
        description: 'Gerenciar contratos',
      },
      {
        name: 'Jogadores',
        href: '/players',
        icon: '🏃‍♂️',
        description: 'Base de jogadores',
      },
      {
        name: 'Drafts',
        href: '/drafts',
        icon: '📝',
        description: 'Status e picks do Draft',
      },
      {
        name: 'Eventos',
        href: '/events',
        icon: '📅',
        description: 'Eventos das ligas',
      },
      {
        name: 'Histórico',
        href: '/history',
        icon: '🏛️',
        description: 'Hall da Fama e Recordes',
      },
      {
        name: 'Informações',
        href: '/informacoes',
        icon: 'ℹ️',
        description: 'Regras, contato e suporte',
      },
    );

    if (currentLeague && isCommissioner) {
      baseItems.push(
        {
          name: 'Relatórios',
          href: '/reports',
          icon: '📈',
          description: 'Relatórios gerenciais',
        },
        {
          name: 'Configurações',
          href: `/leagues/${currentLeague.id}/settings`,
          icon: '⚙️',
          description: 'Configurações da Liga',
        },
      );
    }

    return baseItems;
  }, [
    isAuthenticated,
    user,
    teams,
    isLoading,
    teamsError,
    refetch,
    userTeam,
    currentLeague,
    isCommissioner,
  ]);

  const navigationItems = useMemo(() => getNavigationItems(), [getNavigationItems]);

  // Verificar se o item está ativo (memoizada)
  const isActiveItem = useCallback(
    (href: string) => {
      if (pathname === href) {
        return true;
      }

      // Item "Liga" com href '/leagues' deve ficar ativo apenas
      // na lista de ligas ou na página de liga raiz '/leagues/:id'
      if (href === '/leagues') {
        return (
          pathname === '/leagues' ||
          (pathname.startsWith('/leagues/') && pathname.split('/').length === 3)
        );
      }

      // Item "Liga" com href '/leagues/:id' NÃO deve ficar ativo
      // em subpáginas como '/leagues/:id/teams/...'
      if (/^\/leagues\/[^/]+$/.test(href)) {
        return false;
      }

      return pathname.startsWith(href + '/');
    },
    [pathname],
  );

  return (
    <>
      {/* Sidebar para desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 bg-slate-900 border-r border-slate-700 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div
          className={`flex grow flex-col gap-y-5 overflow-y-auto py-6 ${
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
                // Aplicar padrão visual uniforme para todos os itens, incluindo "Meu Time"
                const baseClasses = `group flex rounded-xl p-2 text-sm leading-6 font-semibold transition-colors ${isCollapsed ? 'justify-center items-center min-h-[44px]' : 'gap-x-3'}`;

                // Tratamento especial para estados de loading e erro
                let itemClasses = '';
                let isClickable = true;

                if (item.isLoading) {
                  itemClasses = 'text-slate-400 bg-slate-800 cursor-wait';
                  isClickable = false;
                } else if (item.isError) {
                  itemClasses = 'text-red-400 bg-red-900/20 cursor-not-allowed';
                  isClickable = false;
                } else if (isActiveItem(item.href)) {
                  itemClasses = 'bg-blue-600 text-white';
                } else {
                  itemClasses = 'text-slate-100 hover:text-blue-400 hover:bg-slate-800';
                }

                const content = (
                  <>
                    <span
                      className={`text-lg flex-shrink-0 ${isCollapsed ? 'text-xl' : ''} ${item.isLoading ? 'animate-pulse' : ''}`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.name}</div>
                        <div
                          className={`text-xs truncate ${
                            item.isLoading
                              ? 'text-slate-500'
                              : item.isError
                                ? 'text-red-500'
                                : 'text-slate-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    )}
                    {/* Botão de retry para itens com erro */}
                    {item.isError && item.onRetry && !isCollapsed && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.onRetry?.();
                        }}
                        className="flex-shrink-0 p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                        title="Tentar novamente"
                      >
                        🔄
                      </button>
                    )}
                  </>
                );

                return (
                  <li key={item.name} className={isCollapsed ? 'w-full' : ''}>
                    {isClickable ? (
                      <Link
                        href={item.href}
                        className={`${baseClasses} ${itemClasses}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div
                        className={`${baseClasses} ${itemClasses}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Widget de Eventos */}
        {currentLeague && (
          <SidebarEventWidget leagueId={currentLeague.id} isCollapsed={isCollapsed} />
        )}
      </div>

      {/* Navegação mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 px-4 py-3">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏈</span>
            <h1 className="text-lg font-semibold text-slate-100">Fantasy CM</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-slate-400 hover:bg-slate-700 transition-colors"
            aria-label="Abrir menu de navegação"
          >
            ☰
          </button>
        </div>

        {/* Menu mobile expandido */}
        {isExpanded && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleSidebar} />

            {/* Sidebar mobile */}
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Header mobile */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🏈</span>
                    <div>
                      <h1 className="text-lg font-semibold text-slate-100">Fantasy CM</h1>
                      <p className="text-xs text-slate-400">Contract Manager</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md text-slate-400 hover:bg-slate-700 transition-colors"
                    aria-label="Fechar menu de navegação"
                  >
                    ✕
                  </button>
                </div>

                {/* Navegação mobile */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                  <ul className="space-y-2">
                    {navigationItems.map(item => {
                      const baseClasses =
                        'group flex items-center gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-colors';

                      let itemClasses = '';
                      let isClickable = true;

                      if (item.isLoading) {
                        itemClasses = 'text-slate-400 bg-slate-800 cursor-wait';
                        isClickable = false;
                      } else if (item.isError) {
                        itemClasses = 'text-red-400 bg-red-900/20 cursor-not-allowed';
                        isClickable = false;
                      } else if (isActiveItem(item.href)) {
                        itemClasses = 'bg-blue-600 text-white';
                      } else {
                        itemClasses = 'text-slate-100 hover:text-blue-400 hover:bg-slate-800';
                      }

                      const content = (
                        <>
                          <span
                            className={`text-lg flex-shrink-0 ${item.isLoading ? 'animate-pulse' : ''}`}
                          >
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{item.name}</div>
                            <div
                              className={`text-xs truncate ${
                                item.isLoading
                                  ? 'text-slate-500'
                                  : item.isError
                                    ? 'text-red-500'
                                    : 'text-slate-400'
                              }`}
                            >
                              {item.description}
                            </div>
                          </div>
                          {/* Botão de retry para itens com erro */}
                          {item.isError && item.onRetry && (
                            <button
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                item.onRetry?.();
                              }}
                              className="flex-shrink-0 p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                              title="Tentar novamente"
                            >
                              🔄
                            </button>
                          )}
                        </>
                      );

                      return (
                        <li key={item.name}>
                          {isClickable ? (
                            <Link
                              href={item.href}
                              className={`${baseClasses} ${itemClasses}`}
                              onClick={toggleSidebar} // Fecha o menu ao clicar em um item
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className={`${baseClasses} ${itemClasses}`}>{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Widget de Eventos Mobile */}
                {currentLeague && (
                  <SidebarEventWidget leagueId={currentLeague.id} isCollapsed={false} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Exporta o componente com React.memo para otimização de performance
export default React.memo(Sidebar);
