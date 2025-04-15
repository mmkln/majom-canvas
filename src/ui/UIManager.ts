// ui/UIManager.ts
import { CanvasControls } from './CanvasControls.ts';
import { ZoomIndicator } from './ZoomIndicator.ts';

export class UIManager {
  private readonly components: { mount(parent?: HTMLElement): void; unmount(): void }[] = [];

  constructor(
    private readonly canvasControls: CanvasControls,
    private readonly zoomIndicator: ZoomIndicator,
  ) {
    this.components.push(canvasControls, zoomIndicator);
  }

  public mountAll(parent: HTMLElement = document.body) {
    this.components.forEach(c => c.mount(parent));
  }

  public unmountAll() {
    this.components.forEach(c => c.unmount());
  }
}
