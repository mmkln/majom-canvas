// core/shapes/Connection.ts
import { ConnectionPoint } from '../interfaces/shape.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
  IConnection,
} from '../interfaces/connection.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { v4 } from 'uuid';
import { connectionRenderer } from '../utils/ConnectionRenderer.ts';

export default class Connection implements IConnection {
  id: string;
  fromId: string;
  toId: string;
  selected: boolean = false;
  public lineType: ConnectionLineType = ConnectionLineType.SShaped;
  public relationType: ConnectionRelationType =
    ConnectionRelationType.RelatesTo;
  public zIndex: number = 1;
  private tangentAngle: number = 0;

  constructor(
    fromId: string,
    toId: string,
    id: string = v4(),
    lineType?: ConnectionLineType,
    relationType?: ConnectionRelationType
  ) {
    this.fromId = fromId;
    this.toId = toId;
    this.id = id;
    if (lineType) {
      this.lineType = lineType;
    }
    if (relationType) {
      this.relationType = relationType;
    }
  }

  public getClosestConnectionPoints(
    from: IConnectable,
    to: IConnectable
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

  public getCurvePoints(
    from: IConnectable,
    to: IConnectable
  ): {
    start: ConnectionPoint;
    end: ConnectionPoint;
    cp1: { x: number; y: number };
    cp2: { x: number; y: number };
    isBezier: boolean;
  } {
    const { start, end } = this.getClosestConnectionPoints(from, to);
    if (this.lineType === ConnectionLineType.Straight) {
      return {
        start,
        end,
        cp1: { x: start.x, y: start.y },
        cp2: { x: end.x, y: end.y },
        isBezier: false,
      };
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = distance / 1.4; // change 1.4 if needed
    const cp1 = this.getControlPoint(start, offset);
    const cp2 = this.getControlPoint(end, offset);
    return { start, end, cp1, cp2, isBezier: true };
  }

  public buildPath(
    ctx: CanvasRenderingContext2D,
    curve: {
      start: ConnectionPoint;
      end: ConnectionPoint;
      cp1: { x: number; y: number };
      cp2: { x: number; y: number };
      isBezier: boolean;
    }
  ): void {
    ctx.beginPath();
    ctx.moveTo(curve.start.x, curve.start.y);
    if (!curve.isBezier) {
      ctx.lineTo(curve.end.x, curve.end.y);
      this.tangentAngle = Math.atan2(
        curve.end.y - curve.start.y,
        curve.end.x - curve.start.x
      );
      return;
    }
    ctx.bezierCurveTo(
      curve.cp1.x,
      curve.cp1.y,
      curve.cp2.x,
      curve.cp2.y,
      curve.end.x,
      curve.end.y
    );
    this.tangentAngle = Math.atan2(
      curve.end.y - curve.cp2.y,
      curve.end.x - curve.cp2.x
    );
  }

  public getTangentAngle(): number {
    return this.tangentAngle;
  }

  private getControlPoint(
    point: ConnectionPoint,
    offset: number
  ): { x: number; y: number } {
    return {
      x: point.x + Math.cos(point.angle) * offset,
      y: point.y + Math.sin(point.angle) * offset,
    };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements: IConnectable[] = []
  ): void {
    const from = this.findConnectable(elements, this.fromId);
    const to = this.findConnectable(elements, this.toId);
    if (!from || !to) {
      return;
    }
    connectionRenderer.draw(this, ctx, panZoom, from, to);
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
    const t = Math.max(
      0,
      Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)
    );
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  public isNearPoint(
    px: number,
    py: number,
    elements: IConnectable[],
    tolerance: number = 5
  ): boolean {
    const from = this.findConnectable(elements, this.fromId);
    const to = this.findConnectable(elements, this.toId);
    if (!from || !to) {
      return false;
    }

    const { start, end } = this.getClosestConnectionPoints(from, to);

    if (this.lineType === ConnectionLineType.Straight) {
      // Пряме з'єднання – використання існуючого методу для відрізка
      const distance = this.distanceToLineSegment(
        px,
        py,
        start.x,
        start.y,
        end.x,
        end.y
      );
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
      const sampleCount =
        this.relationType === ConnectionRelationType.LeadsTo ||
        this.relationType === ConnectionRelationType.ParentChild
          ? 40
          : 20;
      const samples: { x: number; y: number }[] = [];
      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        const invT = 1 - t;
        const x =
          invT * invT * invT * start.x +
          3 * invT * invT * t * cp1.x +
          3 * invT * t * t * cp2.x +
          t * t * t * end.x;
        const y =
          invT * invT * invT * start.y +
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

  public sampleCurveWithTangent(
    curve: {
      start: ConnectionPoint;
      end: ConnectionPoint;
      cp1: { x: number; y: number };
      cp2: { x: number; y: number };
      isBezier: boolean;
    },
    t: number
  ): { x: number; y: number; nx: number; ny: number } {
    if (!curve.isBezier) {
      const x = curve.start.x + (curve.end.x - curve.start.x) * t;
      const y = curve.start.y + (curve.end.y - curve.start.y) * t;
      const dx = curve.end.x - curve.start.x;
      const dy = curve.end.y - curve.start.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      return { x, y, nx: -ty, ny: tx };
    }
    const invT = 1 - t;
    const x =
      invT * invT * invT * curve.start.x +
      3 * invT * invT * t * curve.cp1.x +
      3 * invT * t * t * curve.cp2.x +
      t * t * t * curve.end.x;
    const y =
      invT * invT * invT * curve.start.y +
      3 * invT * invT * t * curve.cp1.y +
      3 * invT * t * t * curve.cp2.y +
      t * t * t * curve.end.y;

    const dx =
      3 * invT * invT * (curve.cp1.x - curve.start.x) +
      6 * invT * t * (curve.cp2.x - curve.cp1.x) +
      3 * t * t * (curve.end.x - curve.cp2.x);
    const dy =
      3 * invT * invT * (curve.cp1.y - curve.start.y) +
      6 * invT * t * (curve.cp2.y - curve.cp1.y) +
      3 * t * t * (curve.end.y - curve.cp2.y);
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    return { x, y, nx: -ty, ny: tx };
  }

  private findConnectable(
    elements: IConnectable[],
    ref: string
  ): IConnectable | undefined {
    return elements.find((el) => {
      const uuid = (el as { uuid?: string }).uuid;
      return el.id === ref || uuid === ref;
    });
  }
}
