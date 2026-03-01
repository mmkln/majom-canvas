import {
  createModalActionRow,
  getModalActionButtonClass,
  createModalShell,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';

export function confirmUnsavedChangesModal(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean): void => {
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
          settle(false);
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

    const keepEditingButton = createTextButton({
      text: 'Keep editing',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('wide'),
      onClick: () => {
        settle(false);
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
        settle(true);
        close();
      },
    });
    row.appendChild(discardButton);

    footer.appendChild(row);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key !== 'Escape') return;
      event.preventDefault();
      settle(false);
      close();
    });
  });
}
