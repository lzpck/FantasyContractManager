import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useUserTeams } from './useUserTeams';
import { useLeagues } from './useLeagues';

/**
 * Hook para gerenciar redirecionamento pós-login baseado no perfil do usuário
 *
 * Lógica de redirecionamento:
 * - Comissário: vai para /dashboard
 * - Usuário comum com time: vai para página do seu time
 * - Usuário comum sem time: vai para /leagues (se tiver acesso) ou mensagem de orientação
 */
export function usePostLoginRedirect() {
  const router = useRouter();
  const { user, isCommissioner, isAuthenticated, isLoading } = useAuth();
  const { teams, loading: teamsLoading } = useUserTeams();
  const { leagues, loading: leaguesLoading, hasLeagues } = useLeagues();

  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    // Se for comissário, redirecionar para dashboard
    if (isCommissioner) {
      router.push('/dashboard');
      return;
    }

    // Para usuários comuns, aguardar carregamento dos dados
    if (teamsLoading || leaguesLoading) {
      return;
    }

    // Se usuário tem time associado, redirecionar para página do time
    if (user.teamId && teams.length > 0) {
      const userTeam = teams.find(team => team.id === user.teamId);
      if (userTeam) {
        router.push(`/leagues/${userTeam.leagueId}/teams/${userTeam.id}`);
        return;
      }
    }

    // Se usuário não tem time mas tem acesso a ligas, redirecionar para /leagues
    if (hasLeagues) {
      router.push('/leagues');
      return;
    }

    // Se usuário não tem acesso a nenhuma liga, redirecionar para página de orientação
    router.push('/unauthorized?reason=no-team-or-league');
  }, [
    isLoading,
    isAuthenticated,
    user,
    isCommissioner,
    teamsLoading,
    leaguesLoading,
    teams,
    hasLeagues,
    router,
  ]);

  return {
    isRedirecting: isLoading || teamsLoading || leaguesLoading,
  };
}
