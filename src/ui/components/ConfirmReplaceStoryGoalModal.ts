import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.ts';

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
    message.className = 'text-sm text-gray-700 leading-relaxed';
    message.textContent = `"${storyLabel}" is already linked to another goal. Do you want to replace it with the new goal?`;
    container.appendChild(message);

    const row = document.createElement('div');
    row.className = 'flex justify-end gap-2 pt-2';

    ComponentFactory.createButton({
      text: 'Cancel',
      variant: 'outline',
      onClick: () => {
        settle(false);
        close();
      },
    }).render(row);

    ComponentFactory.createButton({
      text: 'Replace',
      variant: 'default',
      onClick: () => {
        settle(true);
        close();
      },
    }).render(row);

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

