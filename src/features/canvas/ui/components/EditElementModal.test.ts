// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Scene } from '../../core/scene/Scene.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { EditElementModal } from './EditElementModal.ts';
import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';

const flushAsync = async (): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
};

describe('EditElementModal', () => {
  beforeEach(() => {
    historyService.reset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    historyService.reset();
    vi.restoreAllMocks();
  });

  it('renders status as a segmented control instead of a dropdown select', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      title: 'Task title',
    });
    const modal = new EditElementModal(task, scene);

    modal.show();

    const statusControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Status');

    expect(statusControl).not.toBeNull();
    expect(statusControl?.querySelectorAll('button')).toHaveLength(4);
    expect(statusControl?.textContent).toContain('Defined');
    expect(statusControl?.textContent).toContain('Pending');
    expect(statusControl?.textContent).toContain('In progress');
    expect(statusControl?.textContent).toContain('Done');
    expect(document.body.querySelector('select')).toBeNull();
  });

  it('renders routines with a 10-day completion grid and a routine-only status switch', () => {
    const scene = new Scene();
    const routine = new HabitElement({
      id: 'routine-1',
      uuid: 'routine-uuid-1',
      title: 'Morning review',
      habitStatus: Status.Active,
      completionHistory: [
        ['2026-03-20', true],
        ['2026-03-26', true],
      ],
    });
    const modal = new EditElementModal(routine, scene);

    modal.show();

    const statusControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find(
      (element) => element.getAttribute('aria-label') === 'Routine status'
    );

    expect(statusControl).not.toBeNull();
    expect(statusControl?.querySelectorAll('button')).toHaveLength(2);
    expect(statusControl?.textContent).toContain('Active');
    expect(statusControl?.textContent).toContain('Archived');
    expect(document.body.textContent).toContain('Last 10 days');
    expect(
      document.body.querySelectorAll('input[type="checkbox"]')
    ).toHaveLength(10);

    const priorityControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Priority');

    expect(priorityControl).not.toBeNull();
    expect(priorityControl?.querySelectorAll('button')).toHaveLength(5);
    expect(priorityControl?.textContent).toContain('Lowest');
    expect(priorityControl?.textContent).toContain('Highest');

    const archivedButton = Array.from(
      statusControl?.querySelectorAll<HTMLButtonElement>('button') ?? []
    ).find((button) => button.textContent?.includes('Archived'));
    const archivedIcon = archivedButton?.querySelector('svg');

    expect(archivedIcon?.getAttribute('data-icon-name')).toBe('archive-box');
  });

  it('saves habit priority changes through the element details patch', () => {
    const scene = new Scene();
    const routine = new HabitElement({
      id: 'routine-2',
      uuid: 'routine-uuid-2',
      title: 'Daily reading',
      priority: 'low',
      habitStatus: Status.Active,
    });
    const detailsEdited = vi.fn();
    window.addEventListener('elementDetailsEdited', detailsEdited as EventListener);
    const modal = new EditElementModal(routine, scene);

    modal.show();

    const priorityControl = Array.from(
      document.body.querySelectorAll<HTMLDivElement>(
        '[data-component="HudSegmentedControl"]'
      )
    ).find((element) => element.getAttribute('aria-label') === 'Priority');
    const highButton = Array.from(
      priorityControl?.querySelectorAll<HTMLButtonElement>('button') ?? []
    ).find((button) => button.textContent?.trim() === 'High');
    const saveButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Save');

    highButton?.click();
    saveButton?.click();

    expect(routine.priority).toBe('high');
    expect(detailsEdited).toHaveBeenCalledTimes(1);
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { priority?: string };
    }>;
    expect(event.detail.patch.priority).toBe('high');

    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });

  it('renders goal tags and saves selected tag ids through the element details patch', () => {
    vi.spyOn(TasksApiService.prototype, 'getTags').mockReturnValue(
      of([
        {
          id: 1,
          title: 'Focus',
          slug: 'focus',
          color: '#2563eb',
          description: null,
        },
        {
          id: 2,
          title: 'Strategy',
          slug: 'strategy',
          color: '#7c3aed',
          description: null,
        },
      ])
    );

    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-1',
      uuid: 'goal-uuid-1',
      title: 'Ship v2',
      tags: ['Focus'],
      tagIds: [1],
    });
    const detailsEdited = vi.fn();
    window.addEventListener('elementDetailsEdited', detailsEdited as EventListener);
    const modal = new EditElementModal(goal, scene);

    modal.show();

    expect(document.body.textContent).toContain('Tags');
    const tagPickerTrigger = document.body.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    const strategyCheckbox = document.body.querySelector<HTMLInputElement>(
      'input[aria-label="Strategy"]'
    );
    const saveButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Save');

    expect(tagPickerTrigger).not.toBeNull();
    tagPickerTrigger?.click();
    strategyCheckbox?.click();
    saveButton?.click();

    expect(goal.tagIds).toEqual([1, 2]);
    expect(goal.tags).toEqual(['Focus', 'Strategy']);
    expect(historyService.canUndo()).toBe(true);
    expect(historyService.hasUnsavedChanges()).toBe(false);
    expect(detailsEdited).toHaveBeenCalledTimes(1);
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { tagIds?: number[] };
    }>;
    expect(event.detail.patch.tagIds).toEqual([1, 2]);

    historyService.undo();

    expect(goal.tagIds).toEqual([1]);
    expect(goal.tags).toEqual(['Focus']);

    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });

  it('creates a new goal tag from the picker and saves it through the element details patch', async () => {
    vi.spyOn(TasksApiService.prototype, 'getTags').mockReturnValue(of([]));
    const createTagSpy = vi
      .spyOn(TasksApiService.prototype, 'createTag')
      .mockReturnValue(
        of({
          id: 3,
          title: 'Vision',
          slug: 'vision',
          color: '#0f766e',
          description: null,
          tasks: [],
        })
      );

    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-2',
      uuid: 'goal-uuid-2',
      title: 'Ship v2',
    });
    const detailsEdited = vi.fn();
    window.addEventListener('elementDetailsEdited', detailsEdited as EventListener);
    const modal = new EditElementModal(goal, scene);

    modal.show();

    const tagPickerTrigger = document.body.querySelector<HTMLElement>(
      '[data-role="goal-tag-picker-trigger"]'
    );
    const saveButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Save');

    tagPickerTrigger?.click();

    const searchInput = document.body.querySelector<HTMLInputElement>(
      'input[data-goal-tag-search-input="true"]'
    );
    searchInput!.value = 'Vision';
    searchInput?.dispatchEvent(new Event('input', { bubbles: true }));

    const createRow = document.body.querySelector<HTMLButtonElement>(
      '[data-role="goal-tag-picker-create"]'
    );
    createRow?.click();

    await flushAsync();

    expect(createTagSpy).toHaveBeenCalled();
    expect(tagPickerTrigger?.textContent).toContain('Vision');

    saveButton?.click();

    expect(goal.tagIds).toEqual([3]);
    expect(goal.tags).toEqual(['Vision']);
    expect(historyService.canUndo()).toBe(true);
    expect(historyService.hasUnsavedChanges()).toBe(false);
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { tagIds?: number[] };
    }>;
    expect(event.detail.patch.tagIds).toEqual([3]);

    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });

  it('keeps focus on Save when description editing blurs into a save click', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-description-1',
      uuid: 'task-description-uuid-1',
      title: 'Task title',
      description: 'Original description',
    });
    const modal = new EditElementModal(task, scene);

    modal.show();

    const descriptionPreview = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Original description'));
    const saveButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Save');

    expect(descriptionPreview).not.toBeNull();
    expect(saveButton).not.toBeNull();

    descriptionPreview?.click();

    const descriptionEditor = document.body.querySelector<HTMLTextAreaElement>(
      'textarea'
    );
    expect(descriptionEditor).not.toBeNull();

    if (!descriptionEditor || !saveButton) {
      throw new Error('Expected description editor and save button.');
    }

    descriptionEditor.focus();
    descriptionEditor.value = 'Updated description';
    descriptionEditor.dispatchEvent(new Event('input', { bubbles: true }));

    saveButton.focus();

    expect(document.activeElement).toBe(saveButton);

    saveButton.click();

    expect(task.description).toBe('Updated description');
  });
});
