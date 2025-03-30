// core/shapes/Connection.ts
import { IDrawable } from '../interfaces/drawable';
import { IShape, ConnectionPoint } from '../interfaces/shape';
import { PanZoomManager } from '../../managers/PanZoomManager';

export default class Connection implements IDrawable {
  fromId: string;
  toId: string;

  constructor(fromId: string, toId: string) {
    this.fromId = fromId;
    this.toId = toId;
  }

  private getClosestConnectionPoints(
    from: IShape,
    to: IShape
  ): { start: ConnectionPoint; end: ConnectionPoint } {
    const fromPoints = from.getConnectionPoints();
    const toPoints = to.getConnectionPoints();

    let minDistance = Infinity;
    let bestStart: ConnectionPoint = fromPoints[0];
    let bestEnd: ConnectionPoint = toPoints[0];

    // Знаходимо пару точок з’єднання з мінімальною відстанню
    for (const start of fromPoints) {
      for (const end of toPoints) {
        const distance = Math.sqrt(
          (start.x - end.x) ** 2 + (start.y - end.y) ** 2
        );
        if (distance < minDistance) {
          minDistance = distance;
          bestStart = start;
          bestEnd = end;
        }
      }
    }

    return { start: bestStart, end: bestEnd };
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    from: IShape,
    to: IShape,
    panZoom: PanZoomManager
  ): void {
    const { start, end } = this.getClosestConnectionPoints(from, to);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 / panZoom.scale;
    ctx.stroke();
  }

  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    from: IShape,
    to: IShape,
    panZoom: PanZoomManager
  ): void {
    const { start, end } = this.getClosestConnectionPoints(from, to);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15 / panZoom.scale;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
  }

  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements: IShape[] = []
  ): void {
    const from = elements.find((el) => el.id === this.fromId);
    const to = elements.find((el) => el.id === this.toId);
    if (from && to) {
      this.drawLine(ctx, from, to, panZoom);
      this.drawArrowHead(ctx, from, to, panZoom);
    }
  }
}
