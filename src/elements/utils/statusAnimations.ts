import { ElementStatus } from '../ElementStatus.ts';

const SWEEP_DURATION_MS = 9600;
const SWEEP_GLOW_RADIUS = 14;
const SWEEP_GLOW_ALPHA = 0.4;
const PULSE_DURATION_MS = 2400;
const PULSE_ALPHA_MIN = 0;
const PULSE_ALPHA_MAX = 0.55;
const PULSE_EXPAND_MAX = 22;
const PULSE_COLOR = '24,144,255';
const PULSE_OVERLAP_OFFSET = 0.55;
const ANTS_DURATION_MS = 2400;
const ANTS_DASH = 12;
const ANTS_GAP = 12;
const ANTS_OFFSET = 4;
const ANTS_ALPHA = 0.5;
const ANTS_LINE_MULTIPLIER = 1;
const DEFINED_DRAW_DURATION_MS = 9600;
const DEFINED_CYCLE_MS = 9600;
const DEFINED_ALPHA = 0.6;
const DEFINED_OFFSET = 4;
const DEFINED_SEGMENT_RATIO = 0.1;

const getSweepProgress = (timeMs: number): number =>
  (timeMs % SWEEP_DURATION_MS) / SWEEP_DURATION_MS;

const getPulseProgress = (timeMs: number): number =>
  (timeMs % PULSE_DURATION_MS) / PULSE_DURATION_MS;

const getAntsOffset = (timeMs: number, scale: number): number =>
  -((timeMs % ANTS_DURATION_MS) / ANTS_DURATION_MS) *
  ((ANTS_DASH + ANTS_GAP) / scale);

const getDefinedProgress = (timeMs: number): number =>
  (timeMs % DEFINED_CYCLE_MS) / DEFINED_CYCLE_MS;

const getDefinedSegmentFactor = (progress: number): number => {
  const ramp = 0.2;
  if (progress < ramp) return progress / ramp;
  if (progress > 1 - ramp) return (1 - progress) / ramp;
  return 1;
};

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

const isRectVisible = (
  viewBounds: { minX: number; minY: number; maxX: number; maxY: number } | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number
): boolean => {
  if (!viewBounds) return true;
  const right = x + width;
  const bottom = y + height;
  return (
    right >= viewBounds.minX &&
    x <= viewBounds.maxX &&
    bottom >= viewBounds.minY &&
    y <= viewBounds.maxY
  );
};

const isCircleVisible = (
  viewBounds: { minX: number; minY: number; maxX: number; maxY: number } | null | undefined,
  centerX: number,
  centerY: number,
  radius: number
): boolean => {
  if (!viewBounds) return true;
  const left = centerX - radius;
  const right = centerX + radius;
  const top = centerY - radius;
  const bottom = centerY + radius;
  return (
    right >= viewBounds.minX &&
    left <= viewBounds.maxX &&
    bottom >= viewBounds.minY &&
    top <= viewBounds.maxY
  );
};

export const hasStatusAnimation = (status?: ElementStatus): boolean =>
  status === ElementStatus.Done ||
  status === ElementStatus.InProgress ||
  status === ElementStatus.Pending ||
  status === ElementStatus.Defined;

type RectAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

type CircleAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

type OutlinePath = {
  drawPath: (ctx: CanvasRenderingContext2D, offset: number) => void;
  perimeter: (offset: number) => number;
  pointAt: (t: number, offset: number) => { x: number; y: number };
};

type OutlineAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  outline: OutlinePath;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: { minX: number; minY: number; maxX: number; maxY: number } | null;
};

type OutlineEffectParams = Omit<OutlineAnimationParams, 'status'>;

const clampRadius = (width: number, height: number, radius: number): number =>
  Math.max(0, Math.min(radius, width / 2, height / 2));

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
  const perimeter =
    2 * (straightX + straightY) + (r > 0 ? 2 * Math.PI * r : 0);
  const d = ((t % 1) + 1) % 1 * perimeter;

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
    const angle = 0 + (remaining / arcLen) * (Math.PI / 2);
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

