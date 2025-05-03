import { Command } from './Command.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import type { IViewState } from '../interfaces/interfaces.ts';

/**
 * Pan the canvas by a delta in x and y, supports undo/redo.
 */
export class PanCommand extends Command {
  private prevState!: IViewState;

  constructor(
    private canvasManager: CanvasManager,
    private dx: number,
    private dy: number
  ) {
    super();
  }

  public execute(): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    this.prevState = {
      scrollX: panZoom.scrollX,
      scrollY: panZoom.scrollY,
      scale: panZoom.scale,
    };
    panZoom.scrollX += this.dx;
    panZoom.scrollY += this.dy;
    panZoom.clampScroll();
    this.canvasManager.draw();
  }

  public undo(): void {
    this.canvasManager.getPanZoomManager().setViewState(this.prevState);
    this.canvasManager.draw();
  }
}
