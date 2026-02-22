import { ComponentFactory } from '../ui-lib/src/index.ts';
import { ButtonVariant } from '../ui-lib/src/components/Button.js';
import { historyService } from '../core/services/HistoryService.ts';
import { Subscription } from 'rxjs';

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
    this.container.className = 'flex items-center gap-2';

    const buttonVariant: ButtonVariant = 'secondary';

    this.undoBtn = ComponentFactory.createButton({
      children: this.createUndoIcon(),
      variant: buttonVariant,
      size: 'icon-sm',
      onClick: () => historyService.undo(),
      tooltip: 'Undo',
    }).createElement() as HTMLButtonElement;
    this.undoBtn.setAttribute('aria-label', 'Undo');

    this.redoBtn = ComponentFactory.createButton({
      children: this.createRedoIcon(),
      variant: buttonVariant,
      size: 'icon-sm',
      onClick: () => historyService.redo(),
      tooltip: 'Redo',
    }).createElement() as HTMLButtonElement;
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

  private createUndoIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      'M7 6L3 10L7 14M3 10H11C14.314 10 17 12.686 17 16'
    );
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  private createRedoIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute(
      'd',
      'M13 6L17 10L13 14M17 10H9C5.686 10 3 12.686 3 16'
    );
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    return svg;
  }

  public unmount(): void {
    this.subscription.unsubscribe();
    this.container.remove();
  }
}
