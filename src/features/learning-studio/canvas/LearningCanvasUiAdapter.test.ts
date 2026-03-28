// @vitest-environment jsdom

import { of, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createAppRuntime } from '../../../app-runtime/index.ts';
import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { CanvasLookupAdapter } from '../../canvas-core/adapters/CanvasLookupAdapter.ts';
import type { CanvasManager } from '../../canvas-core/core/managers/CanvasManager.ts';
import type { IViewState } from '../../canvas-core/core/interfaces/interfaces.ts';
import { Scene } from '../../canvas-core/core/scene/Scene.ts';
import { LearningCanvasInteractionAdapter } from './LearningCanvasInteractionAdapter.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningCanvasUiAdapter } from './LearningCanvasUiAdapter.ts';
import { createEmptyLearningCourseContent } from '../domain/types.ts';

function createCanvasManagerStub(): CanvasManager {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;
  const panZoomChanges = new Subject<IViewState>();
  const panZoomStub = {
    scrollX: 0,
    scrollY: 0,
    scale: 1,
    viewBounds: {
      minX: -100,
      minY: -100,
      maxX: 2000,
      maxY: 2000,
    },
    viewChanges: panZoomChanges,
  } as unknown as PanZoomLike;

  return {
    draw(): void {},
    getCanvas: () =>
      ({
        getBoundingClientRect: () => new DOMRect(0, 0, 1200, 800),
      }) as unknown as HTMLCanvasElement,
    getPanZoomManager: () => panZoomStub,
    isDraggingElements: false,
    isResizingStory: false,
  } as unknown as CanvasManager;
}

describe('LearningCanvasUiAdapter', () => {
  it('provides learning HUD components without planning-only chrome', () => {
    const scene = new Scene();
    scene.setSelected([]);
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const hostApi: LearningCanvasHostApi = {
      getDocument: () => ({
        canvasId: 'canvas-1',
        courseId: 'course-1',
        draftId: 'draft-1',
        mode: 'build',
        title: 'Course',
        content: createEmptyLearningCourseContent(),
        selection: null,
      }),
      saveContent: () => {},
      commands: {
        createModule: () => {},
        createLesson: () => {},
        createExercise: () => {},
        createCheckpoint: () => {},
        setLessonPrerequisite: () => {},
      },
      selection: {
        setSelection: () => {},
      },
    };
    const interactionAdapter = new LearningCanvasInteractionAdapter(hostApi);

    const adapter = new LearningCanvasUiAdapter(hostApi);
    const lookupAdapter: CanvasLookupAdapter = {
      searchTasks: (_term, _page, _pageSize) =>
        of({ items: [] as PlatformTask[], hasMore: false }),
      searchGoals: (_term, _page, _pageSize) =>
        of({ items: [] as Goal[], hasMore: false }),
      searchStories: (_term, _page, _pageSize) =>
        of({ items: [] as Story[], hasMore: false }),
      getStory: () => of(({ id: 'story-1' } as unknown) as Story),
      getGoal: () => of(({ id: 'goal-1' } as unknown) as Goal),
      fetchStoriesByIds: () => of([] as Story[]),
    };
    const components = adapter.createComponents({
      scene,
      canvasManager: createCanvasManagerStub(),
      lookupAdapter,
      interactionAdapter,
      runtime,
    });

    expect(adapter.getPreferences()).toMatchObject({
      showNavigationDock: true,
      showBoardSelector: false,
      showSaveControls: false,
      showCanvasMenu: false,
    });
    expect(components).toHaveLength(3);
    expect(components[0]?.constructor?.name).toBe('LearningCanvasSelectionBridge');
    expect(components[1]?.constructor?.name).toBe('ContextMenu');
    expect(components[2]?.constructor?.name).toBe('SelectionActionMenu');
  });
});
