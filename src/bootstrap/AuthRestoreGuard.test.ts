// @vitest-environment jsdom
/// <reference types="vite/client" />
import { afterEach, describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';

function createToken(exp: number): string {
  const encode = (value: object) =>
    window
      .btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp })}.sig`;
}

function readAuthRestoreScript(): string {
  const match = indexHtml.match(
    /<script>\s*(\(function \(\) \{[\s\S]*?data-majom-auth-restore[\s\S]*?\}\)\(\);)\s*<\/script>/
  );

  if (!match) {
    throw new Error('Auth restore guard script was not found in index.html.');
  }

  return match[1];
}

describe('index auth restore guard', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-majom-auth-restore');
  });

  it('does not hide the public landing when no refresh token exists', () => {
    window.eval(readAuthRestoreScript());

    expect(
      document.documentElement.hasAttribute('data-majom-auth-restore')
    ).toBe(false);
  });

  it('hides the public landing before app boot when any refresh token exists', () => {
    document.documentElement.removeAttribute('data-majom-auth-restore');
    window.localStorage.setItem(
      'refresh',
      createToken(Math.floor(Date.now() / 1000) + 60)
    );

    window.eval(readAuthRestoreScript());

    expect(
      document.documentElement.getAttribute('data-majom-auth-restore')
    ).toBe('pending');
  });

  it('leaves authorization validity to the SPA boot lifecycle', () => {
    window.localStorage.setItem('refresh', 'stored-but-not-decodable');

    window.eval(readAuthRestoreScript());

    expect(
      document.documentElement.getAttribute('data-majom-auth-restore')
    ).toBe('pending');
  });
});
