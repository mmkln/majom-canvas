// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../app-runtime/index.ts';
import { WorkspaceViewSwitcher } from './WorkspaceViewSwitcher.ts';

describe('WorkspaceViewSwitcher', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('renders the app menu inside the same floating controls block on the right', () => {
    const switcher = new WorkspaceViewSwitcher('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const container = document.getElementById('workspace-view-switcher');
    const menuButton = container?.querySelector<HTMLButtonElement>(
      'button[aria-label="Open app menu"]'
    );
    const handle = container?.querySelector<HTMLButtonElement>(
      'button[data-role="workspace-view-switcher-handle"]'
    );

    expect(container).not.toBeNull();
    expect(container?.style.display).toBe('');
    expect(container?.children).toHaveLength(2);
    expect(menuButton).not.toBeNull();
    expect(container?.firstElementChild?.contains(menuButton as HTMLButtonElement)).toBe(
      true
    );
    expect(menuButton?.parentElement?.className).toContain('shrink-0');
    expect(container?.firstElementChild?.lastElementChild?.contains(menuButton as HTMLButtonElement)).toBe(
      true
    );
    expect(handle).not.toBeNull();
    expect(container?.lastElementChild).toBe(handle);

    switcher.unmount();
  });

  it('starts deeper-collapsed and expands from the visible handle before collapsing again', () => {
    vi.useFakeTimers();

    const switcher = new WorkspaceViewSwitcher('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const container = document.getElementById('workspace-view-switcher');
    const handle = container?.querySelector(
      'button[data-role="workspace-view-switcher-handle"]'
    ) as HTMLButtonElement;

    expect(container?.dataset.collapsed).toBe('true');
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect((container?.firstElementChild as HTMLElement).style.transform).toBe(
      'translateY(66px)'
    );

    handle.dispatchEvent(new MouseEvent('mouseenter'));
    expect(container?.dataset.collapsed).toBe('false');
    expect(handle.getAttribute('aria-expanded')).toBe('true');

    handle.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(250);
    expect(container?.dataset.collapsed).toBe('true');

    switcher.unmount();
    vi.useRealTimers();
  });

  it('collapses from the handle click even while the handle is hovered', () => {
    vi.useFakeTimers();

    const switcher = new WorkspaceViewSwitcher('canvas', {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showKanban: true,
      showTimeClustering: false,
      showRoutines: false,
      showChat: false,
    });

    switcher.mount();

    const container = document.getElementById('workspace-view-switcher');
    const handle = container?.querySelector(
      'button[data-role="workspace-view-switcher-handle"]'
    ) as HTMLButtonElement;

    handle.dispatchEvent(new MouseEvent('mouseenter'));
    expect(container?.dataset.collapsed).toBe('false');

    handle.click();
    expect(container?.dataset.collapsed).toBe('true');
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    expect((container?.firstElementChild as HTMLElement).style.pointerEvents).toBe(
      'none'
    );

    handle.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(250);
    expect(container?.dataset.collapsed).toBe('true');

    switcher.unmount();
    vi.useRealTimers();
  });
});
