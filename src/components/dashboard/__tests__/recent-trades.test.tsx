import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentTrades } from '../recent-trades';

// Mock Image component to avoid issues in tests
vi.mock('next/image', () => ({
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

import { vi } from 'vitest';

describe('RecentTrades', () => {
  const mockTrades = [
    {
      id: '1',
      tokenSymbol: 'COPE',
      tokenName: 'Cope',
      tokenImageUrl: 'https://example.com/cope.png',
      type: 'buy' as const,
      amountSol: 0.5,
      timestamp: new Date('2026-04-16T15:30:00'),
    },
    {
      id: '2',
      tokenSymbol: 'BONK',
      tokenName: 'Bonk',
      tokenImageUrl: 'https://example.com/bonk.png',
      type: 'sell' as const,
      amountSol: 1.2,
      timestamp: new Date('2026-04-16T14:00:00'),
    },
  ];

  it('should render table with trades', () => {
    render(<RecentTrades trades={mockTrades} />);

    expect(screen.getByText('Recent Trades')).toBeInTheDocument();
    expect(screen.getByText('COPE')).toBeInTheDocument();
    expect(screen.getByText('BONK')).toBeInTheDocument();
  });

  it('should display buy trades with buy badge', () => {
    render(<RecentTrades trades={[mockTrades[0]]} />);

    const buyBadge = screen.getByText('↓ BUY');
    expect(buyBadge).toHaveClass('bg-green-600/30');
    expect(buyBadge).toHaveClass('text-green-300');
  });

  it('should display sell trades with sell badge', () => {
    render(<RecentTrades trades={[mockTrades[1]]} />);

    const sellBadge = screen.getByText('↑ SELL');
    expect(sellBadge).toHaveClass('bg-red-600/30');
    expect(sellBadge).toHaveClass('text-red-300');
  });

  it('should display amount in SOL with 3 decimals', () => {
    render(<RecentTrades trades={mockTrades} />);

    expect(screen.getByText('0.500')).toBeInTheDocument();
    expect(screen.getByText('1.200')).toBeInTheDocument();
  });

  it('should display token name as subtitle', () => {
    render(<RecentTrades trades={mockTrades} />);

    expect(screen.getByText('Cope')).toBeInTheDocument();
    expect(screen.getByText('Bonk')).toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    render(<RecentTrades trades={mockTrades} />);

    // Should show date and time
    expect(screen.getByText(/Apr 16.*\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('should show empty state when no trades', () => {
    render(<RecentTrades trades={[]} />);

    expect(screen.getByText('No trades yet')).toBeInTheDocument();
  });

  it('should limit trades to specified limit', () => {
    const manyTrades = Array.from({ length: 20 }, (_, i) => ({
      ...mockTrades[0],
      id: `${i}`,
    }));

    render(<RecentTrades trades={manyTrades} limit={5} />);

    const rows = screen.getAllByText(/COPE/);
    expect(rows).toHaveLength(5);
  });

  it('should use default limit of 10', () => {
    const manyTrades = Array.from({ length: 15 }, (_, i) => ({
      ...mockTrades[0],
      id: `${i}`,
    }));

    render(<RecentTrades trades={manyTrades} />);

    const rows = screen.getAllByText(/COPE/);
    expect(rows).toHaveLength(10);
  });

  it('should render column headers correctly', () => {
    render(<RecentTrades trades={mockTrades} />);

    expect(screen.getByText('Token')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Amount (SOL)')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should handle trades without image', () => {
    const tradesNoImage = [
      {
        ...mockTrades[0],
        tokenImageUrl: null,
      },
    ];

    render(<RecentTrades trades={tradesNoImage} />);

    expect(screen.getByText('COPE')).toBeInTheDocument();
    // Should not fail even without image
  });

  it('should be responsive with hover effects', () => {
    render(<RecentTrades trades={mockTrades} />);

    const rows = screen.getAllByRole('row');
    // Find the first data row (skip header)
    const dataRow = rows[1];

    expect(dataRow).toHaveClass('hover:bg-gray-700/20');
  });
});
