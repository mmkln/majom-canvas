import type { ConnectionPoint } from '../../canvas-core/core/interfaces/shape.ts';
import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SELECT_COLOR,
  SHOW_ANIM_SCALE,
  SHOW_TASK_TEXT_SCALE,
} from '../../canvas-core/core/constants.ts';
import { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import { taskStyles } from '../../canvas-core/elements/styles/taskStyles.ts';
import { TextRenderer } from '../../canvas-core/utils/TextRenderer.ts';
import { drawStatusAnimationRect } from '../../canvas-core/elements/utils/statusAnimations.ts';
import { getPriorityStrokeWidth } from '../../canvas-core/elements/utils/priorityStroke.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type { LearningUnitType } from '../domain/types.ts';
import { LearningCanvasEntityNode } from './LearningCanvasEntityNode.ts';

type LearningUnitNodeOptions = {
  id?: string;
  uuid?: string;
  x?: number;
  y?: number;
  title?: string;
  description?: string;
  status?: ElementStatus;
  selected?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  priority?: UiPriority;
  dueDate?: Date | null;
  backendId?: number;
  moduleId: string;
  parentLessonId: string | null;
};

export abstract class LearningUnitNode extends LearningCanvasEntityNode {
  public static readonly width = 272;
  public static readonly height = 112;

  public readonly moduleId: string;
  public readonly parentLessonId: string | null;
  public dueDate: Date | null;
  public borderColor = taskStyles[ElementStatus.Defined].borderColor;

  protected constructor(
    nodeKind: LearningUnitType,
    options: LearningUnitNodeOptions
  ) {
    super({
      nodeKind,
      id: options.id,
      uuid: options.uuid,
      backendId: options.backendId,
      x: options.x,
      y: options.y,
      width: LearningUnitNode.width,
      height: LearningUnitNode.height,
      fillColor: '#ffffff',
      lineWidth: 1,
      title: options.title,
      description: options.description,
      status: options.status,
      selected: options.selected,
      interactionStates: options.interactionStates,
      priority: options.priority,
    });
    this.zIndex = 2;
    this.moduleId = options.moduleId;
    this.parentLessonId = options.parentLessonId;
    this.dueDate = options.dueDate ?? null;
    this.borderColor = taskStyles[this.status].borderColor;
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const renderFlags = panZoom.renderFlags;
    const showText =
      renderFlags?.showTaskText ?? panZoom.scale >= SHOW_TASK_TEXT_SCALE;
    const showAnim = renderFlags?.showAnim ?? panZoom.scale >= SHOW_ANIM_SCALE;
    const strokeWidth = getPriorityStrokeWidth(this.priority) / panZoom.scale;
    const style = taskStyles[this.status];
    const appearance = this.resolveAppearance(
      {
        fillColor: style.fillColor,
        chromeColor: this.focused
          ? FOCUS_COLOR
          : this.highlighted
            ? HIGHLIGHT_COLOR
            : style.borderColor,
        borderColor: this.focused
          ? FOCUS_COLOR
          : this.highlighted
            ? HIGHLIGHT_COLOR
            : this.selected
              ? SELECT_COLOR
              : style.borderColor,
      },
      { scale: panZoom.scale }
    );

    this.fillColor = appearance.fillColor;
    this.borderColor = appearance.chromeColor ?? appearance.borderColor!;

    const radius = 24;
    ctx.setLineDash([]);
    ctx.fillStyle = appearance.fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fill();
    ctx.strokeStyle = appearance.borderColor ?? appearance.chromeColor!;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (showAnim) {
      drawStatusAnimationRect({
        status: this.status,
        ctx,
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        radius,
        lineWidth: strokeWidth,
        scale: panZoom.scale,
        color: appearance.chromeColor ?? appearance.borderColor!,
        timeMs: panZoom.timeMs,
        viewBounds: panZoom.viewBounds,
        detail: renderFlags?.statusAnimDetail,
      });
    }

    if (showText) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      const maxTitleWidth = this.width - 32;
      TextRenderer.drawWrappedText(
        ctx,
        this.title,
        this.x + 16,
        this.y + 32,
        maxTitleWidth,
        1.3,
        3,
        20
      );
    }

    const points = this.getConnectionPoints();
    const hoveredPort: ConnectionPoint | undefined = (
      this as unknown as {
        hoveredPort?: ConnectionPoint;
      }
    ).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      for (const point of points) {
        const isPortHovered = hoveredPort
          ? point.x === hoveredPort.x && point.y === hoveredPort.y
          : false;
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

  public contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  public onDrag(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getBoundaryPoint(angle: number): { x: number; y: number } {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return {
      x: cx + Math.cos(angle) * (this.width / 2),
      y: cy + Math.sin(angle) * (this.height / 2),
    };
  }

  public getConnectionPoints(): ConnectionPoint[] {
    return [
      {
        x: this.x + this.width / 2,
        y: this.y,
        angle: -Math.PI / 2,
        isHovered: false,
        direction: 'top',
      },
      {
        x: this.x + this.width,
        y: this.y + this.height / 2,
        angle: 0,
        isHovered: false,
        direction: 'right',
      },
      {
        x: this.x + this.width / 2,
        y: this.y + this.height,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
      },
      {
        x: this.x,
        y: this.y + this.height / 2,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
      },
    ];
  }
}
