import type { OutlinePath } from './statusAnimationTypes.ts';

const clampRadius = (width: number, height: number, radius: number): number =>
  Math.max(0, Math.min(radius, width / 2, height / 2));

const getRoundedRectPerimeter = (
  width: number,
  height: number,
  radius: number
): number => {
  const clampedRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  const straight = 2 * (width + height - 4 * clampedRadius);
  const curved = 2 * Math.PI * clampedRadius;
  return straight + curved;
};

const getRoundedRectPoint = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  t: number
): { x: number; y: number } => {
  const r = clampRadius(width, height, radius);
  const straightX = Math.max(0, width - 2 * r);
  const straightY = Math.max(0, height - 2 * r);
  const arcLen = (Math.PI / 2) * r;
  const perimeter = 2 * (straightX + straightY) + (r > 0 ? 2 * Math.PI * r : 0);
  const d = (((t % 1) + 1) % 1) * perimeter;

  let remaining = d;

  if (remaining <= straightX) {
    return { x: x + r + remaining, y };
  }
  remaining -= straightX;

  if (r > 0 && remaining <= arcLen) {
    const angle = -Math.PI / 2 + (remaining / arcLen) * (Math.PI / 2);
    return {
      x: x + width - r + Math.cos(angle) * r,
      y: y + r + Math.sin(angle) * r,
    };
  }
  remaining -= r > 0 ? arcLen : 0;

  if (remaining <= straightY) {
    return { x: x + width, y: y + r + remaining };
  }
  remaining -= straightY;

  if (r > 0 && remaining <= arcLen) {
    const angle = (remaining / arcLen) * (Math.PI / 2);
    return {
      x: x + width - r + Math.cos(angle) * r,
      y: y + height - r + Math.sin(angle) * r,
    };
  }
  remaining -= r > 0 ? arcLen : 0;

  if (remaining <= straightX) {
    return { x: x + width - r - remaining, y: y + height };
  }
  remaining -= straightX;

  if (r > 0 && remaining <= arcLen) {
    const angle = Math.PI / 2 + (remaining / arcLen) * (Math.PI / 2);
    return {
      x: x + r + Math.cos(angle) * r,
      y: y + height - r + Math.sin(angle) * r,
    };
  }
  remaining -= r > 0 ? arcLen : 0;

  if (remaining <= straightY) {
    return { x, y: y + height - r - remaining };
  }
  remaining -= straightY;

  if (r > 0 && remaining <= arcLen) {
    const angle = Math.PI + (remaining / arcLen) * (Math.PI / 2);
    return {
      x: x + r + Math.cos(angle) * r,
      y: y + r + Math.sin(angle) * r,
    };
  }

  return { x: x + r, y };
};

export const createRectOutline = ({
  x,
  y,
  width,
  height,
  radius,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}): OutlinePath => {
  const getAdjusted = (offset: number) => {
    const adjX = x - offset;
    const adjY = y - offset;
    const adjW = Math.max(0, width + offset * 2);
    const adjH = Math.max(0, height + offset * 2);
    const adjRadius = clampRadius(adjW, adjH, radius + offset);
    return { adjX, adjY, adjW, adjH, adjRadius };
  };

  return {
    drawPath: (ctx, offset) => {
      const { adjX, adjY, adjW, adjH, adjRadius } = getAdjusted(offset);
      ctx.roundRect(adjX, adjY, adjW, adjH, adjRadius);
    },
    perimeter: (offset) => {
      const { adjW, adjH, adjRadius } = getAdjusted(offset);
      return getRoundedRectPerimeter(adjW, adjH, adjRadius);
    },
    pointAt: (t, offset) => {
      const { adjX, adjY, adjW, adjH, adjRadius } = getAdjusted(offset);
      return getRoundedRectPoint(adjX, adjY, adjW, adjH, adjRadius, t);
    },
  };
};

export const createCircleOutline = ({
  centerX,
  centerY,
  radius,
}: {
  centerX: number;
  centerY: number;
  radius: number;
}): OutlinePath => {
  const getRadius = (offset: number) => Math.max(0, radius + offset);

  return {
    drawPath: (ctx, offset) => {
      ctx.arc(centerX, centerY, getRadius(offset), 0, Math.PI * 2);
    },
    perimeter: (offset) => Math.PI * 2 * getRadius(offset),
    pointAt: (t, offset) => {
      const progress = ((t % 1) + 1) % 1;
      const angle = progress * Math.PI * 2;
      const r = getRadius(offset);
      return {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
      };
    },
  };
};

export const createHexOutline = ({
  centerX,
  centerY,
  radius,
}: {
  centerX: number;
  centerY: number;
  radius: number;
}): OutlinePath => {
  const sides = 8;
  const angleStep = (Math.PI * 2) / sides;
  const angleOffset = -Math.PI / 2 - angleStep / 2;
  const getRadius = (offset: number) => Math.max(0, radius + offset);
  const getVertices = (offset: number) => {
    const r = getRadius(offset);
    const vertices: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < sides; i += 1) {
      const angle = angleOffset + angleStep * i;
      vertices.push({
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      });
    }
    return vertices;
  };
  const getPolygonData = (offset: number) => {
    const vertices = getVertices(offset);
    const edgeLengths: number[] = [];
    let totalLength = 0;
    for (let i = 0; i < vertices.length; i += 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const edgeLength = Math.hypot(b.x - a.x, b.y - a.y);
      edgeLengths.push(edgeLength);
      totalLength += edgeLength;
    }
    return { vertices, edgeLengths, totalLength };
  };

  return {
    drawPath: (ctx, offset) => {
      const vertices = getVertices(offset);
      vertices.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
    },
    perimeter: (offset) => getPolygonData(offset).totalLength,
    pointAt: (t, offset) => {
      const progress = ((t % 1) + 1) % 1;
      const { vertices, edgeLengths, totalLength } = getPolygonData(offset);
      if (totalLength <= 0) return { x: centerX, y: centerY };
      let remaining = progress * totalLength;
      for (let i = 0; i < vertices.length; i += 1) {
        const length = edgeLengths[i];
        if (remaining <= length || i === vertices.length - 1) {
          const a = vertices[i];
          const b = vertices[(i + 1) % vertices.length];
          const edgeT = length > 0 ? remaining / length : 0;
          return {
            x: a.x + (b.x - a.x) * edgeT,
            y: a.y + (b.y - a.y) * edgeT,
          };
        }
        remaining -= length;
      }
      return vertices[0];
    },
  };
};
