import { describe, expect, it, vi } from 'vitest';
import {
  buildAiAssistantRouterRepairMessages,
  buildAiAssistantStructuredReplyRepairMessages,
  completeAiAssistantTextWithRepair,
  tryParseAiAssistantJsonCandidate,
} from './AiAssistantRepair.ts';

describe('AiAssistantRepair', () => {
  it('repairs one invalid response into valid JSON', async () => {
    const client = {
      completeText: vi
        .fn()
        .mockResolvedValueOnce('not json at all')
        .mockResolvedValueOnce('{"kind":"finalize"}'),
    };

    const result = await completeAiAssistantTextWithRepair({
      client,
      messages: [{ role: 'user', content: 'Return JSON' }],
      validate: (content) => {
        const parsed = tryParseAiAssistantJsonCandidate<{ kind?: string }>(content);
        if (!parsed || parsed.kind !== 'finalize') {
          throw new Error('Invalid finalize payload.');
        }
        return parsed.kind;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildAiAssistantRouterRepairMessages({
          invalidResponse,
          validationError,
        }),
      maxRepairAttempts: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('finalize');
      expect(result.repairAttempts).toBe(1);
    }
    expect(client.completeText).toHaveBeenCalledTimes(2);
  });

  it('returns the last invalid response after repair attempts are exhausted', async () => {
    const client = {
      completeText: vi
        .fn()
        .mockResolvedValueOnce('bad 1')
        .mockResolvedValueOnce('bad 2'),
    };

    const result = await completeAiAssistantTextWithRepair({
      client,
      messages: [{ role: 'user', content: 'Return JSON' }],
      validate: (content) => {
        const parsed = tryParseAiAssistantJsonCandidate(content);
        if (!parsed) {
          throw new Error('Still invalid JSON.');
        }
        return parsed;
      },
      buildRepairMessages: ({ invalidResponse, validationError }) =>
        buildAiAssistantRouterRepairMessages({
          invalidResponse,
          validationError,
        }),
      maxRepairAttempts: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rawContent).toBe('bad 2');
      expect(result.error.message).toBe('Still invalid JSON.');
      expect(result.repairAttempts).toBe(1);
    }
  });

  it('includes scenario context in repair prompts when available', () => {
    const routerMessages = buildAiAssistantRouterRepairMessages({
      invalidResponse: '{"kind":"finalize"}',
      validationError: 'Invalid decision.',
      scenario: {
        scenarioId: 'strategic_plan.goal_subgoals',
        scenarioMode: 'goal_subgoals',
        scenarioKind: 'typed',
        routeLength: 'long',
        proposalStyle: 'clarify-first',
        fallbackReason: 'scenario_clarification',
      },
    });
    expect(routerMessages[0]?.content).toContain('Scenario context:');
    expect(routerMessages[0]?.content).toContain(
      'scenarioId=strategic_plan.goal_subgoals'
    );
    expect(routerMessages[0]?.content).toContain('fallbackReason=scenario_clarification');

    const structuredMessages = buildAiAssistantStructuredReplyRepairMessages({
      invalidResponse: '{"replyMarkdown":"x","actions":[]}',
      validationError: 'Invalid envelope.',
      allowActions: true,
      scenario: {
        scenarioId: 'strategic_plan.goal_subgoals',
        scenarioMode: 'goal_subgoals',
        scenarioKind: 'typed',
        routeLength: 'long',
        proposalStyle: 'clarify-first',
        fallbackReason: 'scenario_clarification',
      },
    });
    expect(structuredMessages[0]?.content).toContain('Scenario context:');
    expect(structuredMessages[0]?.content).toContain(
      'proposalStyle=clarify-first'
    );
    expect(structuredMessages[0]?.content).toContain('fallbackReason=scenario_clarification');
  });
});
