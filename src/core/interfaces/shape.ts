// core/shapes/shape.ts
import { IDrawable } from './drawable';

export interface IShape extends IDrawable {
  id: string;
  x: number;
  y: number;
  selected: boolean;
  radius: number;
  contains(px: number, py: number): boolean;
  getBoundaryPoint(angle: number): { x: number; y: number }; // Новий метод
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(dx: number, dy: number): void;
  onDragEnd?(): void;
}
