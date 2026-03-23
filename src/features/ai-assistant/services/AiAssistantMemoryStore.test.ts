import { describe, expect, it } from 'vitest';
import type { AiAssistantAction } from '../aiAssistantActions.ts';
import { AiAssistantMemoryStore } from './AiAssistantMemoryStore.ts';
import { createAiAssistantTestSnapshot } from './AiAssistantTestUtils.ts';

describe('AiAssistantMemoryStore', () => {
  it('tracks confirmed facts, user constraints, awaiting input, and applied actions', () => {
    const store = new AiAssistantMemoryStore();
    const snapshot = createAiAssistantTestSnapshot({
      canvasTitle: 'Marketing strategy',
    });

    const userState = store.recordUserInput({
      conversationKey: 'canvas:test',
      prompt: 'Build a strategic plan for marketing automation.',
      snapshot,
      intent: 'strategic_plan',
      intentContext: {
        strategicPlanMode: 'goal_subgoals',
      },
    });

    expect(userState.currentIntent).toContain('strategic_plan');
    expect(userState.userConstraints.map((entry) => entry.text)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Build a strategic plan for marketing automation.'),
        expect.stringContaining('strategicPlanMode=goal_subgoals'),
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
    });

    expect(replyState.awaitingInput).toMatchObject({
      prompt: 'Build a strategic plan for marketing automation.',
      replyPreview: 'Which subgoal should I expand first?',
    });
    expect(replyState.openFollowUpSlots).toEqual([
      'Which subgoal should I expand first?',
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
    });

    expect(actionState.appliedActions).toHaveLength(1);
    expect(actionState.appliedActions[0]).toMatchObject({
      actionKind: 'create_goal',
      sourceMessageId: 'message-1',
      createdElementIds: ['goal-1'],
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
