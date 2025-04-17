/**
 * Represents a planning element (Goal, Story, Task) that builds upon a basic canvas shape
 * with dimensions, styling, and richer metadata. Subclasses will implement drawing, hit-testing,
 * boundary computation, and connection points.
 */
import { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import { PanZoomManager } from '../../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../../core/interfaces/shape.ts';

/**
 * A richer canvas element representing planning constructs (Task, Story, Goal).
 */
export interface IPlanningElement extends ICanvasElement {
  /** width in pixels under current zoom */
  width: number;
  /** height in pixels under current zoom */
  height: number;
  /** background fill color */
  fillColor: string;
  /** border stroke width */
  lineWidth: number;
  /** textual label/title */
  title: string;
  /** detailed description */
  description: string;
  /** optional due date for this element */
  dueDate?: Date;
  /** optional tags/categories */
  tags?: string[];
  /** clone the planning element */
  clone(): IPlanningElement;
  /** render with current pan/zoom */
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  /** point-in-element hit test */
  contains(px: number, py: number): boolean;
  /** compute boundary point at given angle */
  getBoundaryPoint(angle: number): { x: number; y: number };
  /** connection anchor points */
  getConnectionPoints(): ConnectionPoint[];
  /** optional user interaction lifecycle hooks */
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(x: number, y: number): void;
  onDragEnd?(): void;
}
