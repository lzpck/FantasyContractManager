'use client';

import { useState, useEffect } from 'react';
import { DeadMoneyConfig, DEFAULT_DEAD_MONEY_CONFIG } from '@/types';

interface DeadMoneyConfigResponse {
  leagueId: string;
  leagueName: string;
  deadMoneyConfig: DeadMoneyConfig;
  isCommissioner: boolean;
}

interface UseDeadMoneyConfigReturn {
  /** Configuração atual de dead money */
  config: DeadMoneyConfig | null;
  /** Se o usuário é comissário e pode editar */
  canEdit: boolean;
  /** Se está carregando */
  loading: boolean;
  /** Erro, se houver */
  error: string | null;
  /** Função para atualizar a configuração */
  updateConfig: (newConfig: DeadMoneyConfig) => Promise<boolean>;
  /** Função para recarregar a configuração */
  reload: () => Promise<void>;
}

/**
 * Hook para gerenciar configuração de dead money de uma liga
 */
export function useDeadMoneyConfig(leagueId: string): UseDeadMoneyConfigReturn {
  const [config, setConfig] = useState<DeadMoneyConfig | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuração da API
  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}/dead-money-config`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Liga não encontrada');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado');
        }
        throw new Error('Erro ao carregar configuração');
      }

      const data: DeadMoneyConfigResponse = await response.json();
      setConfig(data.deadMoneyConfig);
      setCanEdit(data.isCommissioner);
    } catch (err) {
      console.error('Erro ao carregar configuração de dead money:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Usar configuração padrão em caso de erro
      setConfig(DEFAULT_DEAD_MONEY_CONFIG);
      setCanEdit(false);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configuração na API
  const updateConfig = async (newConfig: DeadMoneyConfig): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(`/api/leagues/${leagueId}/dead-money-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deadMoneyConfig: newConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar configuração');
      }

      const data = await response.json();
      setConfig(data.deadMoneyConfig);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar configuração de dead money:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  // Recarregar configuração
  const reload = async () => {
    await loadConfig();
  };

  // Carregar configuração ao montar o componente
  useEffect(() => {
    if (leagueId) {
      loadConfig();
    }
  }, [leagueId, loadConfig]);

  return {
    config,
    canEdit,
    loading,
    error,
    updateConfig,
    reload,
  };
}

/**
 * Hook para validar configuração de dead money
 */
export function useDeadMoneyValidation() {
  const validateConfig = (config: DeadMoneyConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar temporada atual
    if (
      typeof config.currentSeason !== 'number' ||
      config.currentSeason < 0 ||
      config.currentSeason > 1
    ) {
      errors.push('Percentual da temporada atual deve estar entre 0 e 1');
    }

    // Validar temporadas futuras
    const requiredKeys = ['1', '2', '3', '4'] as const;
    for (const key of requiredKeys) {
      const value = config.futureSeasons[key];
      if (typeof value !== 'number' || value < 0 || value > 1) {
        errors.push(`Percentual para ${key} ano(s) restante(s) deve estar entre 0 e 1`);
      }
    }

    // Verificar se algum cenário resulta em mais de 100% de penalidade
    const warnings: string[] = [];
    for (const key of requiredKeys) {
      const totalPenalty = config.currentSeason + config.futureSeasons[key];
      if (totalPenalty > 1) {
        warnings.push(
          `Cenário com ${key} ano(s) restante(s) resulta em ${(totalPenalty * 100).toFixed(0)}% de penalidade total`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors: [...errors, ...warnings],
    };
  };

  const calculateImpact = (config: DeadMoneyConfig, salary: number, yearsRemaining: number) => {
    const currentSeason = salary * config.currentSeason;
    const futureKey = Math.min(yearsRemaining, 4).toString() as keyof typeof config.futureSeasons;
    const futureSeasons =
      yearsRemaining > 0 ? salary * config.futureSeasons[futureKey] * yearsRemaining : 0;

    return {
      currentSeason,
      futureSeasons,
      total: currentSeason + futureSeasons,
      percentage: ((currentSeason + futureSeasons) / salary) * 100,
    };
  };

  return {
    validateConfig,
    calculateImpact,
  };
}
