'use client';

import { PlayerWithContract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { PencilIcon, TrashIcon, TagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Contract } from '@/types';

interface RosterTableProps {
  active: PlayerWithContract[];
  reserve: PlayerWithContract[];
  taxi: PlayerWithContract[];
  onPlayerAction: (player: PlayerWithContract, action: string) => void;
}

const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

const sortPlayers = (players: PlayerWithContract[]) =>
  players.slice().sort((a, b) => {
    const posA = positionOrder.indexOf(a.player.position);
    const posB = positionOrder.indexOf(b.player.position);
    if (posA !== posB) return posA - posB;
    return a.player.name.localeCompare(b.player.name);
  });

const calculateDeadMoney = (contract: Contract) => {
  const remainingSalary = contract.currentSalary * contract.yearsRemaining;
  return remainingSalary * 0.25;
};

const Section = ({ title, players }: { title: string; players: PlayerWithContract[] }) => (
  <>
    <tr className="bg-gray-100">
      <th colSpan={7} className="px-6 py-2 text-left text-sm font-semibold text-gray-700">
        {title}
      </th>
    </tr>
    {sortPlayers(players).map(p => {
      const deadMoney = p.contract ? calculateDeadMoney(p.contract) : 0;
      return (
        <tr key={p.player.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{p.player.name}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">{p.player.position}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">{p.player.nflTeam}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {p.contract ? formatCurrency(p.contract.currentSalary) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            {p.contract ? `${p.contract.yearsRemaining} ano(s)` : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            {p.contract ? p.contract.status : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            {p.contract ? formatCurrency(deadMoney) : '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            {p.contract ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPlayerAction(p, 'edit')}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPlayerAction(p, 'extend')}
                  className="text-green-600 hover:text-green-900"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPlayerAction(p, 'tag')}
                  className="text-purple-600 hover:text-purple-900"
                >
                  <TagIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPlayerAction(p, 'cut')}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onPlayerAction(p, 'add')}
                className="text-blue-600 hover:text-blue-900"
              >
                Adicionar Contrato
              </button>
            )}
          </td>
        </tr>
      );
    })}
  </>
);

export function RosterTable({ active, reserve, taxi, onPlayerAction }: RosterTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jogador
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Posição
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time NFL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salário Atual
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Anos Restantes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dead Money
            </th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <Section title="Elenco Ativo" players={active} />
          {reserve.length > 0 && <Section title="Injured Reserve (IR)" players={reserve} />}
          {taxi.length > 0 && <Section title="Taxi Squad (TS)" players={taxi} />}
        </tbody>
      </table>
    </div>
  );
}
