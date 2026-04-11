import { cached } from '@/lib/redis';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
const FALLBACK_PRICE = 150; // Fallback SOL price if API fails

/** Fetch SOL/USD price from CoinGecko, cached 5 min in Redis */
export async function getSolPrice(): Promise<number> {
  try {
    return await cached<number>('sol:price:usd', 300, async () => {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) return FALLBACK_PRICE;
      const data = await res.json();
      const price = data?.solana?.usd;
      if (typeof price !== 'number' || price <= 0) return FALLBACK_PRICE;
      return price;
    });
  } catch {
    return FALLBACK_PRICE;
  }
}
