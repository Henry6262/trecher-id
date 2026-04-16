import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAssetsByOwner } from '../helius';

// Mock fetch globally
global.fetch = vi.fn();

describe('helius.ts - getAssetsByOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch and parse token holdings successfully', async () => {
    const mockResponse = {
      result: {
        items: [
          {
            id: 'So11111111111111111111111111111111111111112',
            content: {
              metadata: { symbol: 'SOL', name: 'Wrapped SOL' },
              links: { image: 'https://example.com/sol.png' },
            },
            token_info: { balance: 5000000000, decimals: 9 },
          },
          {
            id: 'EPjFWaLb3odcccccccccccccccccccccccccccccccc',
            content: {
              metadata: { symbol: 'USDC', name: 'USD Coin' },
              links: { image: 'https://example.com/usdc.png' },
            },
            token_info: { balance: 10000000, decimals: 6 },
          },
        ],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Wrapped SOL',
      image: 'https://example.com/sol.png',
      amount: 5000000000,
      decimals: 9,
    });
    expect(result[1]).toEqual({
      mint: 'EPjFWaLb3odcccccccccccccccccccccccccccccccc',
      symbol: 'USDC',
      name: 'USD Coin',
      image: 'https://example.com/usdc.png',
      amount: 10000000,
      decimals: 6,
    });
  });

  it('should filter out holdings with zero balance', async () => {
    const mockResponse = {
      result: {
        items: [
          {
            id: 'So11111111111111111111111111111111111111112',
            content: { metadata: { symbol: 'SOL', name: 'Wrapped SOL' } },
            token_info: { balance: 5000000000, decimals: 9 },
          },
          {
            id: 'EPjFWaLb3odcccccccccccccccccccccccccccccccc',
            content: { metadata: { symbol: 'DUST', name: 'Dust Token' } },
            token_info: { balance: 0, decimals: 6 },
          },
        ],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('SOL');
  });

  it('should handle missing metadata gracefully', async () => {
    const mockResponse = {
      result: {
        items: [
          {
            id: 'EPjFWaLb3odcccccccccccccccccccccccccccccccc',
            content: { metadata: {} },
            token_info: { balance: 1000000, decimals: 6 },
          },
        ],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('EPjFW'); // First 6 chars of mint
    expect(result[0].name).toBe('');
  });

  it('should return empty array on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result).toEqual([]);
  });

  it('should handle missing items in response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: {} }),
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result).toEqual([]);
  });

  it('should include image from multiple fallback sources', async () => {
    const mockResponse = {
      result: {
        items: [
          {
            id: 'Token1',
            content: {
              metadata: { symbol: 'TEST', name: 'Test Token' },
              links: { image: null },
              files: [{ uri: 'https://example.com/fallback.png' }],
            },
            token_info: { balance: 1000, decimals: 6 },
          },
        ],
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getAssetsByOwner('9B5X4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4z4');

    expect(result[0].image).toBe('https://example.com/fallback.png');
  });
});
