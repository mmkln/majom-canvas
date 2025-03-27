export interface IShape {
  id: number;
  draw(ctx: CanvasRenderingContext2D): void;
  contains(px: number, py: number): boolean;
}
