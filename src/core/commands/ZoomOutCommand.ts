import { Command } from './Command.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import type { IViewState } from '../interfaces/interfaces.ts';

export class ZoomOutCommand extends Command {
  private prevState!: IViewState;

  constructor(private canvasManager: CanvasManager) {
    super();
  }

  public execute(): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    this.prevState = { scrollX: panZoom.scrollX, scrollY: panZoom.scrollY, scale: panZoom.scale };
    this.canvasManager.zoomOut();
  }

  public undo(): void {
    this.canvasManager.getPanZoomManager().setViewState(this.prevState);
    this.canvasManager.draw();
  }
}
