import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { notify } from '../services/NotificationService.ts';

/**
 * Command to copy selected PlanningElements to clipboard.
 */
export class CopyCommand extends Command {
  private elements: PlanningElement[] = [];

  constructor(private scene: Scene) { super(); }

  execute(): void {
    const selection = this.scene.getSelectedElements()
      .filter((el): el is PlanningElement => el instanceof PlanningElement);
    this.elements = selection;
    clipboardService.copy(this.elements);
    notify(`Copied ${this.elements.length} items`, 'info');
  }

  undo(): void {
    clipboardService.clear();
    notify(`Clipboard cleared`, 'info');
  }
}
