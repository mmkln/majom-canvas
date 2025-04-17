// core/shapes/Story.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { Task } from './Task.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';

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
  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    // Apply pan and zoom transformations
    const x = (this.x - panZoom.scrollX) / panZoom.scale;
    const y = (this.y - panZoom.scrollY) / panZoom.scale;
    const width = this.width / panZoom.scale;
    const height = this.height / panZoom.scale;
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(250, 245, 255, 0.6)'; // Light purple with transparency
    ctx.strokeStyle = this.selected ? '#1890ff' : this.borderColor;
    ctx.lineWidth = this.selected ? 3 / panZoom.scale : 2 / panZoom.scale;
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8 / panZoom.scale);
    ctx.fill();
    ctx.stroke();
    
    // Story title background
    const titleHeight = 32 / panZoom.scale;
    ctx.fillStyle = this.borderColor + '33'; // Same as border color with transparency
    ctx.beginPath();
    ctx.roundRect(
      x, 
      y, 
      width, 
      titleHeight, 
      [8 / panZoom.scale, 8 / panZoom.scale, 0, 0]
    );
    ctx.fill();
    
    // Story title
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${16 / panZoom.scale}px Arial`;
    ctx.fillText(
      this.title, 
      x + 12 / panZoom.scale, 
      y + 22 / panZoom.scale, 
      width - 100 / panZoom.scale
    );
    
    // Button area in title bar
    const buttonAreaWidth = 80 / panZoom.scale;
    const buttonY = y + 6 / panZoom.scale;
    
    // Draw edit button
    this.drawButton(
      ctx, 
      panZoom,
      x + width - buttonAreaWidth, 
      buttonY, 
      '✏️', 
      'transparent'
    );
    
    // Draw delete button
    this.drawButton(
      ctx, 
      panZoom,
      x + width - buttonAreaWidth + 30 / panZoom.scale, 
      buttonY, 
      '🗑️', 
      'transparent'
    );
    
    // Draw add task button
    this.drawButton(
      ctx, 
      panZoom,
      x + width - buttonAreaWidth + 60 / panZoom.scale, 
      buttonY, 
      '➕', 
      'transparent'
    );
    
    // Draw tasks within this story (for demonstration)
    // In a real implementation, this might be handled by the renderer
    if (this.tasks.length > 0) {
      // Just show the task count for now
      ctx.fillStyle = '#666666';
      ctx.font = `${14 / panZoom.scale}px Arial`;
      ctx.fillText(
        `${this.tasks.length} tasks`,
        x + 12 / panZoom.scale,
        y + 60 / panZoom.scale
      );
    } else {
      // Empty state message
      ctx.fillStyle = '#999999';
      ctx.font = `italic ${14 / panZoom.scale}px Arial`;
      ctx.fillText(
        'Drag tasks here or use + button to add tasks',
        x + 20 / panZoom.scale,
        y + 60 / panZoom.scale
      );
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
    // Logic temporarily removed
  }
  
  /**
   * Remove a task from this story
   */
  removeTask(taskId: string): void {
    // Logic temporarily removed
  }
  
  getBoundaryPoint(angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
  
  getConnectionPoints(): ConnectionPoint[] { return []; }
  
  clone(): PlanningElement { return this; }
}
