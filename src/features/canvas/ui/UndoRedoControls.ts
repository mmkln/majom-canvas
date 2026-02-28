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
    this.container.className = 'flex items-center gap-2 px-0.5';

    this.undoBtn = createIconButton({
      icon: 'arrow-ultum-left',
      size: 'sm',
      title: 'Undo',
      ariaLabel: 'Undo',
      onClick: () => historyService.undo(),
    });
    this.undoBtn.setAttribute('aria-label', 'Undo');

    this.redoBtn = createIconButton({
      icon: 'arrow-ultum-right',
      size: 'sm',
      title: 'Redo',
      ariaLabel: 'Redo',
      onClick: () => historyService.redo(),
    });
    this.redoBtn.setAttribute('aria-label', 'Redo');

    this.container.appendChild(this.undoBtn);
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
