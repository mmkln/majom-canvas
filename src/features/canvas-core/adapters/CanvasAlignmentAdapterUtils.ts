import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import {
  getElementAlignmentRect,
  type SmartAlignmentRect,
} from '../core/services/SmartAlignmentService.ts';
import type {
  AlignmentAnchor,
  AlignmentAnchorRole,
  AlignmentGuideKind,
  AlignmentRect,
  AlignmentScopeKind,
  AlignmentSubject,
  AlignmentSubjectRole,
} from '../core/alignment/types.ts';

export function toAlignmentRect(bounds: SmartAlignmentRect): AlignmentRect {
  return { ...bounds };
}

export function getAggregateAlignmentRect(
  elements: ReadonlyArray<ICanvasElement>
): AlignmentRect | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  elements.forEach((element) => {
    const bounds = getElementAlignmentRect(element);
    if (!bounds) return;
    minX = Math.min(minX, bounds.left);
    minY = Math.min(minY, bounds.top);
    maxX = Math.max(maxX, bounds.right);
    maxY = Math.max(maxY, bounds.bottom);
  });

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    centerX: minX + (maxX - minX) / 2,
    centerY: minY + (maxY - minY) / 2,
  };
}

export function createAlignmentSubject(args: {
  id: string;
  bounds: AlignmentRect;
  role?: AlignmentSubjectRole;
  scopeKind?: AlignmentScopeKind;
  scopeId?: string | null;
  priority?: number;
}): AlignmentSubject {
  return {
    id: args.id,
    bounds: args.bounds,
    anchors: createRectAnchors(args.id, args.bounds),
    role: args.role ?? 'element',
    scopeKind: args.scopeKind ?? 'global',
    scopeId: args.scopeId ?? null,
    priority: args.priority,
  };
}

export function getElementAlignmentSubject(
  element: ICanvasElement,
  args: {
    role?: AlignmentSubjectRole;
    scopeKind?: AlignmentScopeKind;
    scopeId?: string | null;
    priority?: number;
  } = {}
): AlignmentSubject | null {
  const bounds = getElementAlignmentRect(element);
  if (!bounds) return null;
  return createAlignmentSubject({
    id: element.id,
    bounds: toAlignmentRect(bounds),
    role: args.role,
    scopeKind: args.scopeKind,
    scopeId: args.scopeId,
    priority: args.priority,
  });
}

export function isAlignmentRectVisibleInViewport(
  rect: AlignmentRect,
  viewport: AlignmentRect | null
): boolean {
  if (!viewport) return true;
  return (
    rect.right >= viewport.left &&
    rect.left <= viewport.right &&
    rect.bottom >= viewport.top &&
    rect.top <= viewport.bottom
  );
}

function createRectAnchors(id: string, rect: AlignmentRect): AlignmentAnchor[] {
  return [
    createAnchor({
      id: `${id}:x:start`,
      role: 'start',
      kind: 'edge',
      value: rect.left,
      secondaryStart: rect.top,
      secondaryEnd: rect.bottom,
    }),
    createAnchor({
      id: `${id}:x:center`,
      role: 'center',
      kind: 'center',
      value: rect.centerX,
      secondaryStart: rect.top,
      secondaryEnd: rect.bottom,
    }),
    createAnchor({
      id: `${id}:x:end`,
      role: 'end',
      kind: 'edge',
      value: rect.right,
      secondaryStart: rect.top,
      secondaryEnd: rect.bottom,
    }),
    createAnchor({
      id: `${id}:y:start`,
      role: 'start',
      kind: 'edge',
      value: rect.top,
      secondaryStart: rect.left,
      secondaryEnd: rect.right,
      axis: 'y',
    }),
    createAnchor({
      id: `${id}:y:center`,
      role: 'center',
      kind: 'center',
      value: rect.centerY,
      secondaryStart: rect.left,
      secondaryEnd: rect.right,
      axis: 'y',
    }),
    createAnchor({
      id: `${id}:y:end`,
      role: 'end',
      kind: 'edge',
      value: rect.bottom,
      secondaryStart: rect.left,
      secondaryEnd: rect.right,
      axis: 'y',
    }),
  ];
}

function createAnchor(args: {
  id: string;
  role: AlignmentAnchorRole;
  kind: AlignmentGuideKind;
  value: number;
  secondaryStart: number;
  secondaryEnd: number;
  axis?: 'x' | 'y';
}): AlignmentAnchor {
  return {
    id: args.id,
    axis: args.axis ?? 'x',
    role: args.role,
    kind: args.kind,
    value: args.value,
    secondaryStart: args.secondaryStart,
    secondaryEnd: args.secondaryEnd,
  };
}
