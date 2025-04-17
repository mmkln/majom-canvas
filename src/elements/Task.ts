// src/elements/Task.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';

/**
 * Task representation on the canvas
 */
export class Task extends PlanningElement {
  title: string;
  status: 'pending' | 'in-progress' | 'done' = 'pending';

  static width: number = 180;
  static height: number = 90;

  constructor({
    id = `task-${Date.now()}`,
    x = 0,
    y = 0,
    title = 'New Task',
    description = '',
    status = 'pending'
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    description?: string;
    status?: 'pending' | 'in-progress' | 'done';
  }) {
    super({ id, x, y, width: Task.width, height: Task.height, fillColor: '#ffffff', lineWidth: 1, title, description });
    this.title = title;
    this.status = status;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const x = this.x;
    const y = this.y;
    const w = Task.width;
    const h = Task.height;
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = this.selected ? '#1890ff' : '#d9d9d9';
    ctx.lineWidth = this.selected ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = `bold 14px Arial`;
    ctx.fillText(this.title, x + 10, y + 20);
    // Status badge
    ctx.fillStyle = this.getStatusColor();
    ctx.beginPath();
    ctx.arc(x + w - 12, y + 12, 6, 0, 2 * Math.PI);
    ctx.fill();
    // Edit button
    this.drawButton(ctx, panZoom, x + w - 32, y + 10, '✏️');
    // Delete button
    this.drawButton(ctx, panZoom, x + w - 16, y + 10, '🗑️');
    // Draw connection anchors when selected or hovered
    if (this.selected || this.isHovered) {
      const points = this.getConnectionPoints();
      for (const point of points) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / panZoom.scale, 0, 2 * Math.PI);
        ctx.fillStyle = point.isHovered ? '#00ff00' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + Task.width && py >= this.y && py <= this.y + Task.height;
  }

  isEditButtonClicked(px: number, py: number): boolean {
    const bx = this.x + Task.width - 32;
    const by = this.y + 10;
    const size = 16;
    return px >= bx && px <= bx + size && py >= by && py <= by + size;
  }

  isDeleteButtonClicked(px: number, py: number): boolean {
    const bx = this.x + Task.width - 16;
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

  private getStatusColor(): string {
    switch (this.status) {
      case 'pending': return '#faad14';
      case 'in-progress': return '#1890ff';
      case 'done': return '#52c41a';
      default: return '#d9d9d9';
    }
  }

  onDoubleClick?(): void {}
  onRightClick?(): void {}
  onDragStart?(): void {}
  onDrag?(x: number, y: number): void { this.x = x; this.y = y; }
  onDragEnd?(): void {}

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const cx = this.x + Task.width / 2;
    const cy = this.y + Task.height / 2;
    return { x: cx + Math.cos(angle) * (Task.width / 2), y: cy + Math.sin(angle) * (Task.height / 2) };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const w = Task.width, h = Task.height;
    return [
      { x: this.x + w/2, y: this.y, angle: -Math.PI/2, isHovered: false, direction: 'top' },
      { x: this.x + w,   y: this.y + h/2, angle: 0,           isHovered: false, direction: 'right' },
      { x: this.x + w/2, y: this.y + h,   angle: Math.PI/2,    isHovered: false, direction: 'bottom' },
      { x: this.x,       y: this.y + h/2, angle: Math.PI,      isHovered: false, direction: 'left' }
    ];
  }

  clone(): PlanningElement {
    return new Task({ id: this.id, x: this.x, y: this.y, title: this.title, status: this.status });
  }
}
