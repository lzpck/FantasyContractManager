'use client';

import { PlayerWithContract, ContractStatus, ContractWithPlayer } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { getPositionTailwindClasses } from '@/utils/positionColors';

interface ContractsTableProps {
  contracts: ContractWithPlayer[];
}

/**
 * Componente de tabela de contratos
 *
 * Exibe lista de contratos com informações como jogador, posição, salário,
 * anos restantes, status e time da NFL.
 *
 * Segue o mesmo padrão visual do PlayersTable para consistência na UI.
 */
export function ContractsTable({ contracts }: ContractsTableProps) {
  // Função para obter cor do badge de posição
  const getPositionColor = (position: string) => {
    return getPositionTailwindClasses(position);
  };

  // Função para obter cor do status do contrato
  const getStatusColor = (status: string, yearsRemaining?: number) => {
    // Priorizar anos restantes para contratos ativos
    if (status === 'ACTIVE' && yearsRemaining !== undefined) {
      if (yearsRemaining <= 1) return 'bg-red-600 text-red-100'; // Último ano - vermelho
      if (yearsRemaining <= 2) return 'bg-yellow-600 text-yellow-100'; // Expira em breve - amarelo
    }

    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600 text-green-100';
      case 'EXPIRED':
        return 'bg-red-600 text-red-100';
      case 'TAGGED':
        return 'bg-purple-600 text-purple-100';
      case 'EXTENDED':
        return 'bg-blue-600 text-blue-100';
      case 'CUT':
        return 'bg-slate-600 text-slate-100';
      default:
        return 'bg-slate-600 text-slate-100';
    }
  };

  // Função para formatar salário (usando formato abreviado como na tabela de jogadores)
  const formatSalary = (salary: number) => {
    return formatCurrency(salary, { abbreviated: true });
  };

  // Função para traduzir status
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      ACTIVE: 'Ativo',
      EXPIRED: 'Expirado',
      TAGGED: 'Tagueado',
      EXTENDED: 'Estendido',
      CUT: 'Cortado',
    };
    return translations[status] || status;
  };

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Nenhum contrato encontrado</h3>
        <p className="text-slate-400">Não há contratos que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Jogador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Posição
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Salário Atual
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Anos Restantes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
              Time Fantasy
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-800 divide-y divide-slate-700">
          {contracts.map(contract => (
            <tr key={contract.id} className="hover:bg-slate-700 transition-colors">
              {/* Jogador */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-100">
                        {contract.player.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-100">{contract.player.name}</div>
                    <div className="text-sm text-slate-400">ID: {contract.player.id.slice(-6)}</div>
                  </div>
                </div>
              </td>

              {/* Posição */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(contract.player.position)}`}
                >
                  {contract.player.position}
                </span>
              </td>

              {/* Salário Atual */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-100">
                  {formatSalary(contract.currentSalary)}
                </div>
              </td>

              {/* Anos Restantes */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-100">
                  {contract.yearsRemaining} {contract.yearsRemaining === 1 ? 'ano' : 'anos'}
                </div>
                {contract.yearsRemaining <= 1 && (
                  <div className="text-xs text-red-400">Expira em breve</div>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status, contract.yearsRemaining)}`}
                >
                  {translateStatus(contract.status)}
                </span>
              </td>

              {/* Time Fantasy */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-100">
                  {contract.team?.name || 'Time não encontrado'}
                </div>
                <div className="text-sm text-slate-400">Fantasy</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resumo da tabela */}
      <div className="bg-slate-900 px-6 py-3 border-t border-slate-700">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Total de {contracts.length} contratos</span>
          <div className="flex space-x-6">
            <span>Ativos: {contracts.filter(c => c.status === 'ACTIVE').length}</span>
            <span>
              Expirando:{' '}
              {contracts.filter(c => c.status === 'ACTIVE' && c.yearsRemaining <= 1).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
