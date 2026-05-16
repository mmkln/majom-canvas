import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../../../ui-lib/src/hud/index.ts';

export type ConfirmUnsavedTaskChangesAction =
  | 'keep-editing'
  | 'discard'
  | 'save-and-close';

export type ConfirmUnsavedTaskChangesLabels = {
  title: string;
  message: string;
  keepEditing: string;
  discard: string;
  saveChanges: string;
};

const DEFAULT_LABELS: ConfirmUnsavedTaskChangesLabels = {
  title: 'Discard unsaved changes?',
  message: 'You have unsaved changes. If you close now, your edits will be lost.',
  keepEditing: 'Keep editing',
  discard: 'Discard',
  saveChanges: 'Save changes',
};

export function confirmUnsavedTaskChangesModal(
  labels: Partial<ConfirmUnsavedTaskChangesLabels> = {}
): Promise<ConfirmUnsavedTaskChangesAction> {
  const copy = { ...DEFAULT_LABELS, ...labels };
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: ConfirmUnsavedTaskChangesAction): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const { overlay, container, body, footer } = createModalShell(copy.title, {
      onClose: () => {
        settle('keep-editing');
        overlay.remove();
      },
      intent: 'confirm',
      zIndex: 280,
    });

    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.id = `task-unsaved-message-${Math.random().toString(36).slice(2, 9)}`;
    message.textContent = copy.message;
    container.setAttribute('aria-describedby', message.id);
    body.appendChild(message);

    const row = createModalActionRow({ variant: 'confirm' });
    row.append(
      createTextButton({
        text: copy.saveChanges,
        tone: 'secondary',
        size: 'md',
        className: `${getModalActionButtonClass('default')} md:mr-auto`,
        onClick: () => {
          settle('save-and-close');
          overlay.remove();
        },
      }),
      createTextButton({
        text: copy.keepEditing,
        tone: 'text',
        size: 'md',
        className: getModalActionButtonClass('wide'),
        onClick: () => {
          settle('keep-editing');
          overlay.remove();
        },
      }),
      createTextButton({
        text: copy.discard,
        tone: 'destructive',
        size: 'md',
        className: getModalActionButtonClass('medium'),
        onClick: () => {
          settle('discard');
          overlay.remove();
        },
      })
    );
    footer.appendChild(row);
  });
}
