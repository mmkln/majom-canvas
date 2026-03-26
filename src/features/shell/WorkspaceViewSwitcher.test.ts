// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
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

    expect(container).not.toBeNull();
    expect(container?.style.display).toBe('');
    expect(container?.children).toHaveLength(1);
    expect(menuButton).not.toBeNull();
    expect(container?.firstElementChild?.contains(menuButton as HTMLButtonElement)).toBe(
      true
    );
    expect(menuButton?.parentElement?.className).toContain('shrink-0');
    expect(container?.firstElementChild?.lastElementChild?.contains(menuButton as HTMLButtonElement)).toBe(
      true
    );

    switcher.unmount();
  });
});
