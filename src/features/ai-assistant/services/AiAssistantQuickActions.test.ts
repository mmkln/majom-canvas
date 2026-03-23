import { describe, expect, it } from 'vitest';
import { getAiAssistantQuickActions } from './AiAssistantQuickActions.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';

describe('AiAssistantQuickActions', () => {
  it('returns the new canvas-level quick actions when nothing is selected', () => {
    const actions = getAiAssistantQuickActions(
      createAiAssistantTestSnapshot({
        selectionIds: [],
        focusId: null,
        summary: {
          selectedCount: 0,
        },
        elements: createAiAssistantTestSnapshot().elements.map((element) => ({
          ...element,
          selected: false,
          focused: false,
        })),
      })
    );

    expect(actions.map((action) => action.label)).toEqual([
      'Review plan',
      'What is missing?',
      'Next steps',
      'Find duplicates',
      'Review recent changes',
    ]);
  });

  it('prepends Generate strategic plan on an empty canvas', () => {
    const actions = getAiAssistantQuickActions({
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
    });

    expect(actions[0]?.label).toBe('Generate strategic plan');
  });

  it('adds a breakdown shortcut and selection-scoped review actions for a selected story', () => {
    const actions = getAiAssistantQuickActions(createAiAssistantTestSnapshot());

    expect(actions[0]?.label).toBe('Break into tasks');
    expect(actions.some((action) => action.label === 'Review selection')).toBe(true);
    expect(actions.some((action) => action.label === 'Find duplicates')).toBe(true);
    expect(actions.some((action) => action.label === 'Review recent changes')).toBe(true);
  });
});
