// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  createSidebarDivider,
  createSidebarRailButton,
  setSidebarRailButtonActive,
  SIDEBAR_TOKENS,
} from './index.ts';

describe('HudSidebar', () => {
  it('creates shared sidebar rail buttons with a data-driven active contract', () => {
    const button = createSidebarRailButton({
      icon: 'map',
      title: 'Canvas',
      ariaLabel: 'Canvas',
      active: true,
    });

    expect(button.getAttribute('data-component')).toBe('HudIconButton');
    expect(button.getAttribute('data-sidebar-rail-button')).toBe('true');
    expect(button.getAttribute('title')).toBe('Canvas');
    expect(button.getAttribute('aria-label')).toBe('Canvas');
    expect(button.className).toContain('h-9');
    expect(button.className).toContain('w-9');
    expect(button.className).toContain('focus-visible:ring-slate-300');
    expect(button.className).toContain('data-[active=true]:bg-slate-100');
    expect(button.dataset.active).toBe('true');
    expect(button.style.background).toBe('');

    setSidebarRailButtonActive(button, false);
    expect(button.dataset.active).toBe('false');
    expect(button.style.color).toBe('');
  });

  it('creates the documented compact divider and exports shared tokens', () => {
    const divider = createSidebarDivider();

    expect(divider.getAttribute('data-component')).toBe('HudSidebarDivider');
    expect(divider.className).toContain('w-[52px]');
    expect(divider.className).toContain('h-px');
    expect(SIDEBAR_TOKENS.compactWidthPx).toBe(72);
    expect(SIDEBAR_TOKENS.comfortWidthPx).toBe(80);
    expect(SIDEBAR_TOKENS.railButtonSizePx).toBe(36);
  });
});
