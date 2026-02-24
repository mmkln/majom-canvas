import { createModalShell } from '../../ui-lib/src/components/Modal.ts';
import { createHudTextButton } from '../primitives/index.ts';

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
    message.className = 'text-sm leading-relaxed text-slate-600';
    message.textContent = `Are you sure you want to delete "${canvasLabel}"? This action cannot be undone.`;
    container.appendChild(message);

    if (options.isLastCanvas) {
      const note = document.createElement('p');
      note.className =
        'mt-3 rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-700';
      note.textContent =
        'This is your last canvas. A new empty canvas will be created automatically.';
      container.appendChild(note);
    }

    const row = document.createElement('div');
    row.className = 'mt-4 flex justify-end gap-2';

    const cancelButton = createHudTextButton({
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

    const deleteButton = createHudTextButton({
      text: 'Delete',
      tone: 'destructive',
      size: 'md',
      className: 'min-w-[84px] justify-center',
      onClick: () => {
        settle(true);
        close();
      },
    });
    row.appendChild(deleteButton);

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
