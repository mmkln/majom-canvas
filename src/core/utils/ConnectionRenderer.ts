import { SELECT_COLOR } from '../constants.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { ConnectionPoint } from '../interfaces/shape.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import { buildCyberPath } from './connectionPathUtils.ts';

type ConnectionCurve = {
  start: ConnectionPoint;
  end: ConnectionPoint;
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
  isBezier: boolean;
};

type RGBColor = { r: number; g: number; b: number };

type RenderableConnection = {
  relationType: ConnectionRelationType;
  selected: boolean;
  getCurvePoints(from: IConnectable, to: IConnectable): ConnectionCurve;
  buildPath(ctx: CanvasRenderingContext2D, curve: ConnectionCurve): void;
  getClosestConnectionPoints(
    from: IConnectable,
    to: IConnectable
  ): { start: ConnectionPoint; end: ConnectionPoint };
  getTangentAngle(): number;
  sampleCurveWithTangent(
    curve: ConnectionCurve,
    t: number
  ): { x: number; y: number; nx: number; ny: number };
};

class ConnectionRenderer {
  public draw(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    from: IConnectable,
    to: IConnectable
  ): void {
    if (connection.relationType === ConnectionRelationType.LeadsTo) {
      this.drawCyberLine(connection, ctx, from, to, panZoom);
    } else if (connection.relationType === ConnectionRelationType.ParentChild) {
      this.drawCyberLine(connection, ctx, from, to, panZoom, true);
    } else {
      this.drawLine(connection, ctx, from, to);
    }

    if (connection.selected) {
      if (
        connection.relationType === ConnectionRelationType.LeadsTo ||
        connection.relationType === ConnectionRelationType.ParentChild
      ) {
        this.drawCyberSelection(connection, ctx, from, to, panZoom);
      } else {
        const curve = connection.getCurvePoints(from, to);
        this.drawSelectionOutline(connection, ctx, curve, panZoom);
      }
    }

    if (
      connection.relationType !== ConnectionRelationType.ParentChild &&
      connection.relationType !== ConnectionRelationType.LeadsTo
    ) {
      this.drawArrowHead(connection, ctx, from, to, panZoom);
    }
  }

  private drawLine(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable
  ): void {
    const curve = connection.getCurvePoints(from, to);
    connection.buildPath(ctx, curve);
    this.setStrokeProperties(connection, ctx);
    ctx.stroke();
  }

  private drawWaveLine(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const curve = connection.getCurvePoints(from, to);
    const scale = panZoom.scale ?? 1;
    const timeMs = (panZoom.timeMs ?? performance.now()) * 0.02;
    const baseColor = connection.selected
      ? '#008dff'
      : this.getRelationColor(connection);
    const dash = 24 / scale;
    const gap = 12 / scale;
    const offset = -timeMs / scale;

    ctx.save();
    connection.buildPath(ctx, curve);
    ctx.setLineDash([dash, gap]);
    ctx.lineDashOffset = offset;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 0.8 / scale;
    ctx.globalAlpha = 0.6;
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 4 / scale;
    ctx.shadowColor = baseColor;
    ctx.lineWidth = 2.4 / scale;
    ctx.globalAlpha = 0.28;
    ctx.stroke();
    ctx.restore();
  }

  private drawPulseLine(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const scale = panZoom.scale ?? 1;
    const timeMs = panZoom.timeMs ?? performance.now();
    const curve = connection.getCurvePoints(from, to);
    const pulse = 0.5 + 0.5 * Math.sin(timeMs * 0.001);
    const coreWidth = (1.4 + pulse * 1.0) / scale;
    const glowWidth = (3 + pulse * 2) / scale;
    const baseAlpha = 0.25 + pulse * 0.35;
    const fallbackColor = this.parseColor(
      this.getRelationColor(connection)
    ) ?? {
      r: 14,
      g: 165,
      b: 233,
    };
    const startColor = this.getElementSwarmColor(from) ?? fallbackColor;
    const endColor = this.getElementSwarmColor(to) ?? fallbackColor;
    const midColor = this.mixColor(startColor, endColor, 0.5);

    ctx.save();
    connection.buildPath(ctx, curve);
    const gradient = ctx.createLinearGradient(
      curve.start.x,
      curve.start.y,
      curve.end.x,
      curve.end.y
    );
    gradient.addColorStop(0, this.toRgba(startColor, baseAlpha));
    gradient.addColorStop(0.5, this.toRgba(midColor, baseAlpha));
    gradient.addColorStop(1, this.toRgba(endColor, baseAlpha));
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    this.drawTaperedStroke(connection, ctx, curve, coreWidth, 0.35, 1);

    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = (10 + pulse * 12) / scale;
    ctx.shadowColor = this.toRgba(midColor, 0.75);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = glowWidth;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    connection.buildPath(ctx, curve);
    ctx.stroke();
    ctx.restore();
  }

