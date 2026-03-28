// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioPreviewView } from './LearningStudioPreviewView.ts';
import type { LearningStudioPreviewModel } from './LearningStudioScreenModels.ts';

function createPreview(): LearningStudioPreviewModel {
  return {
    course: {
      courseId: 'course-1',
      draftId: 'draft-1',
      title: 'Preview course',
      description: '',
      audience: '',
      outcomes: [],
      lifecycleState: 'draft',
      moduleCount: 1,
      unitCount: 2,
      latestPublishedVersionId: null,
      updatedAt: '2026-03-28T10:00:00.000Z',
      structure: [],
      nextRecommendedRoute: 'preview',
    },
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        lessons: [
          {
            id: 'lesson-1',
            moduleId: 'module-1',
            title: 'Lesson 1',
            status: 'available',
            selected: true,
            hasWarnings: false,
          },
        ],
      },
    ],
    map: {
      layoutMode: 'auto',
      presentation: {
        layoutMode: 'auto',
        showModules: true,
        childUnitVisibility: 'important_only',
        promotedUnitIds: [],
        hiddenNodeIds: [],
        manualNodePositions: {},
      },
      nodes: [
        {
          id: 'module-1',
          kind: 'module',
          title: 'Module 1',
          moduleId: 'module-1',
          parentId: null,
          state: 'none',
          isFocused: false,
          isRecommended: false,
          childCount: 1,
          hiddenChildCount: 0,
          position: null,
        },
        {
          id: 'lesson-1',
          kind: 'lesson',
          title: 'Lesson 1',
          moduleId: 'module-1',
          parentId: 'module-1',
          state: 'available',
          isFocused: true,
          isRecommended: true,
          childCount: 1,
          hiddenChildCount: 1,
          position: null,
        },
        {
          id: 'checkpoint-1',
          kind: 'checkpoint',
          title: 'Checkpoint 1',
          moduleId: 'module-1',
          parentId: 'lesson-1',
          state: 'locked',
          isFocused: false,
          isRecommended: false,
          childCount: 0,
          hiddenChildCount: 0,
          position: null,
        },
      ],
      edges: [
        {
          id: 'lesson-1->checkpoint-1:contains',
          kind: 'contains',
          fromId: 'lesson-1',
          toId: 'checkpoint-1',
        },
      ],
      focusedNodeId: 'lesson-1',
      recommendedNodeId: 'lesson-1',
    },
    focusedLesson: {
      id: 'lesson-1',
      moduleId: 'module-1',
      moduleTitle: 'Module 1',
      title: 'Lesson 1',
      description: 'Lesson description',
      objective: '',
      status: 'available',
      prerequisiteTitles: [],
      blockedByTitles: [],
      warnings: [],
      blocks: [],
    },
    nextRecommendedLessonId: 'lesson-1',
    sandboxMode: true,
  };
}

describe('LearningStudioPreviewView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('toggles between focus and map surfaces', () => {
    const view = new LearningStudioPreviewView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      preview: createPreview(),
      onSelectLesson: vi.fn(),
    });
    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-preview-lesson-view"]')
    ).not.toBeNull();

    (
      view.element.querySelector(
        '[data-role="learning-studio-preview-mode-map"]'
      ) as HTMLButtonElement
    ).click();

    expect(
      view.element.querySelector('[data-role="learning-studio-preview-rail"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-preview-map-surface"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-preview-map"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector(
        '[data-role="learning-studio-preview-map-canvas"], [data-role="learning-studio-preview-map-canvas-fallback"]'
      )
    ).not.toBeNull();

    (
      view.element.querySelector(
        '[data-role="learning-studio-preview-mode-focus"]'
      ) as HTMLButtonElement
    ).click();

    expect(
      view.element.querySelector('[data-role="learning-studio-preview-rail"]')
    ).not.toBeNull();
  });
});
