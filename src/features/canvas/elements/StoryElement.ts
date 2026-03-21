// core/shapes/Story.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { TaskElement } from './TaskElement.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  FOCUS_STORY_FILL,
  HIGHLIGHT_STORY_FILL,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SMALL_FONT_SIZE,
  SHOW_ANIM_SCALE,
  SHOW_DETAILS_SCALE,
  SHOW_STORY_TEXT_SCALE,
} from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';
import { storyStyles } from './styles/storyStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { v4 } from 'uuid';
import { TextRenderer } from '../utils/TextRenderer.ts';
import { drawStatusAnimationRect } from './utils/statusAnimations.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { getPriorityStrokeWidth } from './utils/priorityStroke.ts';

/**
 * Story representation on the canvas - a container for tasks
 */
export class StoryElement extends PlanningElement {
  static width: number = 344;
  static height: number = 240;
  static collapsedHeight: number = 56;
  static collapsedMinWidth: number = 168;
  static collapsedMaxWidth: number = 244;
  public borderColor: string = storyStyles[ElementStatus.Defined].borderColor;
  /** Size for resize handles (in px) */
  // Size in px for the circular resize handle (larger for better UX)
  static HANDLE_SIZE: number = 8;

  status: ElementStatus = ElementStatus.Defined;
  tasks: TaskElement[] = [];
  public priority: UiPriority = 'low';
  public goalBackendId: number | null = null;
  public isCollapsed: boolean = false;
  public expandedWidth: number = StoryElement.width;
  public expandedHeight: number = StoryElement.height;
  /** Currently hovered resize direction */
  public hoveredResizeHandle: 'nw' | 'ne' | 'se' | 'sw' | null = null;

  /**
   * Create a new Story
   */
  constructor({
    id = v4(),
    x = 0,
    y = 0,
    width = StoryElement.width,
    height = 240,
    title = 'New Story',
    description = '',
    status = ElementStatus.Defined,
    priority = 'low',
    tasks = [],
    selected = false,
    backendId,
    uuid,
    goalBackendId = null,
    isCollapsed = false,
    expandedWidth,
    expandedHeight,
  }: {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    title?: string;
    description?: string;
    status?: ElementStatus;
    priority?: UiPriority;
    tasks?: TaskElement[];
    selected?: boolean;
    backendId?: number;
    uuid?: string;
    goalBackendId?: number | null;
    isCollapsed?: boolean;
    expandedWidth?: number;
    expandedHeight?: number;
  }) {
    // determine style by status
    const style = storyStyles[status];
    super({
      id,
      x,
      y,
      width,
      height,
      fillColor: style.fillColor,
      lineWidth: 2,
      title,
      description,
      backendId,
      uuid,
    });
    // layer ordering: draw stories below tasks
    this.zIndex = 1;
    this.status = status;
    this.borderColor = storyStyles[status].borderColor;
    this.priority = priority;
    this.tasks = tasks;
    this.selected = selected;
    this.goalBackendId = goalBackendId;
    this.expandedWidth =
      typeof expandedWidth === 'number'
        ? expandedWidth
        : Math.max(width, StoryElement.collapsedMinWidth);
    this.expandedHeight =
      typeof expandedHeight === 'number'
        ? expandedHeight
        : Math.max(height, StoryElement.height);
    if (isCollapsed) {
      this.isCollapsed = true;
      this.width = this.getPreferredCollapsedWidth();
      this.height = StoryElement.collapsedHeight;
    } else {
      this.width = Math.max(width, StoryElement.collapsedMinWidth);
      this.height = Math.max(height, StoryElement.collapsedHeight);
      this.expandedWidth = this.width;
      this.expandedHeight = this.height;
    }
  }

