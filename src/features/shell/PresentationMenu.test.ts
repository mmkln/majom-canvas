// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../app-runtime/index.ts';
import { PresentationMenu } from './PresentationMenu.ts';
import { resetUserPreferencesForTests } from './services/UserPreferencesService.ts';

describe('PresentationMenu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    resetUserPreferencesForTests();
  });

  it('renders the global menu and pin button inside the floating controls block', () => {
    const switcher = new PresentationMenu('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const container = document.getElementById('presentation-menu');
    const menuButton = container?.querySelector<HTMLButtonElement>(
      'button[aria-label="Open global menu"]'
    );
    const handle = container?.querySelector<HTMLButtonElement>(
      'button[data-role="presentation-menu-handle"]'
    );
    const handleDock = container?.querySelector<HTMLDivElement>(
      'div[data-role="presentation-menu-handle-dock"]'
    );
    const intentZone = container?.querySelector<HTMLDivElement>(
      'div[data-role="presentation-menu-intent-zone"]'
    );
    const pinButton = container?.querySelector<HTMLButtonElement>(
      'button[data-role="presentation-menu-pin"]'
    );
    const pinIndicator = pinButton?.querySelector<HTMLElement>('span[aria-hidden="true"]');

    expect(container).not.toBeNull();
    expect(container?.children).toHaveLength(3);
    expect(menuButton).not.toBeNull();
    expect(handle).not.toBeNull();
    expect(handleDock).not.toBeNull();
    expect(intentZone).not.toBeNull();
    expect(pinButton).not.toBeNull();
    expect(container?.firstElementChild?.contains(menuButton as HTMLButtonElement)).toBe(
      true
    );
    expect(container?.firstElementChild?.contains(pinButton as HTMLButtonElement)).toBe(
      true
    );
    expect(pinIndicator?.style.bottom).toBe('0px');
    expect(handleDock?.contains(handle as HTMLButtonElement)).toBe(true);
    expect(handleDock?.contains(pinButton as HTMLButtonElement)).toBe(false);

    switcher.unmount();
  });

  it('opens from the intent zone after a short hover delay', () => {
    vi.useFakeTimers();

    const switcher = new PresentationMenu('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const container = document.getElementById('presentation-menu');
    const intentZone = container?.querySelector(
      'div[data-role="presentation-menu-intent-zone"]'
    ) as HTMLDivElement;

    intentZone.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(80);
    expect(container?.dataset.mode).toBe('peek');

    vi.advanceTimersByTime(80);
    expect(container?.dataset.mode).toBe('open');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('starts in peek mode and expands from the visible trigger before peeking again', () => {
    vi.useFakeTimers();

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
    const handleDock = container?.querySelector(
      'div[data-role="presentation-menu-handle-dock"]'
    ) as HTMLDivElement;
    const pinButton = container?.querySelector(
      'button[data-role="presentation-menu-pin"]'
    ) as HTMLButtonElement;

    expect(container?.dataset.mode).toBe('peek');
    expect(container?.dataset.collapsed).toBe('true');
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect(
      handle.querySelectorAll('svg')[1]?.getAttribute('data-icon-name')
    ).toBe('chevron-up');
    expect(handleDock.style.opacity).toBe('1');
    expect(pinButton.style.display).toBe('none');
    expect((container?.firstElementChild as HTMLElement).style.transform).toContain(
      'scale(0.972)'
    );

    handle.dispatchEvent(new MouseEvent('mouseenter'));
    expect(container?.dataset.mode).toBe('open');
    expect(container?.dataset.collapsed).toBe('false');
    expect(handle.getAttribute('aria-expanded')).toBe('true');
    expect(
      handle.querySelectorAll('svg')[1]?.getAttribute('data-icon-name')
    ).toBe('chevron-down');
    expect(handleDock.style.opacity).toBe('0');
    expect(pinButton.style.display).toBe('inline-flex');
    expect((container?.firstElementChild as HTMLElement).style.transform).toBe(
      'translateY(0px) scale(1)'
    );

    handle.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(800);
    expect(container?.dataset.mode).toBe('peek');
    expect(container?.dataset.collapsed).toBe('true');
    expect(handleDock.style.opacity).toBe('1');
    expect(pinButton.style.display).toBe('none');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('opens the controls from the peek trigger click', () => {
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

    handle.click();

    expect(container?.dataset.mode).toBe('open');
    expect(container?.dataset.collapsed).toBe('false');
    expect(handle.getAttribute('aria-expanded')).toBe('true');
    expect(pinButton.style.display).toBe('inline-flex');

    switcher.unmount();
  });

  it('removes the hidden handle from hit testing and tab order while expanded', () => {
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

    expect(handle.style.pointerEvents).toBe('auto');
    expect(handle.tabIndex).toBe(0);
    expect(handle.getAttribute('aria-hidden')).toBe('false');

    handle.click();

    expect(container?.dataset.mode).toBe('open');
    expect(handle.style.pointerEvents).toBe('none');
    expect(handle.tabIndex).toBe(-1);
    expect(handle.getAttribute('aria-hidden')).toBe('true');

    pinButton.click();

    expect(container?.dataset.mode).toBe('pinned');
    expect(handle.style.pointerEvents).toBe('none');
    expect(handle.tabIndex).toBe(-1);
    expect(handle.getAttribute('aria-hidden')).toBe('true');

    switcher.unmount();
  });

  it('can mount again after unmounting without losing its interaction state', () => {
    const switcher = new PresentationMenu('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();
    switcher.unmount();
    switcher.mount();

    const container = document.getElementById('presentation-menu');
    const handle = container?.querySelector(
      'button[data-role="presentation-menu-handle"]'
    ) as HTMLButtonElement;

    expect(container?.dataset.mode).toBe('peek');

    handle.click();
    expect(container?.dataset.mode).toBe('open');

    switcher.destroy();
  });

  it('holds the panel open briefly after interaction and allows escape to return to peek', () => {
    vi.useFakeTimers();

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
    const controls = container?.firstElementChild as HTMLElement;

    handle.click();
    controls.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    controls.dispatchEvent(new MouseEvent('mouseleave'));

    vi.advanceTimersByTime(600);
    expect(container?.dataset.mode).toBe('open');

    vi.advanceTimersByTime(1100);
    expect(container?.dataset.mode).toBe('peek');

    handle.click();
    controls.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(container?.dataset.mode).toBe('peek');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('keeps the controls expanded after pinning them', () => {
    vi.useFakeTimers();

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

    handle.click();
    pinButton.click();
    (container?.firstElementChild as HTMLElement).dispatchEvent(
      new MouseEvent('mouseleave')
    );
    vi.advanceTimersByTime(600);

    expect(container?.dataset.mode).toBe('pinned');
    expect(container?.dataset.pinned).toBe('true');
    expect(container?.dataset.collapsed).toBe('false');
    expect(pinButton.getAttribute('aria-pressed')).toBe('true');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('pins reliably through a single click activation path', () => {
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

    handle.click();
    pinButton.click();

    expect(container?.dataset.mode).toBe('pinned');
    expect(container?.dataset.pinned).toBe('true');
    expect(pinButton.getAttribute('aria-pressed')).toBe('true');

    switcher.unmount();
  });

  it('does not collapse when focus moves between elements inside the switcher', () => {
    vi.useFakeTimers();

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
    const menuButton = container?.querySelector(
      'button[aria-label="Open global menu"]'
    ) as HTMLButtonElement;

    handle.click();
    pinButton.focus();
    menuButton.focus();
    vi.runAllTimers();

    expect(container?.dataset.mode).toBe('open');
    expect(container?.dataset.collapsed).toBe('false');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('restores the pinned state and skips the initial peek mode', () => {
    const switcher = new PresentationMenu('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const handle = document.querySelector(
      'button[data-role="presentation-menu-handle"]'
    ) as HTMLButtonElement;
    const pinButton = document.querySelector(
      'button[data-role="presentation-menu-pin"]'
    ) as HTMLButtonElement;

    handle.click();
    pinButton.click();
    switcher.unmount();

    const restoredSwitcher = new PresentationMenu('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    restoredSwitcher.mount();

    const container = document.getElementById('presentation-menu');
    const restoredHandleDock = container?.querySelector(
      'div[data-role="presentation-menu-handle-dock"]'
    ) as HTMLDivElement;
    const restoredPinButton = container?.querySelector(
      'button[data-role="presentation-menu-pin"]'
    ) as HTMLButtonElement;

    expect(container?.dataset.mode).toBe('pinned');
    expect(container?.dataset.pinned).toBe('true');
    expect(container?.dataset.collapsed).toBe('false');
    expect(restoredHandleDock.style.opacity).toBe('0');
    expect(restoredPinButton.getAttribute('aria-pressed')).toBe('true');
    expect((container?.firstElementChild as HTMLElement).style.transform).toBe(
      'translateY(0px) scale(1)'
    );

    restoredSwitcher.unmount();
  });
});
