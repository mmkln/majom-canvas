// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioBuildInspectorView } from './LearningStudioBuildInspectorView.ts';

describe('LearningStudioBuildInspectorView', () => {
  it('can render without the panel header when embedded in a modal', () => {
    const view = new LearningStudioBuildInspectorView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      showHeader: false,
      build: {
        course: {
          courseId: 'course-1',
          draftId: 'draft-1',
          title: 'Course',
          description: '',
          audience: '',
          outcomes: [],
          lifecycleState: 'draft',
          moduleCount: 1,
          unitCount: 1,
          latestPublishedVersionId: null,
          updatedAt: '2026-03-28T10:00:00.000Z',
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
    });

    expect(
      view.element.querySelector('[data-role="learning-studio-build-inspector"] h3')
    ).toBeNull();
  });

  it('renders lesson content controls and forwards add-block actions', () => {
    const onAddLessonBlock = vi.fn();
    const view = new LearningStudioBuildInspectorView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      build: {
        course: {
          courseId: 'course-1',
          draftId: 'draft-1',
          title: 'Course',
          description: '',
          audience: '',
          outcomes: [],
          lifecycleState: 'draft',
          moduleCount: 1,
          unitCount: 3,
          latestPublishedVersionId: null,
          updatedAt: '2026-03-28T10:00:00.000Z',
          structure: [],
          nextRecommendedRoute: 'build',
        },
        modules: [],
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
          blocks: [
            {
              id: 'block-1',
              order: 0,
              type: 'concept',
              text: 'Core concept',
            },
          ],
          availableExerciseRefs: [
            {
              id: 'exercise-1',
              title: 'Exercise 1',
            },
          ],
          availableCheckpointRefs: [],
        },
      },
      onUpdateModuleTitle: vi.fn(),
      onUpdateModuleDescription: vi.fn(),
      onUpdateUnitTitle: vi.fn(),
      onUpdateUnitDescription: vi.fn(),
      onUpdateUnitObjective: vi.fn(),
      onTogglePrerequisite: vi.fn(),
      onAddLessonBlock,
      onUpdateLessonBlockType: vi.fn(),
      onUpdateLessonBlockText: vi.fn(),
      onUpdateLessonBlockReference: vi.fn(),
      onMoveLessonBlock: vi.fn(),
      onRemoveLessonBlock: vi.fn(),
    });

    const addType = view.element.querySelector(
      '[data-role="learning-studio-build-content-add-type-lesson-1"]'
    ) as HTMLSelectElement | null;
    const addButton = view.element.querySelector(
      '[data-role="learning-studio-build-content-add-lesson-1"]'
    ) as HTMLButtonElement | null;
    const block = view.element.querySelector(
      '[data-role="learning-studio-build-block-lesson-1-block-1"]'
    );

    expect(addType).not.toBeNull();
    expect(addButton).not.toBeNull();
    expect(block).not.toBeNull();

    if (!addType || !addButton) {
      throw new Error('Expected content controls.');
    }

    addType.value = 'exercise_ref';
    addButton.click();

    expect(onAddLessonBlock).toHaveBeenCalledWith('lesson-1', 'exercise_ref');
  });
});
