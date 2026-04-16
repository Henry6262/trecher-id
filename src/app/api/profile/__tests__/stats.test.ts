import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../stats/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userRanking: {
      findUnique: vi.fn(),
    },
    tokenHolding: {
      findMany: vi.fn(),
    },
  },
}));

describe('/api/profile/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when username is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/profile/stats');

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('invalid');
  });

  it('should return 400 when period is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/profile/stats?username=henry&period=invalid');

    const response = await GET(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('invalid');
  });

  it('should return 404 when user not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/profile/stats?username=nonexistent&period=7d');

    const response = await GET(req);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('not found');
  });

  it('should return stats with holdings', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'user-123',
      wallets: [{ id: 'wallet-1' }, { id: 'wallet-2' }],
    });

    (prisma.userRanking.findUnique as any).mockResolvedValueOnce({
      pnlUsd: 1234.56,
      winRate: 65.5,
      trades: 42,
      rank: 5,
    });

    (prisma.tokenHolding.findMany as any).mockResolvedValueOnce([
      {
        tokenSymbol: 'SOL',
        tokenName: 'Wrapped SOL',
        amount: 10.5,
        valueUsd: 3150,
      },
      {
        tokenSymbol: 'COPE',
        tokenName: 'Cope',
        amount: 1000,
        valueUsd: 50,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/profile/stats?username=henry&period=7d');

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      pnlUsd: 1234.56,
      winRate: 65.5,
      trades: 42,
      rank: 5,
      period: '7d',
      holdings: [
        {
          tokenSymbol: 'SOL',
          tokenName: 'Wrapped SOL',
          amount: 10.5,
          valueUsd: 3150,
        },
        {
          tokenSymbol: 'COPE',
          tokenName: 'Cope',
          amount: 1000,
          valueUsd: 50,
        },
      ],
    });
  });

  it('should handle missing ranking gracefully', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'user-123',
      wallets: [{ id: 'wallet-1' }],
    });

    (prisma.userRanking.findUnique as any).mockResolvedValueOnce(null);

    (prisma.tokenHolding.findMany as any).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/profile/stats?username=henry&period=7d');

    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.pnlUsd).toBe(0);
    expect(data.winRate).toBe(0);
    expect(data.trades).toBe(0);
    expect(data.rank).toBeNull();
    expect(data.holdings).toEqual([]);
  });

  it('should support different periods', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'user-123',
      wallets: [],
    });

    (prisma.userRanking.findUnique as any).mockResolvedValueOnce({
      pnlUsd: 100,
      winRate: 50,
      trades: 10,
      rank: 20,
    });

    (prisma.tokenHolding.findMany as any).mockResolvedValueOnce([]);

    for (const period of ['1d', '3d', '7d', '14d', 'all']) {
      const req = new NextRequest(`http://localhost:3000/api/profile/stats?username=henry&period=${period}`);
      const response = await GET(req);
      const data = await response.json();

      expect(data.period).toBe(period);
    }
  });

  it('should fetch holdings for all user wallets', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: 'user-123',
      wallets: [{ id: 'wallet-1' }, { id: 'wallet-2' }, { id: 'wallet-3' }],
    });

    (prisma.userRanking.findUnique as any).mockResolvedValueOnce(null);
    (prisma.tokenHolding.findMany as any).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/profile/stats?username=henry&period=7d');
    await GET(req);

    expect(prisma.tokenHolding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          walletId: { in: ['wallet-1', 'wallet-2', 'wallet-3'] },
        },
      }),
    );
  });
});
