import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../../../ui-lib/src/hud/index.ts';
import type { I18nService } from '../../../i18n/index.ts';

type ConfirmDeleteAccountModalOptions = {
  i18n?: Pick<I18nService, 't'>;
  accountLabel?: string;
};

export function confirmDeleteAccountModal(
  options: ConfirmDeleteAccountModalOptions = {}
): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const translate = (
      key:
        | 'profileSettings.delete.confirmTitle'
        | 'profileSettings.delete.confirmMessage'
        | 'common.cancel'
        | 'common.delete',
      params?: Record<string, string>
    ): string => {
      if (options.i18n) {
        return options.i18n.t(key, params);
      }
      switch (key) {
        case 'profileSettings.delete.confirmTitle':
          return 'Request account deletion?';
        case 'profileSettings.delete.confirmMessage':
          return `Are you sure you want to request deletion for "${params?.account ?? 'this account'}"?`;
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
      translate('profileSettings.delete.confirmTitle'),
      {
        onClose: () => {
          settle(false);
          close();
        },
        intent: 'confirm',
        zIndex: 290,
      }
    );

    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `confirm-delete-account-message-${Math.random().toString(36).slice(2, 9)}`;
    container.setAttribute('aria-describedby', message.id);
    message.textContent = translate('profileSettings.delete.confirmMessage', {
      account: options.accountLabel?.trim() || 'this account',
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
    row.append(cancelButton, deleteButton);
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
