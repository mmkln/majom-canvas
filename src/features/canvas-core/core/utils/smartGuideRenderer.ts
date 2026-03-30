import { FONT_FAMILY } from '../constants.ts';
import {
  createSmartGuideOverlayModel,
  type SmartGuideOverlayOptions,
} from '../alignment/createSmartGuideOverlayModel.ts';
import type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentLineVisual,
  AlignmentOverlayModel,
  AlignmentPointVisual,
  AlignmentRect,
  AlignmentVisualPlacement,
} from '../alignment/types.ts';
import type { AlignmentVisualEmphasis } from '../alignment/types.ts';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import {
  DEFAULT_ALIGNMENT_PRESENTATION_THEME,
  getAlignmentKindStyle,
  type AlignmentPresentationTheme,
} from '../../alignment/presentation/theme.ts';

export function drawSmartGuides(args: {
  ctx: CanvasRenderingContext2D;
  guides: ReadonlyArray<SmartGuideLine>;
  scale: number;
  movingBounds?: AlignmentRect | null;
  viewportBounds?: AlignmentRect | null;
  theme?: AlignmentPresentationTheme;
}): void {
  const { ctx, guides, scale, theme = DEFAULT_ALIGNMENT_PRESENTATION_THEME } =
    args;
  if (guides.length === 0) return;
  const overlayOptions: SmartGuideOverlayOptions = {
    movingBounds: args.movingBounds ?? null,
    viewportBounds: args.viewportBounds ?? null,
    scale,
  };

  drawAlignmentOverlay({
    ctx,
    overlay: createSmartGuideOverlayModel(guides, overlayOptions),
    scale,
    theme,
  });
}

export function drawAlignmentOverlay(args: {
  ctx: CanvasRenderingContext2D;
  overlay: AlignmentOverlayModel;
  scale: number;
  theme?: AlignmentPresentationTheme;
}): void {
  const {
    ctx,
    overlay,
    scale,
    theme = DEFAULT_ALIGNMENT_PRESENTATION_THEME,
  } = args;
  if (overlay.visuals.length === 0) return;

  const normalizedScale = Math.max(scale, Number.EPSILON);
  const bands = overlay.visuals.filter(
    (visual): visual is AlignmentBandVisual => visual.type === 'band'
  );
  const lines = overlay.visuals.filter(
    (visual): visual is AlignmentLineVisual => visual.type === 'line'
  );
  const points = overlay.visuals.filter(
    (visual): visual is AlignmentPointVisual => visual.type === 'point'
  );
  const badges = overlay.visuals.filter(
    (visual): visual is AlignmentBadgeVisual => visual.type === 'badge'
  );

  ctx.save();
  renderBands(ctx, bands, { scale: normalizedScale, theme });
  renderLines(ctx, lines, { scale: normalizedScale, theme });
  renderPoints(ctx, points, { scale: normalizedScale, theme });
  renderBadges(ctx, badges, { scale: normalizedScale, theme });
  ctx.restore();
}

function renderBands(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentBandVisual>,
  args: {
    scale: number;
    theme: AlignmentPresentationTheme;
  }
): void {
  if (visuals.length === 0) return;
  ctx.setLineDash([]);
  visuals.forEach((visual) => {
    const kindStyle = getAlignmentKindStyle(args.theme, visual.kind).band;
    if (!kindStyle) return;

    const width =
      visual.axis === 'x'
        ? Math.max(0, visual.end - visual.start)
        : Math.max(0, visual.depthEnd - visual.depthStart);
    const height =
      visual.axis === 'x'
        ? Math.max(0, visual.depthEnd - visual.depthStart)
        : Math.max(0, visual.end - visual.start);
    if (width === 0 || height === 0) return;

    ctx.fillStyle = kindStyle.fill;
    const semantics = visual.emphasis;
    ctx.globalAlpha =
      kindStyle.fillOpacity *
      getStateOpacityMultiplier(args.theme, semantics, false);
    if (visual.axis === 'x') {
      ctx.fillRect(visual.start, visual.depthStart, width, height);
    } else {
      ctx.fillRect(visual.depthStart, visual.start, width, height);
    }
  });
  ctx.globalAlpha = 1;
}

