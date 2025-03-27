// managers/PanZoomManager.ts
export class PanZoomManager {
  scrollX: number = 0;
  scrollY: number = 0;
  scale: number = 1;
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
}
