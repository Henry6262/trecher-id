import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };
const refreshes = new Map<string, Promise<unknown>>();

interface CacheEnvelope<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

function createRedis(): Redis {
  const r = new Redis(process.env.REDIS_URL ?? '', {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    lazyConnect: true,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 3000)),
  });
  r.on('error', () => {}); // suppress unhandled connection errors
  return r;
}

export const redis: Redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

/** Cache helper — get from Redis or compute and store */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis down — fall through to compute
  }

  const data = await compute();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Redis down — data still returned
  }

  return data;
}

async function readEnvelope<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const hit = await redis.get(key);
    if (!hit) return null;
    return JSON.parse(hit) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

async function writeEnvelope<T>(
  key: string,
  value: T,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
): Promise<void> {
  const now = Date.now();
  const envelope: CacheEnvelope<T> = {
    value,
    freshUntil: now + freshTtlSeconds * 1000,
    staleUntil: now + staleTtlSeconds * 1000,
  };

  try {
    await redis.set(key, JSON.stringify(envelope), 'EX', staleTtlSeconds);
  } catch {
    // Redis down — caller still gets fresh data
  }
}

async function acquireRefreshLock(key: string): Promise<boolean> {
  try {
    const result = await redis.set(`${key}:lock`, '1', 'EX', 30, 'NX');
    return result === 'OK';
  } catch {
    return true;
  }
}

async function refreshCache<T>(
  key: string,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
  compute: () => Promise<T>,
  useDistributedLock: boolean,
): Promise<T> {
  const existing = refreshes.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const refreshPromise = (async () => {
    if (useDistributedLock) {
      const hasLock = await acquireRefreshLock(key);
      if (!hasLock) {
        const current = await readEnvelope<T>(key);
        if (current) return current.value;
      }
    }

    const value = await compute();
    await writeEnvelope(key, value, freshTtlSeconds, staleTtlSeconds);
    return value;
  })();

  refreshes.set(key, refreshPromise);
  void refreshPromise.finally(() => {
    if (refreshes.get(key) === refreshPromise) {
      refreshes.delete(key);
    }
  });

  return refreshPromise;
}

export async function cachedWithStale<T>(
  key: string,
  freshTtlSeconds: number,
  staleTtlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const hit = await readEnvelope<T>(key);
  const now = Date.now();

  if (hit && now < hit.freshUntil) {
    return hit.value;
  }

  if (hit && now < hit.staleUntil) {
    void refreshCache(key, freshTtlSeconds, staleTtlSeconds, compute, true).catch(() => {});
    return hit.value;
  }

  try {
    return await refreshCache(key, freshTtlSeconds, staleTtlSeconds, compute, false);
  } catch (error) {
    if (hit) return hit.value;
    throw error;
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key, `${key}:lock`);
  } catch {
    // Redis down — cache will expire naturally
  }
}
