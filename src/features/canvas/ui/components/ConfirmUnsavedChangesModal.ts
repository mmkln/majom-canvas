import { createModalShell } from '../../../../ui-lib/src/components/Modal.ts';
import { createHudTextButton } from '../primitives/index.ts';

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

    const { overlay, container } = createModalShell('Discard unsaved changes?', {
      onClose: () => {
        settle(false);
        close();
      },
      zIndex: 270,
    });

    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.textContent =
      'You have unsaved changes. If you close now, your edits will be lost.';
    container.appendChild(message);

    const row = document.createElement('div');
    row.className = 'mt-4 flex justify-end gap-2';

    const keepEditingButton = createHudTextButton({
      text: 'Keep editing',
      tone: 'text',
      size: 'md',
      className: 'min-w-[108px] justify-center',
      onClick: () => {
        settle(false);
        close();
      },
    });
    row.appendChild(keepEditingButton);

    const discardButton = createHudTextButton({
      text: 'Discard',
      tone: 'destructive',
      size: 'md',
      className: 'min-w-[96px] justify-center',
      onClick: () => {
        settle(true);
        close();
      },
    });
    row.appendChild(discardButton);

    container.appendChild(row);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key !== 'Escape') return;
      event.preventDefault();
      settle(false);
      close();
    });
  });
}
