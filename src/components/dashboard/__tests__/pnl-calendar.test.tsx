import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PnLCalendar } from '../pnl-calendar';

describe('PnLCalendar', () => {
  const mockDailyData = [
    { date: new Date('2026-04-10'), pnlUsd: 100 },
    { date: new Date('2026-04-11'), pnlUsd: -50 },
    { date: new Date('2026-04-12'), pnlUsd: 200 },
    { date: new Date('2026-04-13'), pnlUsd: 0 },
    { date: new Date('2026-04-14'), pnlUsd: 75 },
  ];

  const mockOnPeriodChange = vi.fn();

  it('should render calendar with daily data', () => {
    render(
      <PnLCalendar
        dailyData={mockDailyData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    expect(screen.getByText('PnL Calendar')).toBeInTheDocument();
    expect(screen.getAllByText(/[📈📉]/)).toHaveLength(5);
  });

  it('should display stats correctly', () => {
    render(
      <PnLCalendar
        dailyData={mockDailyData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    expect(screen.getByText('Avg Daily PnL')).toBeInTheDocument();
    expect(screen.getByText('Best Day')).toBeInTheDocument();
    expect(screen.getByText('Worst Day')).toBeInTheDocument();

    // Avg = (100 - 50 + 200 + 0 + 75) / 5 = 65
    expect(screen.getByText('$65.00')).toBeInTheDocument();
    // Max = 200
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    // Min = -50
    expect(screen.getByText('$-50.00')).toBeInTheDocument();
  });

  it('should handle period selection', () => {
    render(
      <PnLCalendar
        dailyData={mockDailyData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const button14d = screen.getByRole('button', { name: /14d/ });
    fireEvent.click(button14d);

    expect(mockOnPeriodChange).toHaveBeenCalledWith('14d');
  });

  it('should highlight active period button', () => {
    render(
      <PnLCalendar
        dailyData={mockDailyData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const button7d = screen.getByRole('button', { name: /7d/ });
    expect(button7d).toHaveClass('bg-cyan-500/30');
  });

  it('should show empty state message when no data', () => {
    render(
      <PnLCalendar
        dailyData={[]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    expect(screen.getByText('No trading data available')).toBeInTheDocument();
  });

  it('should color positive days green', () => {
    render(
      <PnLCalendar
        dailyData={[{ date: new Date('2026-04-10'), pnlUsd: 100 }]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const heatmapCell = screen.getByText('📈').closest('div');
    expect(heatmapCell).toHaveClass('bg-green-600/60');
  });

  it('should color negative days red', () => {
    render(
      <PnLCalendar
        dailyData={[{ date: new Date('2026-04-10'), pnlUsd: -50 }]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const heatmapCell = screen.getByText('📉').closest('div');
    expect(heatmapCell).toHaveClass('bg-red-600/60');
  });

  it('should color zero days gray', () => {
    render(
      <PnLCalendar
        dailyData={[{ date: new Date('2026-04-10'), pnlUsd: 0 }]}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const heatmapCell = screen.getAllByText(/./)[0].closest('div');
    expect(heatmapCell).toHaveClass('bg-gray-600/40');
  });

  it('should handle positive average in green', () => {
    render(
      <PnLCalendar
        dailyData={mockDailyData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const avgElement = screen.getByText('$65.00');
    expect(avgElement).toHaveClass('text-green-400');
  });

  it('should handle negative average in red', () => {
    const negativeData = [
      { date: new Date('2026-04-10'), pnlUsd: -100 },
      { date: new Date('2026-04-11'), pnlUsd: -50 },
    ];

    render(
      <PnLCalendar
        dailyData={negativeData}
        period="7d"
        onPeriodChange={mockOnPeriodChange}
      />,
    );

    const avgElement = screen.getByText('$-75.00');
    expect(avgElement).toHaveClass('text-red-400');
  });
});
