import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { notify } from '../services/NotificationService.ts';
import { CanvasManager } from '../managers/CanvasManager.ts';
import type { PlanningElement } from '../../elements/PlanningElement.ts';

/**
 * Command to paste PlanningElements from clipboard into the scene.
 */
export class PasteCommand extends Command {
  private clones: PlanningElement[] = [];

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager
  ) {
    super();
  }

  execute(): void {
    let position = this.canvasManager.getLastMouseCoords();
    if (!position) {
      const canvas = this.canvasManager.getCanvas();
      const panZoom = this.canvasManager.getPanZoomManager();
      position = {
        x: (canvas.width / 2 + panZoom.scrollX) / panZoom.scale,
        y: (canvas.height / 2 + panZoom.scrollY) / panZoom.scale,
      };
    }
    this.clones = clipboardService.paste(this.scene, position);
    notify(`Pasted ${this.clones.length} items`, 'success');
  }

  undo(): void {
    this.clones.forEach((el) => this.scene.removeElement(el));
    notify(`Undid paste of ${this.clones.length} items`, 'info');
  }
}
