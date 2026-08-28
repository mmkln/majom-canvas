// @vitest-environment jsdom
/// <reference types="vite/client" />
import { afterEach, describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';

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

  it('hides the public landing until the HttpOnly session check finishes', () => {
    window.eval(readAuthRestoreScript());

    expect(
      document.documentElement.getAttribute('data-majom-auth-restore')
    ).toBe('pending');
  });

  it('does not depend on legacy localStorage tokens that cannot represent the cookie session', () => {
    document.documentElement.removeAttribute('data-majom-auth-restore');
    window.localStorage.setItem('refresh', 'legacy-token');

    window.eval(readAuthRestoreScript());

    expect(
      document.documentElement.getAttribute('data-majom-auth-restore')
    ).toBe('pending');
  });
});
