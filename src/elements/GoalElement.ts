// src/elements/Goal.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SMALL_FONT_SIZE,
} from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';
import { v4 } from 'uuid';
import { goalStyles } from './styles/goalStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { TextRenderer } from '../utils/TextRenderer.ts';
import { drawStatusAnimationHex } from './utils/statusAnimations.ts';

export type GoalScale = 1 | 2 | 3;

const DEFAULT_GOAL_SCALE: GoalScale = 1;
const GOAL_SCALE_FACTORS: Record<GoalScale, number> = {
  1: 0.8,
  2: 1,
  3: 1.2,
};

export class GoalElement extends PlanningElement {
  links: string[] = [];
  progress: number = 0;
  public status: ElementStatus = ElementStatus.Defined;
  public priority: 'low' | 'medium' | 'high' = 'medium';
  public scale: GoalScale = DEFAULT_GOAL_SCALE;

  static baseDiameter: number = 400;
  static width: number =
    GoalElement.baseDiameter * GOAL_SCALE_FACTORS[DEFAULT_GOAL_SCALE];
  static height: number = GoalElement.width;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Goal',
    status = ElementStatus.Defined,
    priority = 'medium',
    selected = false,
    description = '',
    scale,
    width,
    height,
    backendId,
    uuid,
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    status?: ElementStatus;
    priority?: 'low' | 'medium' | 'high';
    selected?: boolean;
    description?: string;
    scale?: number;
    width?: number;
    height?: number;
    backendId?: number;
    uuid?: string;
  }) {
    const normalizedScale = GoalElement.normalizeScale(scale, width, height);
    const diameter =
      GoalElement.baseDiameter * GOAL_SCALE_FACTORS[normalizedScale];
    super({
      id,
      x,
      y,
      width: diameter,
      height: diameter,
      fillColor: goalStyles[status].fillColor,
      lineWidth: 2,
      title,
      backendId,
      uuid,
    });
    this.zIndex = 3;
    this.status = status;
    this.priority = priority;
    this.selected = selected;
    this.description = description;
    this.scale = normalizedScale;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const { x, y, width, height, title, progress } = this;
    const style = goalStyles[this.status];
    this.fillColor = style.fillColor;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = width / 2;
    const hexVertices = this.getHexVertices(centerX, centerY, radius);

    // Background hex
    ctx.fillStyle = style.fillColor;
    ctx.beginPath();
    this.drawHexPath(ctx, hexVertices);
    ctx.fill();

    // Progress ring (outside the main hex) - segmented
    const progressRingWidth = 12;
    const progressRingOffset = 8; // Space between main circle and progress ring
    const segmentCount = 100;
    const segmentFillRatio = 0.6;
    const filledSegments = Math.max(
      0,
      Math.min(segmentCount, Math.round(progress * segmentCount))
    );

    ctx.lineWidth = progressRingWidth;
    ctx.lineCap = 'butt';

    // Background segments (unfilled)
    ctx.strokeStyle = 'rgba(224,224,224,0.5)';
    this.drawHexRingSegments(
      ctx,
      centerX,
      centerY,
      radius + progressRingOffset + progressRingWidth / 2,
      segmentCount,
      segmentFillRatio,
      segmentCount
    );

    // Filled segments
    ctx.strokeStyle = style.borderColor;
    this.drawHexRingSegments(
      ctx,
      centerX,
      centerY,
      radius + progressRingOffset + progressRingWidth / 2,
      segmentCount,
      segmentFillRatio,
      filledSegments
    );

    // Border
    ctx.strokeStyle = this.selected ? SELECT_COLOR : style.borderColor;
    ctx.lineWidth = this.lineWidth / panZoom.scale;
    ctx.beginPath();
    this.drawHexPath(ctx, hexVertices);
    ctx.stroke();
    drawStatusAnimationHex({
      status: this.status,
      ctx,
      centerX,
      centerY,
      radius,
      lineWidth: this.lineWidth / panZoom.scale,
      scale: panZoom.scale,
      color: style.borderColor,
      timeMs: panZoom.timeMs,
      viewBounds: panZoom.viewBounds,
    });

    // Title with wrapping
    ctx.fillStyle = '#000000';
    const fontSize = 26;
    const lineHeight = 1.3;
    const maxTitleWidth = width * 0.8; // Use 80% of the circle's width

    // Center the text vertically and horizontally
    TextRenderer.drawWrappedText(
      ctx,
      title,
      centerX - maxTitleWidth / 2,
      centerY - fontSize, // Offset up by half the font size
      maxTitleWidth,
      lineHeight,
      3, // Max 3 lines for Goal title
      fontSize
    );

    // Percentage text
    // ctx.fillStyle = '#000000';
    // ctx.font = `${SMALL_FONT_SIZE}px ${FONT_FAMILY}`;
    // ctx.textAlign = 'center';
    // const percentText = `${Math.round(progress * 100)}%`;
    // ctx.fillText(percentText, centerX, centerY + fontSize + 10);
    // ctx.textAlign = 'left'; // Reset text align

    // Anchors
    super.drawAnchors(ctx, panZoom);
  }

  public setScale(scale: number): void {
    const normalized = GoalElement.normalizeScale(scale);
    if (normalized === this.scale) return;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const diameter =
      GoalElement.baseDiameter * GOAL_SCALE_FACTORS[normalized];
    this.width = diameter;
    this.height = diameter;
    this.x = centerX - diameter / 2;
    this.y = centerY - diameter / 2;
    this.scale = normalized;
  }

  contains(px: number, py: number): boolean {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;
    const progressRingWidth = 12;
    const progressRingOffset = 8;
    const maxRadius = radius + progressRingOffset + progressRingWidth;
    const vertices = this.getHexVertices(centerX, centerY, maxRadius);
    return this.isPointInPolygon(vertices, px, py);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;
    const vertices = this.getHexVertices(centerX, centerY, radius);
    const ray = { x: Math.cos(angle), y: Math.sin(angle) };
    let closest: { x: number; y: number } | null = null;
    let minT = Infinity;

    for (let i = 0; i < vertices.length; i += 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const edge = { x: b.x - a.x, y: b.y - a.y };
      const denom = ray.x * edge.y - ray.y * edge.x;
      if (Math.abs(denom) < 1e-6) continue;
      const ax = a.x - centerX;
      const ay = a.y - centerY;
      const t = (ax * edge.y - ay * edge.x) / denom;
      const u = (ax * ray.y - ay * ray.x) / denom;
      if (t >= 0 && u >= 0 && u <= 1 && t < minT) {
        minT = t;
        closest = {
          x: centerX + ray.x * t,
          y: centerY + ray.y * t,
        };
      }
    }

    return (
      closest ?? {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      }
    );
  }

  getConnectionPoints(): ConnectionPoint[] {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const vertices = this.getHexVertices(centerX, centerY, this.width / 2);
    const points: ConnectionPoint[] = [];
    for (let i = 0; i < vertices.length; i += 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const angle = Math.atan2(y - centerY, x - centerX);
      const direction = this.getDirectionFromAngle(angle);
      points.push({
        x,
        y,
        angle,
        isHovered: false,
        direction,
      });
    }
    return points;
  }

  clone(): PlanningElement {
    const clone = new GoalElement({
      x: this.x,
      y: this.y,
      title: this.title,
      status: this.status,
      priority: this.priority,
      scale: this.scale,
    });
    clone.progress = this.progress;
    clone.links = [...this.links];
    return clone;
  }

  /**
   * Prompt to edit goal title
   */
  public onDoubleClick(): void {
    editElement$.next(this);
  }

  private getHexVertices(
    centerX: number,
    centerY: number,
    radius: number
  ): Array<{ x: number; y: number }> {
    const vertices: Array<{ x: number; y: number }> = [];
    const angleOffset = -Math.PI / 2;
    for (let i = 0; i < 6; i += 1) {
      const angle = angleOffset + (Math.PI / 3) * i;
      vertices.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return vertices;
  }

  private drawHexPath(
    ctx: CanvasRenderingContext2D,
    vertices: Array<{ x: number; y: number }>
  ): void {
    vertices.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
  }

  private drawHexRingSegments(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    segmentCount: number,
    segmentFillRatio: number,
    segmentsToDraw: number
  ): void {
    if (segmentsToDraw <= 0) return;
    const vertices = this.getHexVertices(centerX, centerY, radius);
    const edgeLengths: number[] = [];
    const edgeStarts: number[] = [];
    let total = 0;
    for (let i = 0; i < vertices.length; i += 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      edgeStarts.push(total);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      edgeLengths.push(len);
      total += len;
    }
    const segmentLength = total / segmentCount;
    const drawLength = segmentLength * segmentFillRatio;
    const startOffset = edgeLengths[0] + edgeLengths[1] / 2;
    for (let i = 0; i < segmentsToDraw; i += 1) {
      const start = (startOffset + i * segmentLength) % total;
      const end = start + drawLength;
      this.drawPerimeterSegment(
        ctx,
        vertices,
        edgeStarts,
        edgeLengths,
        start,
        end,
        total
      );
    }
  }

  private drawPerimeterSegment(
    ctx: CanvasRenderingContext2D,
    vertices: Array<{ x: number; y: number }>,
    edgeStarts: number[],
    edgeLengths: number[],
    startDist: number,
    endDist: number,
    totalLength: number
  ): void {
    if (endDist <= totalLength) {
      this.drawPerimeterRange(
        ctx,
        vertices,
        edgeStarts,
        edgeLengths,
        startDist,
        endDist
      );
      return;
    }
    this.drawPerimeterRange(
      ctx,
      vertices,
      edgeStarts,
      edgeLengths,
      startDist,
      totalLength
    );
    this.drawPerimeterRange(
      ctx,
      vertices,
      edgeStarts,
      edgeLengths,
      0,
      endDist - totalLength
    );
  }

  private drawPerimeterRange(
    ctx: CanvasRenderingContext2D,
    vertices: Array<{ x: number; y: number }>,
    edgeStarts: number[],
    edgeLengths: number[],
    startDist: number,
    endDist: number
  ): void {
    let cursor = startDist;
    const epsilon = 1e-6;
    while (cursor < endDist) {
      const edgeIndex = this.getEdgeIndex(edgeStarts, edgeLengths, cursor);
      const edgeStart = edgeStarts[edgeIndex];
      const edgeLength = edgeLengths[edgeIndex];
      const edgeEnd = edgeStart + edgeLength;
      const segEnd = Math.min(endDist, edgeEnd);
      if (segEnd - cursor <= epsilon) {
        cursor = Math.min(endDist, segEnd + epsilon);
        continue;
      }
      const t0 = (cursor - edgeStart) / edgeLength;
      const t1 = (segEnd - edgeStart) / edgeLength;
      const a = vertices[edgeIndex];
      const b = vertices[(edgeIndex + 1) % vertices.length];
      const x0 = a.x + (b.x - a.x) * t0;
      const y0 = a.y + (b.y - a.y) * t0;
      const x1 = a.x + (b.x - a.x) * t1;
      const y1 = a.y + (b.y - a.y) * t1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      cursor = segEnd;
    }
  }

  private getEdgeIndex(
    edgeStarts: number[],
    edgeLengths: number[],
    distance: number
  ): number {
    for (let i = 0; i < edgeStarts.length; i += 1) {
      if (distance <= edgeStarts[i] + edgeLengths[i]) {
        return i;
      }
    }
    return 0;
  }

  private isPointInPolygon(
    vertices: Array<{ x: number; y: number }>,
    px: number,
    py: number
  ): boolean {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      const intersect =
        yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private getDirectionFromAngle(
    angle: number
  ): 'top' | 'right' | 'bottom' | 'left' {
    const normalized = ((angle + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (normalized >= -Math.PI / 4 && normalized < Math.PI / 4) {
      return 'right';
    }
    if (normalized >= Math.PI / 4 && normalized < (3 * Math.PI) / 4) {
      return 'bottom';
    }
    if (normalized < -Math.PI / 4 && normalized >= (-3 * Math.PI) / 4) {
      return 'top';
    }
    return 'left';
  }

  private static normalizeScale(
    scale?: number,
    width?: number,
    height?: number
  ): GoalScale {
    if (typeof scale === 'number' && Number.isFinite(scale)) {
      return GoalElement.clampScale(scale);
    }
    const size =
      typeof width === 'number' && Number.isFinite(width)
        ? width
        : typeof height === 'number' && Number.isFinite(height)
          ? height
          : undefined;
    if (typeof size === 'number' && size > 0) {
      const factor = size / GoalElement.baseDiameter;
      return GoalElement.closestScaleForFactor(factor);
    }
    return DEFAULT_GOAL_SCALE;
  }

  private static clampScale(value: number): GoalScale {
    const rounded = Math.round(value);
    if (rounded <= 1) return 1;
    if (rounded >= 3) return 3;
    return rounded as GoalScale;
  }

  private static closestScaleForFactor(factor: number): GoalScale {
    let best: GoalScale = DEFAULT_GOAL_SCALE;
    let bestDiff = Infinity;
    (Object.keys(GOAL_SCALE_FACTORS) as Array<keyof typeof GOAL_SCALE_FACTORS>)
      .map((key) => Number(key) as GoalScale)
      .forEach((scale) => {
        const diff = Math.abs(GOAL_SCALE_FACTORS[scale] - factor);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = scale;
        }
      });
    return best;
  }
}
