import { v4 } from 'uuid';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { editElement$ } from '../core/eventBus.ts';
import {
  FONT_FAMILY,
  SELECT_COLOR,
  SHOW_GOAL_TEXT_SCALE,
} from '../core/constants.ts';
import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { PlanningElement } from './PlanningElement.ts';
import {
  HABIT_ACTIVE_FILL,
  HABIT_ARCHIVED_FILL,
} from './constants.ts';
import { TextRenderer } from '../utils/TextRenderer.ts';

const HABIT_TEXT_LIGHT = '#f8fafc';
const HABIT_TEXT_DARK = '#0f172a';
export type HabitCompletionEntry = [string, boolean];

export class HabitElement extends PlanningElement {
  public static readonly diameter = 180;
  public static readonly radius = HabitElement.diameter / 2;

  public readonly radius = HabitElement.radius;
  public habitStatus: Status.Active | Status.Archived = Status.Active;
  public priority: UiPriority = 'low';
  public meta: Record<string, unknown> | null = null;
  public completedToday = false;
  public isDueToday = false;
  public lastChecked: Date | null = null;
  public completionHistory: HabitCompletionEntry[] = [];

  constructor({
    id = v4(),
    x = 0,
    y = 0,
    title = 'Routine',
    description = '',
    habitStatus = Status.Active,
    priority = 'low',
    meta = null,
    completedToday = false,
    isDueToday = false,
    lastChecked = null,
    completionHistory = [],
    selected = false,
    backendId,
    uuid,
  }: {
    id?: string;
    x?: number;
    y?: number;
    title?: string;
    description?: string;
    habitStatus?: Status.Active | Status.Archived;
    priority?: UiPriority;
    meta?: Record<string, unknown> | null;
    completedToday?: boolean;
    isDueToday?: boolean;
    lastChecked?: Date | null;
    completionHistory?: HabitCompletionEntry[];
    selected?: boolean;
    backendId?: number | string;
    uuid?: string;
  }) {
    super({
      id,
      x,
      y,
      width: HabitElement.diameter,
      height: HabitElement.diameter,
      fillColor: HABIT_ACTIVE_FILL,
      lineWidth: 2,
      title,
      description,
      backendId,
      uuid,
    });
    this.zIndex = 2;
    this.habitStatus = habitStatus;
    this.priority = priority;
    this.meta = meta;
    this.completedToday = completedToday;
    this.isDueToday = isDueToday;
    this.lastChecked = lastChecked;
    this.completionHistory = completionHistory;
    this.selected = selected;
  }

  public draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const showText = panZoom.scale >= SHOW_GOAL_TEXT_SCALE;
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;
    const { fillColor, textColor } = this.resolveAppearance();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    if (this.selected) {
      ctx.strokeStyle = SELECT_COLOR;
      ctx.lineWidth = 3 / panZoom.scale;
      ctx.stroke();
    }

    if (showText) {
      ctx.fillStyle = textColor;
      ctx.font = `600 18px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = TextRenderer.wrapText(
        ctx,
        this.title,
        this.width * 0.68,
        3
      );
      const lineHeight = 24;
      const totalHeight = Math.max(0, (lines.length - 1) * lineHeight);
      const startY = centerY - totalHeight / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
      });
    }

    ctx.restore();
  }

  public contains(px: number, py: number): boolean {
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;
    const distanceSquared = (px - centerX) ** 2 + (py - centerY) ** 2;
    return distanceSquared <= this.radius ** 2;
  }

  public onDrag?(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

    public onDoubleClick(): void {
    editElement$.next(this);
  }

  public getBoundaryPoint(angle: number): { x: number; y: number } {
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;
    return {
      x: centerX + Math.cos(angle) * this.radius,
      y: centerY + Math.sin(angle) * this.radius,
    };
  }

  public getConnectionPoints(): ConnectionPoint[] {
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;
    return [
      {
        x: centerX,
        y: this.y,
        angle: -Math.PI / 2,
        isHovered: false,
        direction: 'top',
      },
      {
        x: this.x + this.width,
        y: centerY,
        angle: 0,
        isHovered: false,
        direction: 'right',
      },
      {
        x: centerX,
        y: this.y + this.height,
        angle: Math.PI / 2,
        isHovered: false,
        direction: 'bottom',
      },
      {
        x: this.x,
        y: centerY,
        angle: Math.PI,
        isHovered: false,
        direction: 'left',
      },
    ];
  }

  public override getNearestPoint(): { x: number; y: number } {
    return {
      x: this.x + this.radius,
      y: this.y + this.radius,
    };
  }

  public get status(): Status.Active | Status.Archived {
    return this.habitStatus;
  }

  public set status(value: Status.Active | Status.Archived) {
    this.habitStatus = value;
  }

  public clone(): HabitElement {
    return new HabitElement({
      x: this.x,
      y: this.y,
      title: this.title,
      description: this.description,
      habitStatus: this.habitStatus,
      priority: this.priority,
      meta: this.meta ? { ...this.meta } : null,
      completedToday: this.completedToday,
      isDueToday: this.isDueToday,
      lastChecked: this.lastChecked,
      completionHistory: this.completionHistory.map(([date, checked]) => [
        date,
        checked,
      ]),
    });
  }

  private resolveAppearance(): {
    fillColor: string;
    textColor: string;
  } {
    if (this.focused) {
      return {
        fillColor: '#a57aff',
        textColor: HABIT_TEXT_LIGHT,
      };
    }
    if (this.highlighted) {
      return {
        fillColor: '#F2A03D',
        textColor: HABIT_TEXT_LIGHT,
      };
    }
    if (this.habitStatus === Status.Archived) {
      return {
        fillColor: HABIT_ARCHIVED_FILL,
        textColor: HABIT_TEXT_DARK,
      };
    }
    return {
      fillColor: this.isDueToday ? '#3e7ae0' : HABIT_ACTIVE_FILL,
      textColor: HABIT_TEXT_LIGHT,
    };
  }
}
