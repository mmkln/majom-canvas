// src/elements/Goal.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';

export class Goal extends PlanningElement {
  constructor({ id = `goal-${Date.now()}`, x = 0, y = 0, width = 100, height = 100, fillColor = '#e6f7ff', lineWidth = 2, title = 'New Goal', description = '', dueDate, tags }: { id?: string; x?: number; y?: number; width?: number; height?: number; fillColor?: string; lineWidth?: number; title?: string; description?: string; dueDate?: Date; tags?: string[] }) {
    super({ id, x, y, width, height, fillColor, lineWidth, title, description, dueDate, tags });
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {}
  contains(px: number, py: number): boolean { return false; }
  getBoundaryPoint(angle: number): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
  getConnectionPoints(): ConnectionPoint[] {
    const w = this.width, h = this.height;
    return [
      { x: this.x + w/2, y: this.y, angle: -Math.PI/2, isHovered: false, direction: 'top' },
      { x: this.x + w,   y: this.y + h/2, angle: 0,           isHovered: false, direction: 'right' },
      { x: this.x + w/2, y: this.y + h,   angle: Math.PI/2,    isHovered: false, direction: 'bottom' },
      { x: this.x,       y: this.y + h/2, angle: Math.PI,      isHovered: false, direction: 'left' }
    ];
  }
  clone(): PlanningElement {
    return new Goal({ id: this.id, x: this.x, y: this.y, width: this.width, height: this.height, fillColor: this.fillColor, lineWidth: this.lineWidth, title: this.title, description: this.description, dueDate: this.dueDate, tags: this.tags });
  }
}
