import { createModalShell } from '../../../../ui-lib/src/components/Modal.ts';
import { createTextButton } from '../primitives/index.ts';

type ConfirmReplaceStoryGoalModalOptions = {
  storyTitle?: string;
};

export function confirmReplaceStoryGoalModal(
  options: ConfirmReplaceStoryGoalModalOptions = {}
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

    const { overlay, container } = createModalShell('Replace goal link?', {
      onClose: () => {
        settle(false);
        close();
      },
      zIndex: 260,
    });

    const storyLabel = options.storyTitle?.trim() || 'This story';
    const message = document.createElement('p');
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.textContent = `"${storyLabel}" is already linked to another goal. Do you want to replace it with the new goal?`;
    container.appendChild(message);

    const row = document.createElement('div');
    row.className = 'mt-4 flex justify-end gap-2';

    const cancelButton = createTextButton({
      text: 'Cancel',
      tone: 'text',
      size: 'md',
      className: 'min-w-[84px] justify-center',
      onClick: () => {
        settle(false);
        close();
      },
    });
    row.appendChild(cancelButton);

    const replaceButton = createTextButton({
      text: 'Replace',
      tone: 'primary',
      size: 'md',
      className: 'min-w-[84px] justify-center',
      onClick: () => {
        settle(true);
        close();
      },
    });
    row.appendChild(replaceButton);

    container.appendChild(row);

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
