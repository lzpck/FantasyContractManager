/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActiveContractsReport } from '../ActiveContractsReport';
import { useContracts } from '@/hooks/useContracts';
import { ContractStatus } from '@/types';

// Mock useContracts
jest.mock('@/hooks/useContracts');

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock formatCurrency
jest.mock('@/utils/formatUtils', () => ({
  formatCurrency: (val: number) => `$${val}M`,
}));

const mockContracts = [
  {
    id: '1',
    status: ContractStatus.ACTIVE,
    currentSalary: 10,
    yearsRemaining: 2,
    player: { name: 'Player One', id: 'p1' },
  },
  {
    id: '2',
    status: ContractStatus.ACTIVE,
    currentSalary: 2,
    yearsRemaining: 1,
    player: { name: 'Player Two', id: 'p2' },
  },
  {
    id: '3',
    status: ContractStatus.EXPIRED,
    currentSalary: 5,
    yearsRemaining: 0,
    player: { name: 'Player Three', id: 'p3' },
  },
];

describe('ActiveContractsReport', () => {
  beforeEach(() => {
    (useContracts as jest.Mock).mockReturnValue({
      contracts: mockContracts,
      loading: false,
    });
  });

  it('renders active contracts only', () => {
    render(<ActiveContractsReport />);

    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
    expect(screen.queryByText('Player Three')).not.toBeInTheDocument();
  });

  it('filters by search term', () => {
    render(<ActiveContractsReport />);

    const searchInput = screen.getByPlaceholderText('Buscar por nome...');
    fireEvent.change(searchInput, { target: { value: 'One' } });

    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.queryByText('Player Two')).not.toBeInTheDocument();
  });

  it('filters by salary', () => {
    render(<ActiveContractsReport />);

    // Select low salary (< 5)
    // Using aria-label to find select
    const salarySelect = screen.getByLabelText('Filtrar por salário');
    fireEvent.change(salarySelect, { target: { value: 'low' } });

    expect(screen.queryByText('Player One')).not.toBeInTheDocument(); // Salary 10
    expect(screen.getByText('Player Two')).toBeInTheDocument(); // Salary 2
  });

  it('filters by time remaining', () => {
    render(<ActiveContractsReport />);

    // Select expiring (1 year)
    const timeSelect = screen.getByLabelText('Filtrar por tempo de contrato');
    fireEvent.change(timeSelect, { target: { value: 'expiring' } });

    expect(screen.queryByText('Player One')).not.toBeInTheDocument(); // 2 years
    expect(screen.getByText('Player Two')).toBeInTheDocument(); // 1 year
  });
});
