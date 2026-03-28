import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import type { IConnectable } from '../../core/interfaces/connectable.ts';
import type { ConnectionPoint } from '../../core/interfaces/shape.ts';
import type { PanZoomManager } from '../../core/managers/PanZoomManager.ts';
import type { CanvasAppearanceAdapter } from '../../adapters/CanvasAppearanceAdapter.ts';

export type CanvasInteractionState = string;
export type CanvasInteractionStateScope = 'core' | 'external';

export const CANVAS_INTERACTION_STATES = {
  focused: 'focused',
  highlighted: 'highlighted',
} as const;

export interface IStructuredCanvasNode extends ICanvasElement, IConnectable {
  nodeKind: string;
  width: number;
  height: number;
  fillColor: string;
  lineWidth: number;
  title: string;
  description: string;
  appearanceAdapter?: CanvasAppearanceAdapter | null;
  interactionStates?: Iterable<CanvasInteractionState>;
  focused?: boolean;
  highlighted?: boolean;
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
  clone(): IStructuredCanvasNode;
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  contains(px: number, py: number): boolean;
  getBoundaryPoint(angle: number): { x: number; y: number };
  getConnectionPoints(): ConnectionPoint[];
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(x: number, y: number): void;
  onDragEnd?(): void;
}
