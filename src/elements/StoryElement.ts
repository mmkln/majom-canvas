// core/shapes/Story.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { TaskElement } from './TaskElement.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SMALL_FONT_SIZE,
} from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';
import { storyStyles } from './styles/storyStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { v4 } from 'uuid';
import { TextRenderer } from '../utils/TextRenderer.ts';

/**
 * Story representation on the canvas - a container for tasks
 */
export class StoryElement extends PlanningElement {
  static width: number = 320;
  static height: number = 240;
  /** Size for resize handles (in px) */
  // Size in px for the circular resize handle (larger for better UX)
  static HANDLE_SIZE: number = 8;

  status: ElementStatus = ElementStatus.Defined;
  tasks: TaskElement[] = [];
  public priority: 'low' | 'medium' | 'high' = 'medium';
  /** Currently hovered resize direction */
  public hoveredResizeHandle: 'nw' | 'ne' | 'se' | 'sw' | null = null;

  /**
   * Create a new Story
   */
  constructor({
    id = v4(),
    x = 0,
    y = 0,
    width = 320,
    height = 240,
    title = 'New Story',
    description = '',
    status = ElementStatus.Defined,
    priority = 'medium',
    tasks = [],
    selected = false,
  }: {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    title?: string;
    description?: string;
    status?: ElementStatus;
    priority?: 'low' | 'medium' | 'high';
    tasks?: TaskElement[];
    selected?: boolean;
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
    });
    // layer ordering: draw stories below tasks
    this.zIndex = 1;
    this.status = status;
    this.priority = priority;
    this.tasks = tasks;
    this.selected = selected;
  }

  /**
   * Draw the story container on canvas
   */
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    // Apply fill and border based on status
    const style = storyStyles[this.status];
    ctx.fillStyle = style.fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8 * panZoom.scale);
    ctx.fill();
    // Border: dashed or solid
    const dashOn = 6 / panZoom.scale;
    const dashOff = 2 / panZoom.scale;
    ctx.setLineDash(this.selected ? [] : [dashOn, dashOff]);
    ctx.strokeStyle = this.selected ? SELECT_COLOR : style.borderColor;
    ctx.lineWidth = this.lineWidth / panZoom.scale;
    ctx.stroke();
    // Title text with word wrapping
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    // Calculate max width for title, accounting for potential buttons
    const maxTitleWidth = this.width - 90; // Leave space for buttons on the right
    const fontSize = 24;
    const lineHeight = 1.3;
    TextRenderer.drawWrappedText(
      ctx,
      this.title,
      this.x + 16,
      this.y + 32,
      maxTitleWidth,
      lineHeight,
      3, // Max 2 lines for Story title
      fontSize,
    );
    // Draw anchors via base class
    super.drawAnchors(ctx, panZoom);
    // Draw resize handles when selected or hovered
    if (this.selected || this.isHovered) {
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

  /**
   * Check if coordinates are within this story
   */
  contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
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
    });
  }
}
