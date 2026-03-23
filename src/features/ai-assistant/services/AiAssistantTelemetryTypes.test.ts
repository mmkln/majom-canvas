import { describe, expect, it } from 'vitest';
import {
  buildAiAssistantTelemetryScenarioContext,
  describeAiAssistantTelemetryScenarioContext,
} from './AiAssistantTelemetryTypes.ts';

describe('AiAssistantTelemetryTypes', () => {
  it('builds a scenario telemetry context with fallback copy for awaiting input', () => {
    const scenarioContext = buildAiAssistantTelemetryScenarioContext({
      awaitingUserInput: true,
    });

    expect(scenarioContext).toEqual({
      scenarioId: undefined,
      scenarioMode: undefined,
      scenarioKind: undefined,
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      fallbackReason: undefined,
    });
  });

  it('describes scenario telemetry context with shared field ordering', () => {
    const description = describeAiAssistantTelemetryScenarioContext({
      scenarioId: 'strategic_plan.goal_subgoals',
      scenarioMode: 'goal_subgoals',
      scenarioKind: 'typed',
      routeLength: 'long',
      proposalStyle: 'clarify-first',
      fallbackReason: 'scenario_clarification',
    });

    expect(description).toBe(
      'Scenario context: scenarioId=strategic_plan.goal_subgoals, scenarioMode=goal_subgoals, scenarioKind=typed, routeLength=long, proposalStyle=clarify-first, fallbackReason=scenario_clarification'
    );
  });
});
