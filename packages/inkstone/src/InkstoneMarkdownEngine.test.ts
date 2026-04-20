// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createInkstoneMarkdownEngine } from './InkstoneMarkdownEngine.ts';

describe('InkstoneMarkdownEngine', () => {
  it('parses common markdown blocks into a structured document', () => {
    const engine = createInkstoneMarkdownEngine();
    const document = engine.parse(
      '# Heading\n\n---\n- bullet\n1. ordered\n- [x] done\n> quote\n```ts'
    );

    expect(document.blocks.map((block) => block.type)).toEqual([
      'heading',
      'blank',
      'thematic_break',
      'bullet_list_item',
      'ordered_list_item',
      'task_list_item',
      'blockquote',
      'code_fence',
    ]);
    expect(document.stats).toEqual({
      headings: 1,
      thematicBreaks: 1,
      bulletItems: 1,
      orderedItems: 1,
      taskItems: 1,
      blockquotes: 1,
      codeFences: 1,
    });
    expect(document.blocks[0]?.level).toBe(1);
    expect(document.blocks[5]?.checked).toBe(true);
    expect(document.blocks[7]?.language).toBe('ts');
  });

  it('normalizes CRLF line endings by default', () => {
    const engine = createInkstoneMarkdownEngine();
    const document = engine.parse('line one\r\nline two\rline three');

    expect(document.normalized).toBe('line one\nline two\nline three');
  });

  it('extracts inline markdown segments and multiline fenced code blocks', () => {
    const engine = createInkstoneMarkdownEngine();
    const document = engine.parse(
      'Paragraph with **bold**, _italic_, `code`, and [link](https://openai.com)\n```ts\nconst a = 1;\nconst b = 2;\n```'
    );

    const paragraph = document.blocks[0];
    const codeFence = document.blocks[1];

    expect(paragraph?.type).toBe('paragraph');
    expect(paragraph?.segments?.map((segment) => segment.type)).toEqual([
      'text',
      'strong',
      'text',
      'emphasis',
      'text',
      'code',
      'text',
      'link',
    ]);

    expect(codeFence?.type).toBe('code_fence');
    expect(codeFence?.language).toBe('ts');
    expect(codeFence?.text).toBe('const a = 1;\nconst b = 2;');
  });

  it('parses ordered task list items as task blocks', () => {
    const engine = createInkstoneMarkdownEngine();
    const document = engine.parse('1. [ ] First step\n2. [x] Second step');

    expect(document.blocks.map((block) => block.type)).toEqual([
      'task_list_item',
      'task_list_item',
    ]);
    expect(document.blocks[0]?.marker).toBe('1.');
    expect(document.blocks[0]?.checked).toBe(false);
    expect(document.blocks[1]?.marker).toBe('2.');
    expect(document.blocks[1]?.checked).toBe(true);
    expect(document.stats.taskItems).toBe(2);
    expect(document.stats.orderedItems).toBe(0);
  });

  it('creates a lightweight semantic snippet without raw markdown syntax', () => {
    const engine = createInkstoneMarkdownEngine();
    const snippet = engine.createSnippet(
      '## Habits\n- [x] **Drink water**\n[Docs](https://example.com)',
      { maxLength: 120 }
    );

    expect(snippet.items).toEqual([
      { blockType: 'heading', text: 'Habits' },
      { blockType: 'task_list_item', text: '☑ Drink water' },
      { blockType: 'paragraph', text: 'Docs' },
    ]);
    expect(snippet.text).toBe('Habits · ☑ Drink water · Docs');
    expect(snippet.text).not.toContain('##');
    expect(snippet.text).not.toContain('[x]');
    expect(snippet.text).not.toContain('**');
    expect(snippet.text).not.toContain('](');
  });

  it('truncates snippet text on semantic boundaries instead of leaking raw markdown', () => {
    const engine = createInkstoneMarkdownEngine();
    const snippet = engine.createSnippet(
      '- покращити роботу із звязками для цілей, додати можливість видаляти звязки і обирати типи звязків на канвасі',
      { maxLength: 64 }
    );

    expect(snippet.items).toEqual([
      {
        blockType: 'bullet_list_item',
        text:
          '• покращити роботу із звязками для цілей, додати можливість видаляти звязки і обирати типи звязків на канвасі',
      },
    ]);
    expect(snippet.text).toBe(
      '• покращити роботу із звязками для цілей, додати можливість…'
    );
    expect(snippet.truncated).toBe(true);
    expect(snippet.text).not.toContain('- ');
  });
});
