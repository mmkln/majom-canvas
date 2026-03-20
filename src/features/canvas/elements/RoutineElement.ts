import { v4 } from 'uuid';
import { PlanningElement } from './PlanningElement.ts';
import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ElementStatus } from './ElementStatus.ts';
import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SELECT_COLOR,
  SHOW_ANIM_SCALE,
} from '../core/constants.ts';

const ROUTINE_FILL = '#ECFDF3';
const ROUTINE_STROKE = '#22C55E';
const ROUTINE_TEXT = '#14532D';

export class RoutineElement extends PlanningElement {
  public static radius = 56;

  title: string;
  status: ElementStatus = ElementStatus.Defined;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Routine',
    description = '',
    selected = false,
    status = ElementStatus.Defined,
    backendId,
    uuid,
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    description?: string;
    selected?: boolean;
    status?: ElementStatus;
    backendId?: number;
    uuid?: string;
  }) {
    const diameter = RoutineElement.radius * 2;
    super({
      id,
      x,
      y,
      width: diameter,
      height: diameter,
      fillColor: ROUTINE_FILL,
      lineWidth: 2,
      title,
      description,
      backendId,
      uuid,
    });
    this.zIndex = 2;
    this.title = title;
    this.selected = selected;
    this.status = status;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const radius = RoutineElement.radius;
    const centerX = this.x + radius;
    const centerY = this.y + radius;

    ctx.save();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = ROUTINE_FILL;
    ctx.fill();
    ctx.strokeStyle = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : ROUTINE_STROKE;
    ctx.lineWidth = 2 / panZoom.scale;
    ctx.stroke();

    if (panZoom.scale >= SHOW_ANIM_SCALE) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 6 / panZoom.scale, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.lineWidth = 1 / panZoom.scale;
      ctx.stroke();
    }

    ctx.fillStyle = ROUTINE_TEXT;
    ctx.font = `${Math.max(11, 13 / panZoom.scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = (this.title || 'Routine').trim();
    const maxChars = 18;
    const short = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
    ctx.fillText(short, centerX, centerY, radius * 1.6);

    const hoveredPort: ConnectionPoint | undefined = (this as any).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      this.getConnectionPoints().forEach((point) => {
        const isPortHovered = hoveredPort
          ? point.x === hoveredPort.x && point.y === hoveredPort.y
          : false;
        if (!(this.selected || this.isHovered) && !isPortHovered) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, (isPortHovered ? 8 : 4) / panZoom.scale, 0, 2 * Math.PI);
        ctx.fillStyle = isPortHovered ? SELECT_COLOR : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5 / panZoom.scale;
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  contains(px: number, py: number): boolean {
    const radius = RoutineElement.radius;
    const centerX = this.x + radius;
    const centerY = this.y + radius;
    const dx = px - centerX;
    const dy = py - centerY;
    return dx * dx + dy * dy <= radius * radius;
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const radius = RoutineElement.radius;
    const centerX = this.x + radius;
    const centerY = this.y + radius;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  }

  getConnectionPoints(): ConnectionPoint[] {
    const radius = RoutineElement.radius;
    const centerX = this.x + radius;
    const centerY = this.y + radius;
    return [
      {
        x: centerX,
        y: centerY - radius,
        angle: -Math.PI / 2,
        isHovered: false,
        direction: 'top',
      },
      {
        x: centerX + radius,
        y: centerY,
        angle: 0,
        isHovered: false,
        direction: 'right',
      },
      {
        x: centerX,
        y: centerY + radius,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
      },
      {
        x: centerX - radius,
        y: centerY,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
      },
    ];
  }

  clone(): PlanningElement {
    return new RoutineElement({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      status: this.status,
      backendId: this.backendId,
      uuid: this.uuid,
    });
  }


}
