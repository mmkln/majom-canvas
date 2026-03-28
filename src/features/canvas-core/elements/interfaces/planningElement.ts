/**
 * Represents a planning element (Goal, Story, Task) that builds upon a basic canvas shape
 * with dimensions, styling, and richer metadata. Subclasses will implement drawing, hit-testing,
 * boundary computation, and connection points.
 */
import { PanZoomManager } from '../../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../../core/interfaces/shape.ts';
import type {
  CanvasInteractionState,
  CanvasInteractionStateScope,
  IStructuredCanvasNode,
} from './structuredCanvasNode.ts';

/**
 * A richer canvas element representing planning constructs (Task, Story, Goal).
 */
export interface IPlanningElement extends IStructuredCanvasNode {
  /** optional due date for this element */
  dueDate?: Date | null;
  /** optional tags/categories */
  tags?: string[];
  /** backend persistent ref; numeric for legacy entities, string for UUID-first ones */
  backendId?: number | string;
  /** backend uuid */
  uuid?: string;
  /** Layer index for draw ordering; lower draws first */
  zIndex: number;
  /** focused state visualized on canvas */
  focused?: boolean;
  /** highlight state visualized on canvas */
  highlighted?: boolean;
  interactionStates?: Iterable<CanvasInteractionState>;
  getInteractionStates(): ReadonlySet<CanvasInteractionState>;
  hasInteractionState(state: CanvasInteractionState): boolean;
  setInteractionState(
    state: CanvasInteractionState,
    active: boolean,
    scope?: CanvasInteractionStateScope
  ): void;
  replaceInteractionStates(
    states: Iterable<CanvasInteractionState>,
    scope?: CanvasInteractionStateScope
  ): void;
  clearInteractionStates(scope?: CanvasInteractionStateScope): void;
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
