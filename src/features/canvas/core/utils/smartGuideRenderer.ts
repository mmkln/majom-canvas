import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';

export function drawSmartGuides(args: {
  ctx: CanvasRenderingContext2D;
  guides: ReadonlyArray<SmartGuideLine>;
  scale: number;
  color: string;
  lineWidth: number;
}): void {
  const { ctx, guides, scale, color, lineWidth } = args;
  if (guides.length === 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth / Math.max(scale, Number.EPSILON);
  ctx.setLineDash([]);
  guides.forEach((guide) => {
    ctx.beginPath();
    if (guide.orientation === 'vertical') {
      ctx.moveTo(guide.position, guide.start);
      ctx.lineTo(guide.position, guide.end);
    } else {
      ctx.moveTo(guide.start, guide.position);
      ctx.lineTo(guide.end, guide.position);
    }
    ctx.stroke();
  });
  ctx.restore();
}
