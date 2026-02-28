// ui/ZoomIndicator.ts
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { createSurface } from './primitives/index.ts';

type ZoomIndicatorOptions = {
  embedded?: boolean;
  surface?: boolean;
  className?: string;
};

export class ZoomIndicator {
  private readonly container: HTMLDivElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly canvasManager: CanvasManager;
  private unsubscribeZoomChange: (() => void) | null = null;

  constructor(canvasManager: CanvasManager, options: ZoomIndicatorOptions = {}) {
    this.canvasManager = canvasManager;
    const embedded = options.embedded ?? false;
    const useSurface = options.surface ?? true;
    const baseClass = embedded ? '' : 'absolute left-4 bottom-4 z-20';
    const defaultClass =
      'px-2.5 py-2 text-[0.95rem] font-semibold leading-none tracking-[0.02em] text-slate-900';
    const className = `${baseClass} ${options.className ?? defaultClass}`.trim();
    this.container = useSurface
      ? createSurface({ className })
      : document.createElement('div');
    if (!useSurface) {
      this.container.className = className;
    }
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
