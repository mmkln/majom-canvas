import { describe, expect, it } from 'vitest';
import { getWorkspaceChatQuickActions } from './WorkspaceChatQuickActions.ts';
import { createWorkspaceChatTestSnapshot } from './WorkspaceChatTestUtils.ts';

describe('WorkspaceChatQuickActions', () => {
  it('returns the new canvas-level quick actions when nothing is selected', () => {
    const actions = getWorkspaceChatQuickActions(
      createWorkspaceChatTestSnapshot({
        selectionIds: [],
        focusId: null,
        summary: {
          selectedCount: 0,
        },
        elements: createWorkspaceChatTestSnapshot().elements.map((element) => ({
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
    const actions = getWorkspaceChatQuickActions({
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
    const actions = getWorkspaceChatQuickActions(createWorkspaceChatTestSnapshot());

    expect(actions[0]?.label).toBe('Break into tasks');
    expect(actions.some((action) => action.label === 'Review selection')).toBe(true);
    expect(actions.some((action) => action.label === 'Find duplicates')).toBe(true);
    expect(actions.some((action) => action.label === 'Review recent changes')).toBe(true);
  });
});
