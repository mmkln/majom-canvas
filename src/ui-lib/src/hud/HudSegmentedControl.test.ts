// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createHudSegmentedControl } from './HudSegmentedControl.ts';

describe('HudSegmentedControl', () => {
  it('supports a bare variant without visible container chrome', () => {
    const control = createHudSegmentedControl({
      ariaLabel: 'View mode',
      size: 'sm',
      variant: 'bare',
      value: 'day',
      options: [
        { id: 'day', value: 'day', label: 'Day' },
        { id: 'week', value: 'week', label: 'Week' },
      ],
    });

    expect(control.element.className).toContain('border-transparent');
    expect(control.element.className).toContain('bg-transparent');
    expect(control.element.className).toContain('p-0');
    expect(control.element.className.split(/\s+/)).not.toContain('p-1');
    const firstButton = control.element.querySelector('button');
    expect(firstButton?.className).toContain('h-8');
    expect(firstButton?.className).toContain('min-w-8');
  });
});
