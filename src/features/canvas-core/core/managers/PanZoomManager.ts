// managers/PanZoomManager.ts
import { Subject } from 'rxjs';
import type { IViewState } from '../interfaces/interfaces.ts';

export type RenderFlags = {
  showDetails: boolean;
  showTaskText: boolean;
  showStoryText: boolean;
  showGoalText: boolean;
  showAnim: boolean;
  connectionAnimDetail?: 'full' | 'reduced';
  statusAnimDetail?: 'full' | 'reduced';
};

export class PanZoomManager {
  scrollX: number = 0;
  scrollY: number = 0;
  scale: number = 1.25;
  // Virtual content dimensions (can be adjusted or passed in)
  virtualWidth: number = 40000;
  virtualHeight: number = 24000;
  scrollbarWidth: number = 6;
  /** Shared frame time for animation syncing */
  timeMs: number = 0;
  /** Current view bounds in scene coordinates */
  viewBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null = null;
  /** Render feature flags for LOD */
  renderFlags: RenderFlags | null = null;

  /** Emits on any view (scroll/zoom) change */
  public viewChanges: Subject<IViewState> = new Subject<IViewState>();

  constructor(private canvas: HTMLCanvasElement) {}

  public getMinScale(canvas: HTMLCanvasElement = this.canvas): number {
    const viewportWidth = canvas.width - this.scrollbarWidth;
    const viewportHeight = canvas.height - this.scrollbarWidth;
    return Math.max(
      viewportWidth / this.virtualWidth,
      viewportHeight / this.virtualHeight
    );
  }

  public getMaxScale(): number {
    return 1.25;
  }

  clampScroll(): void {
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

  public setScroll(scrollX: number, scrollY: number): void {
    this.scrollX = scrollX;
    this.scrollY = scrollY;
    this.clampScroll();
    this.emitZoomChange();
  }

  public setScale(
    canvas: HTMLCanvasElement,
    nextScale: number,
    anchorX: number = canvas.width / 2,
    anchorY: number = canvas.height / 2
  ): void {
    const oldScale = this.scale || 1;
    const contentX = (anchorX + this.scrollX) / oldScale;
    const contentY = (anchorY + this.scrollY) / oldScale;
    const minScale = this.getMinScale(canvas);
    const maxScale = this.getMaxScale();
    const clampedScale = Math.min(Math.max(nextScale, minScale), maxScale);
    this.scale = clampedScale;
    this.scrollX = contentX * clampedScale - anchorX;
    this.scrollY = contentY * clampedScale - anchorY;
    this.clampScroll();
    this.emitZoomChange();
  }

  // --- Canvas controls logic ---
  public zoomIn(canvas: HTMLCanvasElement): void {
    this.setScale(
      canvas,
      this.scale * 1.15,
      canvas.width / 2,
      canvas.height / 2
    );
  }

  public zoomOut(canvas: HTMLCanvasElement): void {
    this.setScale(
      canvas,
      this.scale / 1.15,
      canvas.width / 2,
      canvas.height / 2
    );
  }

  public center(canvas: HTMLCanvasElement): void {
    this.scale = 1;
    this.scrollX = (this.virtualWidth * this.scale - canvas.width) / 2;
    this.scrollY = (this.virtualHeight * this.scale - canvas.height) / 2;
    this.clampScroll();
    this.emitZoomChange();
  }

  /**
   * Handle wheel event for zooming and panning, then notify listeners
   */
  public handleWheelEvent(
    e: WheelEvent,
    canvas: HTMLCanvasElement,
    mouseX: number,
    mouseY: number
  ): void {
    if (e.ctrlKey || e.metaKey) {
      // increase zoom speed for touchpad zoom
      const zoomFactor = Math.pow(1.005, -e.deltaY);
      this.setScale(canvas, this.scale * zoomFactor, mouseX, mouseY);
      return;
    } else {
      this.scrollX += e.deltaX;
      this.scrollY += e.deltaY;
    }
    this.clampScroll();
    this.emitZoomChange();
  }

  // --- Event system ---
  private zoomListeners = new Set<() => void>();

  public onZoomChange(listener: () => void): () => void {
    this.zoomListeners.add(listener);
    return () => {
      this.zoomListeners.delete(listener);
    };
  }

  private emitZoomChange() {
    this.zoomListeners.forEach((l) => l());
    // emit unified view change event
    this.viewChanges.next({
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      scale: this.scale,
    });
  }

  /**
   * Restore scroll & zoom state and notify listeners
   */
  public setViewState(state: IViewState): void {
    this.scrollX = state.scrollX;
    this.scrollY = state.scrollY;
    this.scale = state.scale;
    this.clampScroll();
    this.emitZoomChange();
  }
}
