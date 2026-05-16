// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { renderInlineComposer } from './renderInlineComposer.ts';

const classNames = {
  root: 'inline-composer',
  collapsedButton: 'inline-composer-collapsed',
  expandedForm: 'inline-composer-expanded',
  textarea: 'inline-composer-textarea',
  actions: 'inline-composer-actions',
  submitButton: 'inline-composer-submit',
  cancelButton: 'inline-composer-cancel',
};

describe('renderInlineComposer', () => {
  it('renders collapsed state and emits expand intent', () => {
    const onExpand = vi.fn();
    const { element } = renderInlineComposer({
      expanded: false,
      collapsedLabel: 'Add card',
      submitLabel: 'Add card',
      cancelLabel: 'Cancel',
      placeholder: 'Enter title',
      ariaLabel: 'Card title',
      classNames,
      onExpand,
    });

    const button = element.querySelector<HTMLButtonElement>('button');
    expect(button?.textContent).toBe('Add card');

    button?.click();

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('submits textarea value from form and Enter key', () => {
    const onSubmit = vi.fn();
    const { element, textarea } = renderInlineComposer({
      expanded: true,
      collapsedLabel: 'Add card',
      submitLabel: 'Save',
      cancelLabel: 'Cancel',
      placeholder: 'Enter title',
      ariaLabel: 'Card title',
      classNames,
      onSubmit,
    });

    expect(textarea).not.toBeNull();
    textarea!.value = 'Task one';

    element.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    textarea!.value = 'Task two';
    textarea!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
    );

    expect(onSubmit).toHaveBeenNthCalledWith(1, 'Task one', textarea);
    expect(onSubmit).toHaveBeenNthCalledWith(2, 'Task two', textarea);
  });
});
