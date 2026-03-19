// src/elements/Goal.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  FOCUS_GOAL_FILL,
  HIGHLIGHT_GOAL_FILL,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SMALL_FONT_SIZE,
  SHOW_ANIM_SCALE,
  SHOW_GOAL_TEXT_SCALE,
} from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';
import { v4 } from 'uuid';
import { goalStyles } from './styles/goalStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { TextRenderer } from '../utils/TextRenderer.ts';
import { drawStatusAnimationHex } from './utils/statusAnimations.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { getPriorityStrokeWidth } from './utils/priorityStroke.ts';

export type GoalScale = 1 | 2 | 3;

const DEFAULT_GOAL_SCALE: GoalScale = 1;
const GOAL_POLYGON_SIDES = 8;
const GOAL_POLYGON_ANGLE_STEP = (Math.PI * 2) / GOAL_POLYGON_SIDES;
const GOAL_POLYGON_ANGLE_OFFSET =
  -Math.PI / 2 - GOAL_POLYGON_ANGLE_STEP / 2;
const GOAL_SCALE_FACTORS: Record<GoalScale, number> = {
  1: 0.7,
  2: 1,
  3: 1.4,
};
// Optical correction: on some fonts/renderers centered goal titles look a bit right-shifted.
const GOAL_TITLE_OPTICAL_OFFSET_PX = 2;

export class GoalElement extends PlanningElement {
  links: string[] = [];
  progress: number = 0;
  public status: ElementStatus = ElementStatus.Defined;
  public borderColor: string = goalStyles[ElementStatus.Defined].borderColor;
  public priority: UiPriority = 'low';
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
    priority = 'low',
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
    priority?: UiPriority;
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
    this.borderColor = goalStyles[status].borderColor;
    this.priority = priority;
    this.selected = selected;
    this.description = description;
    this.scale = normalizedScale;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const renderFlags = panZoom.renderFlags;
    const showText =
      renderFlags?.showGoalText ?? panZoom.scale >= SHOW_GOAL_TEXT_SCALE;
    const showAnim = renderFlags?.showAnim ?? panZoom.scale >= SHOW_ANIM_SCALE;
    const { x, y, width, height, title } = this;
    const style = goalStyles[this.status];
    const chromeColor = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : style.borderColor;
    const fillColor = this.focused
      ? FOCUS_GOAL_FILL
      : this.highlighted
        ? HIGHLIGHT_GOAL_FILL
        : style.fillColor;
    const strokeWidth = getPriorityStrokeWidth(this.priority) / panZoom.scale;
    this.fillColor = fillColor;
    this.borderColor = chromeColor;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = width / 2;
    const goalVertices = this.getGoalVertices(centerX, centerY, radius);

    // Background polygon
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    this.drawGoalPath(ctx, goalVertices);
    ctx.fill();


    // Border
    ctx.strokeStyle = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : style.borderColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    this.drawGoalPath(ctx, goalVertices);
    ctx.stroke();
    if (showAnim) {
      drawStatusAnimationHex({
        status: this.status,
        ctx,
        centerX,
        centerY,
        radius,
        lineWidth: strokeWidth,
        scale: panZoom.scale,
        color: chromeColor,
        timeMs: panZoom.timeMs,
        viewBounds: panZoom.viewBounds,
        detail: renderFlags?.statusAnimDetail,
      });
    }

    if (showText) {
      // Center goal title inside the shape (horizontally and vertically).
      ctx.save();
      ctx.fillStyle = '#000000';
      const fontSize = 26;
      const lineHeight = 1.3;
      const lineStep = fontSize * lineHeight;
      const maxTitleWidth = width * 0.8;
      ctx.font = `${fontSize}px ${FONT_FAMILY}`;

      const lines = TextRenderer.wrapText(ctx, title, maxTitleWidth, 3);
      const blockHeight =
        lines.length > 0 ? (lines.length - 1) * lineStep : 0;
      const startY = centerY - blockHeight / 2;
      const textCenterX = centerX - GOAL_TITLE_OPTICAL_OFFSET_PX / panZoom.scale;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, index) => {
        ctx.fillText(line, textCenterX, startY + index * lineStep);
      });
      ctx.restore();
    }

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
    const diameter = GoalElement.baseDiameter * GOAL_SCALE_FACTORS[normalized];
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
    const vertices = this.getGoalVertices(centerX, centerY, radius);
    return this.isPointInPolygon(vertices, px, py);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;
    const vertices = this.getGoalVertices(centerX, centerY, radius);
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
    const vertices = this.getGoalVertices(centerX, centerY, this.width / 2);
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

  private getGoalVertices(
    centerX: number,
    centerY: number,
    radius: number
  ): Array<{ x: number; y: number }> {
    const vertices: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < GOAL_POLYGON_SIDES; i += 1) {
      const angle = GOAL_POLYGON_ANGLE_OFFSET + GOAL_POLYGON_ANGLE_STEP * i;
      vertices.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    return vertices;
  }

  private drawGoalPath(
    ctx: CanvasRenderingContext2D,
    vertices: Array<{ x: number; y: number }>
  ): void {
    vertices.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
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
    Object.keys(GOAL_SCALE_FACTORS)
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
