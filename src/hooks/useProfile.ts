import { useState, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  login: string;
  email: string;
  role: string;
  teamId?: string;
  team?: {
    id: string;
    name: string;
    league: {
      id: string;
      name: string;
    };
  };
}

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UseProfileReturn {
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: ProfileFormData) => Promise<{ success: boolean; user?: User; error?: string }>;
  changePassword: (data: PasswordFormData) => Promise<{ success: boolean; error?: string }>;
  fetchProfile: () => Promise<{ success: boolean; user?: User; error?: string }>;
}

/**
 * Hook personalizado para gerenciar operações de perfil do usuário
 */
export function useProfile(): UseProfileReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar dados do perfil
   */
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar perfil');
      }

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualizar dados do perfil
   */
  const updateProfile = useCallback(async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'profile',
          ...data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao atualizar perfil');
      }

      return { success: true, user: responseData.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Alterar senha
   */
  const changePassword = useCallback(async (data: PasswordFormData) => {
    setIsLoading(true);
    setError(null);

    // Validar confirmação de senha
    if (data.newPassword !== data.confirmPassword) {
      const errorMessage = 'Nova senha e confirmação não coincidem';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          ...data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao alterar senha');
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar senha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    updateProfile,
    changePassword,
    fetchProfile,
  };
}