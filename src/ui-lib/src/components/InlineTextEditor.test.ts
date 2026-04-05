// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InlineTextEditor } from './InlineTextEditor.ts';

describe('InlineTextEditor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('commits on blur without stealing focus from the next control', () => {
    const onCommit = vi.fn();
    const editor = new InlineTextEditor({
      value: 'Initial note',
      placeholder: 'No description yet.',
      multiline: true,
      editorRows: 4,
      displayClassName: 'display',
      emptyDisplayClassName: 'display-empty',
      inputClassName: 'editor',
      onCommit,
    });
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    document.body.append(editor.element, saveButton);

    editor.startEditing();
    const control = editor.element.querySelector('textarea');
    expect(control).not.toBeNull();

    if (!control) {
      throw new Error('Expected inline editor control.');
    }

    control.focus();
    control.value = 'Updated note';
    control.dispatchEvent(new Event('input', { bubbles: true }));

    saveButton.focus();

    expect(document.activeElement).toBe(saveButton);
    expect(onCommit).toHaveBeenCalledWith('Updated note');
    expect(
      editor.element.querySelector('button')?.textContent
    ).toBe('Updated note');
  });
});
