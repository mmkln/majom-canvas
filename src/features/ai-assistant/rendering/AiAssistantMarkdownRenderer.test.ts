// @vitest-environment jsdom

import { afterAll, describe, expect, it } from 'vitest';
import { AiAssistantMarkdownRenderer } from './AiAssistantMarkdownRenderer.ts';

describe('AiAssistantMarkdownRenderer', () => {
  afterAll(() => {
    window.close();
  });

  it('renders common markdown structures', () => {
    const renderer = new AiAssistantMarkdownRenderer();
    const element = renderer.render('# Title\n\n- First\n- Second\n\n`code`');

    expect(element.querySelector('h1')?.textContent).toBe('Title');
    expect(
      Array.from(element.querySelectorAll('li')).map((item) => item.textContent)
    ).toEqual(['First', 'Second']);
    expect(element.querySelector('code')?.textContent).toBe('code');
  });

  it('sanitizes unsafe html', () => {
    const renderer = new AiAssistantMarkdownRenderer();
    const element = renderer.render(
      '<script>alert(1)</script><img src="x" onerror="alert(1)" />'
    );

    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('img')?.getAttribute('onerror')).toBeNull();
  });
});
