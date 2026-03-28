import { ElementStatus } from '../../canvas-core/elements/ElementStatus.ts';
import type { IStructuredCanvasNode } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { CanvasInteractionState } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import type { ConnectionPoint } from '../../canvas-core/core/interfaces/shape.ts';
import type {
  CanvasLayoutMetrics,
  ICanvasLayoutContainer,
} from '../../canvas-core/elements/interfaces/canvasLayoutContainer.ts';
import type { PanZoomManager } from '../../canvas-core/core/managers/PanZoomManager.ts';
import {
  FONT_FAMILY,
  FOCUS_COLOR,
  FOCUS_STORY_FILL,
  HIGHLIGHT_COLOR,
  HIGHLIGHT_STORY_FILL,
  SELECT_COLOR,
  SHOW_ANIM_SCALE,
  SHOW_DETAILS_SCALE,
  SHOW_STORY_TEXT_SCALE,
  SMALL_FONT_SIZE,
  TITLE_FONT_SIZE,
} from '../../canvas-core/core/constants.ts';
import { storyStyles } from '../../canvas-core/elements/styles/storyStyles.ts';
import { TextRenderer } from '../../canvas-core/utils/TextRenderer.ts';
import { drawStatusAnimationRect } from '../../canvas-core/elements/utils/statusAnimations.ts';
import { getPriorityStrokeWidth } from '../../canvas-core/elements/utils/priorityStroke.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { LearningUnitNode } from './LearningUnitNode.ts';
import { isLearningUnitNode } from './learningCanvasNodes.ts';
import { LearningCanvasEntityNode } from './LearningCanvasEntityNode.ts';

type LearningModuleNodeOptions = {
  id?: string;
  uuid?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  status?: ElementStatus;
  priority?: UiPriority;
  tasks?: LearningUnitNode[];
  selected?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  backendId?: number;
};

export class LearningModuleNode
  extends LearningCanvasEntityNode
  implements ICanvasLayoutContainer<LearningUnitNode>
{
  public static readonly width = 344;
  public static readonly height = 240;
  public static readonly HANDLE_SIZE = 8;
  public static readonly layoutMetrics: CanvasLayoutMetrics = {
    paddingX: 36,
    paddingY: 36,
    gap: 28,
    header: 56,
    childWidth: LearningUnitNode.width,
    childHeight: LearningUnitNode.height,
  };

  public tasks: LearningUnitNode[] = [];
  public borderColor = storyStyles[ElementStatus.Defined].borderColor;
  public hoveredResizeHandle: 'nw' | 'ne' | 'se' | 'sw' | null = null;

  constructor(options: LearningModuleNodeOptions) {
    super({
      nodeKind: 'module',
      id: options.id,
      uuid: options.uuid,
      backendId: options.backendId,
      x: options.x,
      y: options.y,
      width: options.width ?? LearningModuleNode.width,
      height: options.height ?? LearningModuleNode.height,
      fillColor: storyStyles[options.status ?? ElementStatus.Defined].fillColor,
      lineWidth: 2,
      title: options.title,
      description: options.description,
      status: options.status,
      selected: options.selected,
      interactionStates: options.interactionStates,
      priority: options.priority,
    });
    this.zIndex = 1;
    this.tasks = options.tasks ?? [];
    this.borderColor = storyStyles[this.status].borderColor;
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const renderFlags = panZoom.renderFlags;
    const showDetails =
      renderFlags?.showDetails ?? panZoom.scale >= SHOW_DETAILS_SCALE;
    const showText =
      renderFlags?.showStoryText ?? panZoom.scale >= SHOW_STORY_TEXT_SCALE;
    const showAnim = renderFlags?.showAnim ?? panZoom.scale >= SHOW_ANIM_SCALE;
    const style = storyStyles[this.status];
    const appearance = this.resolveAppearance(
      {
        fillColor: this.focused
          ? FOCUS_STORY_FILL
          : this.highlighted
            ? HIGHLIGHT_STORY_FILL
            : style.fillColor,
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
    const strokeWidth = getPriorityStrokeWidth(this.priority) / panZoom.scale;
    this.fillColor = appearance.fillColor;
    this.borderColor = appearance.chromeColor ?? appearance.borderColor!;
    const radius = 8 * panZoom.scale;

    ctx.fillStyle = appearance.fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fill();
    ctx.setLineDash(this.selected ? [] : [6 / panZoom.scale, 2 / panZoom.scale]);
    ctx.strokeStyle = appearance.borderColor ?? appearance.chromeColor!;
    ctx.lineWidth = strokeWidth;
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
      ctx.font = `bold ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
      TextRenderer.drawWrappedText(
        ctx,
        this.title,
        this.x + 16,
        this.y + 32,
        this.width - 90,
        1.3,
        3,
        24
      );
    }

    this.drawAnchors(ctx, panZoom);

    if (showDetails && (this.selected || this.isHovered)) {
      this.getResizeHandles(panZoom).forEach((handle) => {
        const isHandleHovered = this.hoveredResizeHandle === handle.direction;
        const size = LearningModuleNode.HANDLE_SIZE / panZoom.scale;
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, size, 0, 2 * Math.PI);
        ctx.fillStyle = isHandleHovered ? '#00A8FF' : SELECT_COLOR;
        ctx.fill();
      });
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

  public addTask(task: LearningUnitNode): void {
    if (!this.tasks.some((candidate) => candidate.id === task.id)) {
      this.tasks = [...this.tasks, task];
    }
  }

  public removeTask(taskId: string): void {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  public getLayoutMetrics(): CanvasLayoutMetrics {
    return LearningModuleNode.layoutMetrics;
  }

  public getOrderedLayoutChildren(): LearningUnitNode[] {
    return [...this.tasks];
  }

  public replaceOrderedLayoutChildren(children: LearningUnitNode[]): void {
    this.tasks = [...children];
  }

  public acceptsLayoutChild(
    element: IStructuredCanvasNode
  ): element is LearningUnitNode {
    return isLearningUnitNode(element);
  }

  public getBoundaryPoint(_angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
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

  public onDrag(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.x = x;
    this.y = y;
    this.tasks.forEach((task) => {
      task.x += dx;
      task.y += dy;
    });
    this.hoveredResizeHandle = null;
  }

  public getResizeHandles(
    _panZoom: PanZoomManager
  ): { x: number; y: number; direction: 'nw' | 'ne' | 'se' | 'sw' }[] {
    return [
      {
        x: this.x + this.width - 1,
        y: this.y + this.height - 1,
        direction: 'se',
      },
    ];
  }

  public getResizeHandleDirectionAt(
    px: number,
    py: number,
    panZoom: PanZoomManager
  ): 'nw' | 'ne' | 'se' | 'sw' | null {
    const detectSize = LearningModuleNode.HANDLE_SIZE / panZoom.scale;
    const handle = this.getResizeHandles(panZoom)[0];
    const dx = px - handle.x;
    const dy = py - handle.y;
    return Math.sqrt(dx * dx + dy * dy) <= detectSize ? handle.direction : null;
  }

  public override clone(): LearningModuleNode {
    return new LearningModuleNode({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      tasks: [],
    });
  }
}
