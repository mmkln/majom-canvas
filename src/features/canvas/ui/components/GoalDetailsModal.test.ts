// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Scene } from '../../core/scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { editElement$ } from '../../core/eventBus.ts';
import { GoalDetailsModal } from './GoalDetailsModal.ts';
import { GoalRelatedItemsLookupService } from '../../../../majom-wrapper/services/goal-related-items-lookup-service.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { GoalRelationsApiService } from '../../../../majom-wrapper/data-access/goal-relations-api-service.ts';

const flushAsync = async (): Promise<void> => {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
};

describe('GoalDetailsModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders goal stories in the details modal', async () => {
    vi.spyOn(TasksApiService.prototype, 'getTags').mockReturnValue(of([]));
    vi.spyOn(GoalsApiService.prototype, 'getGoal').mockReturnValue(
      of({
        id: 12,
        uuid: 'goal-uuid-12',
        title: 'Improve refunds',
      } as any)
    );
    vi.spyOn(GoalRelationsApiService.prototype, 'listRelations').mockReturnValue(
      of([
        {
          id: 'goal-rel-1',
          from_goal_uuid: 'goal-uuid-12',
          to_goal_uuid: 'goal-uuid-related-1',
          relation_type: 'leads_to',
          meta: null,
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
        {
          id: 'goal-rel-2',
          from_goal_uuid: 'goal-uuid-related-2',
          to_goal_uuid: 'goal-uuid-12',
          relation_type: 'blocks',
          meta: null,
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
      ] as any)
    );
    vi.spyOn(GoalsApiService.prototype, 'fetchGoalsByUuids').mockReturnValue(
      of([
        {
          id: 901,
          uuid: 'goal-uuid-related-1',
          title: 'Stabilize approvals',
          description: '',
          created_at: '2026-04-05T00:00:00Z',
          scale: 2,
          tasks: [],
          subgoals: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          priority: 'high',
          status: 'in_progress',
          strategies: [],
          milestones: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          tags: [],
        },
        {
          id: 902,
          uuid: 'goal-uuid-related-2',
          title: 'Unblock payouts',
          description: '',
          created_at: '2026-04-05T00:00:00Z',
          scale: 2,
          tasks: [],
          subgoals: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          priority: 'medium',
          status: 'completed',
          strategies: [],
          milestones: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          tags: [],
        },
      ] as any)
    );
    vi.spyOn(StoriesApiService.prototype, 'getStory').mockReturnValue(
      of({
        id: 301,
        uuid: 'story-uuid-301',
        title:
          'Support refund initiation, approval, notifications, and audit coverage',
        tasks: [
          {
            id: 401,
            uuid: 'task-uuid-401',
            title: 'Define refund states and transitions',
            status: 'in_progress',
          },
          {
            id: 402,
            uuid: 'task-uuid-402',
            title: 'Implement notifications',
            status: 'completed',
          },
        ],
      } as any)
    );
    vi.spyOn(
      GoalRelatedItemsLookupService.prototype,
      'getRelatedItems'
    ).mockReturnValue(
      of({
        tasks: [],
        goals: [],
        stories: [
          {
            id: 301,
            uuid: 'story-uuid-301',
            title:
              'Support refund initiation, approval, notifications, and audit coverage',
            description: 'Long description that should not render.',
            status: 'in_progress' as any,
            priority: 'high' as any,
          },
          {
            id: 302,
            uuid: 'story-uuid-302',
            title: 'Expose financial summary',
            description: '',
            status: 'completed' as any,
            priority: 'medium' as any,
          },
        ],
      })
    );

    const scene = new Scene();
    const editSpy = vi.spyOn(editElement$, 'next');
    const goal = new GoalElement({
      id: 'goal-12',
      uuid: 'goal-uuid-12',
      title: 'Improve refunds',
      backendId: 12,
    });
    const localStory = new StoryElement({
      id: 'story-local-301',
      uuid: 'story-uuid-301',
      title:
        'Support refund initiation, approval, notifications, and audit coverage',
      goalBackendId: 12,
    });
    const localTask = new TaskElement({
      id: 'task-local-401',
      uuid: 'task-uuid-401',
      title: 'Define refund states and transitions',
    });
    localStory.addTask(localTask);
    const localRelatedGoal = new GoalElement({
      id: 'goal-local-related-1',
      uuid: 'goal-uuid-related-1',
      title: 'Stabilize approvals',
      backendId: 901,
    });
    scene.addElement(goal);
    scene.addElement(localStory);
    scene.addElement(localTask);
    scene.addElement(localRelatedGoal);
    const modal = new GoalDetailsModal(goal, scene);

    modal.show();
    await flushAsync();

    const formPane = document.querySelector('[data-goal-form-pane="true"]');
    const formActions = document.querySelector(
      '[data-goal-form-actions="true"]'
    );
    const storiesPanel = document.querySelector(
      '[data-goal-stories-panel="true"]'
    );
    const storyList = document.querySelector('[data-goal-story-list="true"]');
    const storyRows = document.querySelectorAll('[data-goal-story-item="true"]');
    const statusBadges = document.querySelectorAll('[data-goal-story-status]');
    const actionTriggers = document.querySelectorAll(
      '[data-goal-story-actions-trigger]'
    );
    const storyOpenButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-goal-story-open-details]'
    );
    const storyRowIcons = document.querySelectorAll(
      '[data-goal-story-item="true"] [data-component="PlanningEntityIcon"]'
    );
    const storiesToggle = document.querySelector<HTMLButtonElement>(
      '[data-goal-stories-toggle="true"]'
    );
    const storiesHide = document.querySelector<HTMLButtonElement>(
      '[data-goal-stories-hide="true"]'
    );
    const storiesCreate = document.querySelector<HTMLButtonElement>(
      '[data-goal-stories-create="true"]'
    );
    const relatedGoalsSection = document.querySelector(
      '[data-goal-related-goals="true"]'
    );
    const relatedGoalsTitle = document.querySelector(
      '[data-goal-related-goals-title="true"]'
    );
    const relatedGoalsItems = document.querySelectorAll(
      '[data-goal-related-goal-item="true"]'
    );
    const relationSelectors = document.querySelectorAll<HTMLButtonElement>(
      '[data-goal-related-goal-relation-selector]'
    );
    const relatedGoalActionButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-goal-related-goal-actions-trigger]'
    );
    const relatedGoalOpenButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-goal-related-goal-open-details]'
    );
    const relatedGoalPriorityBadges = document.querySelectorAll(
      '[data-goal-related-goal-priority]'
    );
    const relatedGoalRowIcons = document.querySelectorAll(
      '[data-goal-related-goal-item="true"] [data-component="PlanningEntityIcon"]'
    );
    const relationBadges = document.querySelectorAll(
      '[data-goal-related-goal-relation]'
    );
    const relatedGoalsAdd = document.querySelector<HTMLButtonElement>(
      '[data-goal-related-goals-add="true"]'
    );
    const storyTasksPanel = document.querySelector(
      '[data-goal-story-tasks-panel="true"]'
    );
    const goalHeaderIcon = document.querySelector(
      '[data-component="PlanningEntityIcon"][data-entity-kind="goal"][data-entity-variant="solid"]'
    );
    const storyHeaderIcon = storiesPanel?.querySelector(
      '[data-component="PlanningEntityIcon"][data-entity-kind="story"][data-entity-variant="ghost"]'
    );

    expect(formPane).not.toBeNull();
    expect(formActions).not.toBeNull();
    expect(storiesPanel).not.toBeNull();
    expect(storyList).not.toBeNull();
    expect(storyTasksPanel).not.toBeNull();
    expect(relatedGoalsSection).not.toBeNull();
    expect(relatedGoalsItems).toHaveLength(2);
    expect(relationSelectors).toHaveLength(2);
    expect(relatedGoalActionButtons).toHaveLength(2);
    expect(relatedGoalPriorityBadges).toHaveLength(2);
    expect(relatedGoalRowIcons).toHaveLength(0);
    expect(relationBadges).toHaveLength(2);
    expect(relatedGoalsAdd).not.toBeNull();
    expect(storiesToggle).not.toBeNull();
    expect(storiesHide).not.toBeNull();
    expect(storiesCreate).not.toBeNull();
    expect(storyRows).toHaveLength(2);
    expect(storyOpenButtons).toHaveLength(2);
    expect(storyOpenButtons[0]?.disabled).toBe(false);
    expect(storyOpenButtons[1]?.disabled).toBe(true);
    expect(storyRowIcons).toHaveLength(0);
    expect(actionTriggers).toHaveLength(2);
    expect(goalHeaderIcon).not.toBeNull();
    expect(storyHeaderIcon).not.toBeNull();
    expect(formPane?.contains(formActions)).toBe(true);
    expect(storiesPanel?.contains(formActions)).toBe(false);
    expect(storyList?.className).toContain('overflow-y-auto');
    expect(statusBadges).toHaveLength(2);
    expect(relatedGoalOpenButtons).toHaveLength(2);
    expect(relatedGoalOpenButtons[0]?.disabled).toBe(false);
    expect(relatedGoalOpenButtons[1]?.disabled).toBe(true);
    expect(
      relatedGoalOpenButtons[0]?.querySelector(
        '[data-icon-name="arrow-top-right-on-square"]'
      )
    ).not.toBeNull();

    expect(document.body.textContent).toContain('Improve refunds');
    expect(document.body.textContent).toContain('Stabilize approvals');
    expect(document.body.textContent).toContain('Unblock payouts');
    expect(document.body.textContent).toContain(
      'Support refund initiation, approval'
    );
    expect(document.body.textContent).toContain('Expose financial summary');
    expect(document.body.textContent).not.toContain(
      'Long description that should not render.'
    );

    storyOpenButtons[0]?.click();

    expect(editSpy).toHaveBeenCalledWith(localStory);
    expect((storyRows[0] as HTMLDivElement).className).not.toContain(
      'ring-blue-200'
    );

    (storyRows[0] as HTMLDivElement).click();
    await flushAsync();

    expect((storyRows[0] as HTMLDivElement).className).toContain('ring-blue-200');

    const taskList = document.querySelector('[data-goal-story-task-list="true"]');
    const taskStatusBadges = document.querySelectorAll(
      '[data-goal-story-task-status]'
    );
    const taskOpenButtons = document.querySelectorAll<HTMLButtonElement>(
      '[data-goal-story-task-open-details]'
    );
    const taskRowIcons = document.querySelectorAll(
      '[data-goal-story-task-item="true"] [data-component="PlanningEntityIcon"]'
    );
    const hideTasks = document.querySelector<HTMLButtonElement>(
      '[data-goal-story-tasks-hide="true"]'
    );

    expect(storyTasksPanel?.hasAttribute('hidden')).toBe(false);
    expect(taskList).not.toBeNull();
    expect(taskStatusBadges).toHaveLength(2);
    expect(taskOpenButtons).toHaveLength(2);
    expect(taskOpenButtons[0]?.disabled).toBe(false);
    expect(taskOpenButtons[1]?.disabled).toBe(true);
    expect(taskRowIcons).toHaveLength(0);
    expect(document.body.textContent).toContain(
      'Define refund states and transitions'
    );
    expect(document.body.textContent).toContain('Implement notifications');

    taskOpenButtons[0]?.click();

    expect(editSpy).toHaveBeenCalledWith(localTask);

    hideTasks?.click();

    expect(storyTasksPanel?.hasAttribute('hidden')).toBe(true);
    expect((storyRows[0] as HTMLDivElement).className).not.toContain(
      'ring-blue-200'
    );

    (actionTriggers[0] as HTMLButtonElement).click();
    relatedGoalOpenButtons[0]?.click();

    expect(editSpy).toHaveBeenCalledWith(localRelatedGoal);

    storiesHide?.click();

    expect(storiesPanel?.hasAttribute('hidden')).toBe(true);

    storiesToggle?.click();

    expect(storiesPanel?.hasAttribute('hidden')).toBe(false);

    storiesCreate?.click();
  });

  it('deletes a goal relation from the related goals row menu', async () => {
    vi.spyOn(TasksApiService.prototype, 'getTags').mockReturnValue(of([]));
    vi.spyOn(GoalsApiService.prototype, 'getGoal').mockReturnValue(
      of({
        id: 12,
        uuid: 'goal-uuid-12',
        title: 'Improve refunds',
      } as any)
    );
    vi.spyOn(GoalsApiService.prototype, 'fetchGoalsByUuids').mockReturnValue(
      of([
        {
          id: 901,
          uuid: 'goal-uuid-related-1',
          title: 'Stabilize approvals',
          description: '',
          created_at: '2026-04-05T00:00:00Z',
          scale: 2,
          tasks: [],
          subgoals: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          priority: 'high',
          status: 'in_progress',
          strategies: [],
          milestones: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          tags: [],
        },
      ] as any)
    );
    vi.spyOn(
      GoalRelatedItemsLookupService.prototype,
      'getRelatedItems'
    ).mockReturnValue(
      of({
        tasks: [],
        goals: [],
        stories: [],
      })
    );
    vi.spyOn(GoalRelationsApiService.prototype, 'listRelations').mockReturnValue(
      of([
        {
          id: 'goal-rel-1',
          from_goal_uuid: 'goal-uuid-12',
          to_goal_uuid: 'goal-uuid-related-1',
          relation_type: 'leads_to',
          meta: null,
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
      ] as any)
    );
    const deleteRelationSpy = vi
      .spyOn(GoalRelationsApiService.prototype, 'deleteRelation')
      .mockReturnValue(of(void 0));

    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-12',
      uuid: 'goal-uuid-12',
      title: 'Improve refunds',
      backendId: 12,
    });
    scene.addElement(goal);

    const modal = new GoalDetailsModal(goal, scene);
    modal.show();
    await flushAsync();

    const actionButton = document.querySelector<HTMLButtonElement>(
      '[data-goal-related-goal-actions-trigger="leads_to:goal-uuid-related-1"]'
    );
    expect(actionButton).not.toBeNull();

    actionButton?.click();

    const deleteButton = document.querySelector<HTMLButtonElement>(
      '[data-goal-related-goal-delete-relation="leads_to:goal-uuid-related-1"]'
    );
    expect(deleteButton).not.toBeNull();

    deleteButton?.click();
    await flushAsync();

    expect(deleteRelationSpy).toHaveBeenCalledWith('goal-rel-1');
  });

  it('uses a right arrow icon for follows relation controls', async () => {
    vi.spyOn(TasksApiService.prototype, 'getTags').mockReturnValue(of([]));
    vi.spyOn(GoalsApiService.prototype, 'getGoal').mockReturnValue(
      of({
        id: 12,
        uuid: 'goal-uuid-12',
        title: 'Improve refunds',
      } as any)
    );
    vi.spyOn(GoalsApiService.prototype, 'fetchGoalsByUuids').mockReturnValue(
      of([
        {
          id: 901,
          uuid: 'goal-uuid-related-1',
          title: 'Stabilize approvals',
          description: '',
          created_at: '2026-04-05T00:00:00Z',
          scale: 2,
          tasks: [],
          subgoals: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          priority: 'high',
          status: 'in_progress',
          strategies: [],
          milestones: { items: [], total_count: 0, completed_count: 0, is_draft: false },
          tags: [],
        },
      ] as any)
    );
    vi.spyOn(
      GoalRelatedItemsLookupService.prototype,
      'getRelatedItems'
    ).mockReturnValue(
      of({
        tasks: [],
        goals: [],
        stories: [],
      })
    );
    vi.spyOn(GoalRelationsApiService.prototype, 'listRelations').mockReturnValue(
      of([
        {
          id: 'goal-rel-1',
          from_goal_uuid: 'goal-uuid-12',
          to_goal_uuid: 'goal-uuid-related-1',
          relation_type: 'leads_to',
          meta: null,
          created_at: '2026-04-05T00:00:00Z',
          updated_at: '2026-04-05T00:00:00Z',
        },
      ] as any)
    );

    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-12',
      uuid: 'goal-uuid-12',
      title: 'Improve refunds',
      backendId: 12,
    });
    scene.addElement(goal);

    const modal = new GoalDetailsModal(goal, scene);
    modal.show();
    await flushAsync();

    const relationSelector = document.querySelector<HTMLButtonElement>(
      '[data-goal-related-goal-relation-selector="leads_to:goal-uuid-related-1"]'
    );
    expect(relationSelector).not.toBeNull();
    expect(
      relationSelector?.querySelector('[data-icon-name="arrow-right"]')
    ).not.toBeNull();
    expect(
      relationSelector?.querySelector('[data-icon-name="arrow-down"]')
    ).toBeNull();

    relationSelector?.click();

    const followsOption = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-component="HudDropdownItem"]')
    ).find((item) => item.textContent?.includes('Follows'));

    expect(followsOption).not.toBeUndefined();
    expect(
      followsOption?.querySelector('[data-icon-name="arrow-right"]')
    ).not.toBeNull();
    expect(
      followsOption?.querySelector('[data-icon-name="arrow-down"]')
    ).toBeNull();
  });
});
