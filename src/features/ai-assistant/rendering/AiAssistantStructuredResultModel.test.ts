import { describe, expect, it } from 'vitest';
import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import {
  buildAiAssistantActionButtonModel,
  buildAiAssistantActionEntryModel,
  buildAiAssistantGroupedActionCardModel,
  getAiAssistantReviewAccentColor,
  groupAiAssistantActionsForRender,
} from './AiAssistantStructuredResultModel.ts';

const context: AiAssistantCanvasSnapshot = {
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

describe('AiAssistantStructuredResultModel', () => {
  it('groups consecutive actions by group id', () => {
    const first: AiAssistantAction = {
      id: 'a',
      kind: 'create_task',
      label: 'Create task',
      title: 'Task A',
      status: 'idle',
      groupId: 'g1',
    };
    const second: AiAssistantAction = {
      id: 'b',
      kind: 'create_task',
      label: 'Create task',
      title: 'Task B',
      status: 'idle',
      groupId: 'g1',
    };
    const third: AiAssistantAction = {
      id: 'c',
      kind: 'create_goal',
      label: 'Create goal',
      title: 'Goal C',
      status: 'idle',
    };

    expect(groupAiAssistantActionsForRender([first, second, third])).toEqual([
      { groupId: 'g1', actions: [first, second] },
      { groupId: null, actions: [third] },
    ]);
  });

  it('derives review accents consistently', () => {
    expect(
      getAiAssistantReviewAccentColor({
        title: 'Review',
        readinessScore: 55,
        findings: [],
      })
    ).toBe('#b91c1c');
  });

  it('builds button models with shared CTA state semantics', () => {
    const idleCreateAction: AiAssistantAction = {
      id: 'task-1',
      kind: 'create_task',
      label: 'Create task',
      title: 'Add validation',
      status: 'idle',
    };
    const applyingUpdateAction: AiAssistantAction = {
      id: 'update-1',
      kind: 'suggest_update',
      label: 'Apply update',
      title: 'Refine checkout story',
      status: 'applying',
      elementId: 'story-a',
      elementKind: 'story',
      patch: {
        title: 'Improve checkout flow',
      },
    };
    const appliedPlanAction: AiAssistantAction = {
      id: 'plan-1',
      kind: 'create_goal_blueprint',
      label: 'Create plan',
      title: 'Marketing plan',
      status: 'applied',
      pattern: 'goal_tree_with_sequence',
      goals: [],
      relations: [],
    };

    expect(buildAiAssistantActionButtonModel(idleCreateAction)).toEqual({
      label: 'Create',
      tone: 'primary',
      disabled: false,
      dimmed: false,
    });
    expect(buildAiAssistantActionButtonModel(applyingUpdateAction)).toEqual({
      label: 'Applying...',
      tone: 'quiet',
      disabled: true,
      dimmed: true,
    });
    expect(buildAiAssistantActionButtonModel(appliedPlanAction)).toEqual({
      label: 'Created',
      tone: 'quiet',
      disabled: true,
      dimmed: false,
    });
  });

  it('builds grouped card models with shared header, entry, and footer data', () => {
    const actions: AiAssistantAction[] = [
      {
        id: 'task-1',
        kind: 'create_task',
        label: 'Create task',
        title: 'Task A',
        status: 'idle',
        priority: 'high',
        groupId: 'group-1',
        groupTitle: 'Create tasks',
        groupSummary: 'Tasks derived from the selected story.',
      },
      {
        id: 'task-2',
        kind: 'create_task',
        label: 'Create task',
        title: 'Task B',
        status: 'applied',
        groupId: 'group-1',
        groupTitle: 'Create tasks',
        groupSummary: 'Tasks derived from the selected story.',
      },
      {
        id: 'task-3',
        kind: 'create_task',
        label: 'Create task',
        title: 'Task C',
        status: 'failed',
        groupId: 'group-1',
        groupTitle: 'Create tasks',
        groupSummary: 'Tasks derived from the selected story.',
      },
    ];

    const entryModel = buildAiAssistantActionEntryModel(actions[0], context, true);
    const groupModel = buildAiAssistantGroupedActionCardModel(
      actions,
      context,
      true
    );

    expect(entryModel.actionId).toBe('task-1');
    expect(entryModel.status).toBe('idle');
    expect(entryModel.card.title).toBe('Task A');
    expect(entryModel.button.label).toBe('Create');

    expect(groupModel.header).toEqual({
      eyebrow: 'Create tasks',
      summary: 'Tasks derived from the selected story.',
    });
    expect(groupModel.entries.map((entry) => entry.actionId)).toEqual([
      'task-1',
      'task-2',
      'task-3',
    ]);
    expect(groupModel.footer).toEqual({
      actionIds: ['task-1', 'task-3'],
      button: {
        label: 'Create all',
        tone: 'primary',
        disabled: false,
        dimmed: false,
      },
    });
  });

});
