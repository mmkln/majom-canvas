import { API_URL, GROK_API_KEY } from './env/index.ts';

/**
 * Legacy environment object shape used across the app.
 * Values are sourced from Vite env config in src/config/env/index.ts.
 */
export const environment = {
  apiUrl: API_URL,
  grokApiKey: GROK_API_KEY,
} as const;
