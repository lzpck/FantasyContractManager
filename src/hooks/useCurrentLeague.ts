import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao carregar liga');
  }
  return res.json();
};

export function useCurrentLeague() {
  const { data, error, isLoading, mutate } = useSWR('/api/league', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    league: data?.league ?? null,
    loading: isLoading,
    error: error?.message || null,
    refresh: mutate,
    isConfigured: !!data?.league,
  };
}
