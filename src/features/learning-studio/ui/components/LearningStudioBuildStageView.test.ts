// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningStudioBuildModel } from './LearningStudioScreenModels.ts';
import { LearningStudioBuildStageView } from './LearningStudioBuildStageView.ts';

function createBuildModel(): LearningStudioBuildModel {
  return {
    course: {
      courseId: 'course-1',
      draftId: 'draft-1',
      title: 'Course build test',
      description: 'Structured build test.',
      audience: '',
      outcomes: [],
      lifecycleState: 'draft',
      moduleCount: 1,
      unitCount: 3,
      latestPublishedVersionId: null,
      updatedAt: '2026-03-28T09:00:00.000Z',
      structure: [],
      nextRecommendedRoute: 'build',
    },
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        description: 'Module description',
        order: 0,
        selected: true,
        collapsed: false,
        missingLessons: false,
        childUnitCount: 2,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Lesson 1',
            description: 'Lesson description',
            type: 'lesson',
            order: 0,
            selected: true,
            missingDescription: false,
            prerequisiteIssue: false,
            childUnits: [
              {
                id: 'exercise-1',
                title: 'Exercise 1',
                type: 'exercise',
                order: 0,
                selected: false,
              },
              {
                id: 'checkpoint-1',
                title: 'Checkpoint 1',
                type: 'checkpoint',
                order: 1,
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
      description: 'Lesson description',
      objective: '',
      type: 'lesson',
      prerequisiteLessonIds: [],
      availablePrerequisites: [],
      blocks: [],
      availableExerciseRefs: [],
      availableCheckpointRefs: [],
    },
  };
}

function createOptions() {
  return {
    runtime: createAppRuntime({ initialLocale: 'en' }),
    build: createBuildModel(),
    onAddModule: vi.fn(),
    onSelectCourse: vi.fn(),
    onSelectModule: vi.fn(),
    onSelectUnit: vi.fn(),
    onAddLesson: vi.fn(),
    onAddExercise: vi.fn(),
    onAddCheckpoint: vi.fn(),
    onMoveModule: vi.fn(),
    onToggleModuleCollapse: vi.fn(),
    onMoveLesson: vi.fn(),
    onMoveChildUnit: vi.fn(),
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
  it('renders a structured build workspace with rail and inspector pane', () => {
    const view = new LearningStudioBuildStageView(createOptions());

    expect(
      view.element.querySelector('[data-role="learning-studio-build-rail"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector-pane"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-select-module-module-1"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-select-unit-lesson-1"]')
    ).not.toBeNull();
  });

  it('shows the empty state and creates the first module from the CTA', () => {
    const options = createOptions();
    options.build = {
      ...options.build,
      course: {
        ...options.build.course,
        moduleCount: 0,
        unitCount: 0,
      },
      modules: [],
      selected: { kind: 'course', id: 'course-1' },
      inspector: {
        kind: 'course',
        title: 'Course build test',
        description: '',
        moduleCount: 0,
        unitCount: 0,
        missingModules: true,
        missingDescriptions: 0,
      },
    };

    const view = new LearningStudioBuildStageView(options);
    const button = view.element.querySelector(
      '[data-role="learning-studio-build-empty-add-module"]'
    ) as HTMLButtonElement | null;

    expect(
      view.element.querySelector('[data-role="learning-studio-build-empty"]')
    ).not.toBeNull();
    expect(button).not.toBeNull();

    button?.click();

    expect(options.onAddModule).toHaveBeenCalledTimes(1);
  });

  it('forwards outline actions through the structured controls', () => {
    const options = createOptions();
    const view = new LearningStudioBuildStageView(options);

    (
      view.element.querySelector(
        '[data-role="learning-studio-build-select-course"]'
      ) as HTMLButtonElement
    ).click();
    (
      view.element.querySelector(
        '[data-role="learning-studio-build-add-lesson-module-1"]'
      ) as HTMLButtonElement
    ).click();
    (
      view.element.querySelector(
        '[data-role="learning-studio-build-add-exercise-lesson-1"]'
      ) as HTMLButtonElement
    ).click();
    (
      view.element.querySelector(
        '[data-role="learning-studio-build-add-checkpoint-lesson-1"]'
      ) as HTMLButtonElement
    ).click();
    (
      view.element.querySelector(
        '[data-role="learning-studio-build-move-child-down-exercise-1"]'
      ) as HTMLButtonElement
    ).click();

    expect(options.onSelectCourse).toHaveBeenCalledTimes(1);
    expect(options.onAddLesson).toHaveBeenCalledWith('module-1');
    expect(options.onAddExercise).toHaveBeenCalledWith('lesson-1');
    expect(options.onAddCheckpoint).toHaveBeenCalledWith('lesson-1');
    expect(options.onMoveChildUnit).toHaveBeenCalledWith('exercise-1', 1);
  });
});
