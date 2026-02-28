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
  private readonly miniMapSlot: HTMLDivElement;
  private readonly miniMap: MiniMap;
  private readonly canvasControls: CanvasControls;
  private miniMapVisible = true;

  constructor(scene: Scene, canvasManager: CanvasManager) {
    this.container = createHudSurface({
      className:
        'absolute right-4 bottom-4 z-20 flex flex-col overflow-hidden p-0',
    });
    this.miniMapSlot = document.createElement('div');
    this.miniMapSlot.className = 'w-full';

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
      miniMapToggle: {
        initialVisible: this.miniMapVisible,
        onToggle: (visible) => this.setMiniMapVisible(visible),
      },
    });
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.container.appendChild(this.miniMapSlot);
    this.miniMap.mount(this.miniMapSlot);
    this.canvasControls.mount(this.container);
    this.setMiniMapVisible(this.miniMapVisible);
  }

  public unmount(): void {
    this.canvasControls.unmount();
    this.miniMap.unmount();
    this.container.remove();
  }

  private setMiniMapVisible(visible: boolean): void {
    this.miniMapVisible = visible;
    this.miniMapSlot.style.display = visible ? '' : 'none';
    const controlsEl = this.canvasControls.getElement();
    controlsEl.classList.toggle('border-t', visible);
    controlsEl.classList.toggle('border-slate-200/80', visible);
    this.canvasControls.setMiniMapVisible(visible);
  }
}
