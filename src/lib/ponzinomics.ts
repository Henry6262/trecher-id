/**
 * PONZINOMICS SDK INTEGRATION
 * 
 * Central configuration for Ponzinomics SDK clients.
 * All trecher-id features that use Ponzinomics infrastructure
 * should import from this file.
 */

import { Ponzinomics } from '@ponzinomics/sdk';

// SDK Configuration
const PONZINOMICS_API_KEY = process.env.PONZINOMICS_API_KEY;
const PONZINOMICS_PROJECT_ID = process.env.PONZINOMICS_PROJECT_ID;
const PONZINOMICS_BASE_URL = process.env.PONZINOMICS_BASE_URL || 'https://api.sypher.io';

/**
 * Create a configured Ponzinomics SDK instance.
 * For developer mode (API key + project ID):
 */
export function createPonzinomicsClient() {
  return new Ponzinomics({
    apiKey: PONZINOMICS_API_KEY,
    projectId: PONZINOMICS_PROJECT_ID,
    baseUrl: PONZINOMICS_BASE_URL,
  });
}

/**
 * Create an authenticated client for user operations.
 * Requires an access token (from Privy login flow).
 */
export function createAuthClient(accessToken: string) {
  return new Ponzinomics({
    accessToken,
    baseUrl: PONZINOMICS_BASE_URL,
  });
}

/**
 * Auth utilities for server-side session management.
 * Replaces the local JWT-based auth with Ponzinomics tokens.
 */
export const PONZINOMICS_COOKIE_NAME = 'ponzinomics_token';
export const PONZINOMICS_REFRESH_COOKIE_NAME = 'ponzinomics_refresh';
