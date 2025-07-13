'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Configurações globais do SWR
        revalidateOnFocus: false, // Não revalida quando a janela ganha foco
        revalidateOnReconnect: true, // Revalida quando a conexão é restaurada
        dedupingInterval: 60000, // 1 minuto de cache para deduplicação
        errorRetryCount: 3, // Máximo de 3 tentativas em caso de erro
        errorRetryInterval: 5000, // 5 segundos entre tentativas
        // Cache por 5 minutos por padrão
        refreshInterval: 0, // Não faz polling automático
        // Configuração de timeout
        fetcher: async (url: string) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          try {
            const response = await fetch(url, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
