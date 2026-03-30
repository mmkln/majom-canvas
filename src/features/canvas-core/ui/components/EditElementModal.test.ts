// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Scene } from '../../core/scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { EditElementModal } from './EditElementModal.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';

const flushAsync = async (): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
};

describe('EditElementModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
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
    expect(detailsEdited).toHaveBeenCalledTimes(1);
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { tagIds?: number[] };
    }>;
    expect(event.detail.patch.tagIds).toEqual([1, 2]);

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
    const event = detailsEdited.mock.calls[0]?.[0] as CustomEvent<{
      patch: { tagIds?: number[] };
    }>;
    expect(event.detail.patch.tagIds).toEqual([3]);

    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });
});
