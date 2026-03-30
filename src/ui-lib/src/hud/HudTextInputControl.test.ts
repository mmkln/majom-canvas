// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { createHudInput } from './HudTextInputControl.ts';

describe('HudTextInputControl', () => {
  it('shows a custom clear button for search inputs and clears the value on click', () => {
    const onInput = vi.fn();
    const control = createHudInput({
      type: 'search',
      value: 'roadmap',
      leadingIcon: 'magnifying-glass',
      searchClearLabel: 'Clear search',
      onInput,
    });

    document.body.appendChild(control.element);

    const clearButton = control.element.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear search"]'
    );

    expect(clearButton).not.toBeNull();
    clearButton?.click();

    expect(control.input.value).toBe('');
    expect(onInput).toHaveBeenCalled();
    expect(onInput.mock.calls.at(-1)?.[0]).toBe('');
  });
});
