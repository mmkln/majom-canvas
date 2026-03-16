import { ElementStatus } from '../ElementStatus.ts';
import type {
  OutlineAnimationParams,
  OutlineEffectParams,
  StatusAnimationDetail,
} from './statusAnimationTypes.ts';

const SWEEP_DURATION_MS = 9600;
const PULSE_DURATION_MS = 2400;
const PULSE_ALPHA_MIN = 0;
const PULSE_ALPHA_MAX = 0.55;
const PULSE_EXPAND_MAX = 22;
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

const getAnimDetail = (
  detail?: StatusAnimationDetail
): StatusAnimationDetail => (detail === 'reduced' ? 'reduced' : 'full');

const drawDoneBorderSweep = ({
  ctx,
  outline,
  lineWidth,
  scale,
  timeMs,
  detail,
}: OutlineEffectParams): void => {
  const animDetail = getAnimDetail(detail);
  const progress = getSweepProgress(timeMs);
  const perimeter = Math.max(1, outline.perimeter(0));
  const centerOffset = -perimeter * progress;
  const halfSpan = Math.min(
    perimeter * 0.18,
    Math.max(34 / scale, perimeter * 0.08)
  );
  const sampleCount = animDetail === 'reduced' ? 4 : 12;
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
    const alphaBase = animDetail === 'reduced' ? 0.55 : 0.92;
    const alphaPow = animDetail === 'reduced' ? 1.8 : 2.2;
    const alpha = alphaBase * Math.pow(normalized, alphaPow);
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
  color,
  timeMs,
  detail,
}: OutlineEffectParams): void => {
  const animDetail = getAnimDetail(detail);
  const pulseColor = color ?? '#1890ff';
  const drawPulse = (progress: number): void => {
    const alpha = getPulseAlpha(progress);
    const expand = getPulseExpand(progress, scale);
    const baseAlpha = alpha * 0.55;
    const innerAlpha = Math.min(0.9, alpha * 1.4);

    if (animDetail === 'reduced') {
      ctx.save();
      ctx.strokeStyle = pulseColor;
      ctx.globalAlpha = Math.min(0.65, innerAlpha * 0.9);
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      outline.drawPath(ctx, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = pulseColor;
      ctx.globalAlpha = baseAlpha * 0.5;
      ctx.lineWidth = Math.max(0.5 / scale, lineWidth * 0.85);
      ctx.beginPath();
      outline.drawPath(ctx, expand * 0.65);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.fillStyle = pulseColor;
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    outline.drawPath(ctx, expand);
    outline.drawPath(ctx, 0);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = pulseColor;
    ctx.globalAlpha = innerAlpha;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    outline.drawPath(ctx, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = pulseColor;
    ctx.globalAlpha = baseAlpha * 0.6;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    outline.drawPath(ctx, expand);
    ctx.stroke();
    ctx.restore();
  };

  const progress = getPulseProgress(timeMs);
  drawPulse(progress);
  if (animDetail === 'full') {
    drawPulse((progress + PULSE_OVERLAP_OFFSET) % 1);
  }
};

const drawPendingMarchingAnts = ({
  ctx,
  outline,
  lineWidth,
  scale,
  color,
  timeMs,
  detail,
}: OutlineEffectParams): void => {
  if (!color) return;
  const animDetail = getAnimDetail(detail);
  const offset = ANTS_OFFSET / scale;
  ctx.save();
  ctx.globalAlpha = animDetail === 'reduced' ? ANTS_ALPHA * 0.65 : ANTS_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth =
    lineWidth *
    ANTS_LINE_MULTIPLIER *
    (animDetail === 'reduced' ? 0.85 : 1);
  const dash = animDetail === 'reduced' ? ANTS_DASH * 1.35 : ANTS_DASH;
  const gap = animDetail === 'reduced' ? ANTS_GAP * 1.5 : ANTS_GAP;
  ctx.setLineDash([dash / scale, gap / scale]);
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
  detail,
}: OutlineEffectParams): void => {
  if (!color) return;
  const animDetail = getAnimDetail(detail);
  const cycleProgress = getDefinedProgress(timeMs);
  const activePortion = DEFINED_DRAW_DURATION_MS / DEFINED_CYCLE_MS;
  if (cycleProgress <= 0 || cycleProgress > activePortion) return;
  const drawProgress = cycleProgress / activePortion;
  const offset = DEFINED_OFFSET / scale;
  const perimeter = outline.perimeter(offset);
  const segmentFactor = getDefinedSegmentFactor(drawProgress);
  const segmentRatio =
    animDetail === 'reduced' ? DEFINED_SEGMENT_RATIO * 0.7 : DEFINED_SEGMENT_RATIO;
  const segmentLength = perimeter * segmentRatio * segmentFactor;

  ctx.save();
  ctx.globalAlpha = animDetail === 'reduced' ? DEFINED_ALPHA * 0.75 : DEFINED_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * (animDetail === 'reduced' ? 0.6 : 0.7);
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
