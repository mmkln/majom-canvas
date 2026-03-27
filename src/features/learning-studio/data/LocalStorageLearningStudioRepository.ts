import {
  createEmptyLearningStudioState,
  createEmptyLearningStudioUiState,
  type LearningStudioLocalStateV1,
  type LearningStudioUiStateV1,
} from '../domain/types.ts';

export const LEARNING_STUDIO_STATE_STORAGE_KEY = 'learning-studio-state-v1';
export const LEARNING_STUDIO_UI_STATE_STORAGE_KEY =
  'learning-studio-ui-state-v1';

export class LocalStorageLearningStudioRepository {
  constructor(private readonly storage: Storage = localStorage) {}

  public loadState(): LearningStudioLocalStateV1 {
    const parsed = this.readJson(LEARNING_STUDIO_STATE_STORAGE_KEY);
    if (!isLearningStudioState(parsed)) {
      return createEmptyLearningStudioState();
    }
    return parsed;
  }

  public saveState(state: LearningStudioLocalStateV1): void {
    this.storage.setItem(
      LEARNING_STUDIO_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  public loadUiState(): LearningStudioUiStateV1 {
    const parsed = this.readJson(LEARNING_STUDIO_UI_STATE_STORAGE_KEY);
    if (!isLearningStudioUiState(parsed)) {
      return createEmptyLearningStudioUiState();
    }
    return parsed;
  }

  public saveUiState(state: LearningStudioUiStateV1): void {
    this.storage.setItem(
      LEARNING_STUDIO_UI_STATE_STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  private readJson(key: string): unknown {
    try {
      const raw = this.storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

function isLearningStudioState(
  value: unknown
): value is LearningStudioLocalStateV1 {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 1 &&
    typeof value.updatedAt === 'string' &&
    isObjectArray(value.courses) &&
    isObjectArray(value.modules) &&
    isObjectArray(value.lessons) &&
    (value.moduleLayouts === undefined || isObjectArray(value.moduleLayouts)) &&
    isObjectArray(value.enrollments) &&
    isObjectArray(value.accessGrants) &&
    isObjectArray(value.learnerProgress) &&
    isObjectArray(value.learningSessions)
  );
}

function isLearningStudioUiState(
  value: unknown
): value is LearningStudioUiStateV1 {
  if (!isPlainObject(value)) return false;
  return (
    value.version === 1 &&
    (value.route === 'home' ||
      value.route === 'overview' ||
      value.route === 'build' ||
      value.route === 'learn' ||
      value.route === 'access' ||
      value.route === 'settings' ||
      value.route === 'authoring' ||
      value.route === 'learner') &&
    (value.selectedCourseId === null || typeof value.selectedCourseId === 'string') &&
    (value.selectedElementKind === undefined ||
      value.selectedElementKind === null ||
      value.selectedElementKind === 'course' ||
      value.selectedElementKind === 'module' ||
      value.selectedElementKind === 'lesson') &&
    (value.selectedElementId === undefined ||
      value.selectedElementId === null ||
      typeof value.selectedElementId === 'string') &&
    (value.focusedLessonId === undefined ||
      value.focusedLessonId === null ||
      typeof value.focusedLessonId === 'string') &&
    typeof value.selectedLearnerRef === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isObjectArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
