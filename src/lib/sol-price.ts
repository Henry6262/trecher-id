import { cached } from '@/lib/redis';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

/** Fetch SOL/USD price from CoinGecko, cached 5 min in Redis */
export async function getSolPrice(): Promise<number> {
  return cached<number>('sol:price:usd', 300, async () => {
    const res = await fetch(COINGECKO_URL);
    if (!res.ok) throw new Error(`CoinGecko price API error: ${res.status}`);
    const data = await res.json();
    const price = data?.solana?.usd;
    if (typeof price !== 'number' || price <= 0) throw new Error('Invalid SOL price from CoinGecko');
    return price;
  });
}
