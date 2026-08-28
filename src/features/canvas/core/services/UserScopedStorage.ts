import { getAuthenticatedUserId } from '../../../../majom-wrapper/data-access/auth-service.ts';

const GUEST_SCOPE = 'guest';

function sanitizeScopeSegment(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getCurrentUserStorageScope(): string {
  return sanitizeScopeSegment(getAuthenticatedUserId()) ?? GUEST_SCOPE;
}

export function buildUserScopedStorageKey(baseKey: string): string {
  return `user:${getCurrentUserStorageScope()}:${baseKey}`;
}
