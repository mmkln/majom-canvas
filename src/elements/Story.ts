// core/shapes/Story.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { Task } from './Task.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import { SELECT_COLOR } from '../core/constants.ts';

/**
 * Story representation on the canvas - a container for tasks
 */
export class Story extends PlanningElement {
  static width: number = 320;
  static height: number = 240;

  status: 'pending' | 'in-progress' | 'done' = 'pending';
  borderColor: string;
  tasks: Task[] = [];
  
  /**
   * Create a new Story
   */
  constructor({
    id = `story-${Date.now()}`,
    x = 0,
    y = 0,
    width = 320,
    height = 240,
    title = 'New Story',
    description = '',
    status = 'pending',
    borderColor = '#722ed1', // Default purple
    tasks = []
  }: {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    title?: string;
    description?: string;
    status?: 'pending' | 'in-progress' | 'done';
    borderColor?: string;
    tasks?: Task[];
  }) {
    super({ id, x, y, width, height, fillColor: 'rgba(250, 245, 255, 0.6)', lineWidth: 2, title, description });
    this.status = status;
    this.borderColor = borderColor;
    this.tasks = tasks;
    // Logic temporarily removed
  }

  /**
   * Draw the story container on canvas
   */
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    // Fill transparent story container
    ctx.fillStyle = this.fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8 / panZoom.scale);
    ctx.fill();
    // Border: dashed or solid based on selection
    if (this.selected) {
      ctx.setLineDash([]);
      ctx.strokeStyle = SELECT_COLOR;
    } else {
      ctx.setLineDash([4 / panZoom.scale, 4 / panZoom.scale]);
      ctx.strokeStyle = this.borderColor;
    }
    ctx.lineWidth = this.lineWidth / panZoom.scale;
    ctx.stroke();
    // Title text
    ctx.fillStyle = '#000000';
    ctx.font = `${14 / panZoom.scale}px Arial`;
    ctx.fillText(this.title, this.x + 8 / panZoom.scale, this.y + 16 / panZoom.scale);
    // Draw anchors via base class
    super.drawAnchors(ctx, panZoom);
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
    ctx.font = `${14 / panZoom.scale}px Arial`;
    ctx.fillText(icon, x + 3 / panZoom.scale, y + 16 / panZoom.scale);
  }
  
  /**
   * Check if coordinates are within this story
   */
  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
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
  addTask(task: Task): void {
    if (!this.tasks.find(t => t.id === task.id)) {
      this.tasks.push(task);
    }
  }

  /**
   * Remove a task from this story
   */
  removeTask(taskId: string): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  }
  
  getBoundaryPoint(angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
  
  getConnectionPoints(): ConnectionPoint[] {
    const points: ConnectionPoint[] = [];
    const w = this.width;
    const h = this.height;
    points.push({ x: this.x + w / 2, y: this.y, angle: -Math.PI/2, isHovered: false, direction: 'top' });
    points.push({ x: this.x + w, y: this.y + h / 2, angle: 0, isHovered: false, direction: 'right' });
    points.push({ x: this.x + w / 2, y: this.y + h, angle: Math.PI/2, isHovered: false, direction: 'bottom' });
    points.push({ x: this.x, y: this.y + h / 2, angle: Math.PI, isHovered: false, direction: 'left' });
    return points;
  }

  clone(): PlanningElement { return this; }
}
