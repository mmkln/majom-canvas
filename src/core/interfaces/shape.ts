// core/shapes/IShape.ts
export interface IShape {
  id: number;
  x: number;
  y: number;
  draw(ctx: CanvasRenderingContext2D): void;
  contains(px: number, py: number): boolean;
  // Можна додати методи для різних подій:
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(dx: number, dy: number): void;
  onDragEnd?(): void;
}
