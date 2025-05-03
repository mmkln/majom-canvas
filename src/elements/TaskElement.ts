// src/elements/Task.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import { SELECT_COLOR } from '../core/constants.ts';
import { taskStyles } from './styles/taskStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { editElement$ } from '../core/eventBus.ts';
import { v4 } from 'uuid';
import { TextRenderer } from '../utils/TextRenderer.ts';

/**
 * Task representation on the canvas
 */
export class TaskElement extends PlanningElement {
  title: string;
  status: ElementStatus = ElementStatus.Defined;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;

  static width: number = 180;
  static height: number = 90;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Task',
    description = '',
    status = ElementStatus.Defined,
    selected = false,
    priority = 'medium',
    dueDate = new Date(),
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    description?: string;
    status?: ElementStatus;
    selected?: boolean;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
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
    });
    this.zIndex = 2;
    this.title = title;
    this.status = status;
    this.selected = selected;
    this.priority = priority;
    this.dueDate = dueDate;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    // Ensure solid border for Task
    ctx.setLineDash([]);
    const x = this.x;
    const y = this.y;
    const w = TaskElement.width;
    const h = TaskElement.height;
    // Background
    const style = taskStyles[this.status];
    ctx.fillStyle = style.fillColor;
    ctx.strokeStyle = this.selected ? SELECT_COLOR : style.borderColor;
    ctx.lineWidth = (this.selected ? 2 : 1) / panZoom.scale;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8 * panZoom.scale);
    ctx.fill();
    ctx.stroke();
    
    // Title with word wrapping
    ctx.fillStyle = '#000000';
    ctx.font = `bold 14px Arial`;
    
    // Calculate maximum width for text (accounting for padding and buttons)
    const maxTitleWidth = w - 60; // Leaving space for buttons on right side
    
    // Draw title with word wrapping (font is already set)
    TextRenderer.drawWrappedText(
      ctx,
      this.title,
      x + 10,
      y + 20,
      maxTitleWidth,
      18, // Line height for 14px font
      3  // Max 3 lines of text
    );
    
    // Status badge
    ctx.fillStyle = style.borderColor;
    ctx.beginPath();
    ctx.arc(x + w - 12, y + 12, 6, 0, 2 * Math.PI);
    ctx.fill();
    // Edit button
    this.drawButton(ctx, panZoom, x + w - 32, y + 10, '✏️');
    // Delete button
    this.drawButton(ctx, panZoom, x + w - 16, y + 10, '🗑️');
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
        ctx.lineWidth = 1 / panZoom.scale;
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

  isEditButtonClicked(px: number, py: number): boolean {
    const bx = this.x + TaskElement.width - 32;
    const by = this.y + 10;
    const size = 16;
    return px >= bx && px <= bx + size && py >= by && py <= by + size;
  }

  isDeleteButtonClicked(px: number, py: number): boolean {
    const bx = this.x + TaskElement.width - 16;
    const by = this.y + 10;
    const size = 16;
    return px >= bx && px <= bx + size && py >= by && py <= by + size;
  }

  private drawButton(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    x: number,
    y: number,
    icon: string
  ): void {
    ctx.fillStyle = 'transparent';
    ctx.font = `14px Arial`;
    ctx.fillText(icon, x, y + 12);
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
