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

type SessionPayload = {
  authenticated: true;
  user: SessionUser;
  csrfToken: string;
};

export type StartLoginOptions = {
  switchAccount?: boolean;
};

export function buildSsoLoginUrl(
  baseUrl: string,
  options: StartLoginOptions = {}
): string {
  const query = options.switchAccount ? '?switch=1' : '';
  return `${baseUrl}/auth/sso/login/${query}`;
}

let activeSession: SessionPayload | null = null;

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<SessionPayload>;
  const user = payload.user as Partial<SessionUser> | undefined;
  return (
    payload.authenticated === true &&
    typeof payload.csrfToken === 'string' &&
    typeof user?.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.username === 'string'
  );
}

function removeLegacyBrowserTokens(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getSessionCsrfToken(): string | null {
  return activeSession?.csrfToken ?? null;
}

export function getAuthenticatedUserId(): string | null {
  return activeSession?.user.id ?? null;
}

/** Browser authentication boundary backed by a Django HttpOnly session. */
export class AuthService {
  private baseUrl: string = environment.apiUrl;

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  public async restoreSession(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/auth/sso/session/`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    removeLegacyBrowserTokens();
    if (response.status === 401) {
      this.clearSession();
      return false;
    }
    if (!response.ok) {
      this.clearSession();
      throw new Error('Unable to restore the sign-in session.');
    }

    const payload: unknown = await response.json();
    if (!isSessionPayload(payload)) {
      this.clearSession();
      throw new Error('The sign-in service returned an invalid session.');
    }

    activeSession = payload;
    return true;
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
    const csrfToken = getSessionCsrfToken();
    try {
      await fetch(`${this.baseUrl}/auth/sso/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
      });
    } finally {
      this.clearSession();
    }
  }

  public clearSession(): void {
    activeSession = null;
    removeLegacyBrowserTokens();
  }

  public async getUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/user/`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
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
