// ui/ZoomIndicator.ts
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { createHudSurface } from './primitives/index.ts';

export class ZoomIndicator {
  private readonly container: HTMLDivElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly canvasManager: CanvasManager;
  private unsubscribeZoomChange: (() => void) | null = null;

  constructor(canvasManager: CanvasManager) {
    this.canvasManager = canvasManager;
    this.container = createHudSurface({
      className:
        'absolute left-4 bottom-4 z-20 px-3.5 py-2 text-[0.95rem] font-semibold leading-none tracking-[0.02em] text-slate-900',
    });
    this.valueEl = document.createElement('span');
    this.container.appendChild(this.valueEl);
    this.update();
    this.unsubscribeZoomChange = this.canvasManager.panZoom.onZoomChange(() =>
      this.update()
    );
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
  }

  public update() {
    const percent = Math.round(this.canvasManager.panZoom.scale * 100);
    this.valueEl.textContent = `${percent}%`;
  }

  public unmount() {
    this.unsubscribeZoomChange?.();
    this.unsubscribeZoomChange = null;
    this.container.remove();
  }
}
