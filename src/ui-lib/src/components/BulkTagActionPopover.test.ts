// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BulkTagActionPopover } from './BulkTagActionPopover.ts';

describe('BulkTagActionPopover', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens the tag panel as a fixed overlay like the AI action menu', () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Tags';

    const popover = new BulkTagActionPopover({
      triggerButton: trigger,
      items: [{ id: 1, title: 'Focus', color: '#2563eb' }],
      modeLabels: {
        add: 'Add',
        remove: 'Remove',
        replace: 'Replace',
      },
      applyLabels: {
        add: 'Add tags',
        remove: 'Remove tags',
        replace: 'Replace tags',
      },
    });

    document.body.appendChild(popover.element);

    trigger.click();

    const panel = document.body.querySelector<HTMLElement>(
      '[data-role="bulk-tag-action-panel"]'
    );

    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.className).toContain('fixed');
    expect(panel?.className).toContain('left-0');
    expect(panel?.className).toContain('top-0');
    expect(panel?.className).toContain('overflow-hidden');
    expect(panel?.className).toContain('p-0');
    expect(panel?.classList.contains('hidden')).toBe(false);
    expect(panel?.style.left).not.toBe('');
    expect(panel?.style.top).not.toBe('');

    popover.destroy();
  });

  it('uses the same anchor gap and viewport margin as the AI action menu', () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Tags';

    const popover = new BulkTagActionPopover({
      triggerButton: trigger,
      items: [{ id: 1, title: 'Focus', color: '#2563eb' }],
      modeLabels: {
        add: 'Add',
        remove: 'Remove',
        replace: 'Replace',
      },
      applyLabels: {
        add: 'Add tags',
        remove: 'Remove tags',
        replace: 'Replace tags',
      },
    });

    document.body.appendChild(popover.element);

    const panel = document.body.querySelector<HTMLElement>(
      '[data-role="bulk-tag-action-panel"]'
    );

    Object.defineProperty(popover.element, 'getBoundingClientRect', {
      value: () => new DOMRect(0, 0, 40, 32),
    });
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      value: () => new DOMRect(100, 40, 40, 32),
    });
    Object.defineProperty(panel as HTMLElement, 'getBoundingClientRect', {
      value: () => new DOMRect(0, 0, 320, 220),
    });

    trigger.click();

    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.style.left).toBe('100px');
    expect(panel?.style.top).toBe('80px');

    popover.destroy();
  });

  it('applies the selected tags with the active mode and resets after apply', () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Tags';
    const onApply = vi.fn();
    const popover = new BulkTagActionPopover({
      triggerButton: trigger,
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
      ],
      modeLabels: {
        add: 'Add',
        remove: 'Remove',
        replace: 'Replace',
      },
      applyLabels: {
        add: 'Add tags',
        remove: 'Remove tags',
        replace: 'Replace tags',
      },
      onApply,
    });

    document.body.appendChild(popover.element);

    trigger.click();

    const panel = document.body.querySelector<HTMLElement>(
      '[data-role="bulk-tag-action-panel"]'
    );
    const removeButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    ).find((button) => button.textContent?.includes('Remove'));
    removeButton?.click();

    const firstRow = document.body.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-list"] > div'
    );
    firstRow?.click();

    const applyButton = document.body.querySelector<HTMLButtonElement>(
      '[data-role="bulk-tag-action-apply"]'
    );
    applyButton?.click();

    expect(onApply).toHaveBeenCalledWith({
      mode: 'remove',
      tagIds: [1],
    });
    expect(
      panel?.classList.contains('hidden')
    ).toBe(true);

    trigger.click();
    const addButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    ).find((button) => button.textContent?.includes('Add'));
    expect(addButton?.getAttribute('aria-checked')).toBe('true');

    popover.destroy();
  });
});
