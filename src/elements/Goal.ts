// src/elements/Goal.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import { SELECT_COLOR, GOAL_FILL_COLOR, GOAL_BORDER_COLOR, FONT_FAMILY, TITLE_FONT_SIZE, SMALL_FONT_SIZE } from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';

export class Goal extends PlanningElement {
  links: string[] = [];
  progress: number = 0;
  public status: 'pending' | 'in-progress' | 'done' = 'pending';
  public priority: 'low' | 'medium' | 'high' = 'medium';

  constructor({ id = `goal-${Date.now()}`, x = 0, y = 0, width = 200, height = 120, title = 'New Goal', status = 'pending', priority = 'medium' }: { id?: string; x?: number; y?: number; width?: number; height?: number; title?: string; status?: 'pending' | 'in-progress' | 'done'; priority?: 'low' | 'medium' | 'high' }) {
    super({ id, x, y, width, height, fillColor: GOAL_FILL_COLOR, lineWidth: 2, title });
    this.zIndex = 3;
    this.status = status;
    this.priority = priority;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const { x, y, width, height, title, progress, links } = this;
    // Background
    ctx.fillStyle = this.fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    // Border
    ctx.strokeStyle = this.selected ? SELECT_COLOR : GOAL_BORDER_COLOR;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = `${TITLE_FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.fillText(title, x + 8, y + 20);
    // Progress bar background
    const barX = x + 8;
    const barY = y + height - 16;
    const barWidth = width - 16;
    const barHeight = 8;
    ctx.fillStyle = GOAL_FILL_COLOR;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // Progress fill
    ctx.fillStyle = GOAL_BORDER_COLOR;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    // Percentage text
    ctx.fillStyle = '#000000';
    ctx.font = `${SMALL_FONT_SIZE}px ${FONT_FAMILY}`;
    const percentText = `${Math.round(progress * 100)}%`;
    ctx.fillText(percentText, barX + barWidth * progress + 4, barY + barHeight + 12);
    // Link count icon and number at top-right
    const linkText = `🔗${links.length}`;
    const textWidth = ctx.measureText(linkText).width;
    ctx.fillText(linkText, x + width - 8 - textWidth, y + 20);
    // Anchors
    super.drawAnchors(ctx, panZoom);
  }

  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    return {
      x: this.x + this.width / 2 + Math.cos(angle) * (this.width / 2),
      y: this.y + this.height / 2 + Math.sin(angle) * (this.height / 2)
    };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const w = this.width, h = this.height;
    return [
      { x: this.x + w / 2, y: this.y, angle: -Math.PI / 2, isHovered: false, direction: 'top' },
      { x: this.x + w, y: this.y + h / 2, angle: 0, isHovered: false, direction: 'right' },
      { x: this.x + w / 2, y: this.y + h, angle: Math.PI / 2, isHovered: false, direction: 'bottom' },
      { x: this.x, y: this.y + h / 2, angle: Math.PI, isHovered: false, direction: 'left' }
    ];
  }

  clone(): PlanningElement {
    const clone = new Goal({ x: this.x, y: this.y, width: this.width, height: this.height, title: this.title, status: this.status, priority: this.priority });
    clone.progress = this.progress;
    clone.links = [...this.links];
    return clone;
  }

  /**
   * Prompt to edit goal title
   */
  public onDoubleClick(): void {
    editElement$.next(this);
  }
}
