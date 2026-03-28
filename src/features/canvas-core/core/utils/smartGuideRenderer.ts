import { FONT_FAMILY } from '../constants.ts';
import { createSmartGuideOverlayModel } from '../alignment/createSmartGuideOverlayModel.ts';
import type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentLineVisual,
  AlignmentOverlayModel,
  AlignmentPointVisual,
} from '../alignment/types.ts';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';

export function drawSmartGuides(args: {
  ctx: CanvasRenderingContext2D;
  guides: ReadonlyArray<SmartGuideLine>;
  scale: number;
  color: string;
  spacingColor?: string;
  containerColor?: string;
  viewportCenterColor?: string;
  labelColor?: string;
  lineWidth: number;
}): void {
  const {
    ctx,
    guides,
    scale,
    color,
    spacingColor = color,
    containerColor = color,
    viewportCenterColor = color,
    labelColor = color,
    lineWidth,
  } = args;
  if (guides.length === 0) return;

  drawAlignmentOverlay({
    ctx,
    overlay: createSmartGuideOverlayModel(guides),
    scale,
    color,
    spacingColor,
    containerColor,
    viewportCenterColor,
    labelColor,
    lineWidth,
  });
}

export function drawAlignmentOverlay(args: {
  ctx: CanvasRenderingContext2D;
  overlay: AlignmentOverlayModel;
  scale: number;
  color: string;
  spacingColor?: string;
  containerColor?: string;
  viewportCenterColor?: string;
  labelColor?: string;
  lineWidth: number;
}): void {
  const {
    ctx,
    overlay,
    scale,
    color,
    spacingColor = color,
    containerColor = color,
    viewportCenterColor = color,
    labelColor = color,
    lineWidth,
  } = args;
  if (overlay.visuals.length === 0) return;

  const normalizedScale = Math.max(scale, Number.EPSILON);
  const bands = overlay.visuals.filter(
    (visual): visual is AlignmentBandVisual => visual.type === 'band'
  );
  const edgeLines = overlay.visuals.filter(
    (visual): visual is AlignmentLineVisual =>
      visual.type === 'line' &&
      (visual.kind === 'edge' || visual.kind === 'center')
  );
  const containerLines = overlay.visuals.filter(
    (visual): visual is AlignmentLineVisual =>
      visual.type === 'line' && visual.kind === 'container'
  );
  const viewportCenterLines = overlay.visuals.filter(
    (visual): visual is AlignmentLineVisual =>
      visual.type === 'line' && visual.kind === 'viewport-center'
  );
  const spacingLines = overlay.visuals.filter(
    (visual): visual is AlignmentLineVisual =>
      visual.type === 'line' && visual.kind === 'spacing'
  );
  const points = overlay.visuals.filter(
    (visual): visual is AlignmentPointVisual => visual.type === 'point'
  );
  const badges = overlay.visuals.filter(
    (visual): visual is AlignmentBadgeVisual => visual.type === 'badge'
  );

  ctx.save();
  renderBands(ctx, bands, {
    color,
    spacingColor,
  });
  renderLines(ctx, edgeLines, {
    scale: normalizedScale,
    lineWidth,
    color,
    dashed: [],
    drawCaps: false,
  });
  renderLines(ctx, containerLines, {
    scale: normalizedScale,
    lineWidth,
    color: containerColor,
    dashed: [10 / normalizedScale, 4 / normalizedScale],
    drawCaps: false,
  });
  renderLines(ctx, viewportCenterLines, {
    scale: normalizedScale,
    lineWidth,
    color: viewportCenterColor,
    dashed: [2 / normalizedScale, 5 / normalizedScale],
    drawCaps: false,
  });
  renderLines(ctx, spacingLines, {
    scale: normalizedScale,
    lineWidth,
    color: spacingColor,
    dashed: [6 / normalizedScale, 4 / normalizedScale],
    drawCaps: true,
  });
  renderPoints(ctx, points, {
    scale: normalizedScale,
    color,
    spacingColor,
  });
  renderBadges(ctx, badges, {
    scale: normalizedScale,
    labelColor,
  });
  ctx.restore();
}

