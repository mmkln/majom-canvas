// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  confirmRestoreCanvasDraftModal,
  formatCanvasDraftSavedAt,
} from './ConfirmRestoreCanvasDraftModal.ts';

describe('ConfirmRestoreCanvasDraftModal', () => {
  it('formats savedAt into a friendlier user-facing string', () => {
    const formatted = formatCanvasDraftSavedAt(
      '2026-04-05T15:00:02.468Z',
      'en-US'
    );

    expect(formatted).toContain('Apr 5, 2026');
    expect(formatted).not.toContain('2026-04-05T15:00:02.468Z');
  });

  it('renders the formatted savedAt note in the modal body', async () => {
    const promise = confirmRestoreCanvasDraftModal({
      savedAt: '2026-04-05T15:00:02.468Z',
    });

    const note = Array.from(document.querySelectorAll('p')).find((element) =>
      element.textContent?.includes('Unsaved changes were last saved on')
    );

    expect(note?.textContent).toContain('Apr 5, 2026');
    expect(note?.textContent).not.toContain('2026-04-05T15:00:02.468Z');

    const keepButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Keep current version')
    );
    keepButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await expect(promise).resolves.toBe('discard');
  });
});
