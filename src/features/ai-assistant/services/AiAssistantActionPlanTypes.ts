import type { AiAssistantStructuredActionEntryKind } from './AiAssistantStructuredTransport.ts';
import type { AiAssistantActionKind } from '../aiAssistantActions.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type {
  AiAssistantScenarioConfirmationMode,
  AiAssistantScenarioDescriptor,
} from './AiAssistantScenarioTypes.ts';

export type AiAssistantActionPlan = {
  scenarioId: string;
  scenarioKind: AiAssistantScenarioDescriptor['variant'];
  scenarioMode: AiAssistantScenarioDescriptor['mode'] | 'default' | 'conversation';
  intent: AiAssistantIntentKind | null;
  confirmationMode: AiAssistantScenarioConfirmationMode;
  allowedRuntimeActionKinds: AiAssistantActionKind[];
  allowedStructuredReplyKinds: Array<
    AiAssistantStructuredActionEntryKind | 'reviewFindings'
  >;
  primaryRuntimeActionKind: AiAssistantActionKind | null;
  requiresConfirmation: boolean;
  requiresFollowUp: boolean;
  batchable: boolean;
};

export function isAiAssistantActionPlan(
  value: unknown
): value is AiAssistantActionPlan {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const plan = value as Partial<AiAssistantActionPlan>;
  return (
    typeof plan.scenarioId === 'string' &&
    typeof plan.scenarioKind === 'string' &&
    typeof plan.scenarioMode === 'string' &&
    (plan.intent === null || typeof plan.intent === 'string') &&
    (plan.confirmationMode === 'batch' ||
      plan.confirmationMode === 'single' ||
      plan.confirmationMode === 'follow-up') &&
    Array.isArray(plan.allowedRuntimeActionKinds) &&
    Array.isArray(plan.allowedStructuredReplyKinds) &&
    (plan.primaryRuntimeActionKind === null ||
      typeof plan.primaryRuntimeActionKind === 'string') &&
    typeof plan.requiresConfirmation === 'boolean' &&
    typeof plan.requiresFollowUp === 'boolean' &&
    typeof plan.batchable === 'boolean'
  );
}
