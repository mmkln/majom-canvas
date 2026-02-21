import { ElementStatus } from '../ElementStatus.ts';
import type {
  OutlineAnimationParams,
  OutlineEffectParams,
} from './statusAnimationTypes.ts';

const SWEEP_DURATION_MS = 9600;
const PULSE_DURATION_MS = 2400;
const PULSE_ALPHA_MIN = 0;
const PULSE_ALPHA_MAX = 0.55;
const PULSE_EXPAND_MAX = 22;
const PULSE_COLOR = '24,144,255';
const PULSE_OVERLAP_OFFSET = 0.55;
const ANTS_DURATION_MS = 2400;
const ANTS_DASH = 24;
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
  const perimeter = Math.max(1, outline.perimeter(0));
  const centerOffset = -perimeter * progress;
  const halfSpan = Math.min(
    perimeter * 0.18,
    Math.max(34 / scale, perimeter * 0.08)
  );
  const sampleCount = 12;
  const sampleSpacing = halfSpan / sampleCount;
  const sparkleLength = Math.max(6 / scale, sampleSpacing * 1.9);
  const sparkleGap = Math.max(1, perimeter - sparkleLength);

  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([sparkleLength, sparkleGap]);

  for (let i = -sampleCount; i <= sampleCount; i += 1) {
    const normalized = 1 - Math.abs(i) / sampleCount;
    if (normalized <= 0) continue;
    const offset = centerOffset - i * sampleSpacing;
    const alpha = 0.92 * Math.pow(normalized, 2.2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineDashOffset = offset;
    ctx.beginPath();
    outline.drawPath(ctx, 0);
    ctx.stroke();
  }
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

const STATUS_ANIMATIONS: Partial<
  Record<ElementStatus, (params: OutlineAnimationParams) => void>
> = {
  [ElementStatus.Done]: drawDoneBorderSweep,
  [ElementStatus.InProgress]: drawInProgressPulse,
  [ElementStatus.Pending]: drawPendingMarchingAnts,
  [ElementStatus.Defined]: drawDefinedBorder,
};

export const hasStatusAnimation = (status?: ElementStatus): boolean =>
  status === ElementStatus.Done ||
  status === ElementStatus.InProgress ||
  status === ElementStatus.Pending ||
  status === ElementStatus.Defined;

export const drawStatusAnimationEffect = (
  params: OutlineAnimationParams
): void => {
  const handler = STATUS_ANIMATIONS[params.status];
  if (!handler) return;
  handler(params);
};
