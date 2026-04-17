/**
 * Centralized configuration validation for Trecher-ID.
 * Validates critical environment variables at startup to prevent runtime crashes.
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'HELIUS_API_KEY',
] as const;

const optionalEnvVars = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export type EnvVar = (typeof requiredEnvVars)[number] | (typeof optionalEnvVars)[number];

export const validateConfig = () => {
  const missingRequired = requiredEnvVars.filter((key) => !process.env[key]);
  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    console.warn(`[CONFIG_WARN] Missing optional environment variables: ${missingOptional.join(', ')}. Some features like caching and rate limiting may be degraded.`);
  }

  if (missingRequired.length > 0) {
    const error = `Missing required environment variables: ${missingRequired.join(', ')}`;
    console.error(`[CONFIG_ERROR] ${error}`);
    // In production/Vercel, we want the build or startup to fail
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
      throw new Error(error);
    }
  }
};

// Execute validation immediately on module load
validateConfig();

export const config = {
  databaseUrl: process.env.DATABASE_URL!,
  heliusApiKey: process.env.HELIUS_API_KEY!,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL!,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
  isProduction: process.env.NODE_ENV === 'production',
};
