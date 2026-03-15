import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../../../ui-lib/src/hud/index.ts';

type ConfirmDeleteRoutineModalOptions = {
  routineTitle?: string;
};

export function confirmDeleteRoutineModal(
  options: ConfirmDeleteRoutineModalOptions = {}
): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(true);
  }

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
      'Delete routine permanently?',
      {
        onClose: () => {
          settle(false);
          close();
        },
        intent: 'confirm',
        zIndex: 290,
      }
    );

    const routineLabel = options.routineTitle?.trim() || 'this routine';
    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-delete-routine-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent = `Are you sure you want to delete "${routineLabel}" permanently? This action cannot be undone.`;
    body.appendChild(message);

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
