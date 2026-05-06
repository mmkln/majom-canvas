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

  it('renders all selected tags as wrapped removable chips above the list', () => {
    const onChange = vi.fn();
    const field = new TagPickerField({
      items: [
        { id: 1, title: 'Focus', color: '#2563eb' },
        { id: 2, title: 'Strategy', color: '#7c3aed' },
        { id: 3, title: 'Vision', color: '#0f766e' },
      ],
      selectedIds: [1, 2, 3],
      onChange,
    });
    document.body.appendChild(field.element);

    const trigger = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    expect(trigger).not.toBeNull();
    trigger?.click();

    const selectedSection = document.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-selected-section"]'
    );
    const chips = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-role="goal-tag-picker-panel-selected-chip"]'
      )
    );

    expect(selectedSection).not.toBeNull();
    expect(chips).toHaveLength(3);
    expect(chips.map((chip) => chip.textContent ?? '')).toEqual(
      expect.arrayContaining(['Focus×', 'Strategy×', 'Vision×'])
    );

    chips[1]?.click();

    expect(onChange).toHaveBeenCalledWith([1, 3]);
    expect(
      document.querySelector(
        '[data-role="goal-tag-picker-panel-selected-chip"][data-tag-id="2"]'
      )
    ).toBeNull();

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

  it('renders the labels variant with swatches and edit actions', () => {
    const onChange = vi.fn();
    const field = new TagPickerField({
      variant: 'labels',
      items: [
        { id: 1, title: 'Focus', color: '#4bce97' },
        { id: 2, title: 'Strategy', color: '#fea362' },
      ],
      selectedIds: [1],
      onChange,
    });
    document.body.appendChild(field.element);

    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="clickable-checkbox"]')
    );
    const labels = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="card-label"]')
    );

    expect(rows).toHaveLength(2);
    expect(labels.map((label) => label.textContent)).toEqual([
      'Focus',
      'Strategy',
    ]);

    rows[1]?.click();

    expect(onChange).toHaveBeenCalledWith([1, 2]);
    field.destroy();
  });

  it('edits an existing label from the labels variant editor', async () => {
    const onUpdate = vi.fn(async (id: number, patch: { title?: string; color?: string }) => ({
      id,
      title: patch.title ?? 'Focus',
      color: patch.color ?? '#4bce97',
    }));
    const field = new TagPickerField({
      variant: 'labels',
      items: [{ id: 1, title: 'Focus', color: '#4bce97' }],
      selectedIds: [1],
      onUpdate,
    });
    document.body.appendChild(field.element);

    document.querySelector<HTMLButtonElement>('[data-testid="card-label-edit-button"]')?.click();
    const input = document.querySelector<HTMLInputElement>('#edit-label-title-input');
    input!.value = 'Updated';
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('button[data-testid="color-tile-fea362"]')?.click();
    const save = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent === 'Save'
    );
    save?.click();

    await flushAsync();

    expect(onUpdate).toHaveBeenCalledWith(1, {
      title: 'Updated',
      color: '#fea362',
    });
    expect(document.querySelector('[data-testid="card-label"]')?.textContent).toBe(
      'Updated'
    );
    field.destroy();
  });
});
