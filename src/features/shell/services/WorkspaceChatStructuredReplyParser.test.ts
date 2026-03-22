import { describe, expect, it } from 'vitest';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import {
  parseWorkspaceChatStructuredReply,
} from './WorkspaceChatStructuredReplyParser.ts';

function createSnapshot(): WorkspaceChatCanvasSnapshot {
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

describe('WorkspaceChatStructuredReplyParser', () => {
  it('parses a valid structured reply and keeps supported priorities', () => {
    const result = parseWorkspaceChatStructuredReply(
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

  it('falls back to plain markdown when the payload is not valid JSON', () => {
    const result = parseWorkspaceChatStructuredReply('Plain markdown reply', {
      allowActions: true,
      validationSnapshot: createSnapshot(),
    });

    expect(result.replyMarkdown).toBe('Plain markdown reply');
    expect(result.actions).toEqual([]);
  });

  it('does not infer create actions from plain-text replies anymore', () => {
    const result = parseWorkspaceChatStructuredReply(
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
    const result = parseWorkspaceChatStructuredReply(
      'The selected goal needs a clearer description, but I need more context to make a safe change.',
      {
        allowActions: true,
        validationSnapshot: createSnapshot(),
        intent: 'fill_details',
      }
    );

    expect(result.replyMarkdown).toContain('needs a clearer description');
    expect(result.actions).toEqual([]);
  });

  it('drops action kinds that are incompatible with the active intent', () => {
    const result = parseWorkspaceChatStructuredReply(
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
        intent: 'fill_details',
      }
    );

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('suggest_update');
  });

  it('drops invalid actions but keeps the assistant text', () => {
    const result = parseWorkspaceChatStructuredReply(
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
    const result = parseWorkspaceChatStructuredReply(
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
});
