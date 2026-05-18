// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { StaticDropdownSelect } from './StaticDropdownSelect.ts';

describe('StaticDropdownSelect', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('passes item hints to dropdown list items', () => {
    const select = new StaticDropdownSelect({
      value: null,
      placeholder: 'Pick type',
      items: [{ id: 'mission', label: 'Mission', hint: 'Complete artifact.' }],
      getKey: (item) => item.id,
      getLabel: (item) => item.label,
      getHint: (item) => item.hint,
      onSelect: () => undefined,
      portalTarget: document.body,
    });
    document.body.appendChild(select.element);

    select.element.querySelector<HTMLButtonElement>('button')?.click();

    const item = document.querySelector<HTMLButtonElement>(
      '[data-dropdown-select-item="mission"]'
    );
    expect(item?.getAttribute('aria-description')).toBe('Complete artifact.');
    expect(
      item
        ?.querySelector<HTMLElement>('[data-hud-dropdown-hint="true"]')
        ?.getAttribute('title')
    ).toBe('Complete artifact.');

    select.destroy();
  });
});
