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

export const hasStatusAnimation = (status?: ElementStatus): boolean =>
  status === ElementStatus.Done ||
  status === ElementStatus.InProgress ||
  status === ElementStatus.Pending ||
  status === ElementStatus.Defined;

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

export const drawDoneBorderSweepRect = ({
  ctx,
  x,
  y,
  width,
  height,
  radius,
  lineWidth,
  scale,
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs?: number;
}): void => {
  const progress = getSweepProgress(timeMs);
  const glowRadius = SWEEP_GLOW_RADIUS / scale;
  const p1 = getRoundedRectPoint(x, y, width, height, radius, progress);
  const p2 = getRoundedRectPoint(x, y, width, height, radius, progress + 0.5);
  drawGlow(ctx, p1.x, p1.y, glowRadius);
  drawGlow(ctx, p2.x, p2.y, glowRadius);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = lineWidth * 0.7;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();
  ctx.restore();
};

export const drawDoneBorderSweepCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs?: number;
}): void => {
  const progress = getSweepProgress(timeMs);
  const glowRadius = SWEEP_GLOW_RADIUS / scale;
  const angle1 = progress * Math.PI * 2;
  const angle2 = angle1 + Math.PI;
  const p1 = {
    x: centerX + Math.cos(angle1) * radius,
    y: centerY + Math.sin(angle1) * radius,
  };
  const p2 = {
    x: centerX + Math.cos(angle2) * radius,
    y: centerY + Math.sin(angle2) * radius,
  };
  drawGlow(ctx, p1.x, p1.y, glowRadius);
  drawGlow(ctx, p2.x, p2.y, glowRadius);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = lineWidth * 0.7;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs?: number;
}): void => {
  const drawPulse = (progress: number): void => {
    const alpha = getPulseAlpha(progress);
    const expand = getPulseExpand(progress, scale);
    const baseAlpha = alpha * 0.55;
    const innerAlpha = Math.min(0.9, alpha * 1.4);
    const outerRadius = clampRadius(
      width + expand * 2,
      height + expand * 2,
      radius + expand
    );
    const innerRadius = clampRadius(width, height, radius);

    ctx.save();
    ctx.fillStyle = `rgba(${PULSE_COLOR},${baseAlpha})`;
    ctx.beginPath();
    ctx.roundRect(
      x - expand,
      y - expand,
      width + expand * 2,
      height + expand * 2,
      outerRadius
    );
    ctx.roundRect(x, y, width, height, innerRadius);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${innerAlpha})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, innerRadius);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${baseAlpha * 0.6})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.roundRect(
      x - expand,
      y - expand,
      width + expand * 2,
      height + expand * 2,
      outerRadius
    );
    ctx.stroke();
    ctx.restore();
  };

  const progress = getPulseProgress(timeMs);
  drawPulse(progress);
  drawPulse((progress + PULSE_OVERLAP_OFFSET) % 1);
};

export const drawInProgressPulseCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  timeMs?: number;
}): void => {
  const drawPulse = (progress: number): void => {
    const alpha = getPulseAlpha(progress);
    const expand = getPulseExpand(progress, scale);
    const baseAlpha = alpha * 0.55;
    const innerAlpha = Math.min(0.9, alpha * 1.4);

    ctx.save();
    ctx.fillStyle = `rgba(${PULSE_COLOR},${baseAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + expand, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${innerAlpha})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = `rgba(${PULSE_COLOR},${baseAlpha * 0.6})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + expand, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const progress = getPulseProgress(timeMs);
  drawPulse(progress);
  drawPulse((progress + PULSE_OVERLAP_OFFSET) % 1);
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
  timeMs = performance.now(),
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
  timeMs?: number;
}): void => {
  const offset = ANTS_OFFSET / scale;
  ctx.save();
  ctx.globalAlpha = ANTS_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * ANTS_LINE_MULTIPLIER;
  ctx.setLineDash([ANTS_DASH / scale, ANTS_GAP / scale]);
  ctx.lineDashOffset = getAntsOffset(timeMs, scale);
  ctx.beginPath();
  ctx.roundRect(
    x - offset,
    y - offset,
    width + offset * 2,
    height + offset * 2,
    radius + offset
  );
  ctx.stroke();
  ctx.restore();
};

export const drawPendingMarchingAntsCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  color,
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs?: number;
}): void => {
  const offset = ANTS_OFFSET / scale;
  ctx.save();
  ctx.globalAlpha = ANTS_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * ANTS_LINE_MULTIPLIER;
  ctx.setLineDash([ANTS_DASH / scale, ANTS_GAP / scale]);
  ctx.lineDashOffset = getAntsOffset(timeMs, scale);
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + offset, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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
  timeMs = performance.now(),
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
  timeMs?: number;
}): void => {
  const cycleProgress = getDefinedProgress(timeMs);
  const activePortion = DEFINED_DRAW_DURATION_MS / DEFINED_CYCLE_MS;
  if (cycleProgress <= 0 || cycleProgress > activePortion) return;
  const drawProgress = cycleProgress / activePortion;
  const offset = DEFINED_OFFSET / scale;
  const perimeter = getRoundedRectPerimeter(
    width + offset * 2,
    height + offset * 2,
    radius + offset
  );
  const segmentFactor = getDefinedSegmentFactor(drawProgress);
  const segmentLength = perimeter * DEFINED_SEGMENT_RATIO * segmentFactor;

  ctx.save();
  ctx.globalAlpha = DEFINED_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * 0.7;
  ctx.setLineDash([segmentLength, perimeter]);
  ctx.lineDashOffset = -perimeter * drawProgress;
  ctx.beginPath();
  ctx.roundRect(
    x - offset,
    y - offset,
    width + offset * 2,
    height + offset * 2,
    radius + offset
  );
  ctx.stroke();
  ctx.restore();
};

export const drawDefinedBorderCircle = ({
  ctx,
  centerX,
  centerY,
  radius,
  lineWidth,
  scale,
  color,
  timeMs = performance.now(),
}: {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color: string;
  timeMs?: number;
}): void => {
  const cycleProgress = getDefinedProgress(timeMs);
  const activePortion = DEFINED_DRAW_DURATION_MS / DEFINED_CYCLE_MS;
  if (cycleProgress <= 0 || cycleProgress > activePortion) return;
  const drawProgress = cycleProgress / activePortion;
  const offset = DEFINED_OFFSET / scale;
  const perimeter = Math.PI * 2 * (radius + offset);
  const segmentFactor = getDefinedSegmentFactor(drawProgress);
  const segmentLength = perimeter * DEFINED_SEGMENT_RATIO * segmentFactor;

  ctx.save();
  ctx.globalAlpha = DEFINED_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * 0.7;
  ctx.setLineDash([segmentLength, perimeter]);
  ctx.lineDashOffset = -perimeter * drawProgress;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + offset, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};
