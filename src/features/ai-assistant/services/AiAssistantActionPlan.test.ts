import { describe, expect, it } from 'vitest';
import { createAiAssistantTestMemory, createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';
import {
  buildAiAssistantActionPlanFromIntent,
  buildAiAssistantActionPlanFromScenario,
} from './AiAssistantActionPlan.ts';
import {
  buildAiAssistantScenarioDescriptor,
} from './AiAssistantContextPlanner.ts';
import { isAiAssistantActionPlan } from './AiAssistantActionPlanTypes.ts';

function createSelectedGoalSnapshot() {
  const snapshot = createAiAssistantTestSnapshot();
  return {
    ...snapshot,
    selectionIds: ['goal-1'],
    focusId: 'goal-1',
    summary: {
      ...snapshot.summary,
      selectedCount: 1,
    },
    elements: snapshot.elements.map((element) => ({
      ...element,
      selected: element.id === 'goal-1',
      focused: element.id === 'goal-1',
    })),
  };
}

describe('AiAssistantActionPlan', () => {
  it('builds a batch strategic action plan from a selected-goal scenario', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'strategic_plan',
      prompt: 'декомпозуй поточну ціль у підцілі',
      snapshot: createSelectedGoalSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
    });

    const plan = buildAiAssistantActionPlanFromScenario(scenario);

    expect(isAiAssistantActionPlan(plan)).toBe(true);
    expect(plan?.confirmationMode).toBe('batch');
    expect(plan?.allowedRuntimeActionKinds).toEqual([
      'create_goals',
      'create_goal_blueprint',
    ]);
    expect(plan?.allowedStructuredReplyKinds).toEqual([
      'create_goals',
      'create_goal_blueprint',
    ]);
  });

  it('builds a generic follow-up plan for intent-only requests', () => {
    const plan = buildAiAssistantActionPlanFromIntent('general_question');

    expect(plan?.scenarioId).toBe('general_question.default');
    expect(plan?.confirmationMode).toBe('follow-up');
    expect(plan?.requiresFollowUp).toBe(true);
    expect(plan?.batchable).toBe(false);
  });

  it('expands breakdown goals into compatible single and batch reply forms', () => {
    const scenario = buildAiAssistantScenarioDescriptor({
      intent: 'breakdown',
      prompt: 'розбий на задачі',
      snapshot: createAiAssistantTestSnapshot(),
      memory: createAiAssistantTestMemory(),
      toolResults: [],
      intentContext: {
        breakdownMode: 'story_tasks',
      },
    });

    const plan = buildAiAssistantActionPlanFromScenario(scenario);

    expect(plan?.allowedStructuredReplyKinds).toEqual([
      'create_task',
      'create_batch_tasks',
    ]);
    expect(plan?.allowedRuntimeActionKinds).toEqual(['create_task']);
  });
});
