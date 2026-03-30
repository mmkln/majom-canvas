// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioCourseShellView } from './LearningStudioCourseShellView.ts';
import type { LearningStudioOverviewModel } from './LearningStudioScreenModels.ts';

function createCourse(): LearningStudioOverviewModel {
  return {
    courseId: 'course-1',
    draftId: 'draft-1',
    title: 'Course title',
    description: 'Course description',
    audience: '',
    outcomes: [],
    lifecycleState: 'draft',
    moduleCount: 1,
    unitCount: 2,
    latestPublishedVersionId: null,
    updatedAt: '2026-03-28T09:00:00.000Z',
    structure: [],
    nextRecommendedRoute: 'build',
  };
}

describe('LearningStudioCourseShellView', () => {
  it('wraps immersive stage content in a flex-1 content region', () => {
    const content = document.createElement('div');
    content.dataset.role = 'test-stage-content';

    const view = new LearningStudioCourseShellView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: createCourse(),
      currentStage: 'build',
      content,
      onBackHome: vi.fn(),
      onOpenStage: vi.fn(),
      immersive: true,
    });

    const contentRegion = view.element.querySelector(
      '[data-role="learning-studio-course-shell-content"]'
    ) as HTMLDivElement | null;

    expect(contentRegion).not.toBeNull();
    expect(contentRegion?.querySelector('[data-role="test-stage-content"]')).toBe(
      content
    );
  });
});