  private drawCyberLine(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager,
    reverceAnimation: boolean = false
  ): void {
    const scale = panZoom.scale ?? 1;
    const timeMs = panZoom.timeMs ?? performance.now();
    const { start, end } = connection.getClosestConnectionPoints(from, to);
    const { path, corners } = buildCyberPath(start, end, scale);
    const dash = 18 / scale;
    const gap = 10 / scale;
    const direction = reverceAnimation ? -1 : 1;
    const offset = -(direction * timeMs * 0.02) / scale;
    const baseAlpha = 0.55;
    const fallbackColor = this.parseColor(
      this.getRelationColor(connection)
    ) ?? {
      r: 139,
      g: 92,
      b: 246,
    };
    const startColor = this.getElementSwarmColor(from) ?? fallbackColor;
    const endColor = this.getElementSwarmColor(to) ?? fallbackColor;
    const midColor = this.mixColor(startColor, endColor, 0.5);
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, this.toRgba(startColor, baseAlpha));
    gradient.addColorStop(0.5, this.toRgba(midColor, baseAlpha));
    gradient.addColorStop(1, this.toRgba(endColor, baseAlpha));

    ctx.save();
    ctx.setLineDash([dash, gap]);
    ctx.lineDashOffset = offset;
    ctx.lineWidth = 1.6 / scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = 0.9;
    this.strokePath(ctx, path);

    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowBlur = 8 / scale;
    ctx.shadowColor = this.toRgba(midColor, 0.75);
    ctx.lineWidth = 3 / scale;
    ctx.globalAlpha = 0.35;
    this.strokePath(ctx, path);

    const nodeRadius = 2.4 / scale;
    for (const corner of corners) {
      ctx.beginPath();
      ctx.fillStyle = this.toRgba(midColor, 0.85);
      ctx.shadowBlur = 6 / scale;
      ctx.shadowColor = this.toRgba(midColor, 0.8);
      ctx.arc(corner.x, corner.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCyberSelection(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const scale = panZoom.scale ?? 1;
    const { start, end } = connection.getClosestConnectionPoints(from, to);
    const { path } = buildCyberPath(start, end, scale);
    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 3 / scale;
    ctx.shadowBlur = 10 / scale;
    ctx.shadowColor = SELECT_COLOR;
    ctx.globalAlpha = 0.9;
    this.strokePath(ctx, path);
    ctx.restore();
  }

  private drawArrowHead(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager
  ): void {
    const { end } = connection.getClosestConnectionPoints(from, to);
    const angle = connection.getTangentAngle();
    const headLength = 15;
    const scale = panZoom.scale ?? 1;
    const baseColor = this.getRelationColor(connection);
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
    if (connection.relationType === ConnectionRelationType.LeadsTo) {
      ctx.save();
      ctx.shadowBlur = 14 / scale;
      ctx.shadowColor = baseColor;
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = connection.selected ? '#008dff' : baseColor;
    ctx.fill();
  }

  private drawSelectionOutline(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    curve: ConnectionCurve,
    panZoom: PanZoomManager
  ): void {
    const scale = panZoom.scale ?? 1;
    ctx.save();
    ctx.setLineDash([]);
    connection.buildPath(ctx, curve);
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 3 / scale;
    ctx.shadowBlur = 10 / scale;
    ctx.shadowColor = SELECT_COLOR;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  private drawTaperedStroke(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    curve: ConnectionCurve,
    baseWidth: number,
    minFactor: number,
    maxFactor: number
  ): void {
    const segments = 64;
    for (let i = 0; i < segments; i += 1) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const mid = (t0 + t1) / 2;
      const edgeFactor = Math.abs(mid - 0.5) * 2;
      const widthFactor = minFactor + (maxFactor - minFactor) * edgeFactor;
      const p0 = connection.sampleCurveWithTangent(curve, t0);
      const p1 = connection.sampleCurveWithTangent(curve, t1);
      ctx.lineWidth = baseWidth * widthFactor;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  }

  private setStrokeProperties(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.setLineDash([]);
    const baseColor = this.getRelationColor(connection);
    ctx.strokeStyle = connection.selected ? '#008dff' : baseColor;
    ctx.lineWidth = 2;
  }

  private getRelationColor(connection: RenderableConnection): string {
    switch (connection.relationType) {
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


  private strokePath(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>
  ): void {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

}

export const connectionRenderer = new ConnectionRenderer();
