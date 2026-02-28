import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { MIN_ELEMENT_GAP } from '../constants.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DragResolveArgs = {
  movingElements: PlanningElement[];
  initialPositions: Map<string, { x: number; y: number }>;
  proposedDx: number;
  proposedDy: number;
  sceneElements: ICanvasElement[];
  resolveMode?: DragResolveMode;
};

type RectResolveArgs = {
  element: PlanningElement;
  startRect: Rect;
  targetRect: Rect;
  sceneElements: ICanvasElement[];
  movingIds?: Set<string>;
};

type PlaceElementsOptions = {
  preserveGroup?: boolean;
};

type DragResolveMode = 'preview' | 'commit';

export type PlacementReasonCode = 'collision' | 'none';

export type PlacementBlocker = {
  movingElementId: string;
  blockingElementId: string;
};

export type DragPlacementDiagnostics = {
  valid: boolean;
  reasonCode: PlacementReasonCode;
  blockers: PlacementBlocker[];
  requiredGap: number;
  suggestedTranslation: { dx: number; dy: number };
};

export type RectPlacementDiagnostics = {
  valid: boolean;
  reasonCode: PlacementReasonCode;
  blockers: PlacementBlocker[];
  requiredGap: number;
  suggestedRect: Rect;
};

export class ElementPlacementPolicy {
  private readonly dragSearchMaxRingPreview = 48;
  private readonly dragSearchMaxRingCommit = 220;

  constructor(private readonly minGap: number = MIN_ELEMENT_GAP) {}

  public evaluateDragPlacement({
    movingElements,
    initialPositions,
    proposedDx,
    proposedDy,
    sceneElements,
    resolveMode = 'commit',
  }: DragResolveArgs): DragPlacementDiagnostics {
    const blockers = this.collectDragBlockers(
      movingElements,
      initialPositions,
      proposedDx,
      proposedDy,
      sceneElements
    );
    const suggestedTranslation =
      blockers.length === 0
        ? { dx: proposedDx, dy: proposedDy }
        : this.resolveDragTranslation({
            movingElements,
            initialPositions,
            proposedDx,
            proposedDy,
            sceneElements,
            resolveMode,
          });
    return {
      valid: blockers.length === 0,
      reasonCode: blockers.length === 0 ? 'none' : 'collision',
      blockers,
      requiredGap: this.minGap,
      suggestedTranslation,
    };
  }

  public evaluateRectPlacement(args: RectResolveArgs): RectPlacementDiagnostics {
    const { element, targetRect, sceneElements, movingIds = new Set([element.id]) } =
      args;
    const blockers = this.collectRectBlockers(
      element,
      targetRect,
      sceneElements,
      movingIds
    );
    const suggestedRect =
      blockers.length === 0
        ? targetRect
        : this.resolveElementRectAlongPath({
            ...args,
            movingIds,
          });
    return {
      valid: blockers.length === 0,
      reasonCode: blockers.length === 0 ? 'none' : 'collision',
      blockers,
      requiredGap: this.minGap,
      suggestedRect,
    };
  }

