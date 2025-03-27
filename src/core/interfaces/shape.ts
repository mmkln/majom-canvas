// core/interfaces/shape.ts
import { IDrawable } from './drawable';

export interface IShape extends IDrawable {
  id: string;
  x: number;
  y: number;
  radius: number;
  selected: boolean;
  contains(px: number, py: number): boolean;
  getBoundaryPoint(angle: number): { x: number; y: number };
  clone(): IShape;
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(dx: number, dy: number): void;
  onDragEnd?(): void;
}
