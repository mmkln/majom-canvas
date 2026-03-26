import { describe, expect, it } from 'vitest';
import { getAiAssistantQuickActions } from './AiAssistantQuickActions.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';
import { createAppRuntime } from '../../../app-runtime/index.ts';

describe('AiAssistantQuickActions', () => {
  it('returns the new canvas-level quick actions when nothing is selected', () => {
    const actions = getAiAssistantQuickActions(
      createAiAssistantTestSnapshot({
        selectionIds: [],
        focusId: null,
        summary: {
          goalCount: 1,
          storyCount: 2,
          taskCount: 3,
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
    expect(actions[0]?.submission?.intent).toBe('strategic_plan');
    expect(actions[0]?.submission?.intentContext).toEqual({
      strategicPlanMode: 'canvas_bootstrap',
    });
  });

  it('adds a breakdown shortcut and selection-scoped review actions for a selected story', () => {
    const actions = getAiAssistantQuickActions(createAiAssistantTestSnapshot());

    expect(actions[0]?.label).toBe('Break into tasks');
    expect(actions[0]?.submission?.intent).toBe('breakdown');
    expect(actions[0]?.submission?.intentContext).toEqual({
      breakdownMode: 'story_tasks',
    });
    expect(actions.some((action) => action.label === 'Review selection')).toBe(true);
    expect(actions.some((action) => action.label === 'Find duplicates')).toBe(true);
    expect(actions.some((action) => action.label === 'Review recent changes')).toBe(true);
  });

  it('returns localized quick action labels when i18n is provided', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });
    const actions = getAiAssistantQuickActions(
      createAiAssistantTestSnapshot(),
      runtime.i18n
    );

    expect(actions[0]?.label).toBe('Розбити на задачі');
    expect(
      actions.some((action) => action.label === 'Проаналізувати вибране')
    ).toBe(true);
  });
});
