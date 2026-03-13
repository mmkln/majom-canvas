import {
  createModalActionRow,
  getModalActionButtonClass,
  createModalShell,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';

export type ConfirmUnsavedChangesAction =
  | 'keep-editing'
  | 'discard'
  | 'save-and-close';

export function confirmUnsavedChangesModal(): Promise<ConfirmUnsavedChangesAction> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: ConfirmUnsavedChangesAction): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const close = (): void => {
      overlay.remove();
    };

    const { overlay, container, body, footer } = createModalShell(
      'Discard unsaved changes?',
      {
        onClose: () => {
          settle('keep-editing');
          close();
        },
        intent: 'confirm',
        zIndex: 270,
      }
    );

    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-unsaved-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent =
      'You have unsaved changes. If you close now, your edits will be lost.';
    body.appendChild(message);

    const row = createModalActionRow({ variant: 'confirm' });

    const saveAndCloseButton = createTextButton({
      text: 'Save changes',
      tone: 'secondary',
      size: 'md',
      className: `${getModalActionButtonClass('default')} md:mr-auto`,
      onClick: () => {
        settle('save-and-close');
        close();
      },
    });
    row.appendChild(saveAndCloseButton);

    const keepEditingButton = createTextButton({
      text: 'Keep editing',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('wide'),
      onClick: () => {
        settle('keep-editing');
        close();
      },
    });
    row.appendChild(keepEditingButton);

    const discardButton = createTextButton({
      text: 'Discard',
      tone: 'destructive',
      size: 'md',
      className: getModalActionButtonClass('medium'),
      onClick: () => {
        settle('discard');
        close();
      },
    });
    row.appendChild(discardButton);

    footer.appendChild(row);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key !== 'Escape') return;
      event.preventDefault();
      settle('keep-editing');
      close();
    });
  });
}
