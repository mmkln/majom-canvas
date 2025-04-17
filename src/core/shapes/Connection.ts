// core/shapes/Connection.ts
import { IShape, ConnectionPoint } from '../interfaces/shape.ts';
import { ConnectionLineType, IConnection } from '../interfaces/connection.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { v4 } from 'uuid';

export default class Connection implements IConnection {
  id: string;
  fromId: string;
  toId: string;
  selected: boolean = false;
  public lineType: ConnectionLineType = ConnectionLineType.SShaped;
  private tangentAngle: number = 0;

  constructor(fromId: string, toId: string, id: string = v4(), lineType?: ConnectionLineType) {
    this.fromId = fromId;
    this.toId = toId;
    this.id = id;
    if (lineType) {
      this.lineType = lineType;
    }
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

  private setStrokeProperties(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    ctx.strokeStyle = this.selected ? '#008dff' : '#000';
    ctx.lineWidth = 2 / panZoom.scale;
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

    if (this.lineType === ConnectionLineType.Straight) {
      ctx.lineTo(end.x, end.y);
      this.tangentAngle = Math.atan2(end.y - start.y, end.x - start.x);
    } else if (this.lineType === ConnectionLineType.SShaped) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = distance / 1.4; // change 1.4 if needed
      const startControl = this.getControlPoint(start, offset);
      const endControl = this.getControlPoint(end, offset);
      ctx.bezierCurveTo(
        startControl.x, startControl.y,
        endControl.x, endControl.y,
        end.x, end.y
      );
      this.tangentAngle = Math.atan2(end.y - endControl.y, end.x - endControl.x);
    }

    this.setStrokeProperties(ctx, panZoom);
    ctx.stroke();
  }

  private getControlPoint(point: ConnectionPoint, offset: number): { x: number; y: number } {
    switch (point.direction) {
      case 'left':
        return { x: point.x - offset, y: point.y };
      case 'right':
        return { x: point.x + offset, y: point.y };
      case 'top':
        return { x: point.x, y: point.y - offset };
      case 'bottom':
        return { x: point.x, y: point.y + offset };
      default:
        return { x: point.x, y: point.y };
    }
  }

  private drawArrowHead(
    ctx: CanvasRenderingContext2D,
    from: IShape,
    to: IShape,
    panZoom: PanZoomManager
  ): void {
    const { end } = this.getClosestConnectionPoints(from, to);
    const angle = this.tangentAngle;
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
    ctx.fillStyle = this.selected ? '#008dff' : '#000';
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

  private distanceToLineSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  public isNearPoint(px: number, py: number, elements: IShape[], tolerance: number = 5): boolean {
    const from = elements.find((el) => el.id === this.fromId);
    const to = elements.find((el) => el.id === this.toId);
    if (!from || !to) {
      return false;
    }

    const { start, end } = this.getClosestConnectionPoints(from, to);

    if (this.lineType === ConnectionLineType.Straight) {
      // Пряме з'єднання – використання існуючого методу для відрізка
      const distance = this.distanceToLineSegment(px, py, start.x, start.y, end.x, end.y);
      return distance <= tolerance;
    } else if (this.lineType === ConnectionLineType.SShaped) {
      // S-подібна крива – обчислюємо контрольні точки так само, як у drawLine
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = distance / 1.4; // такий же коефіцієнт, як і в drawLine

      // Використовуємо вже реалізований getControlPoint для обчислення контрольних точок
      const cp1 = this.getControlPoint(start, offset);
      const cp2 = this.getControlPoint(end, offset);

      // Апроксимуємо криву, вибираючи, наприклад, 20 точок
      const sampleCount = 20;
      const samples: { x: number; y: number }[] = [];
      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        const invT = 1 - t;
        const x = invT * invT * invT * start.x +
          3 * invT * invT * t * cp1.x +
          3 * invT * t * t * cp2.x +
          t * t * t * end.x;
        const y = invT * invT * invT * start.y +
          3 * invT * invT * t * cp1.y +
          3 * invT * t * t * cp2.y +
          t * t * t * end.y;
        samples.push({ x, y });
      }

      // Обчислюємо мінімальну відстань від заданої точки до всіх сегментів, що складають криву
      let minDistance = Infinity;
      for (let i = 0; i < samples.length - 1; i++) {
        const p1 = samples[i];
        const p2 = samples[i + 1];
        const d = this.distanceToLineSegment(px, py, p1.x, p1.y, p2.x, p2.y);
        if (d < minDistance) {
          minDistance = d;
        }
      }

      return minDistance <= tolerance;
    }

    return false;
  }

  public setLineType(type: ConnectionLineType): void {
    this.lineType = type;
  }
}
