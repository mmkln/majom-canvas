import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../../../ui-lib/src/hud/index.ts';
import type { I18nService } from '../../../i18n/index.ts';

type ConfirmDeleteNoteModalOptions = {
  noteTitle?: string;
  i18n?: Pick<I18nService, 't'>;
};

export function confirmDeleteNoteModal(
  options: ConfirmDeleteNoteModalOptions = {}
): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const translate = (
      key:
        | 'notes.delete.confirmTitle'
        | 'notes.delete.confirmMessage'
        | 'common.cancel'
        | 'common.delete',
      params?: Record<string, string>
    ): string => {
      if (options.i18n) {
        return options.i18n.t(key, params);
      }
      switch (key) {
        case 'notes.delete.confirmTitle':
          return 'Delete note permanently?';
        case 'notes.delete.confirmMessage':
          return `Are you sure you want to delete "${params?.note ?? 'this note'}" permanently? This action cannot be undone.`;
        case 'common.cancel':
          return 'Cancel';
        case 'common.delete':
          return 'Delete';
      }
    };

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
      translate('notes.delete.confirmTitle'),
      {
        onClose: () => {
          settle(false);
          close();
        },
        intent: 'confirm',
        zIndex: 290,
      }
    );

    const noteLabel = options.noteTitle?.trim() || 'this note';
    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-delete-note-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent = translate('notes.delete.confirmMessage', {
      note: noteLabel,
    });
    body.appendChild(message);

    const row = createModalActionRow({ variant: 'confirm' });
    const cancelButton = createTextButton({
      text: translate('common.cancel'),
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
      text: translate('common.delete'),
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
