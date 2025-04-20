import type { ICanvasElement, IPositioned } from './canvasElement.ts';

/**
 * Interface for elements that support dragging (shapes, planning elements).
 */
export interface IDraggable extends ICanvasElement, IPositioned {
  /** hit-test for drag start */
  contains(px: number, py: number): boolean;
  /** called once at drag start */
  onDragStart?(): void;
  /** called during drag with new coordinates */
  onDrag?(x: number, y: number): void;
  /** called once at drag end */
  onDragEnd?(): void;
}
