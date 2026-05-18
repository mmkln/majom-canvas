// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicLandingPage } from './PublicLandingPage.ts';

describe('PublicLandingPage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the static root landing and routes sign-in CTA through the SPA state owner', () => {
    document.body.innerHTML = `
      <main id="majom-public-landing">
        <button type="button" data-landing-action="sign-in">Sign in</button>
      </main>
    `;
    const onSignIn = vi.fn();
    const landingPage = new PublicLandingPage({ onSignIn });

    document.documentElement.setAttribute('data-majom-auth-restore', 'pending');
    landingPage.show();
    const signInButton = document.querySelector<HTMLButtonElement>(
      '[data-landing-action="sign-in"]'
    );

    expect(document.documentElement.hasAttribute('data-majom-auth-restore')).toBe(
      false
    );
    expect(signInButton?.getAttribute('data-component')).toBe('HudTextButton');
    signInButton?.click();

    expect(onSignIn).toHaveBeenCalledTimes(1);

    landingPage.hide();

    expect(document.getElementById('majom-public-landing')?.hidden).toBe(true);
  });

  it('upgrades and owns the mobile landing menu trigger', () => {
    document.body.innerHTML = `
      <main id="majom-public-landing">
        <button
          type="button"
          data-landing-action="toggle-menu"
          aria-controls="majom-mobile-menu"
          aria-expanded="false"
          class="md:hidden"
        >
          Menu
        </button>
        <div id="majom-mobile-menu" data-landing-mobile-menu hidden>
          <a href="#features">Features</a>
        </div>
      </main>
    `;
    const landingPage = new PublicLandingPage({ onSignIn: vi.fn() });

    landingPage.show();
    const menuButton = document.querySelector<HTMLButtonElement>(
      '[data-landing-action="toggle-menu"]'
    );
    const menu = document.querySelector<HTMLElement>('[data-landing-mobile-menu]');

    expect(menuButton?.getAttribute('data-component')).toBe('HudIconButton');
    expect(menuButton?.className).toContain('md:hidden');
    expect(menu?.hidden).toBe(true);

    menuButton?.click();

    expect(menu?.hidden).toBe(false);
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');

    document.querySelector<HTMLAnchorElement>('[data-landing-mobile-menu] a')?.click();

    expect(menu?.hidden).toBe(true);
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');
  });
});
