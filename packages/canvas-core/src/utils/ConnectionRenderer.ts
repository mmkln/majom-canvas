import { SELECT_COLOR } from '../constants.ts';
import {
  DefaultConnectionRelationType,
  type ConnectionPoint,
} from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
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
  relationType: string;
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

export type ConnectionRendererTheme = {
  selectedLineColor?: string;
  selectionGlowColor?: string;
  relationColors?: Record<string, string>;
};

class ConnectionRenderer {
  private theme: Required<ConnectionRendererTheme> = {
    selectedLineColor: '#008dff',
    selectionGlowColor: SELECT_COLOR,
    relationColors: {
      [DefaultConnectionRelationType.LeadsTo]: '#8b5cf6',
      [DefaultConnectionRelationType.Blocks]: '#ef4444',
      [DefaultConnectionRelationType.ParentChild]: '#0ea5e9',
      [DefaultConnectionRelationType.RelatesTo]: '#111827',
    },
  };

  public setTheme(theme: ConnectionRendererTheme): void {
    this.theme = {
      selectedLineColor: theme.selectedLineColor ?? this.theme.selectedLineColor,
      selectionGlowColor: theme.selectionGlowColor ?? this.theme.selectionGlowColor,
      relationColors: {
        ...this.theme.relationColors,
        ...(theme.relationColors ?? {}),
      },
    };
  }

  public draw(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    from: IConnectable,
    to: IConnectable
  ): void {
    if (connection.relationType === DefaultConnectionRelationType.LeadsTo) {
      this.drawCyberLine(connection, ctx, from, to, panZoom);
    } else if (
      connection.relationType === DefaultConnectionRelationType.ParentChild
    ) {
      this.drawCyberLine(connection, ctx, from, to, panZoom, true);
    } else {
      this.drawLine(connection, ctx, from, to);
    }

    if (connection.selected) {
      if (
        connection.relationType === DefaultConnectionRelationType.LeadsTo ||
        connection.relationType === DefaultConnectionRelationType.ParentChild
      ) {
        this.drawCyberSelection(connection, ctx, from, to, panZoom);
      } else {
        const curve = connection.getCurvePoints(from, to);
        this.drawSelectionOutline(connection, ctx, curve, panZoom);
      }
    }

    if (
      connection.relationType !== DefaultConnectionRelationType.ParentChild &&
      connection.relationType !== DefaultConnectionRelationType.LeadsTo
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

  private drawCyberLine(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D,
    from: IConnectable,
    to: IConnectable,
    panZoom: PanZoomManager,
    reverseAnimation = false
  ): void {
    const scale = panZoom.scale ?? 1;
    const timeMs = panZoom.timeMs ?? performance.now();
    const { start, end } = connection.getClosestConnectionPoints(from, to);
    const { path, corners } = buildCyberPath(start, end, scale);
    const dash = 18 / scale;
    const gap = 10 / scale;
    const direction = reverseAnimation ? -1 : 1;
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
    ctx.strokeStyle = this.theme.selectionGlowColor;
    ctx.lineWidth = 3 / scale;
    ctx.shadowBlur = 10 / scale;
    ctx.shadowColor = this.theme.selectionGlowColor;
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
    if (connection.relationType === DefaultConnectionRelationType.LeadsTo) {
      ctx.save();
      ctx.shadowBlur = 14 / scale;
      ctx.shadowColor = baseColor;
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = connection.selected
      ? this.theme.selectedLineColor
      : baseColor;
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
    ctx.strokeStyle = this.theme.selectionGlowColor;
    ctx.lineWidth = 3 / scale;
    ctx.shadowBlur = 10 / scale;
    ctx.shadowColor = this.theme.selectionGlowColor;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.restore();
  }

  private setStrokeProperties(
    connection: RenderableConnection,
    ctx: CanvasRenderingContext2D
  ): void {
    ctx.setLineDash([]);
    const baseColor = this.getRelationColor(connection);
    ctx.strokeStyle = connection.selected
      ? this.theme.selectedLineColor
      : baseColor;
    ctx.lineWidth = 2;
  }

  private getRelationColor(connection: RenderableConnection): string {
    return (
      this.theme.relationColors[connection.relationType] ??
      this.theme.relationColors[DefaultConnectionRelationType.RelatesTo]
    );
  }

  private getElementSwarmColor(element: IConnectable): RGBColor | null {
    const palette = element as { borderColor?: string; fillColor?: string };
    const color = palette.borderColor ?? palette.fillColor;
    if (!color) return null;
    return this.parseColor(color);
  }

  private parseColor(color: string): RGBColor | null {
    const normalized = color.trim();
    const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
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

