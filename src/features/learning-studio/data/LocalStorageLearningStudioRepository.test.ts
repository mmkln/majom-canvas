import { describe, expect, it, vi } from 'vitest';
import {
  LEARNING_STUDIO_STATE_STORAGE_KEY,
  LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
  LocalStorageLearningStudioRepository,
} from './LocalStorageLearningStudioRepository.ts';

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

describe('LocalStorageLearningStudioRepository', () => {
  it('returns empty v2 defaults when storage is missing or invalid', () => {
    const storage = createStorageMock();
    storage.setItem(LEARNING_STUDIO_STATE_STORAGE_KEY, '{"broken":true}');

    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );

    expect(repository.loadState()).toEqual(
      expect.objectContaining({
        version: 2,
        courses: [],
        drafts: [],
        publishedVersions: [],
      })
    );
    expect(repository.loadUiState()).toEqual(
      expect.objectContaining({
        version: 2,
        route: 'home',
        mode: 'author',
      })
    );
  });

  it('round-trips v2 local state and ui state through storage', () => {
    const storage = createStorageMock();
    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );

    repository.saveState({
      version: 2,
      courses: [
        {
          id: 'course-1',
          ownerRef: 'local-owner',
          lifecycleState: 'draft',
          activeDraftId: 'draft:course-1:1',
          latestPublishedVersionId: null,
          createdAt: '2026-03-27T10:00:00.000Z',
          updatedAt: '2026-03-27T10:00:00.000Z',
        },
      ],
      drafts: [
        {
          id: 'draft:course-1:1',
          courseId: 'course-1',
          revision: 1,
          content: {
            title: 'Intro to Systems Thinking',
            description: 'Map the basics first.',
            audience: 'Self-learners',
            outcomes: [],
            estimatedDurationMinutes: null,
            modules: [],
            units: [],
            moduleLayouts: [],
          },
          lastPreviewedAt: null,
          createdAt: '2026-03-27T10:00:00.000Z',
          updatedAt: '2026-03-27T10:00:00.000Z',
        },
      ],
      publishedVersions: [],
      accessGrants: [],
      enrollments: [],
      progressRecords: [],
      learnerSessions: [],
      updatedAt: '2026-03-27T10:00:00.000Z',
    });
    repository.saveUiState({
      version: 2,
      route: 'build',
      mode: 'author',
      selectedCourseId: 'course-1',
      selectedDraftId: 'draft:course-1:1',
      selectedPublishedVersionId: null,
      selectedEnrollmentId: null,
      activeLearnerRef: 'local-learner',
      selectedElementKind: 'course',
      selectedElementId: 'course-1',
      inspectorPanel: 'course',
      preview: {
        focusedUnitId: null,
        sandboxProgress: {},
        updatedAt: null,
      },
      learner: {
        courseId: null,
        enrollmentId: null,
        focusedUnitId: null,
        lastResumeUnitId: null,
      },
      updatedAt: '2026-03-27T10:00:00.000Z',
    });

    expect(repository.loadState().drafts[0]?.content.title).toBe(
      'Intro to Systems Thinking'
    );
    expect(repository.loadUiState()).toEqual(
      expect.objectContaining({
        route: 'build',
        selectedCourseId: 'course-1',
        selectedDraftId: 'draft:course-1:1',
      })
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      expect.any(String)
    );
  });

  it('migrates legacy v1 state and ui state into the v2 skeleton', () => {
    const storage = createStorageMock();
    storage.setItem(
      'learning-studio-state-v1',
      JSON.stringify({
        version: 1,
        courses: [
          {
            id: 'course-1',
            title: 'Systems Thinking 101',
            description: 'A prototype learning canvas.',
            audience: 'Learners',
            outcomes: ['Understand feedback loops'],
            status: 'published',
            createdAt: '2026-03-27T10:00:00.000Z',
            updatedAt: '2026-03-27T11:00:00.000Z',
            moduleIds: ['module-1'],
          },
        ],
        modules: [
          {
            id: 'module-1',
            courseId: 'course-1',
            title: 'Foundations',
            order: 0,
            lessonIds: ['lesson-1'],
          },
        ],
        lessons: [
          {
            id: 'lesson-1',
            moduleId: 'module-1',
            title: 'Feedback loops',
            description: 'Understand reinforcing and balancing systems.',
            order: 0,
            type: 'lesson',
            prerequisiteIds: [],
          },
        ],
        moduleLayouts: [
          {
            moduleId: 'module-1',
            x: 120,
            y: 180,
          },
        ],
        enrollments: [
          {
            id: 'enrollment-1',
            courseId: 'course-1',
            learnerRef: 'learner-1',
            status: 'active',
            createdAt: '2026-03-27T11:05:00.000Z',
            updatedAt: '2026-03-27T11:05:00.000Z',
          },
        ],
        accessGrants: [
          {
            id: 'grant-1',
            courseId: 'course-1',
            learnerRef: 'learner-1',
            createdAt: '2026-03-27T11:05:00.000Z',
            revokedAt: null,
          },
        ],
        learnerProgress: [
          {
            id: 'progress-1',
            courseId: 'course-1',
            learnerRef: 'learner-1',
            lessonId: 'lesson-1',
            state: 'in_progress',
            updatedAt: '2026-03-27T11:20:00.000Z',
          },
        ],
        learningSessions: [
          {
            id: 'session-1',
            courseId: 'course-1',
            learnerRef: 'learner-1',
            lessonId: 'lesson-1',
            startedAt: '2026-03-27T11:10:00.000Z',
            completedAt: null,
          },
        ],
        updatedAt: '2026-03-27T11:20:00.000Z',
      })
    );
    storage.setItem(
      'learning-studio-ui-state-v1',
      JSON.stringify({
        version: 1,
        route: 'learn',
        selectedCourseId: 'course-1',
        selectedElementKind: 'lesson',
        selectedElementId: 'lesson-1',
        focusedLessonId: 'lesson-1',
        selectedLearnerRef: 'learner-1',
        updatedAt: '2026-03-27T11:20:00.000Z',
      })
    );

    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );
    const state = repository.loadState();
    const uiState = repository.loadUiState();

    expect(state.version).toBe(2);
    expect(state.courses[0]).toEqual(
      expect.objectContaining({
        id: 'course-1',
        activeDraftId: 'draft:course-1:1',
        latestPublishedVersionId: 'version:course-1:1',
      })
    );
    expect(state.drafts[0]?.content.modules[0]?.lessonIds).toEqual(['lesson-1']);
    expect(state.publishedVersions).toHaveLength(1);
    expect(state.progressRecords[0]).toEqual(
      expect.objectContaining({
        unitId: 'lesson-1',
        state: 'in_progress',
      })
    );
    expect(state.learnerSessions[0]).toEqual(
      expect.objectContaining({
        focusedUnitId: 'lesson-1',
      })
    );
    expect(uiState).toEqual(
      expect.objectContaining({
        version: 2,
        route: 'preview',
        mode: 'preview',
        selectedCourseId: 'course-1',
        activeLearnerRef: 'learner-1',
      })
    );
  });
});
