import { describe, expect, it } from 'vitest';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import {
  hasWorkspaceChatCreateIntent,
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
        prompt: 'Create a task for payment form',
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
      prompt: 'Summarize the canvas',
      allowActions: true,
      validationSnapshot: createSnapshot(),
    });

    expect(result.replyMarkdown).toBe('Plain markdown reply');
    expect(result.actions).toEqual([]);
  });

  it('infers a create-goal action from an explicit prompt when the model returns plain text', () => {
    const result = parseWorkspaceChatStructuredReply(
      'Створив нову ціль для інтеграції канвасу в Noesis з високим пріоритетом.',
      {
        prompt:
          'додай нову ціль про те що треба інтегрувати канвас в Noesis, і додай опис що на канвасі буде зручно лінкати звязки між елементами і вони будуть гарно візуально відображатися. пріоритет додай високий і статус в процесі',
        allowActions: true,
        validationSnapshot: createSnapshot(),
      }
    );

    expect(result.replyMarkdown).toContain('Створив нову ціль');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.kind).toBe('create_goal');
    expect(result.actions[0]?.title).toBe('Інтегрувати канвас в Noesis');
    expect(result.actions[0]?.priority).toBe('high');
    expect(result.actions[0]?.elementStatus).toBe('in-progress');
    expect(result.actions[0]?.description).toContain(
      'на канвасі буде зручно лінкати звязки'
    );
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
        prompt: 'Create a task',
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
        prompt: 'Review the selected story and improve it.',
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
