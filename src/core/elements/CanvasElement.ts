// src/core/elements/CanvasElement.ts
import { v4 as uuid } from 'uuid';
import { ICanvasElement, IPositioned } from '../interfaces/canvasElement.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { IShape } from '../interfaces/shape.ts';

/**
 * Base class for all canvas elements.
 */
export abstract class CanvasElement implements ICanvasElement, IPositioned {
  id: string;
  x: number;
  y: number;
  selected: boolean = false;
  isHovered: boolean = false;

  constructor(x: number = 0, y: number = 0) {
    this.id = uuid();
    this.x = x;
    this.y = y;
  }

  abstract draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    shapes?: IShape[]
  ): void;
  abstract contains(px: number, py: number): boolean;

  onDoubleClick?(): void {}
  onRightClick?(): void {}
  onDragStart?(): void {}
  onDrag?(x: number, y: number): void {}
  onDragEnd?(): void {}
}
