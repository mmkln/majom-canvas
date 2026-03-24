// src/elements/Task.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SHOW_ANIM_SCALE,
  SHOW_TASK_TEXT_SCALE,
} from '../core/constants.ts';
import { taskStyles } from './styles/taskStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { editElement$ } from '../core/eventBus.ts';
import { v4 } from 'uuid';
import { TextRenderer } from '../utils/TextRenderer.ts';
import { drawStatusAnimationRect } from './utils/statusAnimations.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { getPriorityStrokeWidth } from './utils/priorityStroke.ts';

/**
 * Task representation on the canvas
 */
export class TaskElement extends PlanningElement {
  title: string;
  status: ElementStatus = ElementStatus.Defined;
  public borderColor: string = taskStyles[ElementStatus.Defined].borderColor;
  priority: UiPriority;
  dueDate: Date | null = null;

  static width: number = 272;
  static height: number = 112;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Task',
    description = '',
    status = ElementStatus.Defined,
    selected = false,
    priority = 'low',
    dueDate = null,
    backendId,
    uuid,
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    description?: string;
    status?: ElementStatus;
    selected?: boolean;
    priority?: UiPriority;
    dueDate?: Date | null;
    backendId?: number;
    uuid?: string;
  }) {
    super({
      id,
      x,
      y,
      width: TaskElement.width,
      height: TaskElement.height,
      fillColor: '#ffffff',
      lineWidth: 1,
      title,
      description,
      backendId,
      uuid,
    });
    this.zIndex = 2;
    this.title = title;
    this.status = status;
    this.borderColor = taskStyles[status].borderColor;
    this.selected = selected;
    this.priority = priority;
    this.dueDate = dueDate ?? null;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const renderFlags = panZoom.renderFlags;
    const showText =
      renderFlags?.showTaskText ?? panZoom.scale >= SHOW_TASK_TEXT_SCALE;
    const showAnim = renderFlags?.showAnim ?? panZoom.scale >= SHOW_ANIM_SCALE;
    // Ensure solid border for Task
    ctx.setLineDash([]);
    const x = this.x;
    const y = this.y;
    const w = TaskElement.width;
    const h = TaskElement.height;
    const strokeWidth = getPriorityStrokeWidth(this.priority) / panZoom.scale;
    // Background
    const style = taskStyles[this.status];
    const chromeColor = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : style.borderColor;
    this.fillColor = style.fillColor;
    this.borderColor = chromeColor;
    // Draw background and uniform 2px rounded border
    const radius = 24;
    ctx.fillStyle = style.fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    ctx.strokeStyle = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : style.borderColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (showAnim) {
      drawStatusAnimationRect({
        status: this.status,
        ctx,
        x,
        y,
        width: w,
        height: h,
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
      // Title with word wrapping
      ctx.fillStyle = '#000000';
      ctx.font = `bold 14px Arial`;

      // Calculate maximum width for text with horizontal padding.
      const maxTitleWidth = w - 32;

      // Draw title with word wrapping (font is already set)
      const fontSize = 20;
      const lineHeight = 1.3;
      TextRenderer.drawWrappedText(
        ctx,
        this.title,
        x + 16,
        y + 32,
        maxTitleWidth,
        lineHeight,
        3, // Max 3 lines of text
        fontSize
      );
    }

    // Draw connection anchors: show only when shape hovered/selected or specific port hovered
    const points = this.getConnectionPoints();
    const hoveredPort: ConnectionPoint | undefined = (this as any).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      for (const point of points) {
        const isPortHovered = hoveredPort
          ? point.x === hoveredPort.x && point.y === hoveredPort.y
          : false;
        // skip other ports when not selecting whole shape
        if (!(this.selected || this.isHovered) && !isPortHovered) continue;
        const radius = (isPortHovered ? 8 : 4) / panZoom.scale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isPortHovered ? SELECT_COLOR : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + TaskElement.width &&
      py >= this.y &&
      py <= this.y + TaskElement.height
    );
  }

  onRightClick?(): void {}
  onDragStart?(): void {}
  onDrag?(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  onDragEnd?(): void {}

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const cx = this.x + TaskElement.width / 2;
    const cy = this.y + TaskElement.height / 2;
    return {
      x: cx + Math.cos(angle) * (TaskElement.width / 2),
      y: cy + Math.sin(angle) * (TaskElement.height / 2),
    };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const w = TaskElement.width,
      h = TaskElement.height;
    return [
      {
        x: this.x + w / 2,
        y: this.y,
        angle: -Math.PI / 2,
        isHovered: false,
        direction: 'top',
      },
      {
        x: this.x + w,
        y: this.y + h / 2,
        angle: 0,
        isHovered: false,
        direction: 'right',
      },
      {
        x: this.x + w / 2,
        y: this.y + h,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
      },
      {
        x: this.x,
        y: this.y + h / 2,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
      },
    ];
  }

  clone(): PlanningElement {
    return new TaskElement({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
    });
  }

  /**
   * Prompt to edit task title, status and priority
   */
  public onDoubleClick(): void {
    // Trigger edit modal via event bus
    editElement$.next(this);
  }
}
