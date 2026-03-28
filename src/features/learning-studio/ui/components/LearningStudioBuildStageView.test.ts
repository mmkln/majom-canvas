// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningCanvasHostApi } from '../../canvas/LearningCanvasHostApi.ts';
import {
  LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
  type LearningCanvasEditorRequestedDetail,
} from '../../canvas/LearningCanvasEditorEvents.ts';
import type { LearningStudioBuildModel } from './LearningStudioScreenModels.ts';
import { LearningStudioBuildStageView } from './LearningStudioBuildStageView.ts';

function createHostApiStub(): LearningCanvasHostApi {
  return {
    getDocument: () => ({
      canvasId: 'learning-course:course-1:build',
      courseId: 'course-1',
      draftId: 'draft-1',
      mode: 'build',
      title: 'Course build test',
      content: {
        title: 'Course build test',
        description: '',
        audience: '',
        outcomes: [],
        estimatedDurationMinutes: null,
        modules: [],
        units: [],
        moduleLayouts: [],
      },
      selection: null,
    }),
    saveContent: vi.fn(),
    commands: {
      createModule: vi.fn(),
      createLesson: vi.fn(),
      createExercise: vi.fn(),
      createCheckpoint: vi.fn(),
      setLessonPrerequisite: vi.fn(),
    },
    selection: {
      setSelection: vi.fn(),
    },
  };
}

function createOptions() {
  const build: LearningStudioBuildModel = {
    course: {
      courseId: 'course-1',
      draftId: 'draft-1',
      title: 'Course build test',
      description: 'Build should expose the canvas workspace.',
      audience: '',
      outcomes: [],
      lifecycleState: 'draft',
      moduleCount: 1,
      unitCount: 2,
      latestPublishedVersionId: null,
      updatedAt: '2026-03-28T09:00:00.000Z',
      structure: [],
      nextRecommendedRoute: 'build',
    },
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        description: '',
        order: 0,
        selected: false,
        collapsed: false,
        missingLessons: false,
        childUnitCount: 1,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            description: '',
            type: 'lesson',
            order: 0,
            selected: true,
            missingDescription: true,
            prerequisiteIssue: false,
            childUnits: [
              {
                id: 'exercise-1',
                title: 'Exercise 1',
                type: 'exercise',
                order: 0,
                selected: false,
              },
            ],
          },
        ],
      },
    ],
    selected: { kind: 'unit', id: 'lesson-1' },
    inspector: {
      kind: 'unit',
      id: 'lesson-1',
      title: 'Lesson 1',
      description: '',
      objective: '',
      type: 'lesson',
      prerequisiteLessonIds: [],
      availablePrerequisites: [],
      blocks: [],
      availableExerciseRefs: [],
      availableCheckpointRefs: [],
    },
  };

  return {
    runtime: createAppRuntime({ initialLocale: 'en' }),
    hostApi: createHostApiStub(),
    build,
    onAddModule: vi.fn(),
    onSelectCourse: vi.fn(),
    onSelectModule: vi.fn(),
    onSelectUnit: vi.fn(),
    onAddLesson: vi.fn(),
    onToggleModuleCollapse: vi.fn(),
    onUpdateModuleTitle: vi.fn(),
    onUpdateModuleDescription: vi.fn(),
    onUpdateUnitTitle: vi.fn(),
    onUpdateUnitDescription: vi.fn(),
    onUpdateUnitObjective: vi.fn(),
    onTogglePrerequisite: vi.fn(),
    onAddLessonBlock: vi.fn(),
    onUpdateLessonBlockType: vi.fn(),
    onUpdateLessonBlockText: vi.fn(),
    onUpdateLessonBlockReference: vi.fn(),
    onMoveLessonBlock: vi.fn(),
    onRemoveLessonBlock: vi.fn(),
  };
}

describe('LearningStudioBuildStageView', () => {
  it('shows a canvas-first build workspace without course map or side inspector', () => {
    const options = createOptions();
    options.build.modules = [];
    options.build.course.moduleCount = 0;
    options.build.course.unitCount = 0;
    options.build.selected = null;
    options.build.inspector = {
      kind: 'course',
      title: 'Course build test',
      description: '',
      moduleCount: 0,
      unitCount: 0,
      missingModules: true,
      missingDescriptions: 0,
    };

    const view = new LearningStudioBuildStageView(options);

    const addModule = view.element.querySelector(
      '[data-role="learning-studio-build-add-module"]'
    ) as HTMLButtonElement | null;
    const emptyAddModule = view.element.querySelector(
      '[data-role="learning-studio-build-empty-add-module"]'
    ) as HTMLButtonElement | null;

    expect(
      view.element.querySelector('[data-role="learning-studio-build-canvas-host"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-empty"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-rail"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector-pane"]')
    ).toBeNull();

    if (!addModule || !emptyAddModule) {
      throw new Error('Expected add-module actions.');
    }

    addModule.click();
    emptyAddModule.click();

    expect(options.onAddModule).toHaveBeenCalledTimes(2);
  });

  it('opens the details modal for canvas editor requests when the target is already selected', () => {
    const options = createOptions();
    options.build.selected = { kind: 'module', id: 'module-1' };
    options.build.inspector = {
      kind: 'module',
      id: 'module-1',
      title: 'Module 1',
      description: '',
      lessonCount: 1,
    };
    const view = new LearningStudioBuildStageView(options);

    window.dispatchEvent(
      new CustomEvent<LearningCanvasEditorRequestedDetail>(
        LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
        {
          detail: {
            kind: 'module',
            id: 'module-1',
          },
        }
      )
    );

    expect(
      document.body.querySelector('[data-role="learning-studio-build-details-modal"]')
    ).not.toBeNull();
    expect(options.onSelectModule).not.toHaveBeenCalled();

    view.destroy();
  });

  it('requests selection first and then opens the details modal on the next build update', () => {
    const options = createOptions();
    const view = new LearningStudioBuildStageView(options);

    window.dispatchEvent(
      new CustomEvent<LearningCanvasEditorRequestedDetail>(
        LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
        {
          detail: {
            kind: 'module',
            id: 'module-1',
          },
        }
      )
    );

    expect(options.onSelectModule).toHaveBeenCalledWith('module-1');
    expect(
      document.body.querySelector('[data-role="learning-studio-build-details-modal"]')
    ).toBeNull();

    view.update({
      ...options,
      build: {
        ...options.build,
        selected: { kind: 'module', id: 'module-1' },
        inspector: {
          kind: 'module',
          id: 'module-1',
          title: 'Module 1',
          description: '',
          lessonCount: 1,
        },
      },
    });

    expect(
      document.body.querySelector('[data-role="learning-studio-build-details-modal"]')
    ).not.toBeNull();
  });
});
