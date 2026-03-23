import { describe, expect, it } from 'vitest';
import { createAiAssistantTelemetryCollector } from './AiAssistantTelemetryStore.ts';

describe('AiAssistantTelemetryStore', () => {
  it('stores interaction, repair, and action telemetry events in memory', () => {
    const collector = createAiAssistantTelemetryCollector();

    collector.record({
      kind: 'interaction',
      timestamp: 1,
      context: {
        conversationKey: 'canvas:test',
        requestId: 'request-1',
      },
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
      scenarioKind: 'typed',
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      fallbackReason: 'scenario_clarification',
      routeType: 'intent',
      intent: 'strategic_plan',
      profile: 'strategic-plan',
      contextMode: 'selection',
      commandSpecUsed: true,
      routerHopCount: 2,
      toolExecutionRounds: 1,
      toolCallCount: 3,
      instructionPacketCount: 2,
      repairAttempts: 1,
      invalidEnvelopeCount: 1,
      followupQuestionReturned: false,
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
      },
      outcome: 'reply',
    });
    collector.record({
      kind: 'repair',
      timestamp: 2,
      context: {
        conversationKey: 'canvas:test',
        requestId: 'request-1',
      },
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
      scenarioKind: 'typed',
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      fallbackReason: 'scenario_clarification',
      stage: 'command',
      attempt: 1,
      validationError: 'Invalid command envelope.',
    });
    collector.record({
      kind: 'action_execution',
      timestamp: 3,
      context: {
        conversationKey: 'canvas:test',
        requestId: 'request-1',
      },
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
      scenarioKind: 'typed',
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      fallbackReason: 'scenario_clarification',
      messageId: 'message-1',
      appliedActionCount: 1,
      pendingActionCount: 1,
      actionKinds: ['create_goal'],
    });

    const events = collector.snapshot();
    expect(events[0]?.kind).toBe('interaction');
    if (events[0]?.kind === 'interaction') {
      expect(events[0].scenarioId).toBe('strategic_plan.goal_subgoals');
      expect(events[0].routeLength).toBe('long');
      expect(events[0].proposalStyle).toBe('clarify-first');
      expect(events[0].routeType).toBe('intent');
      expect(events[0].commandSpecUsed).toBe(true);
      expect(events[0].fallbackReason).toBe('scenario_clarification');
      expect(events[0].tokenUsage?.totalTokens).toBe(120);
    }

    expect(events[1]?.kind).toBe('repair');
    if (events[1]?.kind === 'repair') {
      expect(events[1].scenarioId).toBe('strategic_plan.goal_subgoals');
      expect(events[1].scenarioKind).toBe('typed');
      expect(events[1].stage).toBe('command');
      expect(events[1].validationError).toBe('Invalid command envelope.');
    }

    expect(events[2]?.kind).toBe('action_execution');
    if (events[2]?.kind === 'action_execution') {
      expect(events[2].scenarioId).toBe('strategic_plan.goal_subgoals');
      expect(events[2].scenarioKind).toBe('typed');
      expect(events[2].appliedActionCount).toBe(1);
      expect(events[2].actionKinds).toEqual(['create_goal']);
    }

    collector.clear();
    expect(collector.snapshot()).toEqual([]);
  });
});
