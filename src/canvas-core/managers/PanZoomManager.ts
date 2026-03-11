import { Subject } from 'rxjs';
import type { IViewState } from '../interfaces/viewState.ts';

export type RenderFlags = {
  showDetails: boolean;
  showText: boolean;
  showAnim: boolean;
};

export type PanZoomOptions = {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  virtualWidth?: number;
  virtualHeight?: number;
  scrollbarWidth?: number;
};

/**
 * Owns viewport transform (scroll + scale) and emits view updates.
 */
export class PanZoomManager {
  public scrollX = 0;
  public scrollY = 0;
  public scale: number;
  public virtualWidth: number;
  public virtualHeight: number;
  public scrollbarWidth: number;
  public timeMs = 0;
  public viewBounds:
    | {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
      }
    | null = null;
  public renderFlags: RenderFlags | null = null;
  public readonly viewChanges = new Subject<IViewState>();

  private readonly minScaleFromOptions: number | null;
  private readonly maxScale: number;
  private readonly zoomStep: number;
  private readonly zoomListeners = new Set<() => void>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: PanZoomOptions = {}
  ) {
    this.virtualWidth = options.virtualWidth ?? 40000;
    this.virtualHeight = options.virtualHeight ?? 24000;
    this.scrollbarWidth = options.scrollbarWidth ?? 6;
    this.minScaleFromOptions = options.minScale ?? null;
    this.maxScale = options.maxScale ?? 3;
    this.zoomStep = options.zoomStep ?? 1.15;
    this.scale = options.initialScale ?? Math.min(1.25, this.resolveMinScale());
    this.clampScroll();
  }

  /**
   * Clamps scroll offsets to the configured virtual space.
   */
  public clampScroll(): void {
    const viewportWidth = this.canvas.width - this.scrollbarWidth;
    const viewportHeight = this.canvas.height - this.scrollbarWidth;
    const maxScrollX = Math.max(
      0,
      this.virtualWidth * this.scale - viewportWidth
    );
    const maxScrollY = Math.max(
      0,
      this.virtualHeight * this.scale - viewportHeight
    );
    this.scrollX = Math.min(Math.max(0, this.scrollX), maxScrollX);
    this.scrollY = Math.min(Math.max(0, this.scrollY), maxScrollY);
  }

  /**
   * Sets viewport scroll and emits view change.
   */
  public setScroll(scrollX: number, scrollY: number): void {
    this.scrollX = scrollX;
    this.scrollY = scrollY;
    this.clampScroll();
    this.emitViewChange();
  }

  /**
   * Sets scale around a fixed screen-space pivot point.
   */
  public setScaleAtPoint(nextScale: number, pointX: number, pointY: number): void {
    const oldScale = this.scale;
    const normalizedScale = Math.min(
      Math.max(nextScale, this.resolveMinScale()),
      this.maxScale
    );
    const contentX = (pointX + this.scrollX) / oldScale;
    const contentY = (pointY + this.scrollY) / oldScale;
    this.scale = normalizedScale;
    this.scrollX = contentX * normalizedScale - pointX;
    this.scrollY = contentY * normalizedScale - pointY;
    this.clampScroll();
    this.emitViewChange();
  }

  /**
   * Zooms in around provided viewport center.
   */
  public zoomIn(centerX: number = this.canvas.width / 2, centerY?: number): void {
    const y = centerY ?? this.canvas.height / 2;
    this.setScaleAtPoint(this.scale * this.zoomStep, centerX, y);
  }

  /**
   * Zooms out around provided viewport center.
   */
  public zoomOut(centerX: number = this.canvas.width / 2, centerY?: number): void {
    const y = centerY ?? this.canvas.height / 2;
    this.setScaleAtPoint(this.scale / this.zoomStep, centerX, y);
  }

  /**
   * Recenters viewport in virtual space and normalizes scale.
   */
  public center(): void {
    this.scale = Math.max(1, this.resolveMinScale());
    this.scrollX = (this.virtualWidth * this.scale - this.canvas.width) / 2;
    this.scrollY = (this.virtualHeight * this.scale - this.canvas.height) / 2;
    this.clampScroll();
    this.emitViewChange();
  }

  /**
   * Applies wheel gesture as either zoom (ctrl/meta) or pan.
   */
  public handleWheelEvent(e: WheelEvent, mouseX: number, mouseY: number): void {
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = Math.pow(1.005, -e.deltaY);
      this.setScaleAtPoint(this.scale * zoomFactor, mouseX, mouseY);
      return;
    }

    this.scrollX += e.deltaX;
    this.scrollY += e.deltaY;
    this.clampScroll();
    this.emitViewChange();
  }

  /**
   * Replaces current viewport transform with provided view state.
   */
  public setViewState(state: IViewState): void {
    this.scrollX = state.scrollX;
    this.scrollY = state.scrollY;
    this.scale = Math.min(
      Math.max(state.scale, this.resolveMinScale()),
      this.maxScale
    );
    this.clampScroll();
    this.emitViewChange();
  }

  /**
   * Returns current viewport transform snapshot.
   */
  public getViewState(): IViewState {
    return {
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      scale: this.scale,
    };
  }

  /**
   * Subscribes to zoom/view updates. Returns unsubscribe callback.
   */
  public onZoomChange(listener: () => void): () => void {
    this.zoomListeners.add(listener);
    return () => {
      this.zoomListeners.delete(listener);
    };
  }

  /**
   * Updates size of virtual scene space.
   */
  public setVirtualSpace(width: number, height: number): void {
    this.virtualWidth = width;
    this.virtualHeight = height;
    this.clampScroll();
    this.emitViewChange();
  }

  private resolveMinScale(): number {
    if (this.minScaleFromOptions !== null) {
      return this.minScaleFromOptions;
    }
    const viewportWidth = this.canvas.width - this.scrollbarWidth;
    const viewportHeight = this.canvas.height - this.scrollbarWidth;
    return Math.max(
      viewportWidth / this.virtualWidth,
      viewportHeight / this.virtualHeight
    );
  }

  private emitViewChange(): void {
    this.zoomListeners.forEach((listener) => listener());
    this.viewChanges.next(this.getViewState());
  }
}
