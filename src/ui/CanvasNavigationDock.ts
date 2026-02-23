import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import { CanvasControls } from './CanvasControls.ts';
import { MiniMap } from './MiniMap.ts';
import { createHudSurface } from './primitives/index.ts';

/**
 * Groups minimap and navigation controls into one right-bottom dock.
 */
export class CanvasNavigationDock {
  private readonly container: HTMLDivElement;
  private readonly miniMap: MiniMap;
  private readonly canvasControls: CanvasControls;

  constructor(scene: Scene, canvasManager: CanvasManager) {
    this.container = createHudSurface({
      className:
        'absolute right-4 bottom-4 z-20 flex flex-col overflow-hidden p-0',
    });

    this.miniMap = new MiniMap(scene, canvasManager, {
      embedded: true,
      surface: false,
      className: 'border-none',
    });
    this.canvasControls = new CanvasControls(canvasManager, scene, {
      embedded: true,
      orientation: 'horizontal',
      surface: false,
      showZoomIndicator: true,
      className: 'border-t border-slate-200/80',
    });
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.miniMap.mount(this.container);
    this.canvasControls.mount(this.container);
  }

  public unmount(): void {
    this.canvasControls.unmount();
    this.miniMap.unmount();
    this.container.remove();
  }
}
