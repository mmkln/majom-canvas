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
  it('keeps the overview shell header full-width and centers stage navigation', () => {
    const content = document.createElement('div');
    const view = new LearningStudioCourseShellView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: createCourse(),
      currentStage: 'overview',
      content,
      onBackHome: vi.fn(),
      onOpenStage: vi.fn(),
    });

    const shell = view.element.querySelector(
      '[data-role="learning-studio-course-shell"]'
    ) as HTMLDivElement | null;
    const header = view.element.querySelector(
      '[data-role="learning-studio-course-shell-header"]'
    ) as HTMLElement | null;
    const headerRow = view.element.querySelector(
      '[data-role="learning-studio-course-shell-main-row"]'
    ) as HTMLDivElement | null;
    const stageRail = view.element.querySelector(
      '[data-role="learning-studio-course-shell-stage-rail"]'
    ) as HTMLDivElement | null;

    expect(shell).not.toBeNull();
    expect(shell?.className).not.toContain('max-w-[1480px]');
    expect(headerRow).not.toBeNull();
    expect(headerRow?.className).toContain('grid');
    expect(headerRow?.className).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');
    expect(headerRow?.className).not.toContain('max-w-7xl');
    expect(headerRow?.className).not.toContain('mx-auto');
    expect(headerRow?.className).toContain('w-full');
    expect(stageRail).not.toBeNull();
    expect(stageRail?.className).toContain('rounded-full');
    expect(stageRail?.className).toContain('bg-slate-50/90');
    expect(stageRail?.className).toContain('p-0.5');
    expect(
      view.element.querySelector(
        '[data-role="learning-studio-course-shell-meta-row"]'
      )
    ).toBeNull();

    const overviewButton = view.element.querySelector(
      '[data-role="learning-studio-shell-open-overview"]'
    ) as HTMLButtonElement | null;
    const buildButton = view.element.querySelector(
      '[data-role="learning-studio-shell-open-build"]'
    ) as HTMLButtonElement | null;

    expect(overviewButton?.className).toContain('rounded-full');
    expect(overviewButton?.className).toContain('bg-white');
    expect(overviewButton?.className).toContain('font-semibold');
    expect(buildButton?.className).toContain('rounded-full');
    expect(buildButton?.className).toContain('text-slate-400');
    expect(buildButton?.className).toContain('bg-transparent');
  });

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
    expect(contentRegion?.className).toContain('flex-1');
    expect(contentRegion?.className).toContain('min-h-0');
    expect(contentRegion?.querySelector('[data-role="test-stage-content"]')).toBe(
      content
    );
  });
});
