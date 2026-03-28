import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import { CanvasClientStorage } from '../core/services/CanvasClientStorage.ts';
import { CanvasControls } from './CanvasControls.ts';
import { MiniMap } from './MiniMap.ts';
import { createSurface } from './primitives/index.ts';
import { applyCanvasHudCornerPosition } from './canvasHudLayout.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';

/**
 * Groups minimap and navigation controls into one right-bottom dock.
 */
export class CanvasNavigationDock {
  private readonly container: HTMLDivElement;
  private readonly miniMapSlot: HTMLDivElement;
  private readonly miniMap: MiniMap;
  private readonly canvasControls: CanvasControls;
  private miniMapVisible: boolean;
  private miniMapMounted = false;

  constructor(
    scene: Scene,
    canvasManager: CanvasManager,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.miniMapVisible = CanvasClientStorage.getMiniMapVisible(true);
    this.container = createSurface({
      className:
        'absolute z-20 flex w-fit min-w-fit flex-col items-end overflow-visible p-0',
    });
    applyCanvasHudCornerPosition(this.container, 'bottom-right');
    this.miniMapSlot = document.createElement('div');
    this.miniMapSlot.className = 'w-fit min-w-fit overflow-hidden rounded-t-2xl';

    this.miniMap = new MiniMap(scene, canvasManager, {
      embedded: true,
      surface: false,
      className: 'border-none',
    });
    this.canvasControls = new CanvasControls(canvasManager, scene, {
      runtime,
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
    this.canvasControls.mount(this.container);
    this.setMiniMapVisible(this.miniMapVisible);
  }

  public unmount(): void {
    this.canvasControls.unmount();
    this.unmountMiniMap();
    this.container.remove();
  }

  private setMiniMapVisible(visible: boolean): void {
    this.miniMapVisible = visible;
    CanvasClientStorage.setMiniMapVisible(visible);
    if (visible) {
      this.mountMiniMap();
    } else {
      this.unmountMiniMap();
    }
    const controlsEl = this.canvasControls.getElement();
    controlsEl.classList.toggle('border-t', visible);
    controlsEl.classList.toggle('border-slate-200/80', visible);
    this.canvasControls.setMiniMapVisible(visible);
  }

  private mountMiniMap(): void {
    if (this.miniMapMounted) return;
    this.miniMap.mount(this.miniMapSlot);
    this.miniMapMounted = true;
  }

  private unmountMiniMap(): void {
    if (!this.miniMapMounted) return;
    this.miniMap.unmount();
    this.miniMapMounted = false;
  }
}
