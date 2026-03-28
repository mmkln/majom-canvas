import { jwtDecode, type JwtPayload } from 'jwt-decode';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../../../../config/storage-keys.ts';

type TokenClaims = JwtPayload & {
  user_id?: string | number;
  username?: string;
  email?: string;
};

const GUEST_SCOPE = 'guest';

function sanitizeScopeSegment(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function decodeUserScopeFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const claims = jwtDecode<TokenClaims>(token);
    return (
      sanitizeScopeSegment(claims.user_id) ??
      sanitizeScopeSegment(claims.sub) ??
      sanitizeScopeSegment(claims.username) ??
      sanitizeScopeSegment(claims.email)
    );
  } catch {
    return null;
  }
}

export function getCurrentUserStorageScope(): string {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  return (
    decodeUserScopeFromToken(accessToken) ??
    decodeUserScopeFromToken(refreshToken) ??
    GUEST_SCOPE
  );
}

export function buildUserScopedStorageKey(baseKey: string): string {
  return `user:${getCurrentUserStorageScope()}:${baseKey}`;
}
