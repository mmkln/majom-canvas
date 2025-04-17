// src/elements/Task.ts
import { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';

/**
 * Task representation on the canvas
 */
export class Task implements ICanvasElement {
  id: string;
  x: number;
  y: number;
  selected: boolean = false;
  title: string;
  status: 'pending' | 'in-progress' | 'done' = 'pending';

  static width: number = 180;
  static height: number = 90;

  constructor({
    id = `task-${Date.now()}`,
    x = 0,
    y = 0,
    title = 'New Task',
    status = 'pending'
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    status?: 'pending' | 'in-progress' | 'done';
  }) {
    this.id = id;
    this.x = x;
    this.y = y;
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
}
