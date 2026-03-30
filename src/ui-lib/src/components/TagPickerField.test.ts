// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TagPickerField } from './TagPickerField.ts';

const flushAsync = async (): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
};

describe('TagPickerField', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('surfaces selected tags as removable chips', () => {
    const onChange = vi.fn();
    const field = new TagPickerField({
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
      ],
      selectedIds: [1],
      onChange,
    });
    document.body.appendChild(field.element);

    const trigger = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    const chip = document.querySelector<HTMLButtonElement>(
      '[data-role="goal-tag-picker-selected-chip"][data-tag-id="1"]'
    );

    expect(trigger).not.toBeNull();
    expect(chip).not.toBeNull();
    expect(trigger?.textContent).toContain('Focus');
    chip?.click();

    expect(onChange).toHaveBeenCalledWith([]);
    expect(
      document.querySelector(
        '[data-role="goal-tag-picker-selected-chip"][data-tag-id="1"]'
      )
    ).toBeNull();
    expect(trigger?.textContent).toContain('Select tags');

    field.destroy();
  });

  it('collapses selected tags into an inline summary with overflow', () => {
    const field = new TagPickerField({
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
        { id: 3, title: 'Vision', color: '#0f766e' },
      ],
      selectedIds: [1, 2, 3],
    });
    document.body.appendChild(field.element);

    const trigger = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    const chips = Array.from(
      document.querySelectorAll('[data-role="goal-tag-picker-selected-chip"]')
    );

    expect(trigger).not.toBeNull();
    expect(chips).toHaveLength(2);
    expect(trigger?.textContent).toContain('Focus');
    expect(trigger?.textContent).toContain('Strategy');
    expect(trigger?.textContent).toContain('+1');

    field.destroy();
  });

  it('orders selected tags first inside the popover list', () => {
    const field = new TagPickerField({
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
        { id: 3, title: 'Vision', color: '#0f766e' },
      ],
      selectedIds: [2],
    });
    document.body.appendChild(field.element);

    const trigger = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    expect(trigger).not.toBeNull();
    trigger?.click();

    const panel = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-panel"]'
    );
    const rows = Array.from(
      panel?.querySelectorAll<HTMLElement>('[data-role="goal-tag-picker-list"] > div') ??
        []
    );
    const rowTexts = rows.map((row) => row.textContent ?? '');

    expect(rowTexts[0]).toContain('Strategy');
    expect(rowTexts[1]).toContain('Focus');
    expect(rowTexts[2]).toContain('Vision');

    field.destroy();
  });

  it('creates and selects a new tag from search when no matches exist', async () => {
    const onCreate = vi.fn(async (title: string) => ({
      id: 3,
      title,
      color: '#0f766e',
    }));
    const onChange = vi.fn();
    const field = new TagPickerField({
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
      ],
      onCreate,
      onChange,
    });
    document.body.appendChild(field.element);

    const trigger = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    trigger?.click();

    const searchInput = document.querySelector<HTMLInputElement>(
      'input[data-goal-tag-search-input="true"]'
    );
    searchInput!.value = 'Vision';
    searchInput?.dispatchEvent(new Event('input', { bubbles: true }));

    const createRow = document.querySelector<HTMLButtonElement>(
      '[data-role="goal-tag-picker-create"]'
    );

    expect(createRow?.textContent).toContain('Create tag');
    expect(createRow?.textContent).toContain('"Vision"');

    createRow?.click();

    await flushAsync();

    expect(onCreate).toHaveBeenCalledWith('Vision');
    expect(onChange).toHaveBeenCalledWith([3]);
    expect(trigger?.textContent).toContain('Vision');

    field.destroy();
  });
});
