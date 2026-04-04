import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';

export type ConfirmRestoreCanvasDraftAction = 'restore' | 'discard';

type ConfirmRestoreCanvasDraftModalOptions = {
  savedAt?: string;
  hasCanvasMetaChanges?: boolean;
};

export function confirmRestoreCanvasDraftModal(
  options: ConfirmRestoreCanvasDraftModalOptions = {}
): Promise<ConfirmRestoreCanvasDraftAction> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: ConfirmRestoreCanvasDraftAction): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const close = (): void => {
      overlay.remove();
    };

    const { overlay, container, body, footer } = createModalShell(
      'Restore unsaved changes?',
      {
        onClose: () => {
          settle('discard');
          close();
        },
        intent: 'confirm',
        zIndex: 265,
      }
    );

    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-restore-canvas-draft-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent = options.hasCanvasMetaChanges
      ? 'We found unsaved changes from an earlier session, and this canvas metadata has changed since then. You can restore those changes or keep the current version.'
      : 'We found unsaved changes from an earlier session for this canvas. You can restore those changes or keep the current version.';
    body.appendChild(message);

    if (options.savedAt) {
      const note = document.createElement('p');
      note.className = 'mt-3 text-xs text-slate-500';
      note.textContent = `Local draft saved at ${options.savedAt}.`;
      body.appendChild(note);
    }

    const row = createModalActionRow({ variant: 'confirm' });

    const discardButton = createTextButton({
      text: 'Keep current version',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        settle('discard');
        close();
      },
    });
    row.appendChild(discardButton);

    const restoreButton = createTextButton({
      text: 'Restore changes',
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('wide'),
      onClick: () => {
        settle('restore');
        close();
      },
    });
    row.appendChild(restoreButton);

    footer.appendChild(row);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        settle('discard');
        close();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        settle('restore');
        close();
      }
    });
  });
}
