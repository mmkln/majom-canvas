import { describe, expect, it } from 'vitest';
import type {
  AiAssistantAction,
} from '../aiAssistantActions.ts';
import { AiAssistantMemoryStore } from './AiAssistantMemoryStore.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';
import type { AiAssistantActiveScenario } from './AiAssistantContextTypes.ts';

describe('AiAssistantMemoryStore', () => {
  it('tracks confirmed facts, user constraints, awaiting input, and applied actions', () => {
    const store = new AiAssistantMemoryStore();
    const snapshot = createAiAssistantTestSnapshot({
      canvasTitle: 'Marketing strategy',
    });
    const scenario: AiAssistantActiveScenario = {
      id: 'strategic_plan.goal_subgoals',
      kind: 'typed',
      intent: 'strategic_plan',
      mode: 'goal_subgoals',
      scope: 'item',
      confidence: 0.93,
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      targetSummary: 'goal "Marketing strategy"',
      missingSlots: [],
      confirmationMode: 'batch',
      allowedActionCount: 2,
    };

    const userState = store.recordUserInput({
      conversationKey: 'canvas:test',
      prompt: 'Build a strategic plan for marketing automation.',
      snapshot,
      intent: 'strategic_plan',
      scenario,
    });

    expect(userState.currentIntent).toContain('strategic_plan');
    expect(userState.activeScenario?.id).toBe('strategic_plan.goal_subgoals');
    expect(userState.userConstraints.map((entry) => entry.text)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Build a strategic plan for marketing automation.'),
        expect.stringContaining('Scenario context: scenario=strategic_plan.goal_subgoals'),
        expect.stringContaining('routeLength=long'),
        expect.stringContaining('proposalStyle=clarify-first'),
      ])
    );
    expect(userState.confirmedFacts.some((entry) => entry.source === 'snapshot')).toBe(
      true
    );
    expect(
      userState.confirmedFacts.some((entry) =>
        entry.text.includes('Focus: story')
      )
    ).toBe(true);

    const replyState = store.updateAfterReply({
      conversationKey: 'canvas:test',
      prompt: 'Build a strategic plan for marketing automation.',
      reply: 'Which subgoal should I expand first?',
      snapshot,
      awaitingUserInput: true,
      scenario,
    });

    expect(replyState.awaitingInput).toMatchObject({
      prompt: 'Build a strategic plan for marketing automation.',
      replyPreview: 'Which subgoal should I expand first?',
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
      scenarioKind: 'typed',
      routeLength: 'long',
      proposalStyle: 'clarify-first',
    });
    expect(replyState.openFollowUpSlots).toEqual([
      'Which subgoal should I expand first?',
    ]);
    expect(replyState.openFollowUpSlotRecords).toEqual([
      expect.objectContaining({
        text: 'Which subgoal should I expand first?',
        scenarioId: 'strategic_plan.goal_subgoals',
        scenarioMode: 'goal_subgoals',
      }),
    ]);

    const action = {
      id: 'action-1',
      kind: 'create_goal',
      label: 'Create goal',
      title: 'Build marketing sequence',
      status: 'applied',
      createdElementId: 'goal-1',
    } as AiAssistantAction;
    const actionState = store.recordAppliedActions({
      conversationKey: 'canvas:test',
      sourceMessageId: 'message-1',
      actions: [action],
      scenario,
    });

    expect(actionState.appliedActions).toHaveLength(1);
    expect(actionState.appliedActions[0]).toMatchObject({
      actionKind: 'create_goal',
      sourceMessageId: 'message-1',
      createdElementIds: ['goal-1'],
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
    });
    expect(actionState.confirmedFacts.map((entry) => entry.source)).toContain(
      'action'
    );
    expect(actionState.confirmedFacts.map((entry) => entry.text)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Create goal "Build marketing sequence"'),
      ])
    );
  });
});
