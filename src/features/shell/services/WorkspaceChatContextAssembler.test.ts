import { describe, expect, it } from 'vitest';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import { EMPTY_WORKSPACE_CHAT_MEMORY_STATE } from './WorkspaceChatContextTypes.ts';
import { WorkspaceChatContextAssembler } from './WorkspaceChatContextAssembler.ts';

function createSnapshot(): WorkspaceChatCanvasSnapshot {
  return {
    canvasId: 'canvas-main',
    canvasTitle: 'Main current flow',
    summary: {
      goalCount: 1,
      storyCount: 2,
      taskCount: 3,
      selectedCount: 0,
    },
    selectionIds: [],
    focusId: null,
    highlightedIds: [],
    elements: [
      {
        id: 'goal-1',
        kind: 'goal',
        title: 'Launch v2',
        description: '',
        status: 'in_progress',
        priority: 'high',
        parentId: null,
        childIds: ['story-1', 'story-2'],
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
        priority: 'medium',
        childCount: 2,
        parentId: 'goal-1',
        childIds: ['task-1', 'task-2'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'story-2',
        kind: 'story',
        title: 'Post-purchase',
        description: '',
        status: 'todo',
        priority: 'low',
        childCount: 1,
        parentId: 'goal-1',
        childIds: ['task-3'],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-1',
        kind: 'task',
        title: 'Payment form',
        description: '',
        status: 'todo',
        priority: 'high',
        parentId: 'story-1',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-2',
        kind: 'task',
        title: 'Receipt email',
        description: '',
        status: 'todo',
        priority: 'medium',
        parentId: 'story-1',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
      {
        id: 'task-3',
        kind: 'task',
        title: 'Refund flow',
        description: '',
        status: 'todo',
        priority: 'low',
        parentId: 'story-2',
        childIds: [],
        selected: false,
        focused: false,
        highlighted: false,
      },
    ],
    connections: [
      {
        id: 'rel-1',
        fromId: 'task-1',
        toId: 'task-2',
        relationType: 'relates_to',
      },
      {
        id: 'rel-2',
        fromId: 'task-2',
        toId: 'task-3',
        relationType: 'blocks',
      },
    ],
    viewport: {
      minX: 0,
      minY: 0,
      maxX: 620,
      maxY: 620,
      visibleElementIds: ['goal-1', 'story-1', 'task-1', 'task-2'],
    },
    recentActivity: [
      {
        id: 'activity-1',
        type: 'updated',
        label: 'Updated story "Checkout flow"',
        entityIds: ['story-1'],
        timestamp: 1,
      },
      {
        id: 'activity-2',
        type: 'selection',
        label: 'Selection changed to 2 items',
        entityIds: ['task-1', 'task-2'],
        timestamp: 2,
      },
    ],
  };
}

describe('WorkspaceChatContextAssembler', () => {
  it('anchors breakdown context on a selected story with parent and children', () => {
    const assembler = new WorkspaceChatContextAssembler();
    const snapshot = createSnapshot();
    snapshot.selectionIds = ['story-1'];

    const result = assembler.assemble({
      prompt: 'Break this story into smaller tasks',
      snapshot,
      memory: EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      contextMode: 'selection',
    });

    expect(result.profile).toBe('breakdown');
    expect(result.focus?.item.id).toBe('story-1');
    expect(result.focus?.parent?.id).toBe('goal-1');
    expect(result.focus?.children.map((item) => item.id)).toEqual(['task-1', 'task-2']);
    expect(result.contextSummary).toContain('Primary focus: Story "Checkout flow".');
  });

  it('builds task review context with parent story, siblings, and related tasks', () => {
    const assembler = new WorkspaceChatContextAssembler();
    const snapshot = createSnapshot();
    snapshot.selectionIds = ['task-1'];

    const result = assembler.assemble({
      prompt: 'Review this task and nearby dependencies',
      snapshot,
      memory: EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      contextMode: 'selection',
    });

    expect(result.profile).toBe('review-selection');
    expect(result.focus?.item.id).toBe('task-1');
    expect(result.focus?.parent?.id).toBe('story-1');
    expect(result.focus?.siblings.map((item) => item.id)).toEqual(['task-2']);
    expect(result.focus?.related[0]?.item.id).toBe('task-2');
  });

  it('uses viewport and top-level structure when there is no selection', () => {
    const assembler = new WorkspaceChatContextAssembler();
    const snapshot = createSnapshot();

    const result = assembler.assemble({
      prompt: 'Summarize the current canvas',
      snapshot,
      memory: EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      contextMode: 'canvas',
    });

    expect(result.profile).toBe('summarize');
    expect(result.focus?.item.id).toBe('goal-1');
    expect(result.viewportItems.map((item) => item.id)).toEqual([
      'goal-1',
      'story-1',
      'task-1',
      'task-2',
    ]);
    expect(result.contextSummary).not.toContain('Visible area contributes');
  });

  it('describes multi-select coherence instead of dumping flat selection only', () => {
    const assembler = new WorkspaceChatContextAssembler();
    const snapshot = createSnapshot();
    snapshot.selectionIds = ['task-1', 'task-2'];

    const result = assembler.assemble({
      prompt: 'What should I do next with these?',
      snapshot,
      memory: EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      contextMode: 'selection',
    });

    expect(result.selection.map((item) => item.id)).toEqual(['task-1', 'task-2']);
    expect(result.contextSummary).toContain('Selection forms one story cluster under "Checkout flow".');
    expect(result.recentActivity[0]?.id).toBe('activity-2');
  });

  it('keeps all visible items in viewport mode without a hard 12-item cap', () => {
    const assembler = new WorkspaceChatContextAssembler();
    const snapshot = createSnapshot();
    snapshot.viewport = {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 1000,
      visibleElementIds: [
        'goal-1',
        'story-1',
        'story-2',
        'task-1',
        'task-2',
        'task-3',
      ],
    };

    const result = assembler.assemble({
      prompt: 'Summarize the visible area',
      snapshot,
      memory: EMPTY_WORKSPACE_CHAT_MEMORY_STATE,
      contextMode: 'viewport',
    });

    expect(result.viewportItems.map((item) => item.id)).toEqual([
      'goal-1',
      'story-1',
      'story-2',
      'task-1',
      'task-2',
      'task-3',
    ]);
    expect(result.contextSummary).toContain('Visible area contributes 6 items to context.');
  });
});