  public resolveDragTranslation({
    movingElements,
    initialPositions,
    proposedDx,
    proposedDy,
    sceneElements,
    resolveMode = 'commit',
  }: DragResolveArgs): { dx: number; dy: number } {
    if (movingElements.length === 0) {
      return { dx: proposedDx, dy: proposedDy };
    }

    const movingIds = new Set(movingElements.map((el) => el.id));
    const staticElements = this.getPlanningElements(sceneElements).filter(
      (el) => !movingIds.has(el.id)
    );

    const isValid = (dx: number, dy: number): boolean => {
      for (const movingElement of movingElements) {
        const origin = initialPositions.get(movingElement.id) ?? {
          x: movingElement.x,
          y: movingElement.y,
        };
        const movingRect: Rect = {
          x: origin.x + dx,
          y: origin.y + dy,
          width: movingElement.width,
          height: movingElement.height,
        };
        for (const staticElement of staticElements) {
          const staticRect = this.getRect(staticElement);
          if (!this.intersectsWithGap(movingRect, staticRect)) continue;
          if (
            this.isAllowedOverlap(
              movingElement,
              movingRect,
              staticElement,
              staticRect
            )
          ) {
            continue;
          }
          return false;
        }
      }
      return true;
    };

    if (isValid(proposedDx, proposedDy)) {
      return { dx: proposedDx, dy: proposedDy };
    }

    const nearest = this.findNearestValidTranslationAroundTarget(
      proposedDx,
      proposedDy,
      isValid,
      resolveMode
    );
    if (nearest) return nearest;

    if (resolveMode === 'preview') {
      // During drag preview keep suggestion near cursor.
      // Hard-drop will still resolve to a guaranteed valid position on mouseUp.
      return { dx: proposedDx, dy: proposedDy };
    }

    // Fallback: project to the farthest valid point along start->target path.
    let lo = 0;
    let hi = 1;
    let best = { dx: 0, dy: 0 };
    const iterations = 14;
    for (let i = 0; i < iterations; i += 1) {
      const t = (lo + hi) / 2;
      const dx = proposedDx * t;
      const dy = proposedDy * t;
      if (isValid(dx, dy)) {
        best = { dx, dy };
        lo = t;
      } else {
        hi = t;
      }
    }
    return best;
  }

  public isPlacementValidForRect(
    element: PlanningElement,
    rect: Rect,
    sceneElements: ICanvasElement[],
    movingIds: Set<string> = new Set([element.id])
  ): boolean {
    const staticElements = this.getPlanningElements(sceneElements).filter(
      (candidate) => !movingIds.has(candidate.id)
    );
    for (const staticElement of staticElements) {
      const staticRect = this.getRect(staticElement);
      if (!this.intersectsWithGap(rect, staticRect)) continue;
      if (this.isAllowedOverlap(element, rect, staticElement, staticRect)) {
        continue;
      }
      return false;
    }
    return true;
  }

  public resolveElementRectAlongPath({
    element,
    startRect,
    targetRect,
    sceneElements,
    movingIds = new Set([element.id]),
  }: RectResolveArgs): Rect {
    if (
      this.isPlacementValidForRect(element, targetRect, sceneElements, movingIds)
    ) {
      return targetRect;
    }
    if (
      !this.isPlacementValidForRect(element, startRect, sceneElements, movingIds)
    ) {
      return startRect;
    }

    let lo = 0;
    let hi = 1;
    let best = startRect;
    const iterations = 14;
    for (let i = 0; i < iterations; i += 1) {
      const t = (lo + hi) / 2;
      const candidate = this.lerpRect(startRect, targetRect, t);
      if (
        this.isPlacementValidForRect(element, candidate, sceneElements, movingIds)
      ) {
        best = candidate;
        lo = t;
      } else {
        hi = t;
      }
    }
    return best;
  }

  public placeElements(
    elements: PlanningElement[],
    sceneElements: ICanvasElement[],
    options: PlaceElementsOptions = {}
  ): void {
    if (elements.length === 0) return;

    const staticElements = this.getPlanningElements(sceneElements);
    const preserveGroup = Boolean(options.preserveGroup && elements.length > 1);

    if (preserveGroup) {
      const offset = this.findNearestOffset(elements, staticElements);
      if (offset.x !== 0 || offset.y !== 0) {
        elements.forEach((element) => {
          element.x += offset.x;
          element.y += offset.y;
        });
      }
      return;
    }

    const occupied = [...staticElements];
    elements.forEach((element) => {
      const offset = this.findNearestOffset([element], occupied);
      if (offset.x !== 0 || offset.y !== 0) {
        element.x += offset.x;
        element.y += offset.y;
      }
      occupied.push(element);
    });
  }

