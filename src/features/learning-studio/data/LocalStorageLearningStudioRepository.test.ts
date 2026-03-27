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
  it('returns empty defaults when storage is missing or invalid', () => {
    const storage = createStorageMock();
    storage.setItem(LEARNING_STUDIO_STATE_STORAGE_KEY, '{"broken":true}');

    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );

    expect(repository.loadState().courses).toEqual([]);
    expect(repository.loadUiState().route).toBe('home');
  });

  it('round-trips local state and ui state through storage', () => {
    const storage = createStorageMock();
    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );

    repository.saveState({
      version: 1,
      courses: [
        {
          id: 'course-1',
          title: 'Intro to Systems Thinking',
          description: 'Map the basics first.',
          audience: 'Self-learners',
          outcomes: [],
          status: 'draft',
          createdAt: '2026-03-27T10:00:00.000Z',
          updatedAt: '2026-03-27T10:00:00.000Z',
          moduleIds: [],
        },
      ],
      modules: [],
      lessons: [],
      moduleLayouts: [],
      enrollments: [],
      accessGrants: [],
      learnerProgress: [],
      learningSessions: [],
      updatedAt: '2026-03-27T10:00:00.000Z',
    });
    repository.saveUiState({
      version: 1,
      route: 'build',
      selectedCourseId: 'course-1',
      selectedElementKind: 'course',
      selectedElementId: 'course-1',
      focusedLessonId: null,
      selectedLearnerRef: 'local-learner',
      updatedAt: '2026-03-27T10:00:00.000Z',
    });

    expect(repository.loadState().courses[0]?.title).toBe(
      'Intro to Systems Thinking'
    );
    expect(repository.loadUiState()).toEqual(
      expect.objectContaining({
        route: 'build',
        selectedCourseId: 'course-1',
      })
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      expect.any(String)
    );
  });

  it('accepts legacy authoring routes from persisted storage', () => {
    const storage = createStorageMock();
    storage.setItem(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        route: 'authoring',
        selectedCourseId: 'course-1',
        selectedElementKind: 'course',
        selectedElementId: 'course-1',
        focusedLessonId: null,
        selectedLearnerRef: 'local-learner',
        updatedAt: '2026-03-27T10:00:00.000Z',
      })
    );

    const repository = new LocalStorageLearningStudioRepository(
      storage as unknown as Storage
    );
    const uiState = repository.loadUiState() as unknown as { route: string };

    expect(uiState.route).toBe('authoring');
  });
});
