'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Interface para o contexto do sidebar
 */
interface SidebarContextType {
  /** Estado atual do sidebar (true = expandido, false = recolhido) */
  isExpanded: boolean;
  /** Função para alternar o estado do sidebar */
  toggleSidebar: () => void;
  /** Função para definir explicitamente o estado do sidebar */
  setSidebarExpanded: (expanded: boolean) => void;
}

/**
 * Contexto para gerenciar o estado do sidebar
 */
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Props do provider do contexto do sidebar
 */
interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * Provider do contexto do sidebar
 *
 * Gerencia o estado global do sidebar (expandido/recolhido) e fornece
 * funções para manipular esse estado em toda a aplicação.
 */
export function SidebarProvider({ children }: SidebarProviderProps) {
  // Estado do sidebar - inicia expandido por padrão
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Alterna o estado do sidebar entre expandido e recolhido
   */
  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
  };

  /**
   * Define explicitamente o estado do sidebar
   * @param expanded - true para expandir, false para recolher
   */
  const setSidebarExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  const value: SidebarContextType = {
    isExpanded,
    toggleSidebar,
    setSidebarExpanded,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

/**
 * Hook para usar o contexto do sidebar
 *
 * @returns Objeto com estado e funções do sidebar
 * @throws Error se usado fora do SidebarProvider
 */
export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebar deve ser usado dentro de um SidebarProvider');
  }

  return context;
}