  private findNearestOffset(
    elements: PlanningElement[],
    staticElements: PlanningElement[]
  ): { x: number; y: number } {
    if (this.isGroupPlacementValid(elements, staticElements, 0, 0)) {
      return { x: 0, y: 0 };
    }

    const step = Math.max(8, Math.round(this.minGap));
    const maxRing = 60;

    for (let ring = 1; ring <= maxRing; ring += 1) {
      const radius = ring * step;

      for (let x = -radius; x <= radius; x += step) {
        if (this.isGroupPlacementValid(elements, staticElements, x, -radius)) {
          return { x, y: -radius };
        }
        if (this.isGroupPlacementValid(elements, staticElements, x, radius)) {
          return { x, y: radius };
        }
      }

      for (let y = -radius + step; y <= radius - step; y += step) {
        if (this.isGroupPlacementValid(elements, staticElements, -radius, y)) {
          return { x: -radius, y };
        }
        if (this.isGroupPlacementValid(elements, staticElements, radius, y)) {
          return { x: radius, y };
        }
      }
    }

    return { x: 0, y: 0 };
  }

  private isGroupPlacementValid(
    movingElements: PlanningElement[],
    staticElements: PlanningElement[],
    dx: number,
    dy: number
  ): boolean {
    for (const movingElement of movingElements) {
      const movingRect: Rect = {
        x: movingElement.x + dx,
        y: movingElement.y + dy,
        width: movingElement.width,
        height: movingElement.height,
      };
      for (const staticElement of staticElements) {
        if (staticElement.id === movingElement.id) continue;
        const staticRect = this.getRect(staticElement);
        if (!this.intersectsWithGap(movingRect, staticRect)) continue;
        if (
          this.isAllowedOverlap(
            movingElement,
            movingRect,
            staticElement,
            staticRect
          )
        ) {
          continue;
        }
        return false;
      }
    }
    return true;
  }

  private collectDragBlockers(
    movingElements: PlanningElement[],
    initialPositions: Map<string, { x: number; y: number }>,
    dx: number,
    dy: number,
    sceneElements: ICanvasElement[]
  ): PlacementBlocker[] {
    const movingIds = new Set(movingElements.map((element) => element.id));
    const staticElements = this.getPlanningElements(sceneElements).filter(
      (element) => !movingIds.has(element.id)
    );
    const blockers: PlacementBlocker[] = [];

    for (const movingElement of movingElements) {
      const origin = initialPositions.get(movingElement.id) ?? {
        x: movingElement.x,
        y: movingElement.y,
      };
      const movingRect = {
        x: origin.x + dx,
        y: origin.y + dy,
        width: movingElement.width,
        height: movingElement.height,
      };
      for (const staticElement of staticElements) {
        const staticRect = this.getRect(staticElement);
        if (!this.intersectsWithGap(movingRect, staticRect)) continue;
        if (
          this.isAllowedOverlap(
            movingElement,
            movingRect,
            staticElement,
            staticRect
          )
        ) {
          continue;
        }
        blockers.push({
          movingElementId: movingElement.id,
          blockingElementId: staticElement.id,
        });
      }
    }

    return this.uniqueBlockers(blockers);
  }

  private collectRectBlockers(
    element: PlanningElement,
    rect: Rect,
    sceneElements: ICanvasElement[],
    movingIds: Set<string>
  ): PlacementBlocker[] {
    const staticElements = this.getPlanningElements(sceneElements).filter(
      (candidate) => !movingIds.has(candidate.id)
    );
    const blockers: PlacementBlocker[] = [];
    staticElements.forEach((staticElement) => {
      const staticRect = this.getRect(staticElement);
      if (!this.intersectsWithGap(rect, staticRect)) return;
      if (this.isAllowedOverlap(element, rect, staticElement, staticRect)) {
        return;
      }
      blockers.push({
        movingElementId: element.id,
        blockingElementId: staticElement.id,
      });
    });
    return this.uniqueBlockers(blockers);
  }

