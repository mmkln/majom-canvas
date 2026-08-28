// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthService,
  buildSsoLoginUrl,
  getAuthenticatedUserId,
  getSessionCsrfToken,
} from './auth-service.ts';

describe('AuthService browser session contract', () => {
  const authService = new AuthService('http://api.example.test');

  beforeEach(() => {
    authService.clearSession();
    localStorage.setItem('jwt', 'legacy-access');
    localStorage.setItem('refresh', 'legacy-refresh');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    authService.clearSession();
  });

  it('restores the typed session and removes legacy browser tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: 'user-uuid-1',
            email: 'user@example.com',
            username: 'user',
          },
          csrfToken: 'csrf-token',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(authService.restoreSession()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/auth/sso/session/',
      expect.objectContaining({ credentials: 'include' })
    );
    expect(authService.isLoggedIn()).toBe(true);
    expect(getAuthenticatedUserId()).toBe('user-uuid-1');
    expect(getSessionCsrfToken()).toBe('csrf-token');
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('refresh')).toBeNull();
  });

  it('treats a 401 as an anonymous browser session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
    );

    await expect(authService.restoreSession()).resolves.toBe(false);

    expect(authService.isLoggedIn()).toBe(false);
    expect(getAuthenticatedUserId()).toBeNull();
  });

  it('builds distinct fast-login and switch-account URLs', () => {
    expect(buildSsoLoginUrl('http://api.example.test')).toBe(
      'http://api.example.test/auth/sso/login/'
    );
    expect(
      buildSsoLoginUrl('http://api.example.test', { switchAccount: true })
    ).toBe('http://api.example.test/auth/sso/login/?switch=1');
  });
});