  /**
   * Draw the story container on canvas
   */
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const renderFlags = panZoom.renderFlags;
    const showDetails =
      renderFlags?.showDetails ?? panZoom.scale >= SHOW_DETAILS_SCALE;
    const showText =
      renderFlags?.showStoryText ?? panZoom.scale >= SHOW_STORY_TEXT_SCALE;
    const showAnim = renderFlags?.showAnim ?? panZoom.scale >= SHOW_ANIM_SCALE;
    // Apply fill and border based on status
    const style = storyStyles[this.status];
    const chromeColor = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : style.borderColor;
    const fillColor = this.focused
      ? FOCUS_STORY_FILL
      : this.highlighted
        ? HIGHLIGHT_STORY_FILL
        : style.fillColor;
    const strokeWidth = getPriorityStrokeWidth(this.priority) / panZoom.scale;
    this.fillColor = fillColor;
    this.borderColor = chromeColor;
    const radius = 8 * panZoom.scale;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, radius);
    ctx.fill();
    // Border: dashed or solid
    const dashOn = 6 / panZoom.scale;
    const dashOff = 2 / panZoom.scale;
    ctx.setLineDash(this.selected ? [] : [dashOn, dashOff]);
    ctx.strokeStyle = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : style.borderColor;
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
        color: chromeColor,
        timeMs: panZoom.timeMs,
        viewBounds: panZoom.viewBounds,
        detail: renderFlags?.statusAnimDetail,
      });
    }
    this.drawCollapseToggle(ctx, panZoom);
    if (this.isCollapsed) {
      this.drawCollapsedContent(ctx, panZoom);
      super.drawAnchors(ctx, panZoom);
      return;
    }
    if (showText) {
      // Title text with word wrapping
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
      // Calculate max width for title, accounting for potential buttons
      const maxTitleWidth = this.width - 126;
      const fontSize = 24;
      const lineHeight = 1.3;
      TextRenderer.drawWrappedText(
        ctx,
        this.title,
        this.x + 48,
        this.y + 32,
        maxTitleWidth,
        lineHeight,
        3, // Max 2 lines for Story title
        fontSize
      );
    }
    // Draw anchors via base class
    super.drawAnchors(ctx, panZoom);
    // Draw resize handles when selected or hovered
    if (showDetails && (this.selected || this.isHovered)) {
      this.getResizeHandles(panZoom).forEach((h) => {
        const isHandleHovered = this.hoveredResizeHandle === h.direction;
        const size = StoryElement.HANDLE_SIZE / panZoom.scale;

        ctx.beginPath();
        ctx.arc(h.x, h.y, size, 0, 2 * Math.PI);

        ctx.fillStyle = isHandleHovered ? '#00A8FF' : SELECT_COLOR;
        ctx.fill();
      });
    }
  }

  /**
   * Draw a button
   */
  private drawButton(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    x: number,
    y: number,
    icon: string,
    color: string
  ): void {
    const size = 22 / panZoom.scale;

    // Button background
    if (color !== 'transparent') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4 / panZoom.scale);
      ctx.fill();
    }

    // Icon
    ctx.fillStyle = '#666666';
    ctx.font = `${SMALL_FONT_SIZE / panZoom.scale}px ${FONT_FAMILY}`;
    ctx.fillText(icon, x + 3 / panZoom.scale, y + 16 / panZoom.scale);
  }

  private drawCollapseToggle(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    const bounds = this.getCollapseToggleBounds(panZoom);
    const radius = 6 / panZoom.scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius);
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fill();
    ctx.strokeStyle = this.selected ? SELECT_COLOR : 'rgba(15,23,42,0.12)';
    ctx.lineWidth = 1 / panZoom.scale;
    ctx.stroke();

    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const arm = 4 / panZoom.scale;
    ctx.beginPath();
    if (this.isCollapsed) {
      ctx.moveTo(cx - arm, cy - arm / 2);
      ctx.lineTo(cx, cy + arm / 2);
      ctx.lineTo(cx + arm, cy - arm / 2);
    } else {
      ctx.moveTo(cx - arm, cy + arm / 2);
      ctx.lineTo(cx, cy - arm / 2);
      ctx.lineTo(cx + arm, cy + arm / 2);
    }
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8 / panZoom.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  private drawCollapsedContent(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    const titleX = this.x + 48 / panZoom.scale;
    const titleY = this.y + this.height / 2 + 5 / panZoom.scale;
    const pillHeight = 22 / panZoom.scale;
    const pillPaddingX = 10 / panZoom.scale;
    const countLabel = `${this.tasks.length} ${this.tasks.length === 1 ? 'task' : 'tasks'}`;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    const countWidth = ctx.measureText(countLabel).width + pillPaddingX * 2;
    const pillWidth = Math.max(44 / panZoom.scale, countWidth);
    const pillX = this.x + this.width - pillWidth - 14 / panZoom.scale;
    const pillY = this.y + (this.height - pillHeight) / 2;

    ctx.font = `600 ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    TextRenderer.drawWrappedText(
      ctx,
      this.title,
      titleX,
      titleY,
      Math.max(40, pillX - titleX - 12 / panZoom.scale),
      1.2,
      1,
      TITLE_FONT_SIZE
    );

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 999);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.08)';
    ctx.lineWidth = 1 / panZoom.scale;
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = `500 11px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(countLabel, pillX + pillWidth / 2, pillY + pillHeight / 2 + 0.5);
    ctx.restore();
  }

  /**
   * Check if coordinates are within this story
   */
  contains(px: number, py: number): boolean {
    const bounds = this.getVisibleBounds();
    return (
      px >= bounds.x &&
      px <= bounds.x + bounds.width &&
      py >= bounds.y &&
      py <= bounds.y + bounds.height
    );
  }

  containsLogicalPoint(px: number, py: number): boolean {
    const bounds = this.getLogicalBounds();
    return (
      px >= bounds.x &&
      px <= bounds.x + bounds.width &&
      py >= bounds.y &&
      py <= bounds.y + bounds.height
    );
  }

  containsTaskPoint(px: number, py: number, alreadyContained: boolean): boolean {
    if (alreadyContained) {
      return this.containsLogicalPoint(px, py);
    }
    return this.contains(px, py);
  }

  public getVisibleBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  public getLogicalBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: this.x,
      y: this.y,
      width: this.getLogicalWidth(),
      height: this.getLogicalHeight(),
    };
  }

  public getLogicalWidth(): number {
    return this.isCollapsed ? this.expandedWidth : this.width;
  }

  public getLogicalHeight(): number {
    return this.isCollapsed ? this.expandedHeight : this.height;
  }

  public setExpandedWidth(width: number): void {
    const nextWidth = Math.max(width, StoryElement.collapsedMinWidth);
    this.expandedWidth = nextWidth;
    if (!this.isCollapsed) {
      this.width = nextWidth;
    }
  }

  public setExpandedHeight(height: number): void {
    const nextHeight = Math.max(height, StoryElement.collapsedHeight);
    this.expandedHeight = nextHeight;
    if (!this.isCollapsed) {
      this.height = nextHeight;
    }
  }

  public setCollapsed(collapsed: boolean): void {
    if (this.isCollapsed === collapsed) return;
    if (collapsed) {
      this.expandedWidth = Math.max(this.width, StoryElement.collapsedMinWidth);
      this.expandedHeight = Math.max(this.height, StoryElement.collapsedHeight);
      this.width = this.getPreferredCollapsedWidth();
      this.height = StoryElement.collapsedHeight;
      this.isCollapsed = true;
      this.hoveredResizeHandle = null;
      return;
    }
    const nextHeight = Math.max(
      this.expandedHeight,
      StoryElement.collapsedHeight
    );
    const nextWidth = Math.max(
      this.expandedWidth,
      StoryElement.collapsedMinWidth
    );
    this.width = nextWidth;
    this.height = nextHeight;
    this.expandedWidth = nextWidth;
    this.expandedHeight = nextHeight;
    this.isCollapsed = false;
  }

  public toggleCollapsed(): void {
    this.setCollapsed(!this.isCollapsed);
  }

  public getCollapseToggleBounds(panZoom: PanZoomManager): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const size = 20 / panZoom.scale;
    const inset = 10 / panZoom.scale;
    return {
      x: this.x + inset,
      y: this.y + (this.isCollapsed ? (this.height - size) / 2 : inset),
      width: size,
      height: size,
    };
  }

  public isCollapseToggleClicked(
    px: number,
    py: number,
    panZoom: PanZoomManager
  ): boolean {
    const bounds = this.getCollapseToggleBounds(panZoom);
    const padding = 4 / panZoom.scale;
    return (
      px >= bounds.x - padding &&
      px <= bounds.x + bounds.width + padding &&
      py >= bounds.y - padding &&
      py <= bounds.y + bounds.height + padding
    );
  }

  /**
   * Check if coordinates are within the edit button
   */
  isEditButtonClicked(px: number, py: number): boolean {
    const titleHeight = 32;
    const buttonSize = 22;
    const buttonX = this.x + this.width - 80;
    const buttonY = this.y + 6;

    return (
      px >= buttonX &&
      px <= buttonX + buttonSize &&
      py >= buttonY &&
      py <= buttonY + buttonSize
    );
  }

  /**
   * Check if coordinates are within the delete button
   */
  isDeleteButtonClicked(px: number, py: number): boolean {
    const titleHeight = 32;
    const buttonSize = 22;
    const buttonX = this.x + this.width - 50;
    const buttonY = this.y + 6;

    return (
      px >= buttonX &&
      px <= buttonX + buttonSize &&
      py >= buttonY &&
      py <= buttonY + buttonSize
    );
  }

  /**
   * Check if coordinates are within the add task button
   */
  isAddButtonClicked(px: number, py: number): boolean {
    const titleHeight = 32;
    const buttonSize = 22;
    const buttonX = this.x + this.width - 20;
    const buttonY = this.y + 6;

    return (
      px >= buttonX &&
      px <= buttonX + buttonSize &&
      py >= buttonY &&
      py <= buttonY + buttonSize
    );
  }

  /**
   * Add a task to this story
   */
  addTask(task: TaskElement): void {
    if (!this.tasks.find((t) => t.id === task.id)) {
      this.tasks.push(task);
    }
  }

  /**
   * Remove a task from this story
   */
  removeTask(taskId: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const points: ConnectionPoint[] = [];
    const w = this.width;
    const h = this.height;
    points.push({
      x: this.x + w / 2,
      y: this.y,
      angle: -Math.PI / 2,
      isHovered: false,
      direction: 'top',
    });
    points.push({
      x: this.x + w,
      y: this.y + h / 2,
      angle: 0,
      isHovered: false,
      direction: 'right',
    });
    points.push({
      x: this.x + w / 2,
      y: this.y + h,
      angle: Math.PI / 2,
      isHovered: false,
      direction: 'bottom',
    });
    points.push({
      x: this.x,
      y: this.y + h / 2,
      angle: Math.PI,
      isHovered: false,
      direction: 'left',
    });
    return points;
  }

  /**
   * Move story along with its tasks
   */
  public onDrag(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.x = x;
    this.y = y;
    this.tasks.forEach((t) => {
      t.x += dx;
      t.y += dy;
    });
    this.hoveredResizeHandle = null;
  }

  /**
   * Get positions and directions of resize handles
   */
  public getResizeHandles(
    panZoom: PanZoomManager
  ): { x: number; y: number; direction: 'nw' | 'ne' | 'se' | 'sw' }[] {
    if (this.isCollapsed) {
      return [];
    }
    // Single handle: bottom-right corner only, to declutter UI and simplify resizing
    const offsetFromEdge = 1;
    return [
      {
        x: this.x + this.width - offsetFromEdge,
        y: this.y + this.height - offsetFromEdge,
        direction: 'se',
      },
    ];
  }

  /**
   * Detect which resize handle (if any) contains px,py
   */
  public getResizeHandleDirectionAt(
    px: number,
    py: number,
    panZoom: PanZoomManager
  ): 'nw' | 'ne' | 'se' | 'sw' | null {
    // clickable area: match handle size only
    const detectSize = StoryElement.HANDLE_SIZE / panZoom.scale;
    const handles = this.getResizeHandles(panZoom);
    const handle = handles[0];
    if (!handle) {
      return null;
    }

    const dx = px - handle.x;
    const dy = py - handle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= detectSize) {
      return handle.direction;
    }

    return null;
  }

  /**
   * Prompt to edit story properties
   */
  public onDoubleClick(): void {
    editElement$.next(this);
  }

  clone(): PlanningElement {
    return new StoryElement({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      tasks: [],
      isCollapsed: this.isCollapsed,
      expandedWidth: this.expandedWidth,
      expandedHeight: this.expandedHeight,
    });
  }

  private getPreferredCollapsedWidth(): number {
    const trimmedTitle = this.title.trim();
    const titleLength = trimmedTitle.length > 0 ? trimmedTitle.length : 10;
    const titleWidth = Math.min(20, titleLength) * 7.2;
    const countLabel = `${this.tasks.length} ${this.tasks.length === 1 ? 'task' : 'tasks'}`;
    const countWidth = countLabel.length * 6.4;
    const chromeWidth = 84;
    return Math.max(
      StoryElement.collapsedMinWidth,
      Math.min(
        StoryElement.collapsedMaxWidth,
        Math.ceil(titleWidth + countWidth + chromeWidth)
      )
    );
  }
}
