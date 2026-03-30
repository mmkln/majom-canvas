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

    expect(access.titleLabel.textContent).toBe(longTitle);
    expect(access.titleText.title).toBe(longTitle);
    expect(access.titleText.getAttribute('aria-label')).toBe(longTitle);

    selector.unmount();
  });
});
