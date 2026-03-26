// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createHudBadge } from './HudBadge.ts';

describe('HudBadge', () => {
  it('creates a neutral badge with the provided label', () => {
    const badge = createHudBadge({
      label: 'EN',
      className: 'min-w-[2rem]',
    });

    expect(badge.tagName).toBe('SPAN');
    expect(badge.textContent).toBe('EN');
    expect(badge.className).toContain('rounded-md');
    expect(badge.className).toContain('bg-slate-100');
    expect(badge.className).toContain('min-w-[2rem]');
  });

  it('creates an accent badge with a title', () => {
    const badge = createHudBadge({
      label: 'UK',
      tone: 'accent',
      title: 'Ukrainian',
    });

    expect(badge.className).toContain('bg-indigo-100');
    expect(badge.title).toBe('Ukrainian');
  });
});
