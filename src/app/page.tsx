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
    // Se o usuário já está autenticado, redireciona para o dashboard
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
    // Se não está autenticado, redireciona para o login
    else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
    // Se status é 'loading', aguarda a verificação da sessão
  }, [status, session, router]);

  // Exibe uma tela de carregamento enquanto verifica a autenticação
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-400">Carregando...</p>
      </div>
    </div>
  );
}
