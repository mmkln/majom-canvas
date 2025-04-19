import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { notify } from '../services/NotificationService.ts';

/**
 * Command to cut (copy + delete) PlanningElements: supports undo/redo.
 */
export class CutCommand extends Command {
  private scene: Scene;
  private elements: PlanningElement[] = [];

  constructor(scene: Scene) {
    super();
    this.scene = scene;
  }

  execute(): void {
    const selection = this.scene.getSelectedElements()
      .filter((el): el is PlanningElement => el instanceof PlanningElement);
    this.elements = selection;
    // copy to clipboard, then remove from scene
    clipboardService.copy(this.elements);
    this.scene.removeElements(this.elements);
    notify(`Cut ${this.elements.length} items`, 'info');
  }

  undo(): void {
    // re-add cut elements
    this.elements.forEach(el => this.scene.addElement(el));
    notify(`Restored ${this.elements.length} items`, 'success');
  }
}
