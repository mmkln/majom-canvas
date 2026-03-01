import {
  createModalActionRow,
  getModalActionButtonClass,
  createModalShell,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';

type ConfirmDeleteCanvasModalOptions = {
  canvasTitle?: string;
  isLastCanvas?: boolean;
};

export function confirmDeleteCanvasModal(
  options: ConfirmDeleteCanvasModalOptions = {}
): Promise<boolean> {
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
      'Delete canvas?',
      {
        onClose: () => {
          settle(false);
          close();
        },
        intent: 'confirm',
        zIndex: 260,
      }
    );

    const canvasLabel = options.canvasTitle?.trim() || 'this canvas';
    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-delete-canvas-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent = `Are you sure you want to delete "${canvasLabel}"? This action cannot be undone.`;
    body.appendChild(message);

    if (options.isLastCanvas) {
      const note = document.createElement('p');
      note.className =
        'mt-3 rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-700';
      note.textContent =
        'This is your last canvas. A new empty canvas will be created automatically.';
      body.appendChild(note);
    }

    const row = createModalActionRow({ variant: 'confirm' });

    const cancelButton = createTextButton({
      text: 'Cancel',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        settle(false);
        close();
      },
    });
    row.appendChild(cancelButton);

    const deleteButton = createTextButton({
      text: 'Delete',
      tone: 'destructive',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        settle(true);
        close();
      },
    });
    row.appendChild(deleteButton);

    footer.appendChild(row);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        settle(false);
        close();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        settle(true);
        close();
      }
    });
  });
}
