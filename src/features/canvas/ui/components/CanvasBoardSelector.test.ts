// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { CanvasBoardSelector } from './CanvasBoardSelector.ts';

type CanvasBoardSelectorAccess = {
  titleWrap: HTMLDivElement;
  titleText: HTMLButtonElement;
  titleLabel: HTMLSpanElement;
};

describe('CanvasBoardSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps long canvas titles truncated in the menu trigger while preserving the full title', () => {
    const selector = new CanvasBoardSelector();
    selector.mount();

    const access = selector as unknown as CanvasBoardSelectorAccess;
    const longTitle =
      'This is a very long canvas title that should stay on a single line and truncate in the canvas menu trigger';

    window.dispatchEvent(
      new CustomEvent('canvasTitleChanged', {
        detail: { title: longTitle },
      })
    );

    expect(access.titleWrap.style.maxWidth).toBe('min(44vw, 360px)');
    expect(access.titleText.className).toContain('min-w-0');
    expect(access.titleText.className).toContain('max-w-full');
    expect(access.titleText.className).toContain('flex-1');
    expect(access.titleText.style.flex).toBe('1 1 auto');
    expect(access.titleLabel.className).toContain('truncate');
    expect(access.titleLabel.className).toContain('min-w-0');
    expect(access.titleLabel.textContent).toBe(longTitle);
    expect(access.titleText.title).toBe(longTitle);
    expect(access.titleText.getAttribute('aria-label')).toBe(longTitle);

    selector.unmount();
  });
});
