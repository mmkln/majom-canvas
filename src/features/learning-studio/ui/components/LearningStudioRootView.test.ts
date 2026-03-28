// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioRootView } from './LearningStudioRootView.ts';

function createRootOptions(): ConstructorParameters<typeof LearningStudioRootView>[0] {
  return {
    runtime: createAppRuntime({ initialLocale: 'en' }),
    screen: {
      kind: 'home' as const,
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
  };
}

describe('LearningStudioRootView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the rebuilt Home screen', () => {
    const view = new LearningStudioRootView(createRootOptions());

    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-home"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-home-create-manual"]')
    ).not.toBeNull();
  });

  it('renders Build as a structured workspace inside the shared course shell', () => {
    const options = createRootOptions();
    options.screen = {
      kind: 'build',
      build: {
        course: {
          courseId: 'course-1',
          draftId: 'draft-1',
          title: 'Build course',
          description: 'Structured build test',
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
          title: 'Build course',
          description: '',
          moduleCount: 1,
          unitCount: 1,
          missingModules: false,
          missingDescriptions: 0,
        },
      },
    };

    const view = new LearningStudioRootView(options);
    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-course-shell"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-rail"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector-pane"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-build-canvas-host"]')
    ).toBeNull();
  });

  it('renders Preview as a read-only validation surface', () => {
    const options = createRootOptions();
    options.screen = {
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
          unitCount: 1,
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
        map: {
          layoutMode: 'auto',
          presentation: {
            layoutMode: 'auto',
            showModules: true,
            childUnitVisibility: 'auto',
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
              hiddenChildCount: 1,
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
              childCount: 0,
              hiddenChildCount: 0,
              position: null,
            },
          ],
          edges: [
            {
              id: 'module-1->lesson-1:contains',
              kind: 'contains',
              fromId: 'module-1',
              toId: 'lesson-1',
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
    };

    const view = new LearningStudioRootView(options);
    document.body.append(view.element);

    expect(
      view.element.querySelector('[data-role="learning-studio-preview"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-preview-map-summary"]')
    ).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-preview-canvas-host"]')
    ).toBeNull();

    (
      view.element.querySelector(
        '[data-role="learning-studio-preview-select-lesson-1"]'
      ) as HTMLButtonElement
    ).click();

    expect(options.onSelectPreviewLesson).toHaveBeenCalledWith('lesson-1');
  });
});
