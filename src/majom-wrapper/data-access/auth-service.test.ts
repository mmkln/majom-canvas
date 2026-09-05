// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthService,
  buildSsoLoginUrl,
  getAuthenticatedUserId,
} from './auth-service.ts';

describe('AuthService token SSO contract', () => {
  const authService = new AuthService('http://api.example.test');

  beforeEach(() => {
    authService.clearSession();
    localStorage.setItem('jwt', 'legacy-access');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    authService.clearSession();
  });

  it('exchanges the callback code for a token session', async () => {
    window.history.replaceState(null, '', '/#sso_code=one-time-code');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: 'user-uuid-1',
              email: 'user@example.com',
              username: 'user',
            },
            access: 'access-token',
            refresh: 'refresh-token',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: 'user-uuid-1',
              email: 'user@example.com',
              username: 'user',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(authService.restoreSession()).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/auth/sso/exchange/',
      expect.objectContaining({ method: 'POST' })
    );
    expect(authService.isLoggedIn()).toBe(true);
    expect(getAuthenticatedUserId()).toBe('user-uuid-1');
    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('refresh')).toBe('refresh-token');
  });

  it('treats a failed refresh as an anonymous session', async () => {
    localStorage.setItem('refresh', 'stale-refresh');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
    );

    await expect(authService.restoreSession()).resolves.toBe(false);

    expect(authService.isLoggedIn()).toBe(false);
    expect(getAuthenticatedUserId()).toBeNull();
  });

  it('builds distinct fast-login and switch-account URLs', () => {
    expect(
      buildSsoLoginUrl('http://api.example.test', {
        returnTo: 'https://gomajom.com/',
      })
    ).toBe(
      'http://api.example.test/auth/sso/login/?flow=token&return_to=https%3A%2F%2Fgomajom.com%2F'
    );
    expect(
      buildSsoLoginUrl('http://api.example.test', {
        switchAccount: true,
        returnTo: 'https://gomajom.com/',
      })
    ).toBe(
      'http://api.example.test/auth/sso/login/?flow=token&return_to=https%3A%2F%2Fgomajom.com%2F&switch=1'
    );
  });
});
