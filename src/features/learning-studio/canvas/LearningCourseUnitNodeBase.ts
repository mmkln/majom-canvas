import type { ConnectionPoint } from '../../canvas-core/core/interfaces/shape.ts';
import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import { SELECT_COLOR } from '../../canvas-core/core/constants.ts';
import type { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type { LearningUnitType } from '../domain/types.ts';
import { LearningCanvasEntityNode } from './LearningCanvasEntityNode.ts';
import {
  LEARNING_CHILD_UNIT_HEIGHT,
  LEARNING_CHILD_UNIT_WIDTH,
} from './LearningCanvasRenderConstants.ts';

export type LearningCourseUnitNodeOptions = {
  id?: string;
  uuid?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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
  prerequisiteLessonIds?: readonly string[];
};

export abstract class LearningCourseUnitNodeBase extends LearningCanvasEntityNode {
  public readonly moduleId: string;
  public readonly parentLessonId: string | null;
  public readonly prerequisiteLessonIds: string[];
  public dueDate: Date | null;
  public borderColor = '#cbd5e1';

  protected constructor(
    nodeKind: LearningUnitType,
    options: LearningCourseUnitNodeOptions
  ) {
    super({
      nodeKind,
      id: options.id,
      uuid: options.uuid,
      backendId: options.backendId,
      x: options.x,
      y: options.y,
      width: options.width ?? LEARNING_CHILD_UNIT_WIDTH,
      height: options.height ?? LEARNING_CHILD_UNIT_HEIGHT,
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
    this.prerequisiteLessonIds = [...(options.prerequisiteLessonIds ?? [])];
    this.dueDate = options.dueDate ?? null;
    this.borderColor = '#cbd5e1';
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
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x + this.width,
        y: this.y + this.height / 2,
        angle: 0,
        isHovered: false,
        direction: 'right',
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x + this.width / 2,
        y: this.y + this.height,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
        isVisible: false,
        isInteractive: false,
      },
      {
        x: this.x,
        y: this.y + this.height / 2,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
        isVisible: false,
        isInteractive: false,
      },
    ];
  }

  protected drawConnectionPorts(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    const points = this.getConnectionPoints();
    const hoveredPort: ConnectionPoint | undefined = (
      this as unknown as {
        hoveredPort?: ConnectionPoint;
      }
    ).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      for (const point of points) {
        if (point.isVisible === false) continue;
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

  protected drawPlaceholderSquare(
    ctx: CanvasRenderingContext2D,
    _panZoom: PanZoomManager
  ): void {
    const stroke = this.focused
      ? '#8b5cf6'
      : this.highlighted
        ? '#f59e0b'
        : this.selected
          ? SELECT_COLOR
          : '#64748b';
    this.fillColor = '#e2e8f0';
    this.borderColor = stroke;
    ctx.setLineDash([]);
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
