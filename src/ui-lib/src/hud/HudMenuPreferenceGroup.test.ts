// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createHudMenuPreferenceGroup } from './HudMenuPreferenceGroup.ts';

describe('HudMenuPreferenceGroup', () => {
  it('toggles body visibility from the summary row', () => {
    const child = document.createElement('div');
    child.textContent = 'Child option';

    const group = createHudMenuPreferenceGroup({
      label: 'Alignment guides',
      expanded: true,
      children: [child],
    });

    document.body.appendChild(group.element);

    const summary = group.element.querySelector('[data-slot="summary"]');
    const body = group.element.querySelector('[data-slot="body"]');

    expect(summary).not.toBeNull();
    expect(body).not.toBeNull();
    expect(summary?.getAttribute('aria-expanded')).toBe('true');
    expect(body?.classList.contains('hidden')).toBe(false);

    summary?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(summary?.getAttribute('aria-expanded')).toBe('false');
    expect(body?.classList.contains('hidden')).toBe(true);
  });

  it('does not collapse when the embedded control is clicked', () => {
    const control = document.createElement('button');
    control.type = 'button';
    control.textContent = 'Toggle';

    const group = createHudMenuPreferenceGroup({
      label: 'Alignment guides',
      expanded: true,
      control,
      children: [document.createElement('div')],
    });

    document.body.appendChild(group.element);

    const summary = group.element.querySelector('[data-slot="summary"]');

    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(group.isExpanded()).toBe(true);
    expect(summary?.getAttribute('aria-expanded')).toBe('true');
  });
});
