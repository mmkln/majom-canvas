// managers/CanvasRenderer.ts
export class CanvasRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private panZoom: any
  ) {}

  drawContent(): void {
    const ctx = this.ctx;
    // Example: draw a simple grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    // Use virtual dimensions from panZoom if available
    const virtualWidth = this.panZoom.virtualWidth;
    const virtualHeight = this.panZoom.virtualHeight;

    for (let x = 0; x < virtualWidth; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, virtualHeight);
      ctx.stroke();
    }
    for (let y = 0; y < virtualHeight; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(virtualWidth, y);
      ctx.stroke();
    }
  }
}