function renderBands(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentBandVisual>,
  colors: {
    color: string;
    spacingColor: string;
  }
): void {
  if (visuals.length === 0) return;
  ctx.setLineDash([]);
  visuals.forEach((visual) => {
    const width =
      visual.axis === 'x'
        ? Math.max(0, visual.end - visual.start)
        : Math.max(0, visual.depthEnd - visual.depthStart);
    const height =
      visual.axis === 'x'
        ? Math.max(0, visual.depthEnd - visual.depthStart)
        : Math.max(0, visual.end - visual.start);
    if (width === 0 || height === 0) return;

    ctx.fillStyle =
      visual.kind === 'spacing' ? colors.spacingColor : colors.color;
    ctx.globalAlpha = visual.primary ? 0.12 : 0.07;
    if (visual.axis === 'x') {
      ctx.fillRect(visual.start, visual.depthStart, width, height);
      return;
    }
    ctx.fillRect(visual.depthStart, visual.start, width, height);
  });
  ctx.globalAlpha = 1;
}

function renderLines(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentLineVisual>,
  args: {
    scale: number;
    lineWidth: number;
    color: string;
    dashed: number[];
    drawCaps: boolean;
  }
): void {
  if (visuals.length === 0) return;
  const dash = args.dashed;
  ctx.strokeStyle = args.color;
  ctx.setLineDash(dash);

  visuals.forEach((visual) => {
    ctx.lineWidth = getVisualLineWidth(visual, args.lineWidth, args.scale);
    drawGuideLine(ctx, visual);
    if (!args.drawCaps) return;
    ctx.setLineDash([]);
    drawGuideCaps(ctx, visual, args.scale);
    ctx.setLineDash(dash);
  });
}

function renderPoints(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentPointVisual>,
  args: {
    scale: number;
    color: string;
    spacingColor: string;
  }
): void {
  if (visuals.length === 0) return;
  ctx.setLineDash([]);
  visuals.forEach((visual) => {
    const size = (visual.primary ? 6 : 4) / args.scale;
    ctx.fillStyle = visual.kind === 'spacing' ? args.spacingColor : args.color;
    ctx.globalAlpha = 1;
    ctx.fillRect(visual.x - size / 2, visual.y - size / 2, size, size);
  });
}

function renderBadges(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentBadgeVisual>,
  args: {
    scale: number;
    labelColor: string;
  }
): void {
  if (visuals.length === 0) return;
  const fontSize = 11 / args.scale;
  ctx.setLineDash([]);
  ctx.fillStyle = args.labelColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.globalAlpha = 1;
  visuals.forEach((visual) => {
    ctx.fillText(visual.text, visual.x, visual.y);
  });
}

function drawGuideLine(
  ctx: CanvasRenderingContext2D,
  visual: AlignmentLineVisual
): void {
  ctx.beginPath();
  if (visual.axis === 'x') {
    ctx.moveTo(visual.position, visual.start);
    ctx.lineTo(visual.position, visual.end);
  } else {
    ctx.moveTo(visual.start, visual.position);
    ctx.lineTo(visual.end, visual.position);
  }
  ctx.stroke();
}

function drawGuideCaps(
  ctx: CanvasRenderingContext2D,
  visual: AlignmentLineVisual,
  scale: number
): void {
  const capSize = 8 / scale;
  ctx.beginPath();
  if (visual.axis === 'x') {
    ctx.moveTo(visual.position - capSize, visual.start);
    ctx.lineTo(visual.position + capSize, visual.start);
    ctx.moveTo(visual.position - capSize, visual.end);
    ctx.lineTo(visual.position + capSize, visual.end);
  } else {
    ctx.moveTo(visual.start, visual.position - capSize);
    ctx.lineTo(visual.start, visual.position + capSize);
    ctx.moveTo(visual.end, visual.position - capSize);
    ctx.lineTo(visual.end, visual.position + capSize);
  }
  ctx.stroke();
}

function getVisualLineWidth(
  visual: AlignmentLineVisual,
  baseLineWidth: number,
  scale: number
): number {
  let weight = visual.primary ? 1 : 0.72;
  if (visual.locked) {
    weight *= 1.12;
  }
  return (baseLineWidth * weight) / scale;
}