function renderLines(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentLineVisual>,
  args: {
    scale: number;
    theme: AlignmentPresentationTheme;
  }
): void {
  if (visuals.length === 0) return;
  visuals.forEach((visual) => {
    const style = resolveLineStyle(visual, args.theme, args.scale);
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.strokeWidth;
    ctx.globalAlpha = style.strokeOpacity;
    ctx.lineCap = style.lineCap;
    ctx.setLineDash(style.dash);
    drawGuideLine(ctx, visual);
    if (style.showCaps) {
      ctx.lineCap = 'butt';
      ctx.setLineDash([]);
      drawGuideCaps(ctx, visual, style.capSize);
    }
  });
  ctx.globalAlpha = 1;
  ctx.lineCap = 'butt';
  ctx.setLineDash([]);
}

function renderPoints(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentPointVisual>,
  args: {
    scale: number;
    theme: AlignmentPresentationTheme;
  }
): void {
  if (!args.theme.point.visible || visuals.length === 0) return;
  ctx.setLineDash([]);
  visuals.forEach((visual) => {
    const kindStyle = getAlignmentKindStyle(args.theme, visual.kind).line;
    const size =
      (visual.primary ? args.theme.point.size : args.theme.point.size * 0.85) /
      args.scale;
    const semantics = visual.emphasis;
    ctx.fillStyle = kindStyle.stroke;
    ctx.globalAlpha =
      kindStyle.strokeOpacity *
      getStateOpacityMultiplier(args.theme, semantics, false);
    ctx.fillRect(visual.x - size / 2, visual.y - size / 2, size, size);
  });
  ctx.globalAlpha = 1;
}

function renderBadges(
  ctx: CanvasRenderingContext2D,
  visuals: ReadonlyArray<AlignmentBadgeVisual>,
  args: {
    scale: number;
    theme: AlignmentPresentationTheme;
  }
): void {
  if (visuals.length === 0) return;
  visuals.forEach((visual) => {
    const badgeStyle = getAlignmentKindStyle(args.theme, visual.kind).badge;
    if (!badgeStyle) return;

    const fontSize = args.theme.badge.fontSize / args.scale;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    const chrome = badgeStyle.chrome ?? 'pill';

    if (chrome === 'pill') {
      const paddingX = args.theme.badge.paddingX / args.scale;
      const paddingY = args.theme.badge.paddingY / args.scale;
      const textMetricsWidth = measureLabelWidth(ctx, visual.text, fontSize);
      const width = textMetricsWidth + paddingX * 2;
      const height = fontSize + paddingY * 2;
      const x = visual.x - width / 2;
      const y = visual.y - height / 2;
      const radius = args.theme.badge.radius / args.scale;

      if (badgeStyle.fill) {
        ctx.fillStyle = badgeStyle.fill;
        applyBadgeShadow(ctx, args.theme.badge, args.scale);
        fillBadgeBackground(ctx, x, y, width, height, radius);
        resetBadgeShadow(ctx);
      }

      if (badgeStyle.border && args.theme.badge.borderWidth > 0) {
        ctx.strokeStyle = badgeStyle.border;
        ctx.lineWidth = args.theme.badge.borderWidth / args.scale;
        strokeBadgeBorder(ctx, x, y, width, height, radius);
      }
    }

    const placementOffset = args.theme.badge.placementOffset / args.scale;
    const textX = resolveBadgeTextX(visual, placementOffset);
    const textAlign = resolveBadgeTextAlign(visual.placement);
    const fontWeight =
      visual.labelMode === 'measurement'
        ? args.theme.badge.measurementFontWeight
        : args.theme.badge.fontWeight;

    ctx.fillStyle = badgeStyle.textColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';
    ctx.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;
    ctx.fillText(visual.text, textX, visual.y);
  });
}

