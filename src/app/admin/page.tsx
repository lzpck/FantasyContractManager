'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@prisma/client';
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  EyeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    teams: number;
    leagues: number;
  };
}

/**
 * Página administrativa para gerenciamento de usuários
 */
export default function AdminPage() {
  const { isCommissioner } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Carregar usuários
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      setError('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCommissioner) {
      fetchUsers();
    }
  }, [isCommissioner]);

  // Atualizar usuário
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      await fetchUsers();
      setEditingUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    } finally {
      setIsUpdating(false);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar usuário');
      }

      await fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao deletar usuário');
    }
  };

  // Função para obter ícone do role
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.COMMISSIONER:
        return <ShieldCheckIcon className="h-5 w-5 text-purple-600" />;
      case UserRole.MANAGER:
        return <UserIcon className="h-5 w-5 text-blue-600" />;
      case UserRole.VIEWER:
        return <EyeIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Função para obter cor do badge do role
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.COMMISSIONER:
        return 'bg-purple-100 text-purple-800';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.VIEWER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isCommissioner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Acesso negado. Apenas comissários podem acessar esta página.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie usuários, permissões e perfis da plataforma.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Novo Usuário
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Times/Ligas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span
                            className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                              user.role,
                            )}`}
                          >
                            {user.role === UserRole.COMMISSIONER && 'Comissário'}
                            {user.role === UserRole.MANAGER && 'Manager'}
                            {user.role === UserRole.VIEWER && 'Visualizador'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._count.teams} times, {user._count.leagues} ligas
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Usuário: {editingUser.name}
              </h3>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updates = {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    role: formData.get('role') as UserRole,
                    isActive: formData.get('isActive') === 'true',
                  };
                  handleUpdateUser(editingUser.id, updates);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingUser.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingUser.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Perfil</label>
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={UserRole.VIEWER}>Visualizador</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.COMMISSIONER}>Comissário</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingUser.isActive.toString()}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUpdating ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
