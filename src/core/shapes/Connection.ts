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

type RGBColor = {
  r: number;
  g: number;
  b: number;
};

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

  private getClosestConnectionPoints(
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

  private setStrokeProperties(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    // Ensure solid line for permanent connections
    ctx.setLineDash([]);
    const baseColor = this.getRelationColor();
    ctx.strokeStyle = this.selected ? '#008dff' : baseColor;
    ctx.lineWidth = 2;
  }

  private getCurvePoints(
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

  private buildPath(
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

  private drawLine(
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const curve = this.getCurvePoints(from, to);
    this.buildPath(ctx, curve);
    this.setStrokeProperties(ctx, panZoom);
    ctx.stroke();
  }

  private drawSwarmLine(
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const scale = panZoom.scale ?? 1;
    const time = (panZoom.timeMs ?? performance.now()) / 1000;
    const curve = this.getCurvePoints(from, to);
    const distance = Math.hypot(
      curve.end.x - curve.start.x,
      curve.end.y - curve.start.y
    );
    const screenDistance = distance * scale;
    const swarmScale = Math.max(0.35, Math.min(1, screenDistance / 220));
    const baseAlpha = 0.12 + (1 - swarmScale) * 0.08;
    const fallbackColor =
      this.parseColor(this.getRelationColor()) ?? {
        r: 168,
        g: 85,
        b: 247,
      };
    const startColor = this.getElementSwarmColor(from) ?? fallbackColor;
    const endColor = this.getElementSwarmColor(to) ?? fallbackColor;

    ctx.save();
    this.buildPath(ctx, curve);
    const gradient = ctx.createLinearGradient(
      curve.start.x,
      curve.start.y,
      curve.end.x,
      curve.end.y
    );
    gradient.addColorStop(0, this.toRgba(startColor, baseAlpha));
    gradient.addColorStop(1, this.toRgba(endColor, baseAlpha));
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2 / scale;
    ctx.stroke();

    this.drawSwarmParticles(
      ctx,
      curve,
      time,
      scale,
      screenDistance,
      startColor,
      endColor
    );
    ctx.restore();
  }

  private getControlPoint(
    point: ConnectionPoint,
    offset: number
  ): { x: number; y: number } {
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
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const { end } = this.getClosestConnectionPoints(from, to);
    const angle = this.tangentAngle;
    const headLength = 15;
    const scale = panZoom.scale ?? 1;
    const baseColor = this.getRelationColor();
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
    if (this.relationType === ConnectionRelationType.LeadsTo) {
      ctx.save();
      ctx.shadowBlur = 14 / scale;
      ctx.shadowColor = baseColor;
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = this.selected ? '#008dff' : baseColor;
    ctx.fill();
  }

  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements: IConnectable[] = []
  ): void {
    const from = this.findConnectable(elements, this.fromId);
    const to = this.findConnectable(elements, this.toId);
    if (from && to) {
      if (this.relationType === ConnectionRelationType.LeadsTo) {
        this.drawSwarmLine(ctx, from, to, panZoom);
      } else {
        this.drawLine(ctx, from, to, panZoom);
      }
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
      const sampleCount = 20;
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

  private getRelationColor(): string {
    switch (this.relationType) {
      case ConnectionRelationType.LeadsTo:
        return '#8b5cf6';
      case ConnectionRelationType.Blocks:
        return '#ef4444';
      case ConnectionRelationType.ParentChild:
        return '#0ea5e9';
      case ConnectionRelationType.RelatesTo:
      default:
        return '#111827';
    }
  }

  private drawSwarmParticles(
    ctx: CanvasRenderingContext2D,
    curve: {
      start: ConnectionPoint;
      end: ConnectionPoint;
      cp1: { x: number; y: number };
      cp2: { x: number; y: number };
      isBezier: boolean;
    },
    time: number,
    scale: number,
    screenDistance: number,
    startColor: RGBColor,
    endColor: RGBColor
  ): void {
    const intensity = Math.max(0.35, Math.min(1, screenDistance / 220));
    const density = 0.4 + intensity * 0.6;
    const baseCount = screenDistance / 9;
    const count = Math.max(
      6,
      Math.min(70, Math.round(baseCount * (0.45 + intensity * 0.75)))
    );
    const baseSpreadPx = Math.min(46, Math.max(6, screenDistance * 0.18));
    const spreadPx = Math.min(48, baseSpreadPx * (0.55 + intensity * 0.6));
    const spreadMax = spreadPx / scale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i += 1) {
      const seed = i * 12.9898;
      const rand = this.fract(Math.sin(seed) * 43758.5453);
      const speed = 0.08 + rand * 0.18;
      const t = (time * speed + rand) % 1;
      const flow = this.sampleCurveWithTangent(curve, t);

      const midTightness = 3;
      const spreadProfile =
        0.12 + 0.55 * Math.pow(Math.sin(Math.PI * t), midTightness);
      const spread = spreadProfile * spreadMax;
      const side = rand > 0.5 ? 1 : -1;
      const wobble =
        Math.sin(time * 4 + seed) *
        (0.45 + rand) *
        (2.4 / scale) *
        (0.6 + spreadProfile * 0.6);
      const offset =
        (rand - 0.5) * 2 * spread + side * wobble;
      const px = flow.x + flow.nx * offset;
      const py = flow.y + flow.ny * offset;

      const alpha = Math.max(0.1, 1 - Math.abs(t - 0.5) * 2) * density;
      const radius =
        ((1.15 + rand * 1.05 + spreadProfile * 2.2) / scale) *
        (0.75 + intensity * 0.45);
      const blendedColor = this.mixColor(startColor, endColor, t);
      const haloColor = this.toRgba(blendedColor, 0.35 + alpha * 0.25);

      ctx.beginPath();
      ctx.shadowBlur =
        ((10 + spreadProfile * 16) / scale) *
        (0.75 + intensity * 0.5);
      ctx.shadowColor = haloColor;
      ctx.fillStyle = this.toRgba(blendedColor, 0.18 + alpha * 0.55);
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      if (rand > 0.7) {
        ctx.beginPath();
        ctx.shadowBlur =
          ((14 + spreadProfile * 20) / scale) *
          (0.75 + intensity * 0.5);
        ctx.shadowColor = this.toRgba(blendedColor, 0.85);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.16 + alpha * 0.45})`;
        ctx.arc(px, py, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private sampleCurveWithTangent(
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

  private fract(value: number): number {
    return value - Math.floor(value);
  }

  private getElementSwarmColor(element: IConnectable): RGBColor | null {
    const fillColor = (element as { fillColor?: string }).fillColor;
    if (!fillColor) return null;
    return this.parseColor(fillColor);
  }

  private parseColor(color: string): RGBColor | null {
    const normalized = color.trim();
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      }
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }

    const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
    if (rgbMatch) {
      const parts = rgbMatch[1].split(',').map((part) => part.trim());
      if (parts.length >= 3) {
        const r = Math.round(Number(parts[0]));
        const g = Math.round(Number(parts[1]));
        const b = Math.round(Number(parts[2]));
        if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
          return { r, g, b };
        }
      }
    }

    return null;
  }

  private mixColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  private toRgba(color: RGBColor, alpha: number): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
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
