import { describe, expect, it } from 'vitest';
import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import {
  buildAiAssistantActionCardModel,
  buildAiAssistantActionButtonModel,
  buildAiAssistantActionEntryModel,
  buildAiAssistantGroupedActionCardModel,
  buildAiAssistantActionTagModels,
  getAiAssistantActionButtonLabel,
  getAiAssistantActionSecondaryText,
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

  it('derives selected-story targeting for task creation', () => {
    const action: AiAssistantAction = {
      id: 'task-create',
      kind: 'create_task',
      label: 'Create task',
      title: 'Add validation',
      status: 'idle',
    };

    expect(getAiAssistantActionSecondaryText(action, context, true)).toBe(
      'In selected story'
    );
  });

  it('builds tag models for create and update actions', () => {
    const createAction: AiAssistantAction = {
      id: 'goal-create',
      kind: 'create_goal',
      label: 'Create goal',
      title: 'Integrate canvas in Noesis',
      status: 'idle',
      priority: 'highest',
      elementStatus: 'in-progress',
      confirmationMode: 'batch',
    };
    const updateAction: AiAssistantAction = {
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

    expect(buildAiAssistantActionTagModels(createAction).map((tag) => tag.text))
      .toEqual(['highest', 'In progress', 'Batch confirm']);
    expect(buildAiAssistantActionTagModels(updateAction).map((tag) => tag.text))
      .toEqual(['2 changes']);
  });

  it('derives button labels and review accents consistently', () => {
    const relationAction: AiAssistantAction = {
      id: 'rel-1',
      kind: 'suggest_relation',
      label: 'Add relation',
      title: 'Link tasks',
      status: 'applied',
      relationType: 'blocks',
      fromId: 'task-a',
      toId: 'task-b',
    };
    const removalAction: AiAssistantAction = {
      id: 'rel-2',
      kind: 'remove_relation',
      label: 'Remove relation',
      title: 'Remove outdated relation',
      status: 'idle',
      relationType: 'relates_to',
      fromId: 'story-a',
      toId: 'goal-a',
    };
    const relationUpdateAction: AiAssistantAction = {
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

    expect(getAiAssistantActionButtonLabel(relationAction)).toBe('Applied');
    expect(getAiAssistantActionButtonLabel(removalAction)).toBe('Apply');
    expect(getAiAssistantActionButtonLabel(relationUpdateAction)).toBe('Apply');
    expect(getAiAssistantActionSecondaryText(removalAction, context, true)).toBe(
      '"story-a" → "goal-a"'
    );
    expect(
      buildAiAssistantActionTagModels(relationUpdateAction).map((tag) => tag.text)
    ).toEqual(['relates to -> blocks']);
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

  it('renders strategic blueprint actions with plan-specific labels and tags', () => {
    const action: AiAssistantAction = {
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

    expect(getAiAssistantActionButtonLabel(action)).toBe('Create plan');
    expect(getAiAssistantActionSecondaryText(action, context, true)).toBe(
      '3 strategic goals · 1 leads-to link'
    );
    expect(buildAiAssistantActionTagModels(action).map((tag) => tag.text)).toEqual([
      'goal tree with sequence',
      '3 goals',
      '1 sequence link',
    ]);
  });

  it('renders create_goals actions with batch labels and evidence metadata', () => {
    const action: AiAssistantAction = {
      id: 'goals-1',
      kind: 'create_goals',
      label: 'Create goals',
      title: 'Strategic goals',
      status: 'idle',
      target: { kind: 'goal', id: 'goal-a' },
      items: [
        { title: 'Learn the basics' },
        { title: 'Build first workflows' },
      ],
      supportedBy: ['goal-a'],
      evidenceIds: ['goal-a'],
      sourceContext: 'Selected goal description',
    };

    expect(getAiAssistantActionButtonLabel(action)).toBe('Create all');
    expect(getAiAssistantActionSecondaryText(action, context, true)).toBe(
      '2 strategic goals · In goal "Launch"'
    );
    expect(buildAiAssistantActionTagModels(action).map((tag) => tag.text)).toEqual([
      '2 goals',
      'supported by 1',
      '1 evidence',
      'source context',
    ]);
  });

  it('builds generic action card detail blocks for update and strategic actions', () => {
    const updateAction: AiAssistantAction = {
      id: 'update-1',
      kind: 'suggest_update',
      label: 'Apply update',
      title: 'Refine checkout flow',
      status: 'idle',
      elementId: 'story-a',
      elementKind: 'story',
      targetTitle: 'Checkout flow',
      patch: {
        title: 'Improve checkout flow',
        elementStatus: 'in-progress',
      },
    };
    const goalsAction: AiAssistantAction = {
      id: 'goals-2',
      kind: 'create_goals',
      label: 'Create goals',
      title: 'Strategic goals',
      status: 'idle',
      items: [
        {
          title: 'Learn the basics',
          description: 'Build foundation',
          priority: 'high',
        },
        {
          title: 'Build workflows',
          elementStatus: 'pending',
        },
      ],
    };
    const blueprintAction: AiAssistantAction = {
      id: 'blueprint-2',
      kind: 'create_goal_blueprint',
      label: 'Create plan',
      title: 'Marketing plan',
      status: 'idle',
      pattern: 'goal_tree_with_sequence',
      summary: 'Starter structure.',
      goals: [
        { ref: 'root', title: 'Master automation' },
        { ref: 'child', title: 'Build workflows', parentRef: 'root' },
      ],
      relations: [
        {
          fromRef: 'root',
          toRef: 'child',
          relationType: 'leads_to',
        },
      ],
      assumptions: ['User already knows basic marketing concepts'],
    };

    const updateCard = buildAiAssistantActionCardModel(updateAction, context, true);
    const goalsCard = buildAiAssistantActionCardModel(goalsAction, context, true);
    const blueprintCard = buildAiAssistantActionCardModel(
      blueprintAction,
      context,
      true
    );

    expect(updateCard.detailBlocks).toEqual([
      {
        kind: 'kv-list',
        title: 'Changes',
        entries: [
          { label: 'Title', value: 'Improve checkout flow' },
          { label: 'Status', value: 'In progress' },
        ],
      },
    ]);
    expect(goalsCard.detailBlocks).toEqual([
      {
        kind: 'entity-list',
        title: 'Strategic goals',
        items: [
          {
            title: 'Learn the basics',
            description: 'Build foundation',
            meta: ['high'],
          },
          {
            title: 'Build workflows',
            description: undefined,
            meta: ['Pending'],
          },
        ],
      },
    ]);
    expect(blueprintCard.description).toBe('Starter structure.');
    expect(blueprintCard.detailBlocks).toEqual([
      {
        kind: 'hierarchy-list',
        title: 'Strategic goals',
        items: [
          { title: 'Master automation', description: undefined, depth: 0 },
          { title: 'Build workflows', description: undefined, depth: 1 },
        ],
      },
      {
        kind: 'text-list',
        title: 'Sequence links',
        items: ['Master automation -> Build workflows'],
      },
      {
        kind: 'text-list',
        title: 'Assumptions',
        items: ['User already knows basic marketing concepts'],
      },
    ]);
  });
});
