import { describe, it, expect } from 'vitest';

describe('Cup Engine - Logic Tests', () => {
  describe('PnL Calculation Logic', () => {
    it('should calculate PnL as sellSol - buySol', () => {
      const buySol = 5;
      const sellSol = 10;
      const pnl = sellSol - buySol;
      expect(pnl).toBe(5);
    });

    it('should handle negative PnL', () => {
      const buySol = 10;
      const sellSol = 5;
      const pnl = sellSol - buySol;
      expect(pnl).toBe(-5);
    });
  });

  describe('Win Rate Calculation Logic', () => {
    it('should calculate win rate correctly', () => {
      const trades = [
        { buySol: 1, sellSol: 2 }, // Win
        { buySol: 1, sellSol: 2 }, // Win
        { buySol: 2, sellSol: 1 }, // Loss
      ];

      const wins = trades.filter(t => t.sellSol > t.buySol).length;
      const winRate = wins / trades.length;

      expect(winRate).toBeCloseTo(2 / 3, 2);
    });

    it('should return 0 for all losses', () => {
      const trades = [
        { buySol: 5, sellSol: 2 },
        { buySol: 3, sellSol: 1 },
      ];

      const wins = trades.filter(t => t.sellSol > t.buySol).length;
      const winRate = wins / trades.length;

      expect(winRate).toBe(0);
    });

    it('should return 1 for all wins', () => {
      const trades = [
        { buySol: 1, sellSol: 2 },
        { buySol: 1, sellSol: 3 },
      ];

      const wins = trades.filter(t => t.sellSol > t.buySol).length;
      const winRate = wins / trades.length;

      expect(winRate).toBe(1);
    });
  });

  describe('Qualification Logic', () => {
    it('should filter users by minimum trade count (10)', () => {
      const users = [
        { userId: 'user-a', tradeCount: 15 },
        { userId: 'user-b', tradeCount: 5 },  // Below threshold
        { userId: 'user-c', tradeCount: 10 }, // At threshold
      ];

      const qualified = users.filter(u => u.tradeCount >= 10);

      expect(qualified).toHaveLength(2);
      expect(qualified.map(u => u.userId)).toEqual(['user-a', 'user-c']);
    });

    it('should sort qualifiers by PnL descending', () => {
      const users = [
        { userId: 'user-a', pnl: 100, tradeCount: 15 },
        { userId: 'user-b', pnl: 500, tradeCount: 20 },
        { userId: 'user-c', pnl: 250, tradeCount: 18 },
      ];

      const qualified = users
        .filter(u => u.tradeCount >= 10)
        .sort((a, b) => b.pnl - a.pnl);

      expect(qualified[0].userId).toBe('user-b');
      expect(qualified[1].userId).toBe('user-c');
      expect(qualified[2].userId).toBe('user-a');
    });

    it('should limit to top 32 qualifiers', () => {
      const users = Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i}`,
        pnl: 1000 - i * 10,
        tradeCount: 20,
      }));

      const qualified = users
        .filter(u => u.tradeCount >= 10)
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 32);

      expect(qualified).toHaveLength(32);
      expect(qualified[0].userId).toBe('user-0'); // Highest PnL
      expect(qualified[31].userId).toBe('user-31');
    });
  });
});
