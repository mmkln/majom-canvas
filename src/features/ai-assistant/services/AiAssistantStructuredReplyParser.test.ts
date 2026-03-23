import { describe, expect, it } from 'vitest';
import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import {
  parseAiAssistantStructuredReply,
} from './AiAssistantStructuredReplyParser.ts';
import { buildAiAssistantActionPlanFromScenario } from './AiAssistantActionPlan.ts';
import { buildAiAssistantScenarioDescriptor } from './AiAssistantContextPlanner.ts';
import { createAiAssistantTestMemory } from './AiAssistantTestUtils.ts';

function createSnapshot(): AiAssistantCanvasSnapshot {
  return {
    canvasId: 'canvas-main',
    canvasTitle: 'Main current flow',
    summary: {
      goalCount: 1,
      storyCount: 1,
      taskCount: 2,
      selectedCount: 1,
    },
    selectionIds: ['story-1'],
    focusId: 'story-1',
    highlightedIds: [],
    elements: [
      {
        id: 'goal-1',
        kind: 'goal',
        title: 'Launch v2',
        description: '',
        status: 'todo',
        priority: 'medium',
        parentId: null,
        childIds: ['story-1'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'story-1',
        kind: 'story',
        title: 'Checkout flow',
        description: '',
        status: 'todo',
        priority: 'high',
        childCount: 2,
        parentId: 'goal-1',
        childIds: ['task-1', 'task-2'],
        selected: true,
        focused: true,
        highlighted: false,
      },
    ],
    connections: [],
    viewport: {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 800,
      visibleElementIds: ['goal-1', 'story-1'],
    },
    recentActivity: [],
  };
}

function createEmptySnapshot(): AiAssistantCanvasSnapshot {
  return {
    canvasId: 'canvas-empty',
    canvasTitle: 'Empty canvas',
    summary: {
      goalCount: 0,
      storyCount: 0,
      taskCount: 0,
      selectedCount: 0,
    },
    selectionIds: [],
    focusId: null,
    highlightedIds: [],
    elements: [],
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

describe('AiAssistantStructuredReplyParser', () => {
  it('parses a valid structured reply and keeps supported priorities', () => {
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared a task for you.',
        actions: [
          {
            kind: 'create_task',
            title: 'Build payment form',
            description: 'Implement validation for payment fields.',
            priority: 'highest',
            target: { kind: 'story', id: 'story-1' },
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.replyMarkdown).toBe('I prepared a task for you.');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.label).toBe('Create task');
    expect(result.actions[0]?.priority).toBe('highest');
    expect(result.actions[0]?.target).toEqual({
      kind: 'story',
      id: 'story-1',
    });
  });

  it('preserves confirmation semantics from a scenario action plan', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'декомпозуй поточну ціль у підцілі',
      snapshot: createSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);

    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared strategic goals.',
        actions: [
          {
            kind: 'create_goals',
            title: 'Strategic goals',
            target: { kind: 'goal', id: 'goal-1' },
            items: [{ title: 'Learn the basics' }, { title: 'Build the first flow' }],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
        scenario,
        actionPlan,
      }
    );

    expect(result.actions[0]?.confirmationMode).toBe('batch');
    expect(result.actions[0]?.kind).toBe('create_goals');
  });

  it('falls back to plain markdown when the payload is not valid JSON', () => {
    const result = parseAiAssistantStructuredReply('Plain markdown reply', {
      allowActions: true,
      validationSnapshot: createSnapshot(),
    });

    expect(result.replyMarkdown).toBe('Plain markdown reply');
    expect(result.actions).toEqual([]);
  });

  it('does not infer create actions from plain-text replies anymore', () => {
    const result = parseAiAssistantStructuredReply(
      'Створив нову ціль для інтеграції канвасу в Noesis з високим пріоритетом.',
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.replyMarkdown).toContain('Створив нову ціль');
    expect(result.actions).toEqual([]);
  });

  it('keeps plain-text intent replies free of inferred actions', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'fill_details',
      prompt:
        'The selected goal needs a clearer description, but I need more context to make a safe change.',
      snapshot: createSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);
    const result = parseAiAssistantStructuredReply(
      'The selected goal needs a clearer description, but I need more context to make a safe change.',
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
        scenario,
        actionPlan,
      }
    );

    expect(result.replyMarkdown).toContain('needs a clearer description');
    expect(result.actions).toEqual([]);
  });

  it('drops action kinds that are incompatible with the active intent', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'fill_details',
      prompt: 'Fill in the selected goal',
      snapshot: createSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared one update.',
        actions: [
          {
            kind: 'create_goal',
            title: 'This should not survive fill-details parsing',
          },
          {
            kind: 'suggest_updates',
            updates: [
              {
                elementId: 'goal-1',
                patch: {
                  description:
                    'Move into an apartment that feels like a strong lifestyle upgrade.',
                },
                reason:
                  'This mirrors the goal title without adding unsupported constraints.',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
        scenario,
        actionPlan,
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('suggest_update');
  });

  it('drops invalid actions but keeps the assistant text', () => {
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared some options.',
        actions: [
          {
            kind: 'create_task',
            title: 'Valid task',
            priority: 'lowest',
          },
          {
            kind: 'create_story',
            title: '',
            priority: 'urgent',
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.replyMarkdown).toBe('I prepared some options.');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.title).toBe('Valid task');
    expect(result.actions[0]?.priority).toBe('lowest');
  });

  it('parses review findings and structured planning proposal batches', () => {
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared a review and a few improvements.',
        reviewFindings: {
          title: 'Checkout review',
          summary: 'The story is actionable but still missing explicit sequencing.',
          readinessScore: 68,
          readinessVerdict: 'Needs clearer dependencies before execution.',
          findings: [
            {
              severity: 'medium',
              category: 'missing_dependencies',
              title: 'Missing sequence between story and goal follow-up',
              detail:
                'The checkout story has no explicit non-hierarchical link to the launch goal follow-up.',
              targetIds: ['story-1', 'goal-1'],
            },
          ],
        },
        actions: [
          {
            kind: 'create_batch_tasks',
            title: 'Checkout breakdown',
            summary: 'These tasks make the story easier to execute.',
            target: { kind: 'story', id: 'story-1' },
            items: [
              {
                title: 'Validate payment form states',
                priority: 'high',
              },
              {
                title: 'Draft order review step',
                priority: 'medium',
              },
            ],
          },
          {
            kind: 'suggest_relations',
            title: 'Suggested relations',
            relations: [
              {
                fromId: 'goal-1',
                toId: 'story-1',
                relationType: 'relates_to',
                reason: 'Connect launch work with the main checkout delivery slice.',
              },
            ],
          },
          {
            kind: 'suggest_updates',
            title: 'Suggested refinements',
            updates: [
              {
                elementId: 'story-1',
                patch: {
                  priority: 'highest',
                },
                reason: 'The selected story is central to the current scope.',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.replyMarkdown).toBe(
      'I prepared a review and a few improvements.'
    );
    expect(result.reviewFindings?.findings).toHaveLength(1);
    expect(result.actions).toHaveLength(4);
    expect(result.actions[0]?.kind).toBe('create_task');
    expect(result.actions[1]?.kind).toBe('create_task');
    expect(result.actions[0]?.groupId).toBeTruthy();
    expect(result.actions[0]?.groupId).toBe(result.actions[1]?.groupId);
    expect(result.actions[2]?.kind).toBe('suggest_relation');
    expect(result.actions[3]?.kind).toBe('suggest_update');
  });

  it('normalizes remove_relations batches into remove_relation actions', () => {
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared one dependency cleanup.',
        actions: [
          {
            kind: 'remove_relations',
            title: 'Relations to remove',
            relations: [
              {
                fromId: 'goal-1',
                toId: 'story-1',
                relationType: 'relates_to',
                reason:
                  'This non-hierarchical link is redundant with the current structure.',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('remove_relation');
    expect(result.actions[0]?.label).toBe('Remove relation');
    expect(result.actions[0]?.groupTitle).toBe('Relations to remove');
  });

  it('normalizes update_relations batches into update_relation actions', () => {
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared one relation type change.',
        actions: [
          {
            kind: 'update_relations',
            title: 'Relation type changes',
            relations: [
              {
                fromId: 'goal-1',
                toId: 'story-1',
                currentRelationType: 'relates_to',
                nextRelationType: 'blocks',
                reason:
                  'The checkout work now blocks the launch follow-up rather than merely relating to it.',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('update_relation');
    expect(result.actions[0]?.label).toBe('Update relation');
    expect(result.actions[0]?.groupTitle).toBe('Relation type changes');
  });

  it('keeps create_goals batches as a single grouped strategic action', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'Generate a strategic learning plan for marketing automation.',
      snapshot: createSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared strategic goals for the empty canvas.',
        actions: [
          {
            kind: 'create_goals',
            title: 'Strategic goals',
            summary: 'Top-level strategic goals for the topic.',
            supportedBy: ['goal-1'],
            evidenceIds: ['goal-1'],
            sourceContext: 'Selected strategic goal',
            target: { kind: 'goal', id: 'goal-1' },
            items: [
              {
                title: 'Learn automation fundamentals',
                priority: 'high',
              },
              {
                title: 'Build first automation workflow',
                priority: 'medium',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
        scenario,
        actionPlan,
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('create_goals');
    if (result.actions[0]?.kind !== 'create_goals') {
      throw new Error('Expected create_goals action.');
    }
    expect(result.actions[0].title).toBe('Strategic goals');
    expect(result.actions[0].items).toHaveLength(2);
    expect(result.actions[0].target).toEqual({ kind: 'goal', id: 'goal-1' });
    expect(result.actions[0].supportedBy).toEqual(['goal-1']);
    expect(result.actions[0].evidenceIds).toEqual(['goal-1']);
    expect(result.actions[0].sourceContext).toBe('Selected strategic goal');
  });

  it('keeps create_goal_blueprint as one strategic plan action', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'Generate a strategic learning plan for marketing automation.',
      snapshot: createEmptySnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared one strategic plan skeleton.',
        actions: [
          {
            kind: 'create_goal_blueprint',
            title: 'Marketing automation learning plan',
            summary: 'One main goal with strategic subgoals.',
            pattern: 'goal_tree_with_sequence',
            goals: [
              {
                ref: 'root',
                title: 'Master marketing automation strategically',
              },
              {
                ref: 'fundamentals',
                title: 'Learn core automation concepts',
                parentRef: 'root',
              },
              {
                ref: 'practice',
                title: 'Build first automation workflows',
                parentRef: 'root',
              },
            ],
            relations: [
              {
                fromRef: 'fundamentals',
                toRef: 'practice',
                relationType: 'leads_to',
                reason: 'Foundations should come before practice.',
              },
            ],
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: createEmptySnapshot(),
        scenario,
        actionPlan,
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('create_goal_blueprint');
    if (result.actions[0]?.kind !== 'create_goal_blueprint') {
      throw new Error('Expected create_goal_blueprint action.');
    }
    expect(result.actions[0].pattern).toBe('goal_tree_with_sequence');
    expect(result.actions[0].goals).toHaveLength(3);
    expect(result.actions[0].relations).toHaveLength(1);
  });

  it('rejects legacy create_batch_stories wrappers without recovering batch data', () => {
    const snapshot = createEmptySnapshot();
    snapshot.elements = [
      {
        id: 'goal-1',
        kind: 'goal',
        title: 'Marketing automation',
        description: '',
        status: 'defined',
        priority: 'low',
        childCount: 0,
        parentId: null,
        childIds: [],
        selected: true,
        focused: true,
        highlighted: false,
      },
    ];

    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'breakdown',
      prompt: 'Break down the selected goal into stories.',
      snapshot,
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });
    const actionPlan = buildAiAssistantActionPlanFromScenario(scenario);
    const result = parseAiAssistantStructuredReply(
      JSON.stringify({
        replyMarkdown: 'I prepared stories for the selected goal.',
        actions: [
          {
            kind: 'create_batch_stories',
            data: {
              parentId: 'goal-1',
              stories: [{ title: 'Learn the fundamentals' }],
            },
          },
        ],
      }),
      {
        allowActions: true,
        validationSnapshot: snapshot,
        scenario,
        actionPlan,
      }
    );

    expect(result.actions).toEqual([]);
  });
});
