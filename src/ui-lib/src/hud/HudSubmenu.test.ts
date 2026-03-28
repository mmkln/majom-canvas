// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { HudSubmenu } from './HudSubmenu.ts';

describe('HudSubmenu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('opens on trigger click and closes on outside mousedown', () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Open';
    const panel = document.createElement('div');
    panel.innerHTML = '<button type="button">Item</button>';

    document.body.appendChild(trigger);

    const submenu = new HudSubmenu({
      trigger,
      panel,
      openMode: 'hover-or-click',
    });

    trigger.dispatchEvent(new FocusEvent('focus'));
    trigger.click();

    expect(submenu.isOpen()).toBe(true);
    expect(panel.isConnected).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(submenu.isOpen()).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    submenu.destroy();
  });

  it('keeps panel interaction inside the submenu', () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Open';
    const panel = document.createElement('div');
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = 'Item';
    panel.appendChild(item);

    document.body.appendChild(trigger);

    const submenu = new HudSubmenu({
      trigger,
      panel,
      openMode: 'hover-or-click',
    });
    const outsideMouseDown = vi.fn();
    window.addEventListener('mousedown', outsideMouseDown);

    trigger.click();
    item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(outsideMouseDown).not.toHaveBeenCalled();
    expect(submenu.isOpen()).toBe(true);

    window.removeEventListener('mousedown', outsideMouseDown);
    submenu.destroy();
  });
});
