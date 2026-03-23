import { describe, expect, it, vi } from 'vitest';
import type { AiAssistantApiClient } from './AiAssistantApiClient.ts';
import { AiAssistantService } from './AiAssistantService.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';

describe('AiAssistantService', () => {
  it('passes scenario metadata through to the orchestrator', async () => {
    const scenario: AiAssistantScenarioDescriptor = {
      id: 'strategic_plan.goal_subgoals',
      kind: 'typed',
      intent: 'strategic_plan',
      mode: 'goal_subgoals',
      scope: 'item',
      target: {
        kind: 'item',
        itemId: 'goal-1',
        itemKind: 'goal',
        itemTitle: 'Marketing strategy',
      },
      confidence: 0.9,
      missingSlots: [],
      allowedActions: ['create_goals'],
      confirmationMode: 'batch',
    };

    const orchestrator = {
      reply: vi.fn(() => Promise.resolve({
        replyMarkdown: 'ok',
        actions: [],
        reviewFindings: undefined,
        plan: {
          profile: 'strategic-plan',
          contextMode: 'canvas',
          calls: [],
        },
        toolResults: [],
      })),
    };

    const service = new AiAssistantService({
      apiClient: {
        isConfigured: () => true,
      } as AiAssistantApiClient,
      orchestrator: orchestrator as never,
    });

    await service.reply({
      prompt: 'Generate a plan',
      source: 'intent',
      intent: 'strategic_plan',
      scenario,
      contextMode: 'canvas',
      memory: {
        currentIntent: null,
        conversationSummary: null,
        agreedFacts: [],
        workingSet: [],
        lastRecommendations: [],
        activeScenario: null,
        confirmedFacts: [],
        userConstraints: [],
        openFollowUpSlots: [],
        openFollowUpSlotRecords: [],
        awaitingInput: null,
        appliedActions: [],
        updatedAt: null,
      },
      snapshot: null,
      allowActions: false,
    });

    expect(orchestrator.reply).toHaveBeenCalledTimes(1);
    expect(orchestrator.reply.mock.calls[0]?.[0]).toMatchObject({
      scenario: {
        id: 'strategic_plan.goal_subgoals',
        mode: 'goal_subgoals',
      },
    });
  });
});
