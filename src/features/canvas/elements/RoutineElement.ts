import { v4 } from 'uuid';
import { PlanningElement } from './PlanningElement.ts';
import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ElementStatus } from './ElementStatus.ts';
import { editElement$ } from '../core/eventBus.ts';
import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  FONT_FAMILY,
  TITLE_FONT_SIZE,
  SELECT_COLOR,
} from '../core/constants.ts';
import { TextRenderer } from '../utils/TextRenderer.ts';
import { normalizeRoutineStatus } from './routineStatus.ts';
import { routineStyles } from './styles/routineStyles.ts';

const ROUTINE_TEXT = '#000000';

export class RoutineElement extends PlanningElement {
  public static radius = 92;

  title: string;
  status: ElementStatus = ElementStatus.Defined;
  public borderColor: string =
    routineStyles[ElementStatus.InProgress].borderColor;

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'New Routine',
    description = '',
    selected = false,
    status = ElementStatus.InProgress,
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
    const normalizedStatus = normalizeRoutineStatus(status);
    const style = routineStyles[normalizedStatus];
    super({
      id,
      x,
      y,
      width: diameter,
      height: diameter,
      fillColor: style.fillColor,
      lineWidth: 2,
      title,
      description,
      backendId,
      uuid,
    });
    this.zIndex = 2;
    this.title = title;
    this.selected = selected;
    this.status = normalizedStatus;
    this.borderColor = style.borderColor;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const radius = RoutineElement.radius;
    const centerX = this.x + radius;
    const centerY = this.y + radius;

    ctx.save();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    const style = routineStyles[this.status];
    this.fillColor = style.fillColor;
    ctx.fillStyle = style.fillColor;
    ctx.fill();
    this.borderColor = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : style.borderColor;
    ctx.strokeStyle = this.focused
      ? FOCUS_COLOR
      : this.highlighted
        ? HIGHLIGHT_COLOR
        : this.selected
          ? SELECT_COLOR
          : style.borderColor;
    ctx.lineWidth = 2 / panZoom.scale;
    ctx.stroke();

    ctx.fillStyle = ROUTINE_TEXT;
    const fontSize = Math.max(12, TITLE_FONT_SIZE / panZoom.scale);
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    const label = (this.title || 'Routine').trim();
    const maxTextWidth = radius * 1.45;
    const lines = TextRenderer.wrapText(ctx, label, maxTextWidth, 2);
    const lineHeight = fontSize * 1.25;
    const blockHeight = lines.length > 0 ? (lines.length - 1) * lineHeight : 0;
    const startY = centerY - blockHeight / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });

    const hoveredPort: ConnectionPoint | undefined = (this as any).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      this.getConnectionPoints().forEach((point) => {
        const isPortHovered = hoveredPort
          ? point.x === hoveredPort.x && point.y === hoveredPort.y
          : false;
        if (!(this.selected || this.isHovered) && !isPortHovered) return;
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          (isPortHovered ? 8 : 4) / panZoom.scale,
          0,
          2 * Math.PI
        );
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

  public onDoubleClick(): void {
    editElement$.next(this);
  }
}
