import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { Scene } from '../scene/Scene.ts';
import {
  createAlignmentRect,
  getElementAlignmentRect,
  type SmartAlignmentRect,
} from '../services/SmartAlignmentService.ts';
import { AlignmentSubjectIndex } from './AlignmentSubjectIndex.ts';
import {
  mergeAlignmentPreferences,
  type AlignmentInteractionMode,
  type AlignmentPreferences,
  type AlignmentRect,
  type AlignmentSubject,
} from './types.ts';

type ResolveAlignmentSubjectsArgs = {
  movingElements: ICanvasElement[];
  allowSnap: boolean;
  viewportBuffer: number;
  mode?: AlignmentInteractionMode;
  preferences?: Partial<AlignmentPreferences>;
  maxSubjects?: number;
};

type ResolvedAlignmentSubjects = {
  movingSubject: AlignmentSubject | null;
  subjects: AlignmentSubject[];
  viewport: AlignmentRect;
};

export class CanvasAlignmentSubjectProvider {
  private cachedReferenceSubjectsKey: string | null = null;
  private cachedReferenceSubjectsVersion: number = -1;
  private cachedReferenceSubjects: AlignmentSubject[] = [];
  private cachedReferenceIndex: AlignmentSubjectIndex | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly scene: Scene,
    private readonly panZoom: PanZoomManager
  ) {}

  public resolveSubjects(
    args: ResolveAlignmentSubjectsArgs
  ): ResolvedAlignmentSubjects {
    const preferences = {
      ...mergeAlignmentPreferences(args.preferences),
      snapEnabled: args.allowSnap,
    };
    const viewport = this.createViewport(args.viewportBuffer);
    const movingSubject = this.getMovingSubject(args.movingElements);
    const referenceSubjects = this.getReferenceSubjects({
      movingElements: args.movingElements,
      mode: args.mode ?? 'move',
    });
    const virtualSubjects = preferences.showViewportCenterGuides
      ? [this.createViewportAlignmentSubject()]
      : [];

    return {
      movingSubject,
      subjects: this.rankSubjects({
        movingSubject,
        referenceSubjects,
        virtualSubjects,
        viewport,
        limit: args.maxSubjects,
      }),
      viewport,
    };
  }

  private getMovingSubject(
    movingElements: ReadonlyArray<ICanvasElement>
  ): AlignmentSubject | null {
    const bounds = this.getBoundsForElements(movingElements);
    if (!bounds) return null;
    const taskContainerById = this.getTaskContainerLookup();
    if (movingElements.length === 1) {
      return this.createAlignmentSubject({
        element: movingElements[0]!,
        bounds,
        taskContainerById,
      });
    }
    const commonScopeId = this.getCommonTaskContainerId(
      movingElements,
      taskContainerById
    );
    return {
      id: `selection:${movingElements
        .map((element) => element.id)
        .sort()
        .join('|')}`,
      role: 'element',
      scopeKind: commonScopeId ? 'container' : 'local',
      scopeId: commonScopeId,
      bounds,
      anchors: [],
    };
  }

  private getReferenceSubjects(args: {
    movingElements: ReadonlyArray<ICanvasElement>;
    mode: AlignmentInteractionMode;
  }): AlignmentSubject[] {
    const cacheKey = this.createReferenceSubjectsCacheKey(args);
    const sceneVersion = this.scene.getElementsVersion();
    const shouldRebuildCache =
      this.cachedReferenceSubjectsKey !== cacheKey ||
      this.cachedReferenceSubjectsVersion !== sceneVersion ||
      this.cachedReferenceIndex === null;

    if (shouldRebuildCache) {
      const movingIds = new Set(args.movingElements.map((element) => element.id));
      const taskContainerById = this.getTaskContainerLookup();
      this.cachedReferenceSubjects = this.scene
        .getElements()
        .filter((element) => !movingIds.has(element.id))
        .map((element) => {
          const bounds = getElementAlignmentRect(element);
          if (!bounds) return null;
          return this.createAlignmentSubject({
            element,
            bounds,
            taskContainerById,
          });
        })
        .filter(
          (subject): subject is AlignmentSubject => subject !== null
        );
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
    referenceSubjects: ReadonlyArray<AlignmentSubject>;
    virtualSubjects: ReadonlyArray<AlignmentSubject>;
    viewport: AlignmentRect;
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
            this.isRectVisibleInViewport(subject.bounds, args.viewport),
        }) ?? visibleReferenceSubjects
      );
    }

    const rankedReferenceSubjects =
      this.cachedReferenceIndex?.query({
        movingSubject: args.movingSubject,
        include: (subject) =>
          this.isRectVisibleInViewport(subject.bounds, args.viewport),
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
    viewport: AlignmentRect
  ): AlignmentSubject[] {
    return subjects.filter((subject) =>
      this.isRectVisibleInViewport(subject.bounds, viewport)
    );
  }

  private createReferenceSubjectsCacheKey(args: {
    movingElements: ReadonlyArray<ICanvasElement>;
    mode: AlignmentInteractionMode;
  }): string {
    const movingIds = args.movingElements
      .map((element) => element.id)
      .sort()
      .join('|');

    return `${args.mode}:${movingIds}`;
  }

  private createViewport(buffer: number): AlignmentRect {
    const left = this.panZoom.scrollX / this.panZoom.scale - buffer;
    const top = this.panZoom.scrollY / this.panZoom.scale - buffer;
    const right =
      (this.panZoom.scrollX + this.canvas.width) / this.panZoom.scale + buffer;
    const bottom =
      (this.panZoom.scrollY + this.canvas.height) / this.panZoom.scale + buffer;

    return {
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
    };
  }

  private getBoundsForElements(
    elements: ReadonlyArray<ICanvasElement>
  ): SmartAlignmentRect | null {
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

  private createAlignmentSubject(args: {
    element: ICanvasElement;
    bounds: SmartAlignmentRect;
    taskContainerById: ReadonlyMap<string, string>;
  }): AlignmentSubject | null {
    const { element, bounds, taskContainerById } = args;
    if (element instanceof StoryElement) {
      return {
        id: element.id,
        role: 'container',
        scopeKind: 'container',
        scopeId: null,
        bounds,
        anchors: [],
      };
    }
    const scopeId =
      element instanceof TaskElement ? taskContainerById.get(element.id) ?? null : null;
    return {
      id: element.id,
      role: 'element',
      scopeKind: scopeId ? 'container' : 'local',
      scopeId,
      bounds,
      anchors: [],
    };
  }

  private getTaskContainerLookup(): Map<string, string> {
    const lookup = new Map<string, string>();
    this.scene
      .getElements()
      .filter(isPlanningElement)
      .filter((element): element is StoryElement => element instanceof StoryElement)
      .forEach((story) => {
        story.tasks.forEach((task) => {
          lookup.set(task.id, story.id);
        });
      });
    return lookup;
  }

  private getCommonTaskContainerId(
    elements: ReadonlyArray<ICanvasElement>,
    taskContainerById: ReadonlyMap<string, string>
  ): string | null {
    const taskIds = elements
      .filter((element): element is TaskElement => element instanceof TaskElement)
      .map((task) => task.id);
    if (taskIds.length !== elements.length || taskIds.length === 0) {
      return null;
    }
    const firstScopeId = taskContainerById.get(taskIds[0]!) ?? null;
    if (!firstScopeId) return null;
    return taskIds.every((taskId) => taskContainerById.get(taskId) === firstScopeId)
      ? firstScopeId
      : null;
  }

  private createViewportAlignmentSubject(): AlignmentSubject {
    const bounds = createAlignmentRect({
      x: this.panZoom.scrollX / this.panZoom.scale,
      y: this.panZoom.scrollY / this.panZoom.scale,
      width: this.canvas.width / this.panZoom.scale,
      height: this.canvas.height / this.panZoom.scale,
    });
    return {
      id: 'viewport-center',
      role: 'viewport',
      scopeKind: 'viewport',
      scopeId: null,
      bounds,
      anchors: [],
    };
  }

  private isRectVisibleInViewport(
    rect: SmartAlignmentRect,
    viewport: AlignmentRect
  ): boolean {
    return (
      rect.right >= viewport.left &&
      rect.left <= viewport.right &&
      rect.bottom >= viewport.top &&
      rect.top <= viewport.bottom
    );
  }
}
