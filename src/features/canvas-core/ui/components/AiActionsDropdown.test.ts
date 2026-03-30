// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiActionsDropdown } from './AiActionsDropdown.ts';

describe('AiActionsDropdown', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens as a viewport-anchored overlay via the shared anchored menu', () => {
    const dropdown = new AiActionsDropdown();
    const onSelect = vi.fn();
    dropdown.setItems([
      {
        id: 'summarize',
        label: 'Summarize',
        icon: 'chat-bubble-left',
        onSelect,
      },
    ]);

    document.body.appendChild(dropdown.element);

    const trigger = dropdown.element.querySelector<HTMLButtonElement>('button');
    const panel = document.body.querySelector<HTMLElement>('[role="menu"]');

    Object.defineProperty(trigger as HTMLElement, 'getBoundingClientRect', {
      value: () => new DOMRect(120, 60, 44, 32),
    });
    Object.defineProperty(panel as HTMLElement, 'getBoundingClientRect', {
      value: () => new DOMRect(0, 0, 196, 120),
    });

    trigger?.click();

    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.classList.contains('hidden')).toBe(false);
    expect(panel?.style.left).toBe('120px');
    expect(panel?.style.top).toBe('100px');

    const item = panel?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    item?.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(panel?.classList.contains('hidden')).toBe(true);

    dropdown.destroy();
  });
});
