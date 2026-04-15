import { describe, it, expect } from 'vitest';
import { parseWalletTrades } from '../../src/lib/wallet-trade-parser';

describe('parseWalletTrades', () => {
  const walletAddress = 'USER_WALLET_123';
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const TOKEN_MINT = 'TOKEN_MINT_456';

  it('should parse a simple BUY transaction', () => {
    const mockTxns: any[] = [
      {
        signature: 'sig1',
        type: 'SWAP',
        timestamp: 1700000000,
        tokenTransfers: [
          { mint: TOKEN_MINT, toUserAccount: walletAddress, fromUserAccount: 'POOL_456' }
        ],
        nativeTransfers: [
          { amount: 1e9, fromUserAccount: walletAddress, toUserAccount: 'POOL_456' }
        ],
        accountData: []
      }
    ];

    const result = parseWalletTrades(mockTxns, walletAddress);
    
    expect(result.candidateTxCount).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      signature: 'sig1',
      tokenMint: TOKEN_MINT,
      type: 'BUY',
      amountSol: 1
    });
    
    const agg = result.aggregates.get(TOKEN_MINT);
    expect(agg).toBeDefined();
    expect(agg?.buySol).toBe(1);
    expect(agg?.sellSol).toBe(0);
    expect(agg?.count).toBe(1);
  });

  it('should parse a simple SELL transaction', () => {
    const mockTxns: any[] = [
      {
        signature: 'sig2',
        type: 'SWAP',
        timestamp: 1700003600,
        tokenTransfers: [
          { mint: TOKEN_MINT, fromUserAccount: walletAddress, toUserAccount: 'POOL_456' }
        ],
        nativeTransfers: [
          { amount: 1.5e9, fromUserAccount: 'POOL_456', toUserAccount: walletAddress }
        ],
        accountData: []
      }
    ];

    const result = parseWalletTrades(mockTxns, walletAddress);
    
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: 'SELL',
      amountSol: 1.5
    });
    
    const agg = result.aggregates.get(TOKEN_MINT);
    expect(agg?.sellSol).toBe(1.5);
    expect(agg?.count).toBe(1);
  });

  it('should aggregate multiple trades for the same token', () => {
    const mockTxns: any[] = [
      {
        signature: 'sig1',
        type: 'SWAP',
        timestamp: 1700000000,
        tokenTransfers: [{ mint: TOKEN_MINT, toUserAccount: walletAddress }],
        nativeTransfers: [{ amount: 1e9, fromUserAccount: walletAddress }],
      },
      {
        signature: 'sig2',
        type: 'SWAP',
        timestamp: 1700003600,
        tokenTransfers: [{ mint: TOKEN_MINT, fromUserAccount: walletAddress }],
        nativeTransfers: [{ amount: 2e9, toUserAccount: walletAddress }],
      }
    ];

    const result = parseWalletTrades(mockTxns, walletAddress);
    const agg = result.aggregates.get(TOKEN_MINT);
    
    expect(agg?.count).toBe(2);
    expect(agg?.buySol).toBe(1);
    expect(agg?.sellSol).toBe(2);
    expect(agg?.firstAt).toBe(1700000000);
    expect(agg?.lastAt).toBe(1700003600);
  });

  it('should handle native balance change if nativeTransfers are empty (Raydium style)', () => {
    const mockTxns: any[] = [
      {
        signature: 'sig3',
        type: 'SWAP',
        timestamp: 1700007200,
        tokenTransfers: [{ mint: TOKEN_MINT, toUserAccount: walletAddress }],
        nativeTransfers: [],
        accountData: [
          { account: walletAddress, nativeBalanceChange: -5e8 } // -0.5 SOL
        ]
      }
    ];

    const result = parseWalletTrades(mockTxns, walletAddress);
    const agg = result.aggregates.get(TOKEN_MINT);
    
    expect(agg?.buySol).toBe(0.5);
    expect(result.events[0].amountSol).toBe(0.5);
  });
});
