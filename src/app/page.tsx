'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Página inicial que redireciona automaticamente para login ou dashboard
 */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Aguardar um pouco para garantir que o status seja determinado
    const timer = setTimeout(() => {
      // Se o usuário já está autenticado, redireciona para o dashboard
      if (status === 'authenticated' && session) {
        router.push('/dashboard');
      }
      // Se não está autenticado, redireciona para o login
      else if (status === 'unauthenticated') {
        router.push('/auth/signin');
      }
      // Se ainda está loading após 2 segundos, força redirecionamento para login
      else if (status === 'loading') {
        router.push('/auth/signin');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, session, router]);

  // Exibe uma tela de carregamento enquanto verifica a autenticação
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-400">Verificando autenticação...</p>
      </div>
    </div>
  );
}
