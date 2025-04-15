// managers/PanZoomManager.ts
export class PanZoomManager {
  scrollX: number = 0;
  scrollY: number = 0;
  scale: number = 1.4;
  // Virtual content dimensions (can be adjusted or passed in)
  virtualWidth: number = 3000;
  virtualHeight: number = 2000;
  scrollbarWidth: number = 6;

  constructor(private canvas: HTMLCanvasElement) {}

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

  // --- Canvas controls logic ---
  public zoomIn(canvas: HTMLCanvasElement): void {
    const maxScale = 3;
    this.scale = Math.min(this.scale * 1.15, maxScale);
    this.clampScroll();
    this.emitZoomChange();
  }
  public zoomOut(canvas: HTMLCanvasElement): void {
    const minScale = Math.max(
      (canvas.width - this.scrollbarWidth) / this.virtualWidth,
      (canvas.height - this.scrollbarWidth) / this.virtualHeight
    );
    this.scale = Math.max(this.scale / 1.15, minScale);
    this.clampScroll();
    this.emitZoomChange();
  }
  public center(canvas: HTMLCanvasElement): void {
    this.scale = 1;
    this.scrollX = (this.virtualWidth * this.scale - canvas.width) / 2;
    this.scrollY = (this.virtualHeight * this.scale - canvas.height) / 2;
    this.clampScroll();
    this.emitZoomChange();
  }
  // --- Event system ---
  private zoomListeners: (() => void)[] = [];
  public onZoomChange(listener: () => void) {
    this.zoomListeners.push(listener);
  }
  private emitZoomChange() {
    this.zoomListeners.forEach(l => l());
  }
}
