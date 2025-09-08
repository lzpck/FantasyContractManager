import useSWR from 'swr';
import { useAuth } from './useAuth';
import { Team } from '@/types';

interface UseUserTeamsReturn {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fetcher function para SWR com tratamento de erro aprimorado
const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Tratamento específico para diferentes códigos de erro
      switch (response.status) {
        case 401:
          throw new Error('Sessão expirada. Faça login novamente.');
        case 403:
          throw new Error('Você não tem permissão para acessar estes dados.');
        case 404:
          throw new Error('Times não encontrados.');
        case 500:
          throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
        case 503:
          throw new Error('Serviço temporariamente indisponível.');
        default:
          throw new Error(`Erro ao carregar times (${response.status})`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Se for um erro de rede ou outro erro não relacionado à resposta HTTP
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }

    // Re-throw outros erros (incluindo os que criamos acima)
    throw error;
  }
};

/**
 * Hook para gerenciar times do usuário
 * Busca todos os times onde o usuário é proprietário
 * Usa SWR para cache automático e deduplicação de requisições.
 */
export function useUserTeams(): UseUserTeamsReturn {
  const { user } = useAuth();
  const {
    data: teams = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    user ? '/api/teams' : null, // Só faz a requisição se o usuário estiver logado
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto de cache
    },
  );

  // Formatação do erro para exibição ao usuário
  const formatError = (err: any): string | null => {
    if (!err) return null;

    // Se já é uma string, retorna diretamente
    if (typeof err === 'string') return err;

    // Se tem uma mensagem, usa ela
    if (err.message) return err.message;

    // Fallback genérico
    return 'Erro ao carregar dados do time';
  };

  return {
    teams,
    loading: isLoading,
    error: formatError(error),
    refetch: mutate,
  };
}

/**
 * Hook para buscar times de uma liga específica
 */
export function useLeagueTeams(leagueId: string) {
  const { teams, loading, error, refetch } = useUserTeams();

  const leagueTeams = teams.filter(team => team.leagueId === leagueId);

  return {
    teams: leagueTeams,
    loading,
    error,
    refetch,
  };
}
