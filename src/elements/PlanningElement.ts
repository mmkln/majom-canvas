// core/shapes/PlanningElement.ts
import { CanvasElement } from '../core/elements/CanvasElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import { IPlanningElement } from './interfaces/planningElement.ts';

export abstract class PlanningElement extends CanvasElement implements IPlanningElement {
  width: number;
  height: number;
  fillColor: string;
  lineWidth: number;
  title: string;
  description: string;
  dueDate?: Date;
  tags?: string[];

  constructor({
    id,
    x = 0,
    y = 0,
    width,
    height,
    fillColor = '#e6f7ff',
    lineWidth = 2,
    title = '',
    description = '',
    dueDate,
    tags
  }: {
    id?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    fillColor?: string;
    lineWidth?: number;
    title?: string;
    description?: string;
    dueDate?: Date;
    tags?: string[];
  }) {
    super(x, y);
    if (id) this.id = id;
    this.width = width;
    this.height = height;
    this.fillColor = fillColor;
    this.lineWidth = lineWidth;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.tags = tags;
  }

  // Abstract methods that subclasses must implement
  abstract draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract getConnectionPoints(): ConnectionPoint[];
  abstract clone(): IPlanningElement;
}
