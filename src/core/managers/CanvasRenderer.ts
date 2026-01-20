// managers/CanvasRenderer.ts
export class CanvasRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private panZoom: any
  ) {}

  drawContent(): void {
    const ctx = this.ctx;
    // Draw a subtle hex grid background
    const scale = this.panZoom.scale ?? 1;
    ctx.strokeStyle = 'rgba(221,221,221,0.15)';
    ctx.lineWidth = 1 / scale;

    const virtualWidth = this.panZoom.virtualWidth ?? 0;
    const virtualHeight = this.panZoom.virtualHeight ?? 0;
    const viewBounds = this.panZoom.viewBounds;

    const radius = 60;
    const hexHeight = Math.sqrt(3) * radius;
    const hexWidth = 2 * radius;
    const horiz = 1.5 * radius;
    const vert = hexHeight;

    const minX = viewBounds ? viewBounds.minX - hexWidth : 0;
    const minY = viewBounds ? viewBounds.minY - hexHeight : 0;
    const maxX = viewBounds ? viewBounds.maxX + hexWidth : virtualWidth;
    const maxY = viewBounds ? viewBounds.maxY + hexHeight : virtualHeight;

    const startX = Math.floor(minX / horiz) * horiz - horiz;
    const startY = Math.floor(minY / vert) * vert - vert;

    for (let x = startX; x <= maxX; x += horiz) {
      const columnIndex = Math.round(x / horiz);
      const offsetY = columnIndex % 2 === 0 ? 0 : vert / 2;
      for (let y = startY + offsetY; y <= maxY; y += vert) {
        this.drawHexagon(ctx, x, y, radius);
      }
    }
  }

  private drawHexagon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
  ): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
