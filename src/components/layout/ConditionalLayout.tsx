'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { AuthNavigation } from './AuthNavigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { AgentChatModal } from '@/components/agent/AgentChatModal';

/**
 * Componente que renderiza condicionalmente o layout baseado na rota atual
 *
 * Oculta o sidebar e a navegação superior nas páginas de autenticação
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isExpanded } = useSidebar();

  // Rotas onde o sidebar não deve aparecer
  const authRoutes = ['/auth/signin', '/auth/signup', '/unauthorized'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Se for uma rota de autenticação, renderizar apenas o conteúdo
  if (isAuthRoute) {
    return <main className="bg-[#0f172a] min-h-screen">{children}</main>;
  }

  // Layout normal com sidebar para outras rotas
  return (
    <>
      {/* Sidebar de navegação */}
      <Sidebar />

      {/* Layout principal com sidebar - padding dinâmico baseado no estado do sidebar */}
      <div className={`transition-all duration-300 ${isExpanded ? 'lg:pl-64' : 'lg:pl-20'}`}>
        {/* Barra de navegação superior */}
        <nav className="bg-slate-900 shadow-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center lg:hidden">
                <h1 className="text-xl font-bold text-slate-100">Fantasy Contract Manager</h1>
              </div>
              <div className="flex items-center ml-auto">
                <AuthNavigation />
              </div>
            </div>
          </div>
        </nav>

        {/* Conteúdo principal */}
        <main className="bg-[#0f172a] min-h-screen">{children}</main>
      </div>

      {/* Agente de IA */}
      <AgentChatModal />
    </>
  );
}
