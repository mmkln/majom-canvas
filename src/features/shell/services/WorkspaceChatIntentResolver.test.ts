import { describe, expect, it } from 'vitest';
import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatSelectionItem,
} from '../workspaceChatEvents.ts';
import { resolveWorkspaceChatIntentSubmission } from './WorkspaceChatIntentResolver.ts';

function makeSelectionItem(
  id: string,
  kind: 'goal' | 'story' | 'task',
  title: string
): WorkspaceChatSelectionItem {
  return {
    id,
    kind,
    title,
    description: '',
  };
}

function makeSnapshot(
  items: WorkspaceChatSelectionItem[],
  options: {
    selectionIds?: string[];
    focusId?: string | null;
  } = {}
): WorkspaceChatCanvasSnapshot {
  const selectionIds = options.selectionIds ?? [];
  const selectionIdSet = new Set(selectionIds);
  return {
    canvasId: 'canvas-a',
    canvasTitle: 'Canvas A',
    summary: {
      goalCount: items.filter((item) => item.kind === 'goal').length,
      storyCount: items.filter((item) => item.kind === 'story').length,
      taskCount: items.filter((item) => item.kind === 'task').length,
      selectedCount: selectionIds.length,
    },
    selectionIds,
    focusId: options.focusId ?? null,
    highlightedIds: [],
    elements: items.map((item) => ({
      ...item,
      parentId: null,
      childIds: [],
      selected: selectionIdSet.has(item.id),
      focused: (options.focusId ?? null) === item.id,
      highlighted: false,
    })),
    connections: [],
    viewport: null,
    recentActivity: [],
  };
}

describe('resolveWorkspaceChatIntentSubmission', () => {
  it('rewrites selection and focus for selection-scoped intents', () => {
    const goal = makeSelectionItem(
      'goal-1',
      'goal',
      '5 клієнтів по автоматизації (GHL)'
    );
    const story = makeSelectionItem('story-1', 'story', 'Outbound sequence');
    const snapshot = makeSnapshot([goal, story], {
      selectionIds: [],
    });

    const submission = resolveWorkspaceChatIntentSubmission(
      {
        intent: 'missing',
        scope: 'selection',
        targetIds: ['goal-1'],
      },
      snapshot
    );

    expect(submission.contextMode).toBe('selection');
    expect(submission.source).toBe('intent');
    expect(submission.intent).toBe('missing');
    expect(submission.profile).toBe('readiness-check');
    expect(submission.snapshot?.selectionIds).toEqual(['goal-1']);
    expect(submission.snapshot?.focusId).toBe('goal-1');
    expect(submission.prompt).toContain(
      'selected goal "5 клієнтів по автоматизації (GHL)"'
    );
  });

  it('ignores existing selection when the intent scope is canvas', () => {
    const goal = makeSelectionItem('goal-1', 'goal', 'Launch automation offer');
    const snapshot = makeSnapshot([goal], {
      selectionIds: ['goal-1'],
      focusId: 'goal-1',
    });

    const submission = resolveWorkspaceChatIntentSubmission(
      {
        intent: 'review',
        scope: 'canvas',
      },
      snapshot
    );

    expect(submission.contextMode).toBe('canvas');
    expect(submission.source).toBe('intent');
    expect(submission.intent).toBe('review');
    expect(submission.profile).toBe('review-selection');
    expect(submission.snapshot?.selectionIds).toEqual(['goal-1']);
    expect(submission.prompt).toContain('current canvas structure');
  });

  it('clears stale selection when explicit target ids are missing from the snapshot', () => {
    const goal = makeSelectionItem('goal-1', 'goal', 'Launch automation offer');
    const snapshot = makeSnapshot([goal], {
      selectionIds: ['goal-1'],
      focusId: 'goal-1',
    });

    const submission = resolveWorkspaceChatIntentSubmission(
      {
        intent: 'review',
        scope: 'selection',
        targetIds: ['missing-id'],
      },
      snapshot
    );

    expect(submission.snapshot?.selectionIds).toEqual([]);
    expect(submission.snapshot?.focusId).toBeNull();
    expect(submission.snapshot?.summary.selectedCount).toBe(0);
    expect(submission.prompt).toContain('current canvas structure');
  });
});
