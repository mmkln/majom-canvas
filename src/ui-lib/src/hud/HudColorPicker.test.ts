// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createColorPicker } from './index.ts';

describe('HudColorPicker', () => {
  it('renders swatch options and updates selection on click', () => {
    const onChange = vi.fn();
    const picker = createColorPicker({
      options: [
        {
          id: 'blue',
          value: 'blue',
          label: 'Blue',
          swatchColor: '#2563eb',
          backgroundColor: '#dbeafe',
          borderColor: '#93c5fd',
        },
        {
          id: 'rose',
          value: 'rose',
          label: 'Rose',
          swatchColor: '#db2777',
          backgroundColor: '#fce7f3',
          borderColor: '#f9a8d4',
        },
      ],
      value: 'blue',
      onChange,
      ariaLabel: 'Color',
    });

    const roseButton = picker.element.querySelector<HTMLButtonElement>(
      '[data-value="rose"]'
    );

    expect(picker.element.getAttribute('data-component')).toBe('HudColorPicker');
    expect(picker.element.getAttribute('role')).toBe('radiogroup');
    expect(
      picker.element.querySelector('[data-value="blue"][data-selected="true"]')
    ).not.toBeNull();

    roseButton?.click();

    expect(onChange).toHaveBeenCalledWith('rose');
    expect(picker.getValue()).toBe('rose');
    expect(
      picker.element.querySelector('[data-value="rose"][data-selected="true"]')
    ).not.toBeNull();
  });

  it('disables all options when the picker is disabled', () => {
    const picker = createColorPicker({
      options: [
        {
          id: 'blue',
          value: 'blue',
          label: 'Blue',
          swatchColor: '#2563eb',
        },
      ],
      value: 'blue',
    });

    picker.setDisabled(true);

    const button = picker.element.querySelector<HTMLButtonElement>('button');
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-disabled')).toBe('true');
  });
});
