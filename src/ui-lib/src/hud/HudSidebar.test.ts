// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  createSidebarDivider,
  createSidebarRailButton,
  setSidebarRailButtonBadge,
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
    expect(button.className).toContain('data-[active=true]:bg-indigo-50');
    expect(button.className).toContain('data-[active=true]:text-indigo-700');
    expect(button.dataset.active).toBe('true');
    expect(button.style.background).toBe('');

    setSidebarRailButtonActive(button, false);
    expect(button.dataset.active).toBe('false');
    expect(button.style.color).toBe('');
  });

  it('creates the documented compact divider and exports shared tokens', () => {
    const divider = createSidebarDivider();

    expect(divider.getAttribute('data-component')).toBe('HudSidebarDivider');
    expect(divider.className).toContain('h-px');
    expect(divider.style.width).toBe('48px');
    expect(SIDEBAR_TOKENS.compactWidthPx).toBe(64);
    expect(SIDEBAR_TOKENS.comfortWidthPx).toBe(72);
    expect(SIDEBAR_TOKENS.railButtonSizePx).toBe(36);
  });

  it('supports reusable sidebar rail badges with count, dot, and pill variants', () => {
    const button = createSidebarRailButton({
      icon: 'check-circle',
      title: 'Routines',
      ariaLabel: 'Routines',
      badge: {
        variant: 'count',
        tone: 'success',
        value: 12,
        max: 9,
      },
    });

    const badge = button.querySelector<HTMLSpanElement>(
      '[data-sidebar-rail-badge="true"]'
    );
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('data-component')).toBe('HudSidebarRailBadge');
    expect(badge?.dataset.variant).toBe('count');
    expect(badge?.dataset.tone).toBe('success');
    expect(badge?.textContent).toBe('9+');
    expect(badge?.className).toContain('bg-emerald-500');
    expect(button.className).toContain('relative');

    setSidebarRailButtonBadge(button, {
      variant: 'dot',
      tone: 'warning',
    });
    expect(badge?.dataset.variant).toBe('dot');
    expect(badge?.textContent).toBe('');
    expect(badge?.className).toContain('h-2.5');
    expect(badge?.className).toContain('bg-amber-500');

    setSidebarRailButtonBadge(button, {
      variant: 'pill',
      tone: 'danger',
      value: 'new',
    });
    expect(badge?.dataset.variant).toBe('pill');
    expect(badge?.textContent).toBe('new');
    expect(badge?.className).toContain('bg-rose-500');

    setSidebarRailButtonBadge(button, null);
    expect(badge?.style.display).toBe('none');
  });
});
