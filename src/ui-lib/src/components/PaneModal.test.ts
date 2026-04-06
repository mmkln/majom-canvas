// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPaneModalShell } from './PaneModal.ts';

describe('PaneModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('creates a full-bleed split-pane shell without container padding', () => {
    const onClose = vi.fn();
    const { overlay, container, headerInner, actions, divider, body } =
      createPaneModalShell('Pane details', {
        onClose,
        subtitle: 'Structured modal content',
      });

    expect(container.getAttribute('data-component')).toBe('PaneModalContainer');
    expect(container.className).not.toContain('px-4');
    expect(container.className).not.toContain('px-6');
    expect(headerInner.className).toContain('px-4');
    expect(headerInner.className).toContain('md:px-6');
    expect(divider.className).toContain('border-t');
    expect(divider.className).not.toContain('my-4');
    expect(body.className).toContain('overflow-hidden');
    expect(container.querySelector('[data-component="ModalActionRow"]')).toBeNull();
    expect(actions.getAttribute('data-component')).toBe('PaneModalHeaderActions');

    const closeButton = actions.querySelector<HTMLButtonElement>(
      'button[aria-label="Close dialog"]'
    );
    expect(closeButton).not.toBeNull();

    closeButton?.click();
    expect(onClose).toHaveBeenCalledTimes(1);

    overlay.remove();
  });
});
