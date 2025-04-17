// ui/UIManager.ts
import { CanvasControls } from './CanvasControls.ts';
import { ZoomIndicator } from './ZoomIndicator.ts';
import { CanvasToolbar } from './CanvasToolbar.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';

export class UIManager {
  private readonly components: { mount(parent?: HTMLElement): void; unmount(): void }[] = [];
  private readonly canvasToolbar: CanvasToolbar;
  private readonly canvasControls: CanvasControls;
  private readonly zoomIndicator: ZoomIndicator;

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene,
  ) {
    // Initialize Canvas Toolbar for creating elements
    this.canvasToolbar = new CanvasToolbar(this.scene, this.canvasManager);
    this.canvasControls = new CanvasControls(this.canvasManager);
    this.zoomIndicator = new ZoomIndicator(this.canvasManager);
    
    // Add controls to components that will be mounted
    this.components.push(this.canvasControls, this.zoomIndicator, this.canvasToolbar);
  }

  public mountAll(parent: HTMLElement = document.body): void {
    this.components.forEach(c => c.mount(parent));
  }

  public unmountAll(): void {
    this.components.forEach(c => c.unmount());
  }
}
