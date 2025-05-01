// ui/UndoRedoControls.ts
import { ComponentFactory } from '../ui-lib/src/index.ts';
import { ButtonVariant } from '../ui-lib/src/components/Button.js';
import { historyService } from '../core/services/HistoryService.ts';
import { Subscription } from 'rxjs';

/**
 * Undo/Redo controls positioned relative to toolbar
 */
export class UndoRedoControls {
  public readonly container: HTMLDivElement;
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private subscription!: Subscription;
  private toolbarContainer: HTMLElement;

  constructor(toolbarContainer: HTMLElement) {
    this.toolbarContainer = toolbarContainer;
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    // Initial styles; actual position set dynamically in mount()
    this.container.style.display = 'flex';
    this.container.style.gap = '6px';
    this.container.style.background = 'rgba(255,255,255,0.95)';
    this.container.style.borderRadius = '10px';
    this.container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
    this.container.style.padding = '6px';
    this.container.style.zIndex = '100';

    const buttonVariant: ButtonVariant = 'secondary';

    this.undoBtn = ComponentFactory.createButton({
      text: '↺', // mirror of redo icon
      variant: buttonVariant,
      size: 'icon-lg',
      onClick: () => historyService.undo(),
      tooltip: 'Undo',
    }).createElement() as HTMLButtonElement;

    // rotate undo icon 90° left
    this.undoBtn.style.transform = 'rotate(-90deg)';

    this.redoBtn = ComponentFactory.createButton({
      text: '↻',
      variant: buttonVariant,
      size: 'icon-lg',
      onClick: () => historyService.redo(),
      tooltip: 'Redo',
    }).createElement() as HTMLButtonElement;

    // rotate redo icon 90° right
    this.redoBtn.style.transform = 'rotate(90deg)';

    this.container.appendChild(this.undoBtn);
    this.container.appendChild(this.redoBtn);

    // subscribe to history changes to update button states
    this.subscription = historyService.changes.subscribe(() => this.updateButtons());
    this.updateButtons();
  }

  public mount(parent: HTMLElement = document.body): void {
    const rect = this.toolbarContainer.getBoundingClientRect();
    this.container.style.left = `${rect.right + 12}px`;
    this.container.style.top = `${rect.top}px`;
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
