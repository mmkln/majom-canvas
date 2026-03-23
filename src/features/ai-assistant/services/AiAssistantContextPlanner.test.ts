import { describe, expect, it } from 'vitest';
import {
  buildAiAssistantScenarioDescriptor,
  extractAiAssistantStrategicHints,
  resolveAiAssistantBreakdownMode,
  resolveAiAssistantStrategicPlanMode,
} from './AiAssistantContextPlanner.ts';
import { createAiAssistantTestMemory, createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';

function createSelectedGoalSnapshot() {
  const base = createAiAssistantTestSnapshot();
  return {
    ...base,
    selectionIds: ['goal-1'],
    focusId: 'goal-1',
    summary: {
      ...base.summary,
      selectedCount: 1,
    },
    elements: base.elements.map((element) => ({
      ...element,
      selected: element.id === 'goal-1',
      focused: element.id === 'goal-1',
    })),
  };
}

describe('AiAssistantContextPlanner', () => {
  it('resolves strategic plan scenarios around a selected goal', () => {
    const snapshot = createSelectedGoalSnapshot();
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'декомпозуй поточну ціль у підцілі',
      snapshot,
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });

    expect(scenario.kind).toBe('strategic_plan');
    expect(scenario.mode).toBe('goal_subgoals');
    expect(scenario.targetScope).toBe('selected_goal');
    expect(scenario.allowedActions).toEqual([
      'create_goals',
      'create_goal_blueprint',
    ]);
    expect(scenario.strategicHints[0]).toContain(
      'Deliver the next release with a stable checkout flow'
    );
    expect(scenario.evidence.supportedBy).toContain('goal-1');
  });

  it('resolves fallback strategic plan modes for empty canvas prompts', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'згенеруй стратегічний план',
      snapshot: createAiAssistantTestSnapshot({
        selectionIds: [],
        focusId: null,
        summary: {
          goalCount: 0,
          storyCount: 0,
          taskCount: 0,
          selectedCount: 0,
        },
        elements: [],
        connections: [],
        viewport: null,
        recentActivity: [],
      }),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      intentContext: {
        strategicPlanMode: 'canvas_bootstrap',
      } satisfies AiAssistantIntentContext,
    });

    expect(scenario.mode).toBe('canvas_bootstrap');
    expect(scenario.targetScope).toBe('canvas');
    expect(scenario.confirmationMode).toBe('batch');
  });

  it('resolves breakdown modes from explicit intent context and target kind', () => {
    const snapshot = createAiAssistantTestSnapshot();
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'breakdown',
      prompt: 'розбий на задачі',
      snapshot,
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      intentContext: {
        breakdownMode: 'story_tasks',
      } satisfies AiAssistantIntentContext,
    });

    expect(scenario.mode).toBe('story_tasks');
    expect(scenario.targetScope).toBe('selected_story');
    expect(resolveAiAssistantStrategicPlanMode(undefined, null)).toBe(
      'canvas_bootstrap'
    );
    expect(resolveAiAssistantBreakdownMode(undefined, scenario.target)).toBe(
      'story_tasks'
    );
    expect(extractAiAssistantStrategicHints(null)).toEqual([]);
  });
});
