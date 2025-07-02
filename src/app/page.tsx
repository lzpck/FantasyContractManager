'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePostLoginRedirect } from '@/hooks/usePostLoginRedirect';

/**
 * Página inicial que redireciona automaticamente para login ou destino baseado no perfil
 */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isRedirecting } = usePostLoginRedirect();

  useEffect(() => {
    // Se não está autenticado, redirecionar para login
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // Se ainda está carregando após 3 segundos, forçar redirecionamento para login
    if (status === 'loading') {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  // Se está autenticado, o hook usePostLoginRedirect cuidará do redirecionamento
  // baseado no perfil do usuário

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Fantasy Contract Manager</h1>
        <p className="text-muted-foreground">
          {status === 'loading' || isRedirecting ? 'Carregando...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  );
}
