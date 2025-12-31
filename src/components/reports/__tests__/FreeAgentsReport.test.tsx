/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FreeAgentsReport } from '../FreeAgentsReport';
import { usePlayers } from '@/hooks/usePlayers';
import { useContracts } from '@/hooks/useContracts';
import { ContractStatus } from '@/types';

// Mock hooks
jest.mock('@/hooks/usePlayers');
jest.mock('@/hooks/useContracts');

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock xlsx
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

const mockPlayers = [
  { id: 'p1', name: 'Free Agent 1', position: 'QB', nflTeam: 'ARI', isActive: true },
  { id: 'p2', name: 'Taken Player', position: 'RB', nflTeam: 'BAL', isActive: true },
  { id: 'p3', name: 'Free Agent 2', position: 'WR', nflTeam: 'CLE', isActive: false },
  { id: 'p4', name: 'Tagged Player', position: 'TE', nflTeam: 'DEN', isActive: true },
  { id: 'p5', name: 'Extended Player', position: 'K', nflTeam: 'DET', isActive: true },
];

const mockContracts = [
  {
    id: 'c1',
    status: ContractStatus.ACTIVE,
    playerId: 'p2',
    player: { id: 'p2', name: 'Taken Player' },
  },
  {
    id: 'c2',
    status: ContractStatus.TAGGED,
    playerId: 'p4',
    player: { id: 'p4', name: 'Tagged Player' },
  },
  {
    id: 'c3',
    status: ContractStatus.EXTENDED,
    playerId: 'p5',
    player: { id: 'p5', name: 'Extended Player' },
  },
];

describe('FreeAgentsReport', () => {
  beforeEach(() => {
    (usePlayers as jest.Mock).mockReturnValue({
      players: mockPlayers,
      loading: false,
    });
    (useContracts as jest.Mock).mockReturnValue({
      contracts: mockContracts,
      loading: false,
    });
  });

  it('renders free agents only (excludes ACTIVE, TAGGED, and EXTENDED)', () => {
    render(<FreeAgentsReport />);

    // Free agents should be visible
    expect(screen.getByText('Free Agent 1')).toBeInTheDocument();
    expect(screen.getByText('Free Agent 2')).toBeInTheDocument();

    // Players with ACTIVE, TAGGED, or EXTENDED contracts should NOT appear
    expect(screen.queryByText('Taken Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Tagged Player')).not.toBeInTheDocument();
    expect(screen.queryByText('Extended Player')).not.toBeInTheDocument();
  });

  it('displays correct columns', () => {
    render(<FreeAgentsReport />);

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Posição')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();

    expect(screen.getByText('ARI')).toBeInTheDocument();
    expect(screen.getByText('CLE')).toBeInTheDocument();
  });

  it('filters by active status', () => {
    render(<FreeAgentsReport />);

    // Initially shows both active and inactive free agents
    expect(screen.getByText('Free Agent 1')).toBeInTheDocument(); // Active
    expect(screen.getByText('Free Agent 2')).toBeInTheDocument(); // Inactive

    // Click checkbox to show only active
    const checkbox = screen.getByLabelText('Apenas Jogadores Ativos');
    fireEvent.click(checkbox);

    expect(screen.getByText('Free Agent 1')).toBeInTheDocument();
    expect(screen.queryByText('Free Agent 2')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    (usePlayers as jest.Mock).mockReturnValue({ players: [], loading: true });
    render(<FreeAgentsReport />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
