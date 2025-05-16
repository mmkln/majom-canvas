// src/elements/Goal.ts
import { PlanningElement } from './PlanningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import {
  SELECT_COLOR,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SMALL_FONT_SIZE,
} from '../core/constants.ts';
import { editElement$ } from '../core/eventBus.ts';
import { v4 } from 'uuid';
import { goalStyles } from './styles/goalStyles.ts';
import { ElementStatus } from './ElementStatus.ts';
import { TextRenderer } from '../utils/TextRenderer.ts';

export class GoalElement extends PlanningElement {
  links: string[] = [];
  progress: number = 0;
  public status: ElementStatus = ElementStatus.Defined;
  public priority: 'low' | 'medium' | 'high' = 'medium';

  static diameter: number = 320;
  static width: number = GoalElement.diameter;
  static height: number = GoalElement.diameter;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Goal',
    status = ElementStatus.Defined,
    priority = 'medium',
    selected = false,
    description = '',
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    status?: ElementStatus;
    priority?: 'low' | 'medium' | 'high';
    selected?: boolean;
    description?: string;
  }) {
    super({
      id,
      x,
      y,
      width: GoalElement.width,
      height: GoalElement.height,
      fillColor: goalStyles[status].fillColor,
      lineWidth: 2,
      title,
    });
    this.zIndex = 3;
    this.status = status;
    this.priority = priority;
    this.selected = selected;
    this.description = description;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const { x, y, width, height, title, progress } = this;
    const style = goalStyles[this.status];
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = width / 2;

    // Background circle
    ctx.fillStyle = style.fillColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Progress ring (outside the main circle)
    const progressRingWidth = 12;
    const progressRingOffset = 8; // Space between main circle and progress ring
    const progressRingRadius = radius + progressRingOffset + (progressRingWidth / 2);
    
    // Background of progress ring (unfilled part)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(224,224,224,0.5)';
    ctx.lineWidth = progressRingWidth;
    ctx.arc(centerX, centerY, progressRingRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Filled progress
    ctx.beginPath();
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = progressRingWidth;
    ctx.arc(centerX, centerY, progressRingRadius, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
    ctx.stroke();

    // Border
    ctx.strokeStyle = this.selected ? SELECT_COLOR : style.borderColor;
    ctx.lineWidth = this.lineWidth / panZoom.scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Title with wrapping
    ctx.fillStyle = '#000000';
    const fontSize = 26;
    const lineHeight = 1.3;
    const maxTitleWidth = width * 0.8; // Use 80% of the circle's width
    
    // Center the text vertically and horizontally
    TextRenderer.drawWrappedText(
      ctx,
      title,
      centerX - maxTitleWidth/2,
      centerY - fontSize,  // Offset up by half the font size
      maxTitleWidth,
      lineHeight,
      3, // Max 3 lines for Goal title
      fontSize,
    );

    // Percentage text
    // ctx.fillStyle = '#000000';
    // ctx.font = `${SMALL_FONT_SIZE}px ${FONT_FAMILY}`;
    // ctx.textAlign = 'center';
    // const percentText = `${Math.round(progress * 100)}%`;
    // ctx.fillText(percentText, centerX, centerY + fontSize + 10);
    // ctx.textAlign = 'left'; // Reset text align

    // Anchors
    super.drawAnchors(ctx, panZoom);
  }

  contains(px: number, py: number): boolean {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = this.width / 2;
    const progressRingWidth = 12;
    const progressRingOffset = 8;
    const maxRadius = radius + progressRingOffset + progressRingWidth;
    
    const dx = px - centerX;
    const dy = py - centerY;
    const distanceSquared = dx * dx + dy * dy;
    
    // Check if point is within the outer boundary (including progress ring)
    return distanceSquared <= (maxRadius * maxRadius);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const radius = this.width / 2;
    return {
      x: this.x + this.width / 2 + Math.cos(angle) * radius,
      y: this.y + this.height / 2 + Math.sin(angle) * radius,
    };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const w = this.width,
      h = this.height;
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
    const clone = new GoalElement({
      x: this.x,
      y: this.y,
      title: this.title,
      status: this.status,
      priority: this.priority,
    });
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
