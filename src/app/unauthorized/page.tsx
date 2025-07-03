'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Suspense } from 'react';

/**
 * Componente interno que usa useSearchParams
 */
function UnauthorizedContent() {
  const { user, isAuthenticated, isCommissioner } = useAuth();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  // Determinar o tipo de mensagem baseado no motivo
  const isNoTeamOrLeague = reason === 'no-team-or-league';

  // Configurar conteúdo baseado no contexto
  const getContent = () => {
    if (isNoTeamOrLeague && isAuthenticated && !isCommissioner) {
      return {
        icon: UserGroupIcon,
        iconColor: 'text-blue-500',
        title: 'Aguardando Associação',
        description: 'Você ainda não foi associado a nenhum time ou liga.',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        isWelcomeMessage: true,
      };
    }

    return {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-500',
      title: 'Acesso Negado',
      description: isAuthenticated
        ? 'Você não tem permissão para acessar esta página.'
        : 'Você precisa fazer login para acessar esta página.',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      isWelcomeMessage: false,
    };
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <IconComponent className={`mx-auto h-16 w-16 ${content.iconColor}`} />
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">{content.title}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{content.description}</p>
        </div>

        {isAuthenticated && user && (
          <div className={`${content.bgColor} border ${content.borderColor} rounded-md p-4`}>
            <div className={`text-sm ${content.textColor}`}>
              {content.isWelcomeMessage ? (
                <>
                  <p className="font-medium mb-2">Bem-vindo ao Fantasy Contract Manager!</p>
                  <p className="mb-2">
                    Olá, <strong>{user.name}</strong>! Sua conta foi criada com sucesso.
                  </p>
                  <p>
                    Aguarde o convite do seu comissário ou entre em contato para mais informações
                    sobre sua associação a um time.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Seu perfil atual:</p>
                  <p>
                    {user.name} ({user.email})
                  </p>
                  <p className="capitalize">Tipo: {user.role.toLowerCase().replace('_', ' ')}</p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              {content.isWelcomeMessage ? (
                <>
                  <Link
                    href="/leagues"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Explorar Ligas
                  </Link>
                  <p className="text-xs text-gray-500">
                    Você pode explorar as ligas disponíveis enquanto aguarda sua associação a um
                    time.
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href={isCommissioner ? '/dashboard' : '/leagues'}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isCommissioner ? 'Voltar ao Dashboard' : 'Ver Ligas'}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Se você acredita que deveria ter acesso a esta página, entre em contato com o
                    comissário da liga.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fazer Login
              </Link>
              <p className="text-sm text-gray-600 text-center">
                Entre em contato com o comissário para criar uma conta.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Página de acesso negado
 * Exibe mensagens personalizadas baseadas no motivo do redirecionamento
 */
export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="animate-pulse">
              <div className="mx-auto h-16 w-16 bg-gray-300 rounded-full"></div>
              <div className="mt-6 h-8 bg-gray-300 rounded mx-auto w-3/4"></div>
              <div className="mt-2 h-4 bg-gray-300 rounded mx-auto w-1/2"></div>
            </div>
          </div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