function applyBadgeShadow(
  ctx: CanvasRenderingContext2D,
  badgeTheme: AlignmentPresentationTheme['badge'],
  scale: number
): void {
  ctx.shadowColor = badgeTheme.shadowColor;
  ctx.shadowBlur = badgeTheme.shadowBlur / scale;
  ctx.shadowOffsetY = badgeTheme.shadowOffsetY / scale;
}

function resetBadgeShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function fillBadgeBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, Math.min(radius, height / 2));
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, width, height);
}

function strokeBadgeBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, Math.min(radius, height / 2));
    ctx.stroke();
    return;
  }
  ctx.strokeRect(x, y, width, height);
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
  capSize: number
): void {
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

function resolveLineStyle(
  visual: AlignmentLineVisual,
  theme: AlignmentPresentationTheme,
  scale: number
): {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  dash: number[];
  showCaps: boolean;
  capSize: number;
  lineCap: CanvasLineCap;
} {
  const style = getAlignmentKindStyle(theme, visual.kind).line;
  const semantics = visual.emphasis;
  const strokeOpacity = Math.min(
    1,
    style.strokeOpacity *
      getStateOpacityMultiplier(theme, semantics, visual.locked)
  );
  const strokeWidth =
    (style.strokeWidth *
      getStrokeWidthMultiplier(theme, semantics, visual.locked)) /
    scale;

  return {
    stroke: style.stroke,
    strokeWidth,
    strokeOpacity,
    dash: style.dash.map((segment) => segment / scale),
    showCaps: style.showCaps,
    capSize: (style.capSize ?? 8) / scale,
    lineCap: style.lineCap ?? 'butt',
  };
}

function getStateOpacityMultiplier(
  theme: AlignmentPresentationTheme,
  semantics: AlignmentVisualEmphasis,
  locked: boolean
): number {
  let multiplier = 1;
  if (semantics === 'secondary') {
    multiplier *= theme.state.secondaryOpacityMultiplier;
  } else if (semantics === 'structural') {
    multiplier *= theme.state.structuralOpacityMultiplier;
  } else if (semantics === 'measurement') {
    multiplier *= theme.state.measurementOpacityMultiplier;
  }
  if (locked) {
    multiplier *= theme.state.lockedOpacityMultiplier;
  }
  return multiplier;
}

function getStrokeWidthMultiplier(
  theme: AlignmentPresentationTheme,
  semantics: AlignmentVisualEmphasis,
  locked: boolean
): number {
  let multiplier = 1;
  if (semantics === 'secondary') {
    multiplier *= theme.state.secondaryStrokeWidthMultiplier;
  } else if (semantics === 'structural') {
    multiplier *= theme.state.structuralStrokeWidthMultiplier;
  } else if (semantics === 'measurement') {
    multiplier *= theme.state.measurementStrokeWidthMultiplier;
  }
  if (locked) {
    multiplier *= theme.state.lockedStrokeWidthMultiplier;
  }
  return multiplier;
}

function measureLabelWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number
): number {
  const previousFont = ctx.font;
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  const measured =
    typeof ctx.measureText === 'function'
      ? ctx.measureText(text).width
      : text.length * fontSize * 0.56;
  ctx.font = previousFont;
  return measured;
}

function resolveBadgeTextAlign(
  placement: AlignmentVisualPlacement
): CanvasTextAlign {
  if (placement === 'outside-left') {
    return 'right';
  }
  if (placement === 'outside-right') {
    return 'left';
  }
  return 'center';
}

function resolveBadgeTextX(
  visual: AlignmentBadgeVisual,
  placementOffset: number
): number {
  if (visual.placement === 'outside-left') {
    return visual.x - placementOffset;
  }
  if (visual.placement === 'outside-right') {
    return visual.x + placementOffset;
  }
  return visual.x;
}