const createRectOutline = ({
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

const createCircleOutline = ({
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

const drawGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
): void => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255,255,255,${SWEEP_GLOW_ALPHA})`);
  gradient.addColorStop(0.5, `rgba(255,255,255,${SWEEP_GLOW_ALPHA * 0.4})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const getPulseAlpha = (progress: number): number =>
  Math.max(PULSE_ALPHA_MIN, PULSE_ALPHA_MAX * (1 - progress));

const getPulseExpand = (progress: number, scale: number): number =>
  (PULSE_EXPAND_MAX * progress) / scale;

const drawDoneBorderSweep = ({
  ctx,
  outline,
  lineWidth,
  scale,
  timeMs,
}: OutlineEffectParams): void => {
  const progress = getSweepProgress(timeMs);
  const glowRadius = SWEEP_GLOW_RADIUS / scale;
  const p1 = outline.pointAt(progress, 0);
  const p2 = outline.pointAt(progress + 0.5, 0);
  drawGlow(ctx, p1.x, p1.y, glowRadius);
  drawGlow(ctx, p2.x, p2.y, glowRadius);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = lineWidth * 0.7;
  ctx.beginPath();
  outline.drawPath(ctx, 0);
  ctx.stroke();
  ctx.restore();
};

const drawInProgressPulse = ({
  ctx,
  outline,
  lineWidth,
  scale,
  timeMs,
}: OutlineEffectParams): void => {
  const drawPulse = (progress: number): void => {
    const alpha = getPulseAlpha(progress);
    const expand = getPulseExpand(progress, scale);
    const baseAlpha = alpha * 0.55;
    const innerAlpha = Math.min(0.9, alpha * 1.4);

    ctx.save();
    ctx.fillStyle = `rgba(${PULSE_COLOR},${baseAlpha})`;
    ctx.beginPath();
    outline.drawPath(ctx, expand);
    outline.drawPath(ctx, 0);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${innerAlpha})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    outline.drawPath(ctx, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${baseAlpha * 0.6})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    outline.drawPath(ctx, expand);
    ctx.stroke();
    ctx.restore();
  };

  const progress = getPulseProgress(timeMs);
  drawPulse(progress);
  drawPulse((progress + PULSE_OVERLAP_OFFSET) % 1);
};

const drawPendingMarchingAnts = ({
  ctx,
  outline,
  lineWidth,
  scale,
  color,
  timeMs,
}: OutlineEffectParams): void => {
  if (!color) return;
  const offset = ANTS_OFFSET / scale;
  ctx.save();
  ctx.globalAlpha = ANTS_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * ANTS_LINE_MULTIPLIER;
  ctx.setLineDash([ANTS_DASH / scale, ANTS_GAP / scale]);
  ctx.lineDashOffset = getAntsOffset(timeMs, scale);
  ctx.beginPath();
  outline.drawPath(ctx, offset);
  ctx.stroke();
  ctx.restore();
};

const drawDefinedBorder = ({
  ctx,
  outline,
  lineWidth,
  scale,
  color,
  timeMs,
}: OutlineEffectParams): void => {
  if (!color) return;
  const cycleProgress = getDefinedProgress(timeMs);
  const activePortion = DEFINED_DRAW_DURATION_MS / DEFINED_CYCLE_MS;
  if (cycleProgress <= 0 || cycleProgress > activePortion) return;
  const drawProgress = cycleProgress / activePortion;
  const offset = DEFINED_OFFSET / scale;
  const perimeter = outline.perimeter(offset);
  const segmentFactor = getDefinedSegmentFactor(drawProgress);
  const segmentLength = perimeter * DEFINED_SEGMENT_RATIO * segmentFactor;

  ctx.save();
  ctx.globalAlpha = DEFINED_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * 0.7;
  ctx.setLineDash([segmentLength, perimeter]);
  ctx.lineDashOffset = -perimeter * drawProgress;
  ctx.beginPath();
  outline.drawPath(ctx, offset);
  ctx.stroke();
  ctx.restore();
};

export const drawDoneBorderSweepRect = ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  lineWidth,
  scale,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs: number;
}): void => {
  const outline = createRectOutline({ x, y, width, height, radius });
  drawDoneBorderSweep({
    ctx,
    outline,
    lineWidth,
    scale,
    timeMs,
  });
};

export const drawDoneBorderSweepCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs: number;
}): void => {
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawDoneBorderSweep({
    ctx,
    outline,
    lineWidth,
    scale,
    timeMs,
  });
};

export const drawInProgressPulseRect = ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  lineWidth,
  scale,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs: number;
}): void => {
  const outline = createRectOutline({ x, y, width, height, radius });
  drawInProgressPulse({
    ctx,
    outline,
    lineWidth,
    scale,
    timeMs,
  });
};

export const drawInProgressPulseCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs: number;
}): void => {
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawInProgressPulse({
    ctx,
    outline,
    lineWidth,
    scale,
    timeMs,
  });
};

export const drawPendingMarchingAntsRect = ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  lineWidth,
  scale,
  color,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs: number;
}): void => {
  const outline = createRectOutline({ x, y, width, height, radius });
  drawPendingMarchingAnts({
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
  });
};

export const drawPendingMarchingAntsCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  color,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs: number;
}): void => {
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawPendingMarchingAnts({
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
  });
};

const STATUS_ANIMATIONS: Partial<
  Record<ElementStatus, (params: OutlineAnimationParams) => void>
> = {
  [ElementStatus.Done]: drawDoneBorderSweep,
  [ElementStatus.InProgress]: drawInProgressPulse,
  [ElementStatus.Pending]: drawPendingMarchingAnts,
  [ElementStatus.Defined]: drawDefinedBorder,
};

const drawStatusAnimation = (params: OutlineAnimationParams): void => {
  const handler = STATUS_ANIMATIONS[params.status];
  if (!handler) return;
  handler(params);
};

export const drawStatusAnimationRect = (params: RectAnimationParams): void => {
  const {
    status,
    ctx,
    x,
    y,
    width,
    height,
    radius,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
  } = params;
  if (!isRectVisible(viewBounds, x, y, width, height)) return;
  const outline = createRectOutline({ x, y, width, height, radius });
  drawStatusAnimation({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
  });
};

export const drawStatusAnimationCircle = (
  params: CircleAnimationParams
): void => {
  const {
    status,
    ctx,
    centerX,
    centerY,
    radius,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
  } = params;
  if (!isCircleVisible(viewBounds, centerX, centerY, radius)) return;
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawStatusAnimation({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
  });
};

export const drawDefinedBorderRect = ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  lineWidth,
  scale,
  color,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs: number;
}): void => {
  const outline = createRectOutline({ x, y, width, height, radius });
  drawDefinedBorder({
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
  });
};

export const drawDefinedBorderCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  color,
  timeMs,
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs: number;
}): void => {
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawDefinedBorder({
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
  });
};
