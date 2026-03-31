import { cached } from '@/lib/redis';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const JUPITER_PRICE_URL = `https://api.jup.ag/price/v2?ids=${SOL_MINT}`;

/** Fetch SOL/USD price from Jupiter Price API v2, cached 5 min in Redis */
export async function getSolPrice(): Promise<number> {
  return cached<number>('sol:price:usd', 300, async () => {
    const res = await fetch(JUPITER_PRICE_URL);
    if (!res.ok) throw new Error(`Jupiter price API error: ${res.status}`);
    const data = await res.json();
    const price = parseFloat(data?.data?.[SOL_MINT]?.price);
    if (isNaN(price) || price <= 0) throw new Error('Invalid SOL price from Jupiter');
    return price;
  });
}
