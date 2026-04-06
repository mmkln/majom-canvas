// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Scene } from '../../core/scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { editElement$ } from '../../core/eventBus.ts';
import { StoryDetailsModal } from './StoryDetailsModal.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';

const flushAsync = async (): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
};

describe('StoryDetailsModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders story tasks in the details modal', async () => {
    vi.spyOn(StoriesApiService.prototype, 'getStory').mockReturnValue(
      of({
        id: 12,
        uuid: 'story-uuid-12',
        title: 'Checkout overhaul',
        description: 'Improve the checkout story',
        status: 'in_progress' as any,
        priority: 'high' as any,
        tasks: [
          {
            id: 101,
            uuid: 'task-uuid-101',
            title:
              'Refine edge cases across checkout, retries, taxes, receipts, and failed authorization handling',
            description: 'Audit all failure paths before release.',
            status: 'active',
          },
          {
            id: 102,
            uuid: 'task-uuid-102',
            title: 'Ship analytics events',
            description: '',
            status: 'completed',
          },
        ],
      } as any)
    );

    const scene = new Scene();
    const editSpy = vi.spyOn(editElement$, 'next');
    const story = new StoryElement({
      id: 'story-12',
      uuid: 'story-uuid-12',
      title: 'Checkout overhaul',
    });
    const localTask = new TaskElement({
      id: 'task-local-101',
      uuid: 'task-uuid-101',
      title:
        'Refine edge cases across checkout, retries, taxes, receipts, and failed authorization handling',
    });
    story.addTask(localTask);
    scene.addElement(story);
    scene.addElement(localTask);
    const modal = new StoryDetailsModal(story, scene);

    modal.show();
    await flushAsync();

    const formPane = document.querySelector('[data-story-form-pane="true"]');
    const formActions = document.querySelector(
      '[data-story-form-actions="true"]'
    );
    const tasksPanel = document.querySelector('[data-story-tasks-panel="true"]');
    const taskList = document.querySelector('[data-story-task-list="true"]');
    const statusBadges = document.querySelectorAll('[data-story-task-status]');
    const actionTriggers = document.querySelectorAll(
      '[data-story-task-actions-trigger]'
    );
    const openDetailsButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-story-task-open-details]'
    );
    const taskRowIcons = document.querySelectorAll(
      '[data-story-task-item="true"] [data-component="PlanningEntityIcon"]'
    );
    const tasksToggle = document.querySelector<HTMLButtonElement>(
      '[data-story-tasks-toggle="true"]'
    );
    const tasksHide = document.querySelector<HTMLButtonElement>(
      '[data-story-tasks-hide="true"]'
    );
    const tasksCreate = document.querySelector<HTMLButtonElement>(
      '[data-story-tasks-create="true"]'
    );
    const storyHeaderIcon = document.querySelector(
      '[data-component="PlanningEntityIcon"][data-entity-kind="story"][data-entity-variant="solid"]'
    );
    const taskHeaderIcon = tasksPanel?.querySelector(
      '[data-component="PlanningEntityIcon"][data-entity-kind="task"][data-entity-variant="ghost"]'
    );

    expect(formPane).not.toBeNull();
    expect(formActions).not.toBeNull();
    expect(tasksPanel).not.toBeNull();
    expect(taskList).not.toBeNull();
    expect(tasksToggle).not.toBeNull();
    expect(tasksHide).not.toBeNull();
    expect(tasksCreate).not.toBeNull();
    expect(actionTriggers).toHaveLength(2);
    expect(openDetailsButtons).toHaveLength(2);
    expect(openDetailsButtons[0]?.disabled).toBe(false);
    expect(openDetailsButtons[1]?.disabled).toBe(true);
    expect(taskRowIcons).toHaveLength(0);
    expect(storyHeaderIcon).not.toBeNull();
    expect(taskHeaderIcon).not.toBeNull();
    expect(formPane?.contains(formActions)).toBe(true);
    expect(tasksPanel?.contains(formActions)).toBe(false);
    expect(taskList?.className).toContain('overflow-y-auto');
    expect(statusBadges).toHaveLength(2);

    expect(document.body.textContent).toContain('Checkout overhaul');
    expect(document.body.textContent).toContain(
      'Refine edge cases across checkout'
    );
    expect(document.body.textContent).toContain('Ship analytics events');
    expect(document.body.textContent).not.toContain('tasks in this story');
    expect(document.body.textContent).not.toContain(
      'Audit all failure paths before release.'
    );

    openDetailsButtons[0]?.click();

    expect(editSpy).toHaveBeenCalledWith(localTask);

    (actionTriggers[0] as HTMLButtonElement).click();

    tasksHide?.click();

    expect(tasksPanel?.hasAttribute('hidden')).toBe(true);

    tasksToggle?.click();

    expect(tasksPanel?.hasAttribute('hidden')).toBe(false);

    tasksCreate?.click();
  });
});
