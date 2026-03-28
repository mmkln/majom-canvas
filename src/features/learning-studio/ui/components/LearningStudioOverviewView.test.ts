// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import type { LearningStudioOverviewModel } from './LearningStudioScreenModels.ts';
import { LearningStudioOverviewView } from './LearningStudioOverviewView.ts';

function createCourse(
  overrides: Partial<LearningStudioOverviewModel> = {}
): LearningStudioOverviewModel {
  return {
    courseId: 'course-1',
    draftId: 'draft-1',
    title: 'Systems Thinking',
    description: 'A short course.',
    audience: 'Team leads',
    outcomes: ['Understand loops'],
    lifecycleState: 'draft',
    moduleCount: 0,
    unitCount: 0,
    latestPublishedVersionId: null,
    updatedAt: '2026-03-28T10:00:00.000Z',
    structure: [],
    nextRecommendedRoute: 'build',
    hasUnpublishedChanges: false,
    activeEnrollmentCount: 0,
    readinessIssues: [],
    ...overrides,
  };
}

describe('LearningStudioOverviewView', () => {
  it('keeps page meta, readiness, and footer composition stable across draft and published states', () => {
    const scenarios: LearningStudioOverviewModel[] = [
      createCourse({
        readinessIssues: [{ kind: 'modules_need_lessons', count: 1 }],
      }),
      createCourse({
        lifecycleState: 'published',
        latestPublishedVersionId: 'version-1',
        nextRecommendedRoute: 'preview',
        moduleCount: 1,
        unitCount: 3,
        structure: [
          {
            id: 'module-1',
            title: 'Foundations',
            lessonCount: 1,
            exerciseCount: 1,
            checkpointCount: 1,
            warning: null,
          },
        ],
      }),
    ];

    scenarios.forEach((course) => {
      const view = new LearningStudioOverviewView({
        runtime: createAppRuntime({ initialLocale: 'en' }),
        course,
        onOpenStage: vi.fn(),
        onSaveOverview: vi.fn(),
      });

      const pageMeta = view.element.querySelector(
        '[data-role="learning-studio-overview-page-meta"]'
      );
      const readiness = view.element.querySelector(
        '[data-role="learning-studio-overview-readiness"]'
      );
      const readinessLayout = view.element.querySelector(
        '[data-role="learning-studio-overview-readiness-layout"]'
      );
      const nextStep = view.element.querySelector(
        '[data-role="learning-studio-overview-next-step"]'
      );

      expect(pageMeta).not.toBeNull();
      expect(
        pageMeta?.querySelector(
          '[data-role="learning-studio-overview-version-badge"]'
        )?.textContent
      ).toMatch(/^(Draft|Published) · v\d+$/);
      expect(
        pageMeta?.querySelector(
          '[data-role="learning-studio-overview-status-badge"]'
        )
      ).not.toBeNull();
      expect(
        pageMeta?.querySelector(
          '[data-role="learning-studio-overview-open-settings"]'
        )
      ).not.toBeNull();
      expect(
        pageMeta?.querySelector('[data-role="learning-studio-overview-publish"]')
      ).not.toBeNull();
      expect(
        view.element.querySelector(
          '[data-role="learning-studio-overview-lifecycle-strip"]'
        )
      ).toBeNull();
      expect(
        view.element.querySelector(
          '[data-role="learning-studio-overview-footer-updated"]'
        )
      ).not.toBeNull();
      expect(readiness).not.toBeNull();
      expect(readinessLayout).not.toBeNull();
      expect(nextStep).not.toBeNull();
      expect(readiness?.contains(nextStep)).toBe(true);
      expect(
        view.element.querySelector(
          '[data-role="learning-studio-overview-next-step-panel"]'
        )
      ).not.toBeNull();
    });
  });

  it('renders page meta, readiness, and a reasoned build CTA for an in-progress draft', () => {
    const onOpenStage = vi.fn();
    const onSaveOverview = vi.fn();
    const onSelectModule = vi.fn();
    const view = new LearningStudioOverviewView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: createCourse({
        moduleCount: 2,
        unitCount: 1,
        structure: [
          {
            id: 'module-1',
            title: 'Foundations',
            lessonCount: 0,
            exerciseCount: 0,
            checkpointCount: 0,
            warning: 'needs_lessons',
          },
          {
            id: 'module-2',
            title: 'Feedback loops',
            lessonCount: 1,
            exerciseCount: 0,
            checkpointCount: 0,
            warning: null,
          },
        ],
        readinessIssues: [{ kind: 'modules_need_lessons', count: 1 }],
      }),
      onOpenStage,
      onSaveOverview,
      onSelectModule,
    });

    const pageMeta = view.element.querySelector(
      '[data-role="learning-studio-overview-page-meta"]'
    );
    const readinessIssue = view.element.querySelector(
      '[data-role="learning-studio-overview-readiness-issue"]'
    );
    const nextStep = view.element.querySelector(
      '[data-role="learning-studio-overview-next-step"]'
    ) as HTMLButtonElement | null;
    const nextStepTitle = view.element.querySelector(
      '[data-role="learning-studio-overview-next-step-title"]'
    );
    const readiness = view.element.querySelector(
      '[data-role="learning-studio-overview-readiness"]'
    );
    const courseTitle = view.element.querySelector(
      '[data-role="learning-studio-overview-course-title"]'
    ) as HTMLButtonElement | null;
    const courseDescription = view.element.querySelector(
      '[data-role="learning-studio-overview-course-description"]'
    ) as HTMLButtonElement | null;
    const moduleRows = view.element.querySelectorAll(
      '[data-role="learning-studio-overview-structure-module"]'
    );
    const firstModuleRow = moduleRows.item(0) as HTMLButtonElement | null;
    const firstModuleStatus = view.element.querySelector(
      '[data-role="learning-studio-overview-structure-module-status"]'
    );
    const firstModuleOrder = view.element.querySelector(
      '[data-role="learning-studio-overview-structure-module-order"]'
    );

    expect(pageMeta).not.toBeNull();
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-version-badge"]'
      )?.textContent
    ).toBe('Draft · v1');
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-status-badge"]'
      )?.textContent
    ).toBe('In progress');
    expect(
      view.element.querySelector(
        '[data-role="learning-studio-overview-lifecycle-strip"]'
      )
    ).toBeNull();
    expect(readinessIssue?.getAttribute('data-severity')).toBe('critical');
    expect(readinessIssue?.textContent).toContain('Critical');
    expect(readinessIssue?.textContent).toContain('modules still need lessons');
    expect(nextStepTitle?.textContent).toContain('Continue building');
    expect(readiness?.contains(nextStep)).toBe(true);
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-audience-input"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-outcomes-input"]')
    ).toBeNull();
    expect(courseTitle?.textContent).toContain('Systems Thinking');
    expect(courseDescription?.textContent).toContain('A short course.');
    expect(
      view.element.querySelector(
        '[data-role="learning-studio-overview-footer-updated"]'
      )?.textContent
    ).toContain('Last updated');
    expect(moduleRows).toHaveLength(2);
    expect(firstModuleRow?.className).toContain('hover:bg-slate-50');
    expect(firstModuleStatus?.textContent).toBe('Needs lessons');
    expect(firstModuleOrder?.textContent).toBe('01');

    if (!courseTitle || !courseDescription || !nextStep || !firstModuleRow) {
      throw new Error('Expected overview controls.');
    }

    firstModuleRow.click();
    expect(onSelectModule).toHaveBeenCalledWith('module-1');

    courseTitle.click();
    const titleEditor = view.element.querySelector(
      '[data-role="learning-studio-overview-course-title-editor"]'
    ) as HTMLTextAreaElement | null;

    expect(titleEditor).not.toBeNull();

    if (!titleEditor) {
      throw new Error('Expected inline title editor.');
    }

    titleEditor.value = 'Updated title';
    titleEditor.dispatchEvent(new Event('input', { bubbles: true }));
    titleEditor.dispatchEvent(new FocusEvent('blur'));

    courseDescription.click();
    const descriptionEditor = view.element.querySelector(
      '[data-role="learning-studio-overview-course-description-editor"]'
    ) as HTMLTextAreaElement | null;

    expect(descriptionEditor).not.toBeNull();

    if (!descriptionEditor) {
      throw new Error('Expected inline description editor.');
    }

    descriptionEditor.value = 'Updated description';
    descriptionEditor.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionEditor.dispatchEvent(new FocusEvent('blur'));
    nextStep.click();

    expect(onSaveOverview).toHaveBeenNthCalledWith(1, {
      title: 'Updated title',
      description: 'A short course.',
    });
    expect(onSaveOverview).toHaveBeenNthCalledWith(2, {
      title: 'Updated title',
      description: 'Updated description',
    });
    expect(onOpenStage).toHaveBeenCalledWith('build');
  });

  it('shows published stability messaging and keeps preview guidance inside readiness', () => {
    const onOpenStage = vi.fn();
    const view = new LearningStudioOverviewView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: createCourse({
        lifecycleState: 'published',
        latestPublishedVersionId: 'version-1',
        nextRecommendedRoute: 'preview',
        hasUnpublishedChanges: false,
        activeEnrollmentCount: 3,
        moduleCount: 1,
        unitCount: 3,
        structure: [
          {
            id: 'module-1',
            title: 'Foundations',
            lessonCount: 1,
            exerciseCount: 1,
            checkpointCount: 1,
            warning: null,
          },
        ],
        readinessIssues: [],
      }),
      onOpenStage,
      onSaveOverview: vi.fn(),
    });

    const readiness = view.element.querySelector(
      '[data-role="learning-studio-overview-readiness"]'
    );
    const nextStep = view.element.querySelector(
      '[data-role="learning-studio-overview-next-step"]'
    ) as HTMLButtonElement | null;
    const pageMeta = view.element.querySelector(
      '[data-role="learning-studio-overview-page-meta"]'
    );

    expect(view.element.textContent).toContain('Ready for learner validation');
    expect(
      view.element.querySelector(
        '[data-role="learning-studio-overview-lifecycle-strip"]'
      )
    ).toBeNull();
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-version-badge"]'
      )?.textContent
    ).toBe('Published · v1');
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-status-badge"]'
      )?.textContent
    ).toBe('Ready');
    expect(nextStep).not.toBeNull();
    expect(readiness?.contains(nextStep)).toBe(true);
    expect(nextStep?.className).toContain('bg-white/10');

    if (!nextStep) {
      throw new Error('Expected readiness next-step CTA.');
    }

    nextStep.click();
    expect(onOpenStage).toHaveBeenCalledWith('preview');
  });

  it('keeps the next-step guidance integrated in readiness for published courses with unpublished changes', () => {
    const onOpenStage = vi.fn();
    const view = new LearningStudioOverviewView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: createCourse({
        lifecycleState: 'published',
        latestPublishedVersionId: 'version-2',
        hasUnpublishedChanges: true,
        nextRecommendedRoute: 'build',
        activeEnrollmentCount: 2,
        readinessIssues: [{ kind: 'modules_need_lessons', count: 2 }],
      }),
      onOpenStage,
      onSaveOverview: vi.fn(),
    });

    const readiness = view.element.querySelector(
      '[data-role="learning-studio-overview-readiness"]'
    );
    const nextStep = view.element.querySelector(
      '[data-role="learning-studio-overview-next-step"]'
    ) as HTMLButtonElement | null;
    const pageMeta = view.element.querySelector(
      '[data-role="learning-studio-overview-page-meta"]'
    );

    expect(
      view.element.querySelector(
        '[data-role="learning-studio-overview-lifecycle-strip"]'
      )
    ).toBeNull();
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-version-badge"]'
      )?.textContent
    ).toBe('Draft · v3');
    expect(
      pageMeta?.querySelector(
        '[data-role="learning-studio-overview-status-badge"]'
      )?.textContent
    ).toBe('In progress');
    expect(readiness?.contains(nextStep)).toBe(true);
    expect(view.element.textContent).toContain('Critical');

    if (!nextStep) {
      throw new Error('Expected readiness action CTA.');
    }

    nextStep.click();
    expect(onOpenStage).toHaveBeenCalledWith('build');
  });
});
