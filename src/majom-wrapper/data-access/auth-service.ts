import { environment } from '../../config/environment.js';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from '../../config/storage-keys.js';
import type {
  AuthResponse,
  LoginCredentials,
  User,
} from '../interfaces/auth-interfaces.js';

export type SessionUser = {
  id: string;
  email: string;
  username: string;
};

type TokenSessionPayload = {
  user: SessionUser;
  access: string;
  refresh: string;
};

type TokenRefreshPayload = {
  access: string;
  refresh?: string;
};

type IdentityPayload = { user: SessionUser };

export type StartLoginOptions = {
  switchAccount?: boolean;
  returnTo?: string;
};

let activeSession: IdentityPayload | null = null;
let accessToken: string | null = null;

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<SessionUser>;
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.username === 'string'
  );
}

function isTokenSessionPayload(value: unknown): value is TokenSessionPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<TokenSessionPayload>;
  return (
    isSessionUser(payload.user) &&
    typeof payload.access === 'string' &&
    payload.access.length > 0 &&
    typeof payload.refresh === 'string' &&
    payload.refresh.length > 0
  );
}

function isTokenRefreshPayload(value: unknown): value is TokenRefreshPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<TokenRefreshPayload>;
  return typeof payload.access === 'string' && payload.access.length > 0;
}

function isIdentityPayload(value: unknown): value is IdentityPayload {
  return Boolean(
    value &&
      typeof value === 'object' &&
      isSessionUser((value as Partial<IdentityPayload>).user)
  );
}

function readRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // The active browser session remains usable until the next reload.
  }
}

function clearStoredTokens(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function removeLegacyAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function consumeSsoCallback(): { code: string | null; error: string | null } {
  const parameters = new URLSearchParams(
    window.location.hash.replace(/^#/, '')
  );
  const code = parameters.get('sso_code');
  const error = parameters.get('sso_error');
  if (code || error) {
    window.history.replaceState(
      null,
      document.title,
      `${window.location.pathname}${window.location.search}`
    );
  }
  return { code, error };
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export function buildSsoLoginUrl(
  baseUrl: string,
  options: StartLoginOptions = {}
): string {
  const returnTo = options.returnTo ?? `${window.location.origin}/`;
  const query = new URLSearchParams({ flow: 'token', return_to: returnTo });
  if (options.switchAccount) query.set('switch', '1');
  return `${baseUrl}/auth/sso/login/?${query.toString()}`;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getAuthenticatedUserId(): string | null {
  return activeSession?.user.id ?? null;
}

export async function refreshAccessToken(baseUrl: string): Promise<string> {
  const refresh = readRefreshToken();
  if (!refresh) throw new Error('Authentication required.');

  const response = await fetch(`${baseUrl}/auth/token/refresh/`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  const payload = await parseJson(response);
  if (!response.ok || !isTokenRefreshPayload(payload)) {
    throw new Error('Unable to refresh the sign-in session.');
  }

  accessToken = payload.access;
  removeLegacyAccessToken();
  if (payload.refresh) storeRefreshToken(payload.refresh);
  return accessToken;
}

async function loadIdentity(baseUrl: string): Promise<SessionUser> {
  if (!accessToken) throw new Error('Authentication required.');
  const response = await fetch(`${baseUrl}/auth/sso/me/`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await parseJson(response);
  if (!response.ok || !isIdentityPayload(payload)) {
    throw new Error('The sign-in service returned an invalid identity.');
  }
  return payload.user;
}

/** Central Majom ID boundary using an SSO code exchanged for application JWTs. */
export class AuthService {
  private baseUrl: string = environment.apiUrl;

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  public async restoreSession(): Promise<boolean> {
    const { code, error } = consumeSsoCallback();
    if (error === 'access_denied') {
      this.clearSession();
      return false;
    }
    if (error) {
      this.clearSession();
      throw new Error('Majom ID could not complete sign in.');
    }

    try {
      if (code) {
        const response = await fetch(`${this.baseUrl}/auth/sso/exchange/`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        const payload = await parseJson(response);
        if (!response.ok || !isTokenSessionPayload(payload)) {
          throw new Error(
            'The sign-in service returned an invalid token session.'
          );
        }
        accessToken = payload.access;
        removeLegacyAccessToken();
        storeRefreshToken(payload.refresh);
      } else {
        if (!readRefreshToken()) return false;
        await refreshAccessToken(this.baseUrl);
      }

      activeSession = { user: await loadIdentity(this.baseUrl) };
      return true;
    } catch (error) {
      this.clearSession();
      if (
        error instanceof Error &&
        error.message === 'Unable to refresh the sign-in session.'
      ) {
        return false;
      }
      throw error;
    }
  }

  public startLogin(options: StartLoginOptions = {}): void {
    window.location.assign(buildSsoLoginUrl(this.baseUrl, options));
  }

  /** Compatibility entrypoint for older UI owners; login now redirects to OIDC. */
  public login(_credentials: LoginCredentials): Promise<AuthResponse> {
    void _credentials;
    this.startLogin();
    return new Promise<AuthResponse>(() => undefined);
  }

  public async logout(): Promise<void> {
    const refresh = readRefreshToken();
    this.clearSession();
    if (!refresh) return;
    await fetch(`${this.baseUrl}/auth/token/blacklist/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }

  public clearSession(): void {
    activeSession = null;
    accessToken = null;
    clearStoredTokens();
  }

  public async getUser(): Promise<User> {
    if (!accessToken) await refreshAccessToken(this.baseUrl);
    const response = await fetch(`${this.baseUrl}/user/`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user data.');
    }
    return (await response.json()) as User;
  }

  public isLoggedIn(): boolean {
    return activeSession !== null;
  }
}
