import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { notify } from '../services/NotificationService.ts';

/**
 * Command to copy selected PlanningElements to clipboard.
 */
export class CopyCommand extends Command {
  private elements: PlanningElement[] = [];

  constructor(
    private scene: Scene,
    private sourceElements?: ICanvasElement[]
  ) {
    super();
  }

  execute(): void {
    const candidates = this.sourceElements ?? this.scene.getSelectedElements();
    this.elements = candidates.filter(
      (el): el is PlanningElement => el instanceof PlanningElement
    );
    clipboardService.copy(this.elements);
    notify(`Copied ${this.elements.length} items`, 'info');
  }

  undo(): void {
    clipboardService.clear();
    notify(`Clipboard cleared`, 'info');
  }
}
