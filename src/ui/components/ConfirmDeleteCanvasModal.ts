import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.ts';

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

    const { overlay, container } = createModalShell('Delete canvas?', {
      onClose: () => {
        settle(false);
        close();
      },
      zIndex: 260,
    });

    const canvasLabel = options.canvasTitle?.trim() || 'this canvas';
    const message = document.createElement('p');
    message.className = 'text-sm text-gray-700 leading-relaxed';
    message.textContent = `Are you sure you want to delete "${canvasLabel}"? This action cannot be undone.`;
    container.appendChild(message);

    if (options.isLastCanvas) {
      const note = document.createElement('p');
      note.className = 'rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700';
      note.textContent =
        'This is your last canvas. A new empty canvas will be created automatically.';
      container.appendChild(note);
    }

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
      text: 'Delete',
      variant: 'default',
      className: 'border-rose-600 bg-rose-600 hover:border-rose-700 hover:bg-rose-700',
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
      }
    });
  });
}