  private uniqueBlockers(blockers: PlacementBlocker[]): PlacementBlocker[] {
    const seen = new Set<string>();
    return blockers.filter((blocker) => {
      const key = `${blocker.movingElementId}:${blocker.blockingElementId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isAllowedOverlap(
    movingElement: PlanningElement,
    movingRect: Rect,
    staticElement: PlanningElement,
    staticRect: Rect
  ): boolean {
    if (movingElement instanceof TaskElement && staticElement instanceof StoryElement) {
      return this.isTaskInsideStory(movingRect, staticRect);
    }
    if (
      movingElement instanceof StoryElement &&
      staticElement instanceof TaskElement
    ) {
      const belongsToStory = movingElement.tasks.some(
        (task) => task.id === staticElement.id
      );
      if (!belongsToStory) return false;
      return this.isTaskInsideStory(staticRect, movingRect);
    }
    return false;
  }

  private isTaskInsideStory(taskRect: Rect, storyRect: Rect): boolean {
    const anchorX = taskRect.x + taskRect.width / 2;
    const anchorY = taskRect.y + taskRect.height / 2;
    return (
      anchorX >= storyRect.x &&
      anchorX <= storyRect.x + storyRect.width &&
      anchorY >= storyRect.y &&
      anchorY <= storyRect.y + storyRect.height
    );
  }

  private intersectsWithGap(a: Rect, b: Rect): boolean {
    const gap = this.minGap;
    return (
      a.x < b.x + b.width + gap &&
      a.x + a.width + gap > b.x &&
      a.y < b.y + b.height + gap &&
      a.y + a.height + gap > b.y
    );
  }

  private lerpRect(start: Rect, target: Rect, t: number): Rect {
    return {
      x: start.x + (target.x - start.x) * t,
      y: start.y + (target.y - start.y) * t,
      width: start.width + (target.width - start.width) * t,
      height: start.height + (target.height - start.height) * t,
    };
  }

  private getPlanningElements(elements: ICanvasElement[]): PlanningElement[] {
    return elements.filter(
      (element): element is PlanningElement => element instanceof PlanningElement
    );
  }

  private getRect(element: PlanningElement): Rect {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }

  private getDragSearchMaxRing(resolveMode: DragResolveMode): number {
    return resolveMode === 'preview'
      ? this.dragSearchMaxRingPreview
      : this.dragSearchMaxRingCommit;
  }

  private findNearestValidTranslationAroundTarget(
    proposedDx: number,
    proposedDy: number,
    isValid: (dx: number, dy: number) => boolean,
    resolveMode: DragResolveMode
  ): { dx: number; dy: number } | null {
    const step = Math.max(8, Math.round(this.minGap / 2));
    const maxRing = this.getDragSearchMaxRing(resolveMode);
    for (let ring = 1; ring <= maxRing; ring += 1) {
      const radius = ring * step;
      let bestCandidate: { dx: number; dy: number; distSq: number } | null = null;
      const testCandidate = (offsetX: number, offsetY: number): void => {
        const dx = proposedDx + offsetX;
        const dy = proposedDy + offsetY;
        if (!isValid(dx, dy)) return;
        const distSq = offsetX * offsetX + offsetY * offsetY;
        if (bestCandidate && bestCandidate.distSq <= distSq) return;
        bestCandidate = { dx, dy, distSq };
      };
      for (let x = -radius; x <= radius; x += step) {
        testCandidate(x, -radius);
        testCandidate(x, radius);
      }
      for (let y = -radius + step; y <= radius - step; y += step) {
        testCandidate(-radius, y);
        testCandidate(radius, y);
      }
      if (bestCandidate) {
        return { dx: bestCandidate.dx, dy: bestCandidate.dy };
      }
    }
    return null;
  }
}

export const elementPlacementPolicy = new ElementPlacementPolicy();
