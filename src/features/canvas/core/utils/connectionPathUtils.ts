import type { ConnectionPoint } from '../interfaces/shape.ts';

type Point = { x: number; y: number };

export function buildCyberPath(
  start: ConnectionPoint,
  end: ConnectionPoint,
  scale: number
): {
  path: Point[];
  corners: Point[];
} {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const stubBase = 26 / scale;
  const stubLen = Math.min(stubBase, distance * 0.3);
  const pathPoints: Point[] = [];

  if (distance <= stubLen * 2 || Math.abs(dx) < 0.5 || Math.abs(dy) < 0.5) {
    pathPoints.push({ x: start.x, y: start.y }, { x: end.x, y: end.y });
  } else {
    const startStub = {
      x: start.x + Math.cos(start.angle) * stubLen,
      y: start.y + Math.sin(start.angle) * stubLen,
    };
    const endStub = {
      x: end.x + Math.cos(end.angle) * stubLen,
      y: end.y + Math.sin(end.angle) * stubLen,
    };
    const midX = startStub.x + (endStub.x - startStub.x) * 0.5;
    const midY = startStub.y + (endStub.y - startStub.y) * 0.5;

    pathPoints.push({ x: start.x, y: start.y }, startStub);
    if (
      Math.abs(endStub.x - startStub.x) >= Math.abs(endStub.y - startStub.y)
    ) {
      pathPoints.push({ x: midX, y: startStub.y }, { x: midX, y: endStub.y });
    } else {
      pathPoints.push({ x: startStub.x, y: midY }, { x: endStub.x, y: midY });
    }
    pathPoints.push(endStub, { x: end.x, y: end.y });
  }

  const filtered = pathPoints.filter((point, index, arr) => {
    if (index === 0) return true;
    return distanceBetween(point, arr[index - 1]) > 0.5;
  });

  if (filtered.length <= 2) {
    return { path: filtered, corners: [] };
  }

  const cornerBase = 14 / scale;
  const corners = filtered.slice(2, -2);
  const path: Point[] = [{ ...filtered[0] }];
  for (let i = 1; i < filtered.length - 1; i += 1) {
    const prev = filtered[i - 1];
    const curr = filtered[i];
    const next = filtered[i + 1];
    const v1 = normalize(prev.x - curr.x, prev.y - curr.y);
    const v2 = normalize(next.x - curr.x, next.y - curr.y);
    const maxCorner = Math.min(
      cornerBase,
      distanceBetween(curr, prev) * 0.5,
      distanceBetween(curr, next) * 0.5
    );
    const p1 = {
      x: curr.x + v1.x * maxCorner,
      y: curr.y + v1.y * maxCorner,
    };
    const p2 = {
      x: curr.x + v2.x * maxCorner,
      y: curr.y + v2.y * maxCorner,
    };
    path.push(p1, p2);
  }
  path.push({ ...filtered[filtered.length - 1] });
  return { path, corners };
}

function normalize(x: number, y: number): Point {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
