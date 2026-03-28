// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { LearningStudioOverviewView } from './LearningStudioOverviewView.ts';

describe('LearningStudioOverviewView', () => {
  it('keeps overview focused on title, description, and a single next-step CTA', () => {
    const onOpenStage = vi.fn();
    const onSaveOverview = vi.fn();
    const view = new LearningStudioOverviewView({
      runtime: createAppRuntime({ initialLocale: 'en' }),
      course: {
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
      },
      onOpenStage,
      onSaveOverview,
    });

    const form = view.element.querySelector(
      '[data-role="learning-studio-overview-form"]'
    ) as HTMLFormElement | null;
    const summary = view.element.querySelector(
      '[data-role="learning-studio-overview-basics-summary"]'
    );
    const editToggle = view.element.querySelector(
      '[data-role="learning-studio-overview-toggle-basics"]'
    ) as HTMLButtonElement | null;
    const nextStep = view.element.querySelector(
      '[data-role="learning-studio-overview-next-step"]'
    ) as HTMLButtonElement | null;

    expect(form).toBeNull();
    expect(summary).not.toBeNull();
    expect(editToggle).not.toBeNull();
    expect(nextStep).not.toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-audience-input"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-outcomes-input"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-secondary-step"]')
    ).toBeNull();
    expect(
      view.element.querySelector('[data-role="learning-studio-overview-empty-build"]')
    ).toBeNull();

    if (!editToggle || !nextStep) {
      throw new Error('Expected overview controls.');
    }

    editToggle.click();

    const expandedForm = view.element.querySelector(
      '[data-role="learning-studio-overview-form"]'
    ) as HTMLFormElement | null;
    const titleInput = view.element.querySelector(
      '[data-role="learning-studio-overview-title-input"]'
    ) as HTMLInputElement | null;
    const descriptionInput = view.element.querySelector(
      '[data-role="learning-studio-overview-description-input"]'
    ) as HTMLTextAreaElement | null;

    expect(expandedForm).not.toBeNull();
    expect(titleInput).not.toBeNull();
    expect(descriptionInput).not.toBeNull();

    if (!expandedForm || !titleInput || !descriptionInput) {
      throw new Error('Expected expanded overview form.');
    }

    titleInput.value = 'Updated title';
    descriptionInput.value = 'Updated description';
    expandedForm.requestSubmit();
    nextStep.click();

    expect(onSaveOverview).toHaveBeenCalledWith({
      title: 'Updated title',
      description: 'Updated description',
    });
    expect(onOpenStage).toHaveBeenCalledWith('build');
  });
});
