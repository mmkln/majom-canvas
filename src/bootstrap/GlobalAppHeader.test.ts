// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/environment.ts', () => ({
  environment: {
    apiUrl: 'https://example.test',
  },
}));

vi.mock('../config/env/index.ts', () => ({
  IS_DEVELOPMENT_MODE: true,
  KANBAN_DEV_ENABLED: true,
  LEARNING_STUDIO_DEV_ENABLED: true,
  ROUTINES_ENABLED: true,
  TIME_CLUSTERING_DEV_ENABLED: false,
}));

import { createAppRuntime } from '../app-runtime/index.ts';
import { GlobalAppHeader } from './GlobalAppHeader.ts';

type GlobalAppHeaderAccess = {
  element: HTMLDivElement | null;
  menuContainer: HTMLDivElement | null;
  unmount(): void;
};

describe('GlobalAppHeader sidebar energy placement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('keeps the sidebar cluster focused on sidebar actions without the global menu button', () => {
    const runtime = createAppRuntime({
      initialLocale: 'en',
      energyService: {
        loadEnergy: async () => null,
        loadEnergyHistory: async () => [],
        saveEnergy: async (level) => ({
          id: 'energy-1',
          recordedAt: '2026-03-26T09:00:00.000Z',
          energy: level,
        }),
      },
    });
    const header = new GlobalAppHeader(runtime) as unknown as GlobalAppHeaderAccess;

    expect(header.element).not.toBeNull();
    expect(header.menuContainer).not.toBeNull();

    const buttons = Array.from(
      header.menuContainer?.querySelectorAll<HTMLButtonElement>(
        'button[aria-label]'
      ) ?? []
    );
    const chatButton = buttons.find(
      (button) => button.getAttribute('aria-label') === 'Toggle AI assistant panel'
    );
    const energyButton = buttons.find(
      (button) => button.getAttribute('aria-label') === 'Select energy'
    );
    const routinesButton = buttons.find(
      (button) => button.getAttribute('aria-label') === 'Open routines'
    );
    const menuButton = header.element?.querySelector<HTMLButtonElement>(
      'button[aria-label="Open global menu"]'
    );

    expect(chatButton).toBeDefined();
    expect(energyButton).toBeDefined();
    expect(routinesButton).toBeDefined();
    expect(menuButton).toBeNull();
    expect(buttons.indexOf(energyButton as HTMLButtonElement)).toBeLessThan(
      buttons.indexOf(routinesButton as HTMLButtonElement)
    );

    header.unmount();
  });

  it('renders a count badge on the routines sidebar button when routines are still open', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const header = new GlobalAppHeader(runtime) as any;

    header.syncRoutinesStatus({
      openCount: 4,
      completedCount: 2,
      totalDue: 6,
      archivedCount: 1,
      activeCount: 6,
    });

    const routinesButton = (header as GlobalAppHeaderAccess).menuContainer?.querySelector<HTMLButtonElement>(
      'button[aria-label="Open routines"]'
    );
    const badge = routinesButton?.querySelector<HTMLSpanElement>(
      '[data-role="global-routines-button-badge"]'
    );

    expect(badge).not.toBeNull();
    expect(badge?.dataset.variant).toBe('count');
    expect(badge?.dataset.tone).toBe('success');
    expect(badge?.textContent).toBe('4');

    header.unmount();
  });
});
