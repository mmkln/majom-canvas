import { API_URL } from './env/index.ts';

/**
 * Legacy environment object shape used across the app.
 * Values are sourced from Vite env config in src/config/env/index.ts.
 */
export const environment = {
  apiUrl: API_URL,
} as const;
