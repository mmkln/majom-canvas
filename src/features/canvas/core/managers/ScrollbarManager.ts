// managers/ScrollbarManager.ts
import { PanZoomManager } from './PanZoomManager.ts';

export class ScrollbarManager {
  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private panZoom: PanZoomManager
  ) {}

  // Helper to draw a rounded rectangle
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawScrollbars(): void {
    const { canvas, panZoom, ctx } = this;
    const viewportWidth = canvas.width - panZoom.scrollbarWidth;
    const viewportHeight = canvas.height - panZoom.scrollbarWidth;
    const contentWidth = panZoom.virtualWidth * panZoom.scale;
    const contentHeight = panZoom.virtualHeight * panZoom.scale;

    // Horizontal scrollbar
    if (contentWidth > viewportWidth) {
      const scrollRatioX = viewportWidth / contentWidth;
      const thumbWidth = viewportWidth * scrollRatioX;
      const thumbX = (panZoom.scrollX / contentWidth) * viewportWidth;
      const trackY = canvas.height - panZoom.scrollbarWidth;

      ctx.fillStyle = '#5D5D5D80';
      ctx.strokeStyle = '#5D5D5D80';
      ctx.lineWidth = 1;
      this.drawRoundedRect(
        thumbX,
        trackY,
        thumbWidth,
        panZoom.scrollbarWidth,
        panZoom.scrollbarWidth / 2
      );
    }

    // Vertical scrollbar
    if (contentHeight > viewportHeight) {
      const scrollRatioY = viewportHeight / contentHeight;
      const thumbHeight = viewportHeight * scrollRatioY;
      const thumbY = (panZoom.scrollY / contentHeight) * viewportHeight;
      const trackX = canvas.width - panZoom.scrollbarWidth;

      ctx.fillStyle = '#5D5D5D80';
      ctx.strokeStyle = '#5D5D5D80';
      ctx.lineWidth = 1;
      this.drawRoundedRect(
        trackX,
        thumbY,
        panZoom.scrollbarWidth,
        thumbHeight,
        panZoom.scrollbarWidth / 2
      );
    }
  }

  hitTestScrollbars(x: number, y: number): 'horizontal' | 'vertical' | null {
    const { canvas, panZoom } = this;
    const viewportWidth = canvas.width - panZoom.scrollbarWidth;
    const viewportHeight = canvas.height - panZoom.scrollbarWidth;
    const contentWidth = panZoom.virtualWidth * panZoom.scale;
    const contentHeight = panZoom.virtualHeight * panZoom.scale;

    // Horizontal scrollbar hit test
    if (contentWidth > viewportWidth && y > viewportHeight) {
      const scrollRatioX = viewportWidth / contentWidth;
      const thumbWidth = viewportWidth * scrollRatioX;
      const thumbX = (panZoom.scrollX / contentWidth) * viewportWidth;
      if (x >= thumbX && x <= thumbX + thumbWidth) {
        return 'horizontal';
      }
    }

    // Vertical scrollbar hit test
    if (contentHeight > viewportHeight && x > viewportWidth) {
      const scrollRatioY = viewportHeight / contentHeight;
      const thumbHeight = viewportHeight * scrollRatioY;
      const thumbY = (panZoom.scrollY / contentHeight) * viewportHeight;
      if (y >= thumbY && y <= thumbY + thumbHeight) {
        return 'vertical';
      }
    }

    return null;
  }
}
