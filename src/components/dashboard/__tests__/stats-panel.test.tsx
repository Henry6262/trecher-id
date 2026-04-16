import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from '../stats-panel';

describe('StatsPanel', () => {
  const mockStats = {
    totalPnlUsd: 1234.56,
    winRate: 65.5,
    totalTrades: 42,
    holdings: [
      { tokenSymbol: 'SOL', amount: 10.5, valueUsd: 3150 },
      { tokenSymbol: 'COPE', amount: 1000, valueUsd: 50 },
    ],
  };

  it('should render all stats correctly', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('65.5%')).toBeInTheDocument();

    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    expect(screen.getByText('Total PnL')).toBeInTheDocument();
    expect(screen.getByText('$1234.56')).toBeInTheDocument();

    expect(screen.getByText('Holdings')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show top holding in preview', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText(/Top: SOL/)).toBeInTheDocument();
    expect(screen.getByText(/\$3150.00/)).toBeInTheDocument();
  });

  it('should handle zero values gracefully', () => {
    const zeroStats = {
      totalPnlUsd: 0,
      winRate: 0,
      totalTrades: 0,
      holdings: [],
    };

    render(<StatsPanel stats={zeroStats} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show positive PnL in green', () => {
    render(<StatsPanel stats={mockStats} />);

    const pnlElement = screen.getByText('$1234.56');
    expect(pnlElement).toHaveClass('text-green-400');
  });

  it('should show negative PnL in red', () => {
    const negativeStats = {
      ...mockStats,
      totalPnlUsd: -500,
    };

    render(<StatsPanel stats={negativeStats} />);

    const pnlElement = screen.getByText('$-500.00');
    expect(pnlElement).toHaveClass('text-red-400');
  });

  it('should handle missing stats fields', () => {
    const partialStats = {
      holdings: [{ tokenSymbol: 'SOL', amount: 1, valueUsd: 300 }],
    };

    render(<StatsPanel stats={partialStats as any} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    const stats = {
      totalPnlUsd: 0.01,
      winRate: 33.33333,
      totalTrades: 100,
      holdings: [],
    };

    render(<StatsPanel stats={stats} />);

    expect(screen.getByText('33.3%')).toBeInTheDocument();
    expect(screen.getByText('$0.01')).toBeInTheDocument();
  });
});
