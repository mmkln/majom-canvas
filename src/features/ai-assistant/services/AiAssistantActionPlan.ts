import type { AiAssistantActionPlan } from './AiAssistantActionPlanTypes.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import {
  resolveAiAssistantActionKindsForScenario,
  resolveAiAssistantStructuredReplyKindsForScenario,
} from './AiAssistantActionPolicy.ts';

export function buildAiAssistantActionPlanFromScenario(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): AiAssistantActionPlan | null {
  if (!scenario) {
    return null;
  }

  const allowedStructuredReplyKinds =
    resolveAiAssistantStructuredReplyKindsForScenario(scenario) ?? [];
  const allowedRuntimeActionKinds =
    resolveAiAssistantActionKindsForScenario(scenario) ?? [];

  return {
    scenarioId: scenario.id,
    scenarioKind: scenario.variant,
    scenarioMode: scenario.mode,
    intent: scenario.intent,
    confirmationMode: scenario.confirmationMode,
    allowedRuntimeActionKinds,
    allowedStructuredReplyKinds,
    primaryRuntimeActionKind: allowedRuntimeActionKinds[0] ?? null,
    requiresConfirmation:
      scenario.confirmationMode === 'batch' ||
      scenario.confirmationMode === 'single',
    requiresFollowUp: false,
    batchable: scenario.confirmationMode === 'batch',
  };
}
