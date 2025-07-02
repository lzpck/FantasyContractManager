'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/types/database';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Team } from '@/types';

/**
 * Componente para criação de usuários por comissários
 */
interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.USER,
    teamId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Carregar times disponíveis quando o componente montar
  useEffect(() => {
    const fetchAvailableTeams = async () => {
      try {
        setLoadingTeams(true);
        const response = await fetch('/api/teams/available');

        if (response.ok) {
          const data = await response.json();
          setAvailableTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Erro ao carregar times disponíveis:', error);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchAvailableTeams();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          login: formData.login,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          teamId: formData.teamId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar usuário');
      } else {
        setSuccess('Usuário criado com sucesso!');
        // Limpar formulário
        setFormData({
          name: '',
          login: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: UserRole.USER,
          teamId: '',
        });
        // Chamar callback de sucesso após um breve delay
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      setError('Erro ao criar usuário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-slate-100">Criar Novo Usuário</h3>
        <p className="mt-1 text-sm text-slate-400">
          Preencha os dados para criar um novo usuário no sistema.
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
            required
            className="mt-1 block w-full px-3 py-2 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="Login único do usuário"
            value={formData.login}
            onChange={handleChange}
          />
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
              <option value="">Selecione um time...</option>
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
              Escolha o time que o usuário irá gerenciar.
            </p>
          </div>
        )}

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-slate-100">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            className="mt-1 block w-full px-3 py-2 pr-10 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="Mínimo 6 caracteres"
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

        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-100">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            className="mt-1 block w-full px-3 py-2 pr-10 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-100 bg-slate-800 placeholder-slate-500"
            placeholder="Confirme a senha"
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
            {isLoading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
