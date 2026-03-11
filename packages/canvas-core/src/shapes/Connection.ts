import type { IConnectable } from '../interfaces/connectable.ts';
import {
  ConnectionLineType,
  DefaultConnectionRelationType,
  type ConnectionPoint,
  type ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import { connectionRenderer } from '../utils/ConnectionRenderer.ts';
import { buildCyberPath } from '../utils/connectionPathUtils.ts';

const createConnectionId = (): string => {
  const cryptoObject = globalThis.crypto as Crypto | undefined;
  if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }
  return `conn-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Connection element with drawing helpers and edge hit-testing.
 */
export default class Connection implements IConnection {
  public id: string;
  public fromId: string;
  public toId: string;
  public selected = false;
  public lineType: ConnectionLineType = ConnectionLineType.SShaped;
  public relationType: ConnectionRelationType =
    DefaultConnectionRelationType.RelatesTo;
  public zIndex = 1;
  private tangentAngle = 0;

  constructor(
    fromId: string,
    toId: string,
    id: string = createConnectionId(),
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

  /**
   * Returns nearest pair of anchor points between two connectables.
   */
  public getClosestConnectionPoints(
    from: IConnectable,
    to: IConnectable
  ): { start: ConnectionPoint; end: ConnectionPoint } {
    const fromPoints = from.getConnectionPoints();
    const toPoints = to.getConnectionPoints();

    let minDistance = Number.POSITIVE_INFINITY;
    let bestStart: ConnectionPoint = fromPoints[0];
    let bestEnd: ConnectionPoint = toPoints[0];

    for (const start of fromPoints) {
      for (const end of toPoints) {
        const distance = Math.hypot(start.x - end.x, start.y - end.y);
        if (distance < minDistance) {
          minDistance = distance;
          bestStart = start;
          bestEnd = end;
        }
      }
    }

    return { start: bestStart, end: bestEnd };
  }

  /**
   * Returns line/bezier curve definition for current connection style.
   */
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
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const offset = distance / 1.4;
    const cp1 = this.getControlPoint(start, offset);
    const cp2 = this.getControlPoint(end, offset);
    return { start, end, cp1, cp2, isBezier: true };
  }

  /**
   * Builds canvas path for provided curve and stores arrow tangent angle.
   */
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

  /**
   * Returns tangent angle at connection end used for arrow rendering.
   */
  public getTangentAngle(): number {
    return this.tangentAngle;
  }

  /**
   * Draws connection using shared renderer.
   */
  public draw(
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

  /**
   * Hit-tests pointer proximity against the rendered connection curve/path.
   */
  public isNearPoint(
    px: number,
    py: number,
    elements: IConnectable[],
    tolerance = 5,
    scale = 1
  ): boolean {
    const from = this.findConnectable(elements, this.fromId);
    const to = this.findConnectable(elements, this.toId);
    if (!from || !to) {
      return false;
    }

    const { start, end } = this.getClosestConnectionPoints(from, to);
    if (
      this.relationType === DefaultConnectionRelationType.LeadsTo ||
      this.relationType === DefaultConnectionRelationType.ParentChild
    ) {
      const { path } = buildCyberPath(start, end, scale);
      let minDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < path.length - 1; i += 1) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const distance = this.distanceToLineSegment(px, py, p1.x, p1.y, p2.x, p2.y);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
      return minDistance <= tolerance;
    }

    if (this.lineType === ConnectionLineType.Straight) {
      const distance = this.distanceToLineSegment(
        px,
        py,
        start.x,
        start.y,
        end.x,
        end.y
      );
      return distance <= tolerance;
    }

    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const offset = distance / 1.4;
    const cp1 = this.getControlPoint(start, offset);
    const cp2 = this.getControlPoint(end, offset);
    const sampleCount =
      this.relationType === DefaultConnectionRelationType.LeadsTo ||
      this.relationType === DefaultConnectionRelationType.ParentChild
        ? 40
        : 20;
    const samples: { x: number; y: number }[] = [];
    for (let i = 0; i <= sampleCount; i += 1) {
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

    let minDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < samples.length - 1; i += 1) {
      const p1 = samples[i];
      const p2 = samples[i + 1];
      const currentDistance = this.distanceToLineSegment(
        px,
        py,
        p1.x,
        p1.y,
        p2.x,
        p2.y
      );
      if (currentDistance < minDistance) {
        minDistance = currentDistance;
      }
    }
    return minDistance <= tolerance;
  }

  /**
   * Updates connection line type.
   */
  public setLineType(type: ConnectionLineType): void {
    this.lineType = type;
  }

  /**
   * Samples point and normal from curve at `t` in [0..1].
   */
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

  private getControlPoint(
    point: ConnectionPoint,
    offset: number
  ): { x: number; y: number } {
    return {
      x: point.x + Math.cos(point.angle) * offset,
      y: point.y + Math.sin(point.angle) * offset,
    };
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
      return Math.hypot(px - x1, py - y1);
    }
    const t = Math.max(
      0,
      Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)
    );
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  private findConnectable(
    elements: IConnectable[],
    reference: string
  ): IConnectable | undefined {
    return elements.find((element) => {
      const aliases = element as { id: string; uuid?: string; backendId?: string };
      return (
        aliases.id === reference ||
        aliases.uuid === reference ||
        aliases.backendId === reference
      );
    });
  }
}
