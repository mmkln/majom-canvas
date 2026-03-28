// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioRootView } from './LearningStudioRootView.ts';
import type { LearningCanvasHostApi } from '../../canvas/LearningCanvasHostApi.ts';

const createCanvasHostApiStub = (): LearningCanvasHostApi => ({
  getDocument: () => ({
    canvasId: 'learning-course:course-1:build',
    courseId: 'course-1',
    draftId: 'draft-1',
    mode: 'build',
    title: 'Canvas build test',
    content: {
      title: 'Canvas build test',
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
});

describe('LearningStudioRootView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the rebuilt Home screen instead of the redesign placeholder', () => {
    const view = new LearningStudioRootView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      screen: {
        kind: 'home',
        courses: [],
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson: vi.fn(),
      resolveCanvasHostApi: () => null,
    });

    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-home"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-home-empty"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-home-create-manual"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-redesign-placeholder"]')
    ).toBeNull();
  });

  it('wraps course stages in the shared course shell', () => {
    const view = new LearningStudioRootView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      screen: {
        kind: 'overview',
        course: {
          courseId: 'course-1',
          draftId: 'draft-1',
          title: 'Course shell test',
          description: 'Overview should be wrapped in the shared shell.',
          audience: 'Test audience',
          outcomes: [],
          lifecycleState: 'draft',
          moduleCount: 2,
          unitCount: 5,
          latestPublishedVersionId: null,
          updatedAt: '2026-03-27T10:00:00.000Z',
          structure: [],
          nextRecommendedRoute: 'build',
        },
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson: vi.fn(),
      resolveCanvasHostApi: () => null,
    });

    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-course-shell"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-shell-open-build"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-shell-open-preview"]')
    ).not.toBeNull();
  });

  it('renders the connected canvas-core host for the Build stage', () => {
    const view = new LearningStudioRootView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      screen: {
        kind: 'build',
        build: {
          course: {
            courseId: 'course-1',
            draftId: 'draft-1',
            title: 'Canvas build test',
            description: 'Build should now host canvas-core.',
            audience: 'Test audience',
            outcomes: [],
            lifecycleState: 'draft',
            moduleCount: 0,
            unitCount: 0,
            latestPublishedVersionId: null,
            updatedAt: '2026-03-27T10:00:00.000Z',
            structure: [],
            nextRecommendedRoute: 'build',
          },
          modules: [],
          selected: null,
          inspector: {
            kind: 'course',
            title: 'Canvas build test',
            description: '',
            moduleCount: 0,
            unitCount: 0,
            missingModules: true,
            missingDescriptions: 0,
          },
        },
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson: vi.fn(),
      resolveCanvasHostApi: () => createCanvasHostApiStub(),
    });

    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-build-canvas-host"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-rail"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector-pane"]')
    ).toBeNull();
  });

  it('keeps the same build canvas host mounted during build-only updates', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const view = new LearningStudioRootView({
      runtime,
      screen: {
        kind: 'build',
        build: {
          course: {
            courseId: 'course-1',
            draftId: 'draft-1',
            title: 'Canvas build test',
            description: 'Build should now host canvas-core.',
            audience: 'Test audience',
            outcomes: [],
            lifecycleState: 'draft',
            moduleCount: 1,
            unitCount: 1,
            latestPublishedVersionId: null,
            updatedAt: '2026-03-27T10:00:00.000Z',
            structure: [],
            nextRecommendedRoute: 'build',
          },
          modules: [],
          selected: { kind: 'course', id: 'course-1' },
          inspector: {
            kind: 'course',
            title: 'Canvas build test',
            description: '',
            moduleCount: 1,
            unitCount: 1,
            missingModules: false,
            missingDescriptions: 0,
          },
        },
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson: vi.fn(),
      resolveCanvasHostApi: () => createCanvasHostApiStub(),
    });

    document.body.append(view.element);

    const hostBefore = view.element.querySelector(
      '[data-role="learning-studio-build-canvas-host"]'
    );

    view.update({
      runtime,
      screen: {
        kind: 'build',
        build: {
          course: {
            courseId: 'course-1',
            draftId: 'draft-1',
            title: 'Canvas build test',
            description: 'Build should now host canvas-core.',
            audience: 'Test audience',
            outcomes: [],
            lifecycleState: 'draft',
            moduleCount: 1,
            unitCount: 1,
            latestPublishedVersionId: null,
            updatedAt: '2026-03-27T10:00:00.000Z',
            structure: [],
            nextRecommendedRoute: 'build',
          },
          modules: [],
          selected: { kind: 'module', id: 'module-1' },
          inspector: {
            kind: 'module',
            id: 'module-1',
            title: 'Module 1',
            description: '',
            lessonCount: 1,
          },
        },
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson: vi.fn(),
      resolveCanvasHostApi: () => createCanvasHostApiStub(),
    });

    const hostAfter = view.element.querySelector(
      '[data-role="learning-studio-build-canvas-host"]'
    );

    expect(hostAfter).toBe(hostBefore);
    expect(
      view.element.querySelector('[data-role="learning-studio-build-rail"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector-pane"]')
    ).toBeNull();
  });

  it('renders Preview as a read-only validation surface instead of a canvas host', () => {
    const onSelectPreviewLesson = vi.fn();
    const view = new LearningStudioRootView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      screen: {
        kind: 'preview',
        preview: {
          course: {
            courseId: 'course-1',
            draftId: 'draft-1',
            title: 'Preview course',
            description: 'Preview should stay read-only.',
            audience: 'Test audience',
            outcomes: [],
            lifecycleState: 'draft',
            moduleCount: 1,
            unitCount: 2,
            latestPublishedVersionId: null,
            updatedAt: '2026-03-27T10:00:00.000Z',
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
          focusedLesson: {
            id: 'lesson-1',
            moduleId: 'module-1',
            moduleTitle: 'Module 1',
            title: 'Lesson 1',
            description: 'Read-only preview lesson',
            objective: '',
            status: 'available',
            prerequisiteTitles: [],
            blockedByTitles: [],
            warnings: [],
            blocks: [
              {
                id: 'block-1',
                order: 0,
                type: 'intro',
                text: 'Preview copy',
              },
            ],
          },
          nextRecommendedLessonId: 'lesson-1',
          sandboxMode: true,
        },
      },
      onCreateManual: vi.fn(),
      onOpenCourse: vi.fn(),
      onBackHome: vi.fn(),
      onBackOverview: null,
      onOpenStage: vi.fn(),
      onOpenPreview: vi.fn(),
      onSaveOverview: vi.fn(),
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
      onSelectPreviewLesson,
      resolveCanvasHostApi: () => null,
    });

    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-preview"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-preview-canvas-host"]')
    ).toBeNull();

    (
      view.element.querySelector(
        '[data-role="learning-studio-preview-select-lesson-1"]'
      ) as HTMLButtonElement
    ).click();

    expect(onSelectPreviewLesson).toHaveBeenCalledWith('lesson-1');
  });
});
