import type { CanvasAlignmentAdapter } from '../../adapters/CanvasAlignmentAdapter.ts';
import type { CanvasAlignmentContext } from '../../adapters/CanvasAlignmentAdapter.ts';
import { isAlignmentRectVisibleInViewport } from '../../adapters/CanvasAlignmentAdapterUtils.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { Scene } from '../scene/Scene.ts';
import type {
  AlignmentInteractionMode,
  AlignmentPreferences,
  AlignmentSubject,
} from './types.ts';
import { mergeAlignmentPreferences } from './types.ts';
import { AlignmentSubjectIndex } from './AlignmentSubjectIndex.ts';

type ResolveAlignmentSubjectsArgs = {
  movingElements: ICanvasElement[];
  allowSnap: boolean;
  viewportBuffer: number;
  mode?: AlignmentInteractionMode;
  preferences?: Partial<AlignmentPreferences>;
  maxSubjects?: number;
};

type ResolvedAlignmentSubjects = {
  context: CanvasAlignmentContext;
  movingSubject: AlignmentSubject | null;
  subjects: AlignmentSubject[];
};

export class CanvasAlignmentSubjectProvider {
  private cachedReferenceSubjectsKey: string | null = null;
  private cachedReferenceSubjectsVersion: number = -1;
  private cachedReferenceSubjects: AlignmentSubject[] = [];
  private cachedReferenceIndex: AlignmentSubjectIndex | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scene: Scene,
    private readonly panZoom: PanZoomManager,
    private readonly adapter: CanvasAlignmentAdapter
  ) {}

  public resolveSubjects(
    args: ResolveAlignmentSubjectsArgs
  ): ResolvedAlignmentSubjects {
    const context = this.createContext(args);
    const movingSubject = this.adapter.getMovingSubject(context);
    const referenceSubjects = this.getReferenceSubjects(context);
    const virtualSubjects = this.adapter.getVirtualSubjects?.(context) ?? [];

    const orderedSubjects = this.rankSubjects({
      movingSubject,
      referenceSubjects,
      virtualSubjects,
      limit: args.maxSubjects,
      viewport: context.viewport,
    });

    return {
      context,
      movingSubject,
      subjects: orderedSubjects,
    };
  }

  private getReferenceSubjects(
    context: CanvasAlignmentContext
  ): AlignmentSubject[] {
    const cacheKey = this.createReferenceSubjectsCacheKey(context);
    const sceneVersion = this.scene.getElementsVersion();
    const shouldRebuildCache =
      this.cachedReferenceSubjectsKey !== cacheKey ||
      this.cachedReferenceSubjectsVersion !== sceneVersion ||
      this.cachedReferenceIndex === null;

    if (shouldRebuildCache) {
      const uncroppedContext: CanvasAlignmentContext = {
        ...context,
        movingElements: [...context.movingElements],
        viewport: null,
      };
      this.cachedReferenceSubjects =
        this.adapter.getReferenceSubjects(uncroppedContext);
      this.cachedReferenceIndex = new AlignmentSubjectIndex(
        this.cachedReferenceSubjects
      );
      this.cachedReferenceSubjectsKey = cacheKey;
      this.cachedReferenceSubjectsVersion = sceneVersion;
    }

    return this.cachedReferenceSubjects;
  }

  private rankSubjects(args: {
    movingSubject: AlignmentSubject | null;
    referenceSubjects: AlignmentSubject[];
    virtualSubjects: AlignmentSubject[];
    viewport: CanvasAlignmentContext['viewport'];
    limit?: number;
  }): AlignmentSubject[] {
    const visibleReferenceSubjects = this.filterVisibleSubjects(
      args.referenceSubjects,
      args.viewport
    );
    const visibleVirtualSubjects = this.filterVisibleSubjects(
      args.virtualSubjects,
      args.viewport
    );

    if (!args.movingSubject) {
      return [...visibleReferenceSubjects, ...visibleVirtualSubjects];
    }

    if (visibleVirtualSubjects.length === 0) {
      return (
        this.cachedReferenceIndex?.query({
          movingSubject: args.movingSubject,
          limit: args.limit,
          include: (subject) =>
            isAlignmentRectVisibleInViewport(subject.bounds, args.viewport),
        }) ?? visibleReferenceSubjects
      );
    }

    const rankedReferenceSubjects =
      this.cachedReferenceIndex?.query({
        movingSubject: args.movingSubject,
        include: (subject) =>
          isAlignmentRectVisibleInViewport(subject.bounds, args.viewport),
      }) ?? visibleReferenceSubjects;

    return new AlignmentSubjectIndex([
      ...rankedReferenceSubjects,
      ...visibleVirtualSubjects,
    ]).query({
      movingSubject: args.movingSubject,
      limit: args.limit,
    });
  }

  private filterVisibleSubjects(
    subjects: ReadonlyArray<AlignmentSubject>,
    viewport: CanvasAlignmentContext['viewport']
  ): AlignmentSubject[] {
    return subjects.filter((subject) =>
      isAlignmentRectVisibleInViewport(subject.bounds, viewport)
    );
  }

  private createReferenceSubjectsCacheKey(
    context: CanvasAlignmentContext
  ): string {
    const movingIds = context.movingElements
      .map((element) => element.id)
      .sort()
      .join('|');

    return `${context.mode}:${movingIds}`;
  }

  private createContext(
    args: ResolveAlignmentSubjectsArgs
  ): CanvasAlignmentContext {
    const buffer = args.viewportBuffer;
    const left = this.panZoom.scrollX / this.panZoom.scale - buffer;
    const top = this.panZoom.scrollY / this.panZoom.scale - buffer;
    const right =
      (this.panZoom.scrollX + this.canvas.width) / this.panZoom.scale + buffer;
    const bottom =
      (this.panZoom.scrollY + this.canvas.height) / this.panZoom.scale + buffer;

    return {
      elements: this.scene.getElements(),
      movingElements: args.movingElements,
      viewport: {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        left,
        right,
        top,
        bottom,
        centerX: left + (right - left) / 2,
        centerY: top + (bottom - top) / 2,
      },
      mode: args.mode ?? 'move',
      preferences: {
        ...mergeAlignmentPreferences(args.preferences),
        snapEnabled: args.allowSnap,
      },
    };
  }
}
