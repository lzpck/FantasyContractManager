'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { League, LeagueStatus } from '@/types';
import { useLeagues } from '@/hooks/useLeagues';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentLeague } from '@/hooks/useCurrentLeague';
import { formatCurrency, getStatusColor, getStatusText } from '@/utils/formatUtils';
import { Toast } from '@/components/ui/Toast';
import LeagueModal from '@/components/leagues/LeagueModal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Página de listagem de ligas
 *
 * Exibe todas as ligas cadastradas em formato de cards responsivos,
 * com funcionalidades de busca, filtros e ações rápidas.
 */
export default function LeaguesPage() {
  const router = useRouter();
  const { league, loading, error } = useCurrentLeague();
  const { canImportLeague } = useAuth();

  useEffect(() => {
    if (!loading && league) {
      router.push(`/leagues/${league.id}`);
    }
  }, [loading, league, router]);

  // Renderizar estado de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-400">Carregando liga...</span>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Erro ao carregar liga</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
