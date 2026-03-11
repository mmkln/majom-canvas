export type ConnectionPointLike = {
  x: number;
  y: number;
};

export type ConnectionPointHost<TPoint extends ConnectionPointLike> = {
  getConnectionPoints(): TPoint[];
};

export type ConnectionPointHit<
  TShape extends ConnectionPointHost<TPoint>,
  TPoint extends ConnectionPointLike,
> = {
  shape: TShape;
  point: TPoint;
};

/**
 * Finds top-most connection point under pointer in scene coordinates.
 */
export function findConnectionPointAt<
  TShape extends ConnectionPointHost<TPoint>,
  TPoint extends ConnectionPointLike,
>(
  sceneX: number,
  sceneY: number,
  elements: TShape[],
  scale: number,
  hitRadiusPx: number = 8
): ConnectionPointHit<TShape, TPoint> | null {
  const tolerance = hitRadiusPx / scale;
  for (let i = elements.length - 1; i >= 0; i -= 1) {
    const shape = elements[i];
    const points = shape.getConnectionPoints();
    for (const point of points) {
      const dx = sceneX - point.x;
      const dy = sceneY - point.y;
      if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
        return { shape, point };
      }
    }
  }
  return null;
}
