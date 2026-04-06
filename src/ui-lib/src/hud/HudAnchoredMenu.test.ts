// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { HudAnchoredMenu } from './HudAnchoredMenu.ts';

describe('HudAnchoredMenu', () => {
  it('uses a modal-safe default z-index for viewport panels', () => {
    const container = document.createElement('button');
    const panel = document.createElement('div');

    const menu = new HudAnchoredMenu({
      container,
      panel,
      positioning: 'viewport',
    });

    expect(panel.style.zIndex).toBe('320');

    menu.unmount();
  });

  it('allows explicit panel z-index override', () => {
    const container = document.createElement('button');
    const panel = document.createElement('div');

    const menu = new HudAnchoredMenu({
      container,
      panel,
      positioning: 'viewport',
      panelZIndex: 480,
    });

    expect(panel.style.zIndex).toBe('480');

    menu.unmount();
  });
});
