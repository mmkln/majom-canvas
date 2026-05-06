// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../app-runtime/index.ts';
import { clearUserPreferences } from './services/UserPreferencesService.ts';
import { PresentationMenu } from './PresentationMenu.ts';

function mountSwitcher(): {
  switcher: PresentationMenu;
  container: HTMLElement;
  handle: HTMLButtonElement;
  pinButton: HTMLButtonElement;
  controls: HTMLElement;
} {
  const switcher = new PresentationMenu('canvas', {
    runtime: createAppRuntime({ initialLocale: 'en' }),
    showKanban: true,
    showTimeClustering: false,
    showRoutines: false,
    showChat: false,
  });

  switcher.mount();

  const container = document.getElementById('presentation-menu');
  const handle = container?.querySelector(
    'button[data-role="presentation-menu-handle"]'
  ) as HTMLButtonElement;
  const pinButton = container?.querySelector(
    'button[data-role="presentation-menu-pin"]'
  ) as HTMLButtonElement;
  const controls = container?.firstElementChild as HTMLElement;

  if (!container) {
    throw new Error('PresentationMenu container not mounted.');
  }

  return { switcher, container, handle, pinButton, controls };
}

describe('PresentationMenu pin diagnostics', () => {
  beforeEach(() => {
    clearUserPreferences();
    localStorage.clear();
  });

  afterEach(() => {
    if (typeof vi.isFakeTimers === 'function' && vi.isFakeTimers()) {
      vi.runOnlyPendingTimers();
    }
    vi.useRealTimers();
    document.body.innerHTML = '';
    localStorage.clear();
    clearUserPreferences();
  });

  it('pins correctly when opened by handle click and clicked immediately', () => {
    const { switcher, container, handle, pinButton } = mountSwitcher();

    handle.click();
    pinButton.click();

    expect(container.dataset.mode).toBe('pinned');
    expect(container.dataset.pinned).toBe('true');

    switcher.destroy();
  });

  it('pins correctly on hover-open once controls receive mouseenter', () => {
    const { switcher, container, handle, pinButton, controls } = mountSwitcher();

    handle.dispatchEvent(new MouseEvent('mouseenter'));
    controls.dispatchEvent(new MouseEvent('mouseenter'));
    pinButton.click();

    expect(container.dataset.mode).toBe('pinned');
    expect(container.dataset.pinned).toBe('true');

    switcher.destroy();
  });

  it('toggles on every repeated physical click sequence in jsdom', () => {
    const { switcher, container, handle, pinButton } = mountSwitcher();

    handle.click();

    const physicalClick = (): void => {
      pinButton.click();
    };

    physicalClick();
    expect(container.dataset.mode).toBe('pinned');

    physicalClick();
    expect(container.dataset.mode).toBe('open');

    physicalClick();
    expect(container.dataset.mode).toBe('pinned');

    physicalClick();
    expect(container.dataset.mode).toBe('open');

    switcher.destroy();
  });

  it('does not lose toggles across multiple click-only events', () => {

    const { switcher, container, handle, pinButton } = mountSwitcher();

    handle.click();

    pinButton.click();
    expect(container.dataset.mode).toBe('pinned');

    pinButton.click();
    expect(container.dataset.mode).toBe('open');

    pinButton.click();
    expect(container.dataset.mode).toBe('pinned');

    switcher.destroy();
  });
});
