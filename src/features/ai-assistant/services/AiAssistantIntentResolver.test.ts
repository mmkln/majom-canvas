import { describe, expect, it } from 'vitest';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantSelectionItem,
} from '../aiAssistantEvents.ts';
import { resolveAiAssistantIntentSubmission } from './AiAssistantIntentResolver.ts';
import { createAppRuntime } from '../../../app-runtime/index.ts';

function makeSelectionItem(
  id: string,
  kind: 'goal' | 'story' | 'task',
  title: string
): AiAssistantSelectionItem {
  return {
    id,
    kind,
    title,
    description: '',
  };
}

function makeSnapshot(
  items: AiAssistantSelectionItem[],
  options: {
    selectionIds?: string[];
    focusId?: string | null;
  } = {}
): AiAssistantCanvasSnapshot {
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

describe('resolveAiAssistantIntentSubmission', () => {
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

    const submission = resolveAiAssistantIntentSubmission(
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
    expect(submission.intentContext).toBeUndefined();
    expect(submission.profile).toBe('readiness-check');
    expect(submission.requestLabel).toBe('What is missing?');
    expect(submission.requestMessageKind).toBe('command');
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

    const submission = resolveAiAssistantIntentSubmission(
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
    expect(submission.requestLabel).toBe('Review plan');
    expect(submission.snapshot?.selectionIds).toEqual(['goal-1']);
    expect(submission.prompt).toContain('current canvas structure');
  });

  it('clears stale selection when explicit target ids are missing from the snapshot', () => {
    const goal = makeSelectionItem('goal-1', 'goal', 'Launch automation offer');
    const snapshot = makeSnapshot([goal], {
      selectionIds: ['goal-1'],
      focusId: 'goal-1',
    });

    const submission = resolveAiAssistantIntentSubmission(
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
    expect(submission.requestLabel).toBe('Review plan');
    expect(submission.prompt).toContain('current canvas structure');
  });

  it('resolves clarify intents into targeted selection-scoped submissions', () => {
    const story = makeSelectionItem('story-1', 'story', 'Outbound sequence');
    const snapshot = makeSnapshot([story], {
      selectionIds: [],
      focusId: null,
    });

    const submission = resolveAiAssistantIntentSubmission(
      {
        intent: 'clarify',
        scope: 'selection',
        targetIds: ['story-1'],
      },
      snapshot
    );

    expect(submission.contextMode).toBe('selection');
    expect(submission.intent).toBe('clarify');
    expect(submission.intentContext).toBeUndefined();
    expect(submission.profile).toBe('breakdown');
    expect(submission.requestLabel).toBe('Clarify · Story: Outbound sequence');
    expect(submission.snapshot?.selectionIds).toEqual(['story-1']);
    expect(submission.prompt).toContain('Clarify the selected story "Outbound sequence"');
  });

  it('resolves strategic_plan into a canvas-scoped strategic plan submission', () => {
    const snapshot = makeSnapshot([]);

    const submission = resolveAiAssistantIntentSubmission(
      {
        intent: 'strategic_plan',
        scope: 'canvas',
      },
      snapshot
    );

    expect(submission.contextMode).toBe('canvas');
    expect(submission.intent).toBe('strategic_plan');
    expect(submission.intentContext).toEqual({
      strategicPlanMode: 'canvas_bootstrap',
    });
    expect(submission.profile).toBe('strategic-plan');
    expect(submission.requestLabel).toBe('Generate strategic plan');
    expect(submission.requestMessageKind).toBe('command');
    expect(submission.prompt).toContain('create_goals');
    expect(submission.prompt).toContain('create_goal_blueprint');
  });

  it('localizes request labels when i18n is provided', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });
    const story = makeSelectionItem('story-1', 'story', 'Outbound sequence');
    const snapshot = makeSnapshot([story], {
      selectionIds: [],
      focusId: null,
    });

    const submission = resolveAiAssistantIntentSubmission(
      {
        intent: 'clarify',
        scope: 'selection',
        targetIds: ['story-1'],
      },
      snapshot,
      runtime.i18n
    );

    expect(submission.requestLabel).toBe('Уточнити · Історія: Outbound sequence');
  });
});
