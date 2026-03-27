// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import {
  createEmptyLearningStudioState,
  createEmptyLearningStudioUiState,
} from '../../domain/types.ts';
import { LearningStudioRootView } from './LearningStudioRootView.ts';

describe('LearningStudioRootView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the redesign placeholder and hides interactive surfaces', () => {
    const view = new LearningStudioRootView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      state: createEmptyLearningStudioState(),
      uiState: createEmptyLearningStudioUiState(),
      onCreateManualCourse: () => undefined,
      onCreateAiCourse: () => undefined,
      onCreateModule: () => undefined,
      onCreateLesson: () => undefined,
      onRouteChange: () => undefined,
      onSelectCourse: () => undefined,
      onSelectElement: () => undefined,
      onUpdateCourse: () => undefined,
      onUpdateModule: () => undefined,
      onUpdateLesson: () => undefined,
      onMoveModule: () => undefined,
      onFocusLesson: () => undefined,
      onSetLessonProgress: () => undefined,
      onInviteLearner: () => undefined,
      onCopyShareLink: () => undefined,
      onRevokeAccess: () => undefined,
      onPublishCourse: () => undefined,
      onArchiveCourse: () => undefined,
      onDuplicateCourse: () => undefined,
      getCourseLearnerSnapshot: () => null,
      getCourseLearnerProgressSummary: () => null,
      getRecommendedNextLearnerStep: () => null,
      getLessonLearnerState: () => null,
    });

    document.body.append(view.element);

    const placeholder = view.element.querySelector(
      '[data-role="learning-studio-redesign-placeholder"]'
    );

    expect(placeholder).not.toBeNull();
    expect(view.element.querySelectorAll('button')).toHaveLength(0);
    expect(view.element.querySelector('[data-role^="learning-studio-nav-"]')).toBeNull();
    expect(view.element.querySelector('[data-role^="learning-studio-stage-"]')).toBeNull();
    expect(view.element.querySelector('[data-role^="learning-studio-course-"]')).toBeNull();
    expect(view.element.querySelector('[data-role^="learning-studio-rail-"]')).toBeNull();
    expect(view.element.querySelector('[data-role^="learning-studio-empty-"]')).toBeNull();
  });
});
