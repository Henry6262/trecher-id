import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseWalletTrades } from '../../src/lib/wallet-trade-parser';

describe('Wallet Sync & Trade Parsing', () => {
  describe('parseWalletTrades - Real Helius Transaction Parsing', () => {
    const walletAddress = '11111111111111111111111111111112';
    const USDC_MINT = 'EPjFWaLb3oclEYwEvg3YL4KSqB3d4KyleP9uS25yxE7';
    const WIF_MINT = 'EKpQBwAC67dkHGWJ5d1M7MWTuLWQV3E2aswcWqq4abqV';

    it('should parse real swap transactions correctly', () => {
      // Real Helius transaction: user buys WIF, pays SOL
      const mockHeliusResponse = [
        {
          signature: 'real_sig_123',
          type: 'SWAP',
          timestamp: 1713000000,
          tokenTransfers: [
            {
              mint: WIF_MINT,
              fromUserAccount: 'pool',
              toUserAccount: walletAddress, // User receives WIF = BUY
            },
          ],
          nativeTransfers: [
            {
              fromUserAccount: walletAddress,
              toUserAccount: 'pool',
              amount: 5000000, // 0.005 SOL (wallet sent SOL, so spent)
            },
          ],
          accountData: [],
        },
      ];

      const result = parseWalletTrades(mockHeliusResponse, walletAddress);

      expect(result.events).toHaveLength(1);
      const event = result.events[0];

      expect(event.signature).toBe('real_sig_123');
      expect(event.type).toBe('BUY'); // Buying WIF
      expect(event.tokenMint).toBe(WIF_MINT);
      expect(event.timestamp).toBe(1713000000);
      expect(event.amountSol).toBeCloseTo(0.005, 5);
    });

    it('should handle multiple token transfers in one transaction', () => {
      const mockTxn = {
        signature: 'multi_swap_123',
        type: 'SWAP',
        timestamp: 1713100000,
        tokenTransfers: [
          // Buy WIF
          {
            mint: WIF_MINT,
            fromUserAccount: 'pool1',
            toUserAccount: walletAddress,
          },
          // Buy BONK
          {
            mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixVqXaSfzgs6ZH7PZrVg',
            fromUserAccount: 'pool2',
            toUserAccount: walletAddress,
          },
        ],
        nativeTransfers: [
          {
            fromUserAccount: walletAddress,
            toUserAccount: 'pool',
            amount: 10000000, // 0.01 SOL spent total
          },
        ],
        accountData: [],
      };

      const result = parseWalletTrades([mockTxn], walletAddress);

      // Should parse multiple tokens from one txn
      expect(result.events.length).toBeGreaterThanOrEqual(1);
      expect(result.aggregates.size).toBeGreaterThanOrEqual(1);
    });

    it('should distinguish between BUY and SELL correctly', () => {
      const buyTxn = {
        signature: 'buy_sig',
        type: 'SWAP',
        timestamp: 1713000000,
        tokenTransfers: [
          {
            mint: WIF_MINT,
            toUserAccount: walletAddress, // User receives token = BUY
            fromUserAccount: 'pool',
          },
        ],
        nativeTransfers: [
          {
            amount: 1000000,
            fromUserAccount: walletAddress, // User sends SOL = paying for it
          },
        ],
        accountData: [],
      };

      const sellTxn = {
        signature: 'sell_sig',
        type: 'SWAP',
        timestamp: 1713010000,
        tokenTransfers: [
          {
            mint: WIF_MINT,
            fromUserAccount: walletAddress, // User sends token = SELL
            toUserAccount: 'pool',
          },
        ],
        nativeTransfers: [
          {
            amount: 2000000,
            toUserAccount: walletAddress, // User receives SOL = getting paid
          },
        ],
        accountData: [],
      };

      const result = parseWalletTrades([buyTxn, sellTxn], walletAddress);

      const buyEvent = result.events.find((e) => e.signature === 'buy_sig');
      const sellEvent = result.events.find((e) => e.signature === 'sell_sig');

      expect(buyEvent?.type).toBe('BUY');
      expect(sellEvent?.type).toBe('SELL');
    });

    it('should aggregate trades by token mint', () => {
      const mockTxns = [
        {
          signature: 'sig1',
          type: 'SWAP',
          timestamp: 1713000000,
          tokenTransfers: [
            {
              mint: WIF_MINT,
              toUserAccount: walletAddress, // BUY
              fromUserAccount: 'pool',
            },
          ],
          nativeTransfers: [
            { amount: 1000000000, fromUserAccount: walletAddress }, // 1 SOL spent
          ],
          accountData: [],
        },
        {
          signature: 'sig2',
          type: 'SWAP',
          timestamp: 1713010000,
          tokenTransfers: [
            {
              mint: WIF_MINT,
              fromUserAccount: walletAddress, // SELL
              toUserAccount: 'pool',
            },
          ],
          nativeTransfers: [
            { amount: 2000000000, toUserAccount: walletAddress }, // 2 SOL received
          ],
          accountData: [],
        },
      ];

      const result = parseWalletTrades(mockTxns, walletAddress);

      expect(result.aggregates.has(WIF_MINT)).toBe(true);

      const agg = result.aggregates.get(WIF_MINT);
      expect(agg?.count).toBe(2);
      expect(agg?.buySol).toBeCloseTo(1, 3); // First transaction: 1 SOL
      expect(agg?.sellSol).toBeCloseTo(2, 3); // Second transaction: 2 SOL received
    });

    it('should handle transaction fees in SOL calculations', () => {
      // Real transaction may have fees
      const mockTxn = {
        signature: 'fee_txn',
        type: 'SWAP',
        timestamp: 1713000000,
        tokenTransfers: [
          {
            mint: WIF_MINT,
            toUserAccount: walletAddress,
            fromUserAccount: 'pool',
          },
        ],
        nativeTransfers: [
          {
            amount: 1000000,
            fromUserAccount: walletAddress,
            toUserAccount: 'pool', // User pays for token
          },
          {
            amount: 5000,
            fromUserAccount: walletAddress,
            toUserAccount: 'SystemProgram', // Fee to system
          },
        ],
        accountData: [],
      };

      const result = parseWalletTrades([mockTxn], walletAddress);

      // Should include fee in SOL calculation
      const event = result.events[0];
      expect(event.amountSol).toBeGreaterThan(0.001); // Should account for main amount
    });

    it('should handle Raydium-style swaps with accountData balance changes', () => {
      // Raydium may not explicitly list all transfers
      const mockTxn = {
        signature: 'raydium_swap',
        type: 'SWAP',
        timestamp: 1713000000,
        tokenTransfers: [
          {
            mint: WIF_MINT,
            toUserAccount: walletAddress,
            fromUserAccount: 'raydium_pool',
          },
        ],
        nativeTransfers: [], // May be empty
        accountData: [
          {
            account: walletAddress,
            nativeBalanceChange: -1000000, // Wallet lost 0.001 SOL (BUY)
          },
        ],
      };

      const result = parseWalletTrades([mockTxn], walletAddress);

      // Should parse even with accountData instead of nativeTransfers
      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should skip non-swap transactions', () => {
      const mockTxns = [
        {
          signature: 'transfer_only',
          type: 'TRANSFER', // Not a SWAP
          timestamp: 1713000000,
          tokenTransfers: [
            {
              mint: WIF_MINT,
              fromUserAccount: walletAddress,
              toUserAccount: 'another_user',
            },
          ],
          nativeTransfers: [],
          accountData: [],
        },
        {
          signature: 'actual_swap',
          type: 'SWAP',
          timestamp: 1713010000,
          tokenTransfers: [
            {
              mint: WIF_MINT,
              toUserAccount: walletAddress,
              fromUserAccount: 'pool',
            },
          ],
          nativeTransfers: [
            { amount: 1000000, fromUserAccount: walletAddress },
          ],
          accountData: [],
        },
      ];

      const result = parseWalletTrades(mockTxns, walletAddress);

      // Should only include the SWAP
      expect(result.events).toHaveLength(1);
      expect(result.events[0].signature).toBe('actual_swap');
    });
  });

  describe('Wallet Data Rebuild Edge Cases', () => {
    it('should handle wallet with no transactions', () => {
      const emptyResult = parseWalletTrades([], 'empty_wallet');

      expect(emptyResult.events).toHaveLength(0);
      expect(emptyResult.aggregates.size).toBe(0);
      expect(emptyResult.candidateTxCount).toBe(0);
    });

    it('should handle wallet with failed/partial syncs', () => {
      // Simulate partial data (some txns succeeded, then API failed)
      const partialTxns = [
        {
          signature: 'partial_1',
          type: 'SWAP',
          timestamp: 1713000000,
          tokenTransfers: [
            {
              mint: 'EKpQBwAC67dkHGWJ5d1M7MWTuLWQV3E2aswcWqq4abqV', // WIF
              toUserAccount: 'wallet123',
              fromUserAccount: 'pool',
            },
          ],
          nativeTransfers: [
            { amount: 1000000000, fromUserAccount: 'wallet123' },
          ],
          accountData: [],
        },
      ];

      const result = parseWalletTrades(partialTxns, 'wallet123');

      // Should still process what it has
      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should maintain order by timestamp', () => {
      const unorderedTxns = [
        {
          signature: 'sig3',
          type: 'SWAP',
          timestamp: 1713020000, // Newest
          tokenTransfers: [
            {
              mint: 'mint1',
              toUserAccount: 'wallet',
              fromUserAccount: 'pool',
            },
          ],
          nativeTransfers: [{ amount: 1000000, fromUserAccount: 'wallet' }],
          accountData: [],
        },
        {
          signature: 'sig1',
          type: 'SWAP',
          timestamp: 1713000000, // Oldest
          tokenTransfers: [
            {
              mint: 'mint2',
              toUserAccount: 'wallet',
              fromUserAccount: 'pool',
            },
          ],
          nativeTransfers: [{ amount: 2000000, fromUserAccount: 'wallet' }],
          accountData: [],
        },
        {
          signature: 'sig2',
          type: 'SWAP',
          timestamp: 1713010000, // Middle
          tokenTransfers: [
            {
              mint: 'mint1',
              fromUserAccount: 'wallet',
              toUserAccount: 'pool',
            },
          ],
          nativeTransfers: [{ amount: 1500000, toUserAccount: 'wallet' }],
          accountData: [],
        },
      ];

      const result = parseWalletTrades(unorderedTxns, 'wallet');

      // Verify aggregation respects time order
      const mint1Agg = result.aggregates.get('mint1');
      expect(mint1Agg?.firstAt).toBeLessThan(mint1Agg?.lastAt || 0);
    });
  });
});
