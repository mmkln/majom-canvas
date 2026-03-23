import { describe, expect, it } from 'vitest';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type { WorkspaceChatAction } from '../workspaceChatActions.ts';
import {
  buildWorkspaceChatActionTagModels,
  getWorkspaceChatActionButtonLabel,
  getWorkspaceChatActionSecondaryText,
  getWorkspaceChatReviewAccentColor,
  groupWorkspaceChatActionsForRender,
} from './WorkspaceChatStructuredResultModel.ts';

const context: WorkspaceChatCanvasSnapshot = {
  canvasId: 'canvas-a',
  canvasTitle: 'Main current flow',
  summary: {
    goalCount: 1,
    storyCount: 1,
    taskCount: 1,
    selectedCount: 1,
  },
  selectionIds: ['story-a'],
  focusId: 'story-a',
  highlightedIds: [],
  elements: [
    {
      id: 'goal-a',
      kind: 'goal',
      title: 'Launch',
      description: '',
      status: 'defined',
      priority: 'high',
      childCount: 1,
      parentId: null,
      childIds: ['story-a'],
      selected: false,
      focused: false,
      highlighted: false,
    },
    {
      id: 'story-a',
      kind: 'story',
      title: 'Checkout flow',
      description: '',
      status: 'in-progress',
      priority: 'medium',
      childCount: 1,
      parentId: 'goal-a',
      childIds: ['task-a'],
      selected: true,
      focused: true,
      highlighted: false,
    },
    {
      id: 'task-a',
      kind: 'task',
      title: 'Add payment form',
      description: '',
      status: 'pending',
      priority: 'low',
      parentId: 'story-a',
      childIds: [],
      selected: false,
      focused: false,
      highlighted: false,
    },
  ],
  connections: [],
  viewport: null,
  recentActivity: [],
};

describe('WorkspaceChatStructuredResultModel', () => {
  it('groups consecutive actions by group id', () => {
    const first: WorkspaceChatAction = {
      id: 'a',
      kind: 'create_task',
      label: 'Create task',
      title: 'Task A',
      status: 'idle',
      groupId: 'g1',
    };
    const second: WorkspaceChatAction = {
      id: 'b',
      kind: 'create_task',
      label: 'Create task',
      title: 'Task B',
      status: 'idle',
      groupId: 'g1',
    };
    const third: WorkspaceChatAction = {
      id: 'c',
      kind: 'create_goal',
      label: 'Create goal',
      title: 'Goal C',
      status: 'idle',
    };

    expect(groupWorkspaceChatActionsForRender([first, second, third])).toEqual([
      { groupId: 'g1', actions: [first, second] },
      { groupId: null, actions: [third] },
    ]);
  });

  it('derives selected-story targeting for task creation', () => {
    const action: WorkspaceChatAction = {
      id: 'task-create',
      kind: 'create_task',
      label: 'Create task',
      title: 'Add validation',
      status: 'idle',
    };

    expect(getWorkspaceChatActionSecondaryText(action, context, true)).toBe(
      'In selected story'
    );
  });

  it('builds tag models for create and update actions', () => {
    const createAction: WorkspaceChatAction = {
      id: 'goal-create',
      kind: 'create_goal',
      label: 'Create goal',
      title: 'Integrate canvas in Noesis',
      status: 'idle',
      priority: 'highest',
      elementStatus: 'in-progress',
    };
    const updateAction: WorkspaceChatAction = {
      id: 'update-story',
      kind: 'suggest_update',
      label: 'Apply update',
      title: 'Refine story',
      status: 'idle',
      elementId: 'story-a',
      elementKind: 'story',
      patch: {
        priority: 'lowest',
        elementStatus: 'done',
      },
    };

    expect(buildWorkspaceChatActionTagModels(createAction).map((tag) => tag.text))
      .toEqual(['highest', 'In progress']);
    expect(buildWorkspaceChatActionTagModels(updateAction).map((tag) => tag.text))
      .toEqual(['Priority change', 'Status change']);
  });

  it('derives button labels and review accents consistently', () => {
    const relationAction: WorkspaceChatAction = {
      id: 'rel-1',
      kind: 'suggest_relation',
      label: 'Add relation',
      title: 'Link tasks',
      status: 'applied',
      relationType: 'blocks',
      fromId: 'task-a',
      toId: 'task-b',
    };
    const removalAction: WorkspaceChatAction = {
      id: 'rel-2',
      kind: 'remove_relation',
      label: 'Remove relation',
      title: 'Remove outdated relation',
      status: 'idle',
      relationType: 'relates_to',
      fromId: 'story-a',
      toId: 'goal-a',
    };
    const relationUpdateAction: WorkspaceChatAction = {
      id: 'rel-3',
      kind: 'update_relation',
      label: 'Update relation',
      title: 'Change relation type',
      status: 'idle',
      currentRelationType: 'relates_to',
      nextRelationType: 'blocks',
      fromId: 'story-a',
      toId: 'goal-a',
    };

    expect(getWorkspaceChatActionButtonLabel(relationAction)).toBe('Applied');
    expect(getWorkspaceChatActionButtonLabel(removalAction)).toBe('Apply');
    expect(getWorkspaceChatActionButtonLabel(relationUpdateAction)).toBe('Apply');
    expect(getWorkspaceChatActionSecondaryText(removalAction, context, true)).toBe(
      '"story-a" → "goal-a"'
    );
    expect(
      buildWorkspaceChatActionTagModels(relationUpdateAction).map((tag) => tag.text)
    ).toEqual(['relates to -> blocks']);
    expect(
      getWorkspaceChatReviewAccentColor({
        title: 'Review',
        readinessScore: 55,
        findings: [],
      })
    ).toBe('#b91c1c');
  });

  it('renders strategic blueprint actions with plan-specific labels and tags', () => {
    const action: WorkspaceChatAction = {
      id: 'blueprint-1',
      kind: 'create_goal_blueprint',
      label: 'Create plan',
      title: 'Marketing automation learning plan',
      status: 'idle',
      pattern: 'goal_tree_with_sequence',
      summary: 'Strategic starter structure for the topic.',
      goals: [
        { ref: 'root', title: 'Master marketing automation strategically' },
        {
          ref: 'fundamentals',
          title: 'Learn the fundamentals',
          parentRef: 'root',
        },
        {
          ref: 'practice',
          title: 'Build first workflows',
          parentRef: 'root',
        },
      ],
      relations: [
        {
          fromRef: 'fundamentals',
          toRef: 'practice',
          relationType: 'leads_to',
        },
      ],
    };

    expect(getWorkspaceChatActionButtonLabel(action)).toBe('Create plan');
    expect(getWorkspaceChatActionSecondaryText(action, context, true)).toBe(
      '3 strategic goals · 1 leads-to link'
    );
    expect(buildWorkspaceChatActionTagModels(action).map((tag) => tag.text)).toEqual([
      'goal tree with sequence',
      '3 goals',
      '1 sequence link',
    ]);
  });
});
