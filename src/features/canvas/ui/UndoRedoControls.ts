import { historyService } from '../core/services/HistoryService.ts';
import { Subscription } from 'rxjs';
import { createIconButton } from './primitives/index.ts';

/**
 * Inline Undo/Redo controls for top action bars.
 */
export class UndoRedoControls {
  public readonly container: HTMLDivElement;
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private subscription!: Subscription;

  constructor() {
    this.container = document.createElement('div');
    this.container.className =
      'inline-flex items-center gap-1 rounded-2xl border border-slate-200/85 bg-white/92 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.12)] backdrop-blur-sm';

    this.undoBtn = createIconButton({
      icon: 'arrow-ultum-left',
      size: 'md',
      title: 'Undo',
      ariaLabel: 'Undo',
      className:
        'h-9 w-9 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      onClick: () => historyService.undo(),
    });
    this.undoBtn.setAttribute('aria-label', 'Undo');

    const divider = document.createElement('span');
    divider.className = 'h-6 w-px bg-slate-200/90';
    divider.setAttribute('aria-hidden', 'true');

    this.redoBtn = createIconButton({
      icon: 'arrow-ultum-right',
      size: 'md',
      title: 'Redo',
      ariaLabel: 'Redo',
      className:
        'h-9 w-9 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      onClick: () => historyService.redo(),
    });
    this.redoBtn.setAttribute('aria-label', 'Redo');

    this.container.appendChild(this.undoBtn);
    this.container.appendChild(divider);
    this.container.appendChild(this.redoBtn);

    this.subscription = historyService.changes.subscribe(() =>
      this.updateButtons()
    );
    this.updateButtons();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  private updateButtons(): void {
    this.undoBtn.disabled = !historyService.canUndo();
    this.redoBtn.disabled = !historyService.canRedo();
  }

  public unmount(): void {
    this.subscription.unsubscribe();
    this.container.remove();
  }
}
