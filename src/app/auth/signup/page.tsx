'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/types/database';
import { Team } from '@/types';

/**
 * Página de cadastro de usuários
 * Redirecionamento para login - apenas comissários podem criar usuários
 */
export default function SignUpPage() {
  const router = useRouter();

  // Redirecionar para login, pois cadastro público não é permitido
  useEffect(() => {
    router.push('/auth/signin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Redirecionando...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Apenas comissários podem criar novos usuários.
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Você será redirecionado para a página de login.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente original de cadastro (mantido como referência)
 * Não é mais utilizado, pois cadastro público foi desabilitado
 */
function OriginalSignUpForm() {
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
  const router = useRouter();

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
        setError(data.error || 'Erro ao criar conta');
      } else {
        setSuccess('Conta criada com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      }
    } catch (error) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Fantasy Contract Manager
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                Login
              </label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Seu login único"
                value={formData.login}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Tipo de usuário
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                value={formData.role}
                onChange={handleChange}
              >
                <option value={UserRole.USER}>Usuário</option>
                <option value={UserRole.COMMISSIONER}>Comissário</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Usuário: gerencia um time | Comissário: acesso total às ligas
              </p>
            </div>

            {/* Seleção de time - obrigatório apenas para usuários */}
            {formData.role === UserRole.USER && (
              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
                  Selecionar Time *
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  required={formData.role === UserRole.USER}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  value={formData.teamId}
                  onChange={handleChange}
                  disabled={loadingTeams}
                >
                  <option value="">Selecione um time...</option>
                  {availableTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} - {team.league?.name} ({team.league?.season})
                    </option>
                  ))}
                </select>
                {loadingTeams && (
                  <p className="mt-1 text-xs text-gray-500">Carregando times disponíveis...</p>
                )}
                {!loadingTeams && availableTeams.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">Nenhum time disponível no momento.</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Escolha o time que você irá gerenciar. Comissários podem se associar a times posteriormente.
                </p>
              </div>
            )}

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
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
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Faça login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
