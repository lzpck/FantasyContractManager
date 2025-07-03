'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/types/database';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Team, TeamWithLeague } from '@/types';

/**
 * Componente para edição de usuários por comissários
 */
interface EditUserFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditUserForm({ userId, onSuccess, onCancel }: EditUserFormProps) {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.USER,
    isActive: true,
    password: '',
    confirmPassword: '',
    teamId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableTeams, setAvailableTeams] = useState<TeamWithLeague[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        const response = await fetch(`/api/users/${userId}`);

        if (response.ok) {
          const data = await response.json();
          const userData = data.user;
          setUser(userData);

          // Atualizar formData com os dados do usuário
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role,
            isActive: userData.isActive,
            password: '',
            confirmPassword: '',
            teamId: userData.team
              ? userData.team.id
              : userData.teams && userData.teams.length > 0
                ? userData.teams[0].id
                : '',
          });
        } else {
          setError('Erro ao carregar dados do usuário');
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Carregar times disponíveis quando o usuário for carregado
  useEffect(() => {
    if (!user) return;

    const fetchAvailableTeams = async () => {
      try {
        setLoadingTeams(true);
        const response = await fetch('/api/teams/available');

        if (response.ok) {
          const data = await response.json();
          const teams = data.teams || [];

          // Se o usuário já tem um time, incluí-lo na lista
          if (user.teams && user.teams.length > 0) {
            const userTeam = user.teams[0];
            const teamExists = teams.find((t: Team) => t.id === userTeam.id);
            if (!teamExists) {
              teams.unshift({
                id: userTeam.id,
                name: userTeam.name,
                league: userTeam.league,
              });
            }
          }

          setAvailableTeams(teams);
        }
      } catch (error) {
        console.error('Erro ao carregar times disponíveis:', error);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchAvailableTeams();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validações
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    // Validar seleção de time para usuários
    if (formData.role === UserRole.USER && !formData.teamId) {
      setError('Seleção de time é obrigatória para usuários');
      setIsLoading(false);
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Incluir senha apenas se foi fornecida
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Incluir teamId (pode ser null para desassociar)
      if (formData.role === UserRole.USER) {
        updateData.teamId = formData.teamId || null;
      } else {
        // Para comissários, sempre desassociar de times
        updateData.teamId = null;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao atualizar usuário');
      } else {
        setSuccess('Usuário atualizado com sucesso!');
        // Chamar callback de sucesso após um breve delay
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      setError('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-100">Carregando dados do usuário...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
        <div className="text-center py-8">
          <p className="text-red-400">Erro ao carregar dados do usuário</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-slate-100">Editar Usuário</h3>
        <p className="mt-1 text-sm text-slate-400">
          Atualize as informações do usuário {user.login || user.email}.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-100">
            Nome completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="Nome completo do usuário"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="login" className="block text-sm font-medium text-slate-100">
            Login
          </label>
          <input
            id="login"
            name="login"
            type="text"
            disabled
            className="mt-1 block w-full px-3 py-2 border border-slate-700 rounded-xl shadow-sm bg-slate-700 text-slate-400 cursor-not-allowed"
            value={user.login}
          />
          <p className="mt-1 text-xs text-slate-400">O login não pode ser alterado.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-100">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-100">
            Tipo de usuário
          </label>
          <select
            id="role"
            name="role"
            className="mt-1 block w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100"
            value={formData.role}
            onChange={handleChange}
          >
            <option value={UserRole.USER}>Usuário</option>
            <option value={UserRole.COMMISSIONER}>Comissário</option>
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Usuário: acesso básico | Comissário: gerencia ligas
          </p>
        </div>

        <div className="flex items-center">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-700 rounded bg-slate-800"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-slate-100">
            Usuário ativo
          </label>
          <p className="ml-2 text-xs text-slate-400">Desmarque para desativar o usuário</p>
        </div>

        {/* Seleção de time - obrigatório apenas para usuários */}
        {formData.role === UserRole.USER && (
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-slate-100">
              Selecionar Time *
            </label>
            <select
              id="teamId"
              name="teamId"
              required={formData.role === UserRole.USER}
              className="mt-1 block w-full px-3 py-2 border border-slate-700 bg-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100"
              value={formData.teamId}
              onChange={handleChange}
              disabled={loadingTeams}
            >
              <option value="">Nenhum time selecionado</option>
              {availableTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.league?.name} ({team.league?.season})
                </option>
              ))}
            </select>
            {loadingTeams && (
              <p className="mt-1 text-xs text-slate-400">Carregando times disponíveis...</p>
            )}
            {!loadingTeams && availableTeams.length === 0 && (
              <p className="mt-1 text-xs text-red-400">Nenhum time disponível no momento.</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Escolha o time que o usuário irá gerenciar ou deixe vazio para desassociar.
            </p>
          </div>
        )}

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-slate-100">
            Nova senha (opcional)
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            className="mt-1 block w-full px-3 py-2 pr-10 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="Deixe vazio para manter a senha atual"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-slate-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-slate-400" />
            )}
          </button>
        </div>

        {formData.password && (
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-100">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required={!!formData.password}
              className="mt-1 block w-full px-3 py-2 pr-10 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
              placeholder="Confirme a nova senha"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-slate-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Atualizando...' : 'Atualizar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
