// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInkstoneEditor } from './InkstoneEditor.ts';
import { createInkstoneMirrorRenderer } from './InkstoneMirrorRenderer.ts';

function dispatchMacShortcut(key: string, options: { shiftKey?: boolean } = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    metaKey: true,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
  });
}

function dispatchEditorKey(
  key: string,
  options: { shiftKey?: boolean } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey ?? false,
  });
}

describe('InkstoneEditor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('emits onChange when the document changes through direct input', () => {
    const onChange = vi.fn();
    const onDocumentChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: 'Alpha',
      onChange,
      onDocumentChange,
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.value = 'Alpha beta';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('Alpha beta');
    expect(editor.getValue()).toBe('Alpha beta');
    expect(onDocumentChange).toHaveBeenCalled();
    expect(editor.getDocument().stats.headings).toBe(0);
  });

  it('wraps the current selection in bold markers on Cmd/Ctrl+B', () => {
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: 'Alpha beta',
      onChange,
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(0, 5);

    input.dispatchEvent(dispatchMacShortcut('b'));

    expect(editor.getValue()).toBe('**Alpha** beta');
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(7);
    expect(onChange).toHaveBeenLastCalledWith('**Alpha** beta');
  });

  it('toggles bullet list prefix on Cmd/Ctrl+Shift+8', () => {
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: 'First line',
      onChange,
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(0, input.value.length);

    input.dispatchEvent(dispatchMacShortcut('8', { shiftKey: true }));

    expect(editor.getValue()).toBe('- First line');
    expect(onChange).toHaveBeenLastCalledWith('- First line');

    input.setSelectionRange(0, input.value.length);
    input.dispatchEvent(dispatchMacShortcut('8', { shiftKey: true }));

    expect(editor.getValue()).toBe('First line');
  });

  it('continues a task item on Enter', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] Ship inkstone',
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    input.dispatchEvent(dispatchEditorKey('Enter'));

    expect(editor.getValue()).toBe('- [ ] Ship inkstone\n- [ ] ');
    expect(input.selectionStart).toBe(editor.getValue().length);
    expect(input.selectionEnd).toBe(editor.getValue().length);
  });

  it('continues an ordered task item on Enter with the next number', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '1. [ ] First step',
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    input.dispatchEvent(dispatchEditorKey('Enter'));

    expect(editor.getValue()).toBe('1. [ ] First step\n2. [ ] ');
  });

  it('exits an empty task item on Enter', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] ',
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    input.dispatchEvent(dispatchEditorKey('Enter'));

    expect(editor.getValue()).toBe('');
    expect(input.selectionStart).toBe(0);
  });

  it('unwraps a task item on Backspace at the content start', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] Ship inkstone',
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(6, 6);

    input.dispatchEvent(dispatchEditorKey('Backspace'));

    expect(editor.getValue()).toBe('Ship inkstone');
    expect(input.selectionStart).toBe(0);
  });

  it('indents and outdents a task item with Tab and Shift+Tab', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] Ship inkstone',
    });

    editor.mount(host);
    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(0, 0);

    input.dispatchEvent(dispatchEditorKey('Tab'));
    expect(editor.getValue()).toBe('  - [ ] Ship inkstone');

    input.setSelectionRange(0, 0);
    input.dispatchEvent(dispatchEditorKey('Tab', { shiftKey: true }));
    expect(editor.getValue()).toBe('- [ ] Ship inkstone');
  });

  it('normalizes line endings through the markdown engine and exposes document metadata', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Heading\r\n- [x] Done',
    });

    editor.mount(host);

    expect(editor.getValue()).toBe('# Heading\n- [x] Done');
    expect(editor.getDocument().stats.headings).toBe(1);
    expect(editor.getDocument().stats.taskItems).toBe(1);
    expect(editor.element.dataset.inkstoneHeadingCount).toBe('1');
    expect(editor.element.dataset.inkstoneTaskCount).toBe('1');
    expect(editor.getInputElement().spellcheck).toBe(false);
    expect(editor.getInputElement().getAttribute('autocorrect')).toBe('off');
  });

  it('renders visible formatting blocks in the mirror surface', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Heading\n---\n- [x] Done\n> Quote',
      placeholder: 'Write something',
    });

    editor.mount(host);

    const lines = Array.from(
      editor.element.querySelectorAll<HTMLElement>('[data-inkstone-role="line"]')
    );
    expect(lines).toHaveLength(4);
    expect(lines[0]?.dataset.inkstoneBlockType).toBe('heading');
    expect(lines[1]?.dataset.inkstoneBlockType).toBe('thematic_break');
    expect(lines[2]?.dataset.inkstoneBlockType).toBe('task_list_item');
    expect(lines[3]?.dataset.inkstoneBlockType).toBe('blockquote');
    expect(lines[0]?.textContent).toBe('Heading');
    expect(lines[1]?.style.display).toBe('flex');
    expect(lines[1]?.style.alignItems).toBe('center');
    const divider = lines[1]?.querySelector<HTMLElement>('[data-inkstone-role="divider"]');
    expect(divider).not.toBeNull();
    expect(divider?.style.backgroundColor).toBe('rgba(203, 213, 225, 0.6)');
    expect(lines[2]?.textContent).toContain('Done');
    expect(lines[3]?.textContent).toContain('Quote');
  });

  it('renders visible markers for bullet and ordered lists in styled mode', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- Bullet item\n1. Ordered item',
    });

    editor.mount(host);

    const bulletLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const orderedLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="14"]'
    );
    const bulletMarker = bulletLine?.querySelector<HTMLElement>(
      '[data-inkstone-role="list-marker"]'
    );
    const orderedMarker = orderedLine?.querySelector<HTMLElement>(
      '[data-inkstone-role="list-marker"]'
    );
    const bulletGutter = bulletLine?.querySelector<HTMLElement>(
      '[data-inkstone-role="list-gutter"]'
    );
    const orderedGutter = orderedLine?.querySelector<HTMLElement>(
      '[data-inkstone-role="list-gutter"]'
    );

    expect(bulletLine?.dataset.inkstoneBlockType).toBe('bullet_list_item');
    expect(orderedLine?.dataset.inkstoneBlockType).toBe('ordered_list_item');
    expect(bulletMarker?.textContent).toBe('•');
    expect(orderedMarker?.textContent).toBe('1.');
    expect(bulletMarker?.style.opacity).toBe('1');
    expect(orderedMarker?.style.opacity).toBe('1');
    expect(bulletGutter?.style.display).toBe('inline-block');
    expect(orderedGutter?.style.display).toBe('inline-block');
    expect(bulletGutter?.querySelector('[aria-hidden="true"]')?.textContent).toBe('- ');
    expect(orderedGutter?.querySelector('[aria-hidden="true"]')?.textContent).toBe('1. ');
  });

  it('does not narrow bullet list content width in editor mode, otherwise wrapped list lines drift away from the textarea caret', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value:
        '- покращити роботу із звязками для цілей, додати можливість видаляти звязки і обирати типи звязків на канвасі',
    });

    editor.mount(host);

    const bulletLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="bullet_list_item"]'
    );
    const bulletRow = bulletLine?.firstElementChild as HTMLElement | null;

    expect(bulletLine).not.toBeNull();
    expect(bulletRow).not.toBeNull();
    expect(bulletRow?.style.display).not.toBe('grid');
    expect(bulletRow?.style.gridTemplateColumns).toBe('');
  });

  it('reserves the raw task syntax width in editor mode instead of using a narrower checkbox grid gutter', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] Ship inkstone',
    });

    editor.mount(host);

    const checkboxGutter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-role="task-gutter"]'
    );
    const reservedSyntax = checkboxGutter?.querySelector<HTMLElement>('[aria-hidden="true"]');

    expect(checkboxGutter).not.toBeNull();
    expect(checkboxGutter?.style.display).toBe('inline-block');
    expect(reservedSyntax?.textContent).toBe('[ ] ');
  });

  it('renders inline markdown styling in the mirror surface', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: 'Paragraph with **bold**, _italic_, `code`, and [link](https://openai.com)',
    });

    editor.mount(host);

    const strong = editor.element.querySelector('strong');
    expect(strong?.textContent).toBe('bold');
    expect(strong?.style.textDecoration).toBe('none');
    expect(editor.element.querySelector('em')?.textContent).toBe('italic');
    expect(editor.element.querySelector('code')?.textContent).toBe('code');
    expect(
      editor.element.querySelector('[data-inkstone-href="https://openai.com"]')
        ?.textContent
    ).toBe('link');
    expect(
      editor.element.querySelectorAll(
        '[data-inkstone-block-type="paragraph"] [aria-hidden="true"]'
      )
    ).toHaveLength(0);
  });

  it('does not reserve hidden syntax spacing for blockquotes in styled mode', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '> Quoted text',
    });

    editor.mount(host);

    const quoteLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="blockquote"]'
    );

    expect(quoteLine?.textContent).toBe('Quoted text');
    expect(quoteLine?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it('keeps heading hierarchy visually distinct without changing editor line metrics', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Title\n## Section\n### Topic\n#### Detail\n##### Habit',
    });

    editor.mount(host);

    const headingLines = Array.from(
      editor.element.querySelectorAll<HTMLElement>('[data-inkstone-block-type="heading"]')
    );

    expect(headingLines).toHaveLength(5);
    expect(headingLines[0]?.style.color).toBe('rgb(39, 54, 74)');
    expect(headingLines[1]?.style.color).toBe('rgb(51, 65, 85)');
    expect(headingLines[2]?.style.color).toBe('rgb(71, 85, 105)');
    expect(headingLines[3]?.style.color).toBe('rgb(91, 104, 122)');
    expect(headingLines[4]?.style.color).toBe('rgb(107, 114, 128)');
    expect(headingLines[0]?.style.fontSize).toBe('');
    expect(headingLines[4]?.style.fontSize).toBe('');
    expect(headingLines[0]?.style.textDecoration).toBe('none');
    expect(headingLines[4]?.style.textDecoration).toBe('none');
  });

  it('does not change heading line metrics in styled mode in a way that can desync wrapping from the textarea', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '##### A heading that is close to the wrap boundary',
    });

    editor.mount(host);

    const headingLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="heading"]'
    );

    expect(headingLine).not.toBeNull();
    expect(headingLine?.style.fontSize).toBe('');
    expect(headingLine?.style.letterSpacing).toBe('');
  });

  it('does not apply inline box or weight styles that can expand a single raw line into multiple visual lines', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: 'A line with **bold** and `code` close to wrapping',
    });

    editor.mount(host);

    const strong = editor.element.querySelector<HTMLElement>('strong');
    const code = editor.element.querySelector<HTMLElement>('code');

    expect(strong).not.toBeNull();
    expect(code).not.toBeNull();
    expect(strong?.style.fontWeight).toBe('inherit');
    expect(
      window.getComputedStyle(strong as HTMLElement).fontWeight
    ).not.toBe('700');
    expect(code?.style.padding).toBe('');
    expect(code?.style.borderRadius).toBe('');
    expect(code?.style.fontFamily).toBe('inherit');
  });

  it('anchors task checkbox to the first line for multiline task items', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] First line of task\ncontinuation line',
    });

    editor.mount(host);

    const checkbox = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-task-toggle="true"]'
    );
    const checkboxGutter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-role="task-gutter"]'
    );

    expect(checkbox).not.toBeNull();
    expect(checkbox?.style.position).toBe('absolute');
    expect(checkbox?.style.top).toBe('50%');
    expect(checkboxGutter?.style.display).toBe('inline-block');
    expect(checkboxGutter?.style.verticalAlign).toBe('top');
  });

  it('toggles a task checkbox through the mirror surface', () => {
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '- [ ] Ship inkstone',
      onChange,
    });

    editor.mount(host);

    const checkbox = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-task-toggle="true"]'
    );
    expect(checkbox).not.toBeNull();
    if (!checkbox) {
      throw new Error('Expected task toggle checkbox.');
    }

    checkbox.click();

    expect(editor.getValue()).toBe('- [x] Ship inkstone');
    expect(onChange).toHaveBeenLastCalledWith('- [x] Ship inkstone');
  });

  it('renders and toggles ordered task list items through the mirror surface', () => {
    const onChange = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '1. [ ] Ship inkstone',
      onChange,
    });

    editor.mount(host);

    const taskLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="task_list_item"]'
    );
    const checkbox = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-task-toggle="true"]'
    );

    expect(taskLine).not.toBeNull();
    expect(checkbox).not.toBeNull();
    if (!checkbox) {
      throw new Error('Expected ordered task toggle checkbox.');
    }

    checkbox.click();

    expect(editor.getValue()).toBe('1. [x] Ship inkstone');
    expect(onChange).toHaveBeenLastCalledWith('1. [x] Ship inkstone');
  });

  it('does not run a full mirror render when toggling a task checkbox', () => {
    const host = document.createElement('div');
    const mirrorRenderer = createInkstoneMirrorRenderer();
    const renderSpy = vi.spyOn(mirrorRenderer, 'render');
    document.body.appendChild(host);

    const editor = createInkstoneEditor({
      value: '# Heading\n- [ ] Ship inkstone',
      mirrorRenderer,
    });

    editor.mount(host);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    const checkbox = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-task-toggle="true"]'
    );
    if (!checkbox) {
      throw new Error('Expected task toggle checkbox.');
    }

    checkbox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    checkbox.click();

    expect(editor.getValue()).toBe('# Heading\n- [x] Ship inkstone');
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('preserves unaffected line nodes when toggling a task checkbox', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Heading\n- [ ] Ship inkstone',
    });

    editor.mount(host);

    const headingLineBefore = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const taskLineBefore = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="task_list_item"]'
    );
    const checkbox = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-task-toggle="true"]'
    );
    if (!headingLineBefore || !taskLineBefore || !checkbox) {
      throw new Error('Expected heading line, task line and task toggle checkbox.');
    }

    checkbox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    checkbox.click();

    const headingLineAfter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const taskLineAfter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-block-type="task_list_item"]'
    );

    expect(headingLineAfter).toBe(headingLineBefore);
    expect(taskLineAfter).not.toBe(taskLineBefore);
  });

  it('renders the active block as raw markdown while keeping inactive blocks styled', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Heading\nParagraph with **bold** text',
    });

    editor.mount(host);

    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(12, 12);
    input.dispatchEvent(new Event('select', { bubbles: true }));

    const headingLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const paragraphLine = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="10"]'
    );

    expect(headingLine?.dataset.inkstoneRenderMode).toBe('styled');
    expect(headingLine?.textContent).toBe('Heading');
    expect(paragraphLine?.dataset.inkstoneRenderMode).toBe('editing');
    expect(paragraphLine?.textContent).toBe('Paragraph with **bold** text');
    expect(paragraphLine?.querySelector('strong')).toBeNull();
  });

  it('moves raw markdown editing mode to the newly active block', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = createInkstoneEditor({
      value: '# Heading\n- [ ] Ship inkstone',
    });

    editor.mount(host);

    const input = editor.getInputElement();
    input.focus();
    input.setSelectionRange(0, 0);
    input.dispatchEvent(new Event('select', { bubbles: true }));

    const headingLineBefore = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const taskLineBefore = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="10"]'
    );

    expect(headingLineBefore?.dataset.inkstoneRenderMode).toBe('editing');
    expect(headingLineBefore?.textContent).toBe('# Heading');
    expect(headingLineBefore?.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(taskLineBefore?.dataset.inkstoneRenderMode).toBe('styled');
    expect(taskLineBefore?.querySelector('[data-inkstone-task-toggle="true"]')).not.toBeNull();

    input.setSelectionRange(13, 13);
    input.dispatchEvent(new Event('select', { bubbles: true }));

    const headingLineAfter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="0"]'
    );
    const taskLineAfter = editor.element.querySelector<HTMLElement>(
      '[data-inkstone-line-start="10"]'
    );

    expect(headingLineAfter?.dataset.inkstoneRenderMode).toBe('styled');
    expect(headingLineAfter?.textContent).toBe('Heading');
    expect(taskLineAfter?.dataset.inkstoneRenderMode).toBe('editing');
    expect(taskLineAfter?.textContent).toBe('- [ ] Ship inkstone');
    expect(taskLineAfter?.querySelector('[data-inkstone-task-toggle="true"]')).toBeNull();
  });
});
