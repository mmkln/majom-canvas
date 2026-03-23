import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantActionPlan } from './AiAssistantActionPlanTypes.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import type {
  AiAssistantStructuredActionEntryKind,
  AiAssistantStructuredActionPlanHint,
} from './AiAssistantStructuredTransport.ts';
import {
  resolveAiAssistantActionKindsForIntent,
  resolveAiAssistantActionKindsForScenario,
  resolveAiAssistantStructuredReplyKindsForIntent,
  resolveAiAssistantStructuredReplyKindsForScenario,
} from './AiAssistantActionPolicy.ts';

const STRUCTURED_TO_RUNTIME_KIND: Partial<
  Record<AiAssistantStructuredActionEntryKind, string>
> = {
  create_batch_tasks: 'create_task',
  create_batch_stories: 'create_story',
  suggest_relations: 'suggest_relation',
  remove_relations: 'remove_relation',
  update_relations: 'update_relation',
  suggest_updates: 'suggest_update',
};

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
    requiresFollowUp: scenario.confirmationMode === 'follow-up',
    batchable: scenario.confirmationMode === 'batch',
  };
}

export function buildAiAssistantActionPlanFromIntent(
  intent: AiAssistantIntentKind | undefined
): AiAssistantActionPlan | null {
  if (!intent) {
    return null;
  }

  const allowedStructuredReplyKinds =
    resolveAiAssistantStructuredReplyKindsForIntent(intent) ?? [];
  const allowedRuntimeActionKinds =
    resolveAiAssistantActionKindsForIntent(intent) ?? [];
  const confirmationMode = resolveConfirmationModeForIntent(intent);

  return {
    scenarioId: `${intent}.default`,
    scenarioKind:
      intent === 'review' ||
      intent === 'missing' ||
      intent === 'clarify' ||
      intent === 'next_steps' ||
      intent === 'recent_changes' ||
      intent === 'duplicates' ||
      intent === 'general_question' ||
      intent === 'capability_help'
        ? 'fallback'
        : 'typed',
    scenarioMode: 'default',
    intent,
    confirmationMode,
    allowedRuntimeActionKinds,
    allowedStructuredReplyKinds,
    primaryRuntimeActionKind: allowedRuntimeActionKinds[0] ?? null,
    requiresConfirmation:
      confirmationMode === 'batch' || confirmationMode === 'single',
    requiresFollowUp: confirmationMode === 'follow-up',
    batchable: confirmationMode === 'batch',
  };
}

export function buildAiAssistantActionPlanFromHint(
  hint: AiAssistantStructuredActionPlanHint | null | undefined
): AiAssistantActionPlan | null {
  if (!hint) {
    return null;
  }

  const allowedStructuredReplyKinds =
    hint.allowedStructuredReplyKinds ?? [];
  const allowedRuntimeActionKinds = (
    allowedStructuredReplyKinds
      .map((kind) =>
        kind === 'reviewFindings'
          ? null
          : STRUCTURED_TO_RUNTIME_KIND[kind] ?? kind
      )
      .filter((kind): kind is string => typeof kind === 'string')
  ) as AiAssistantActionPlan['allowedRuntimeActionKinds'];
  const confirmationMode = hint.confirmationMode ?? 'single';

  return {
    scenarioId: hint.scenarioId ?? 'structured-reply.action-plan',
    scenarioKind: 'typed',
    scenarioMode: hint.scenarioMode ?? 'default',
    intent: null,
    confirmationMode,
    allowedRuntimeActionKinds,
    allowedStructuredReplyKinds,
    primaryRuntimeActionKind: allowedRuntimeActionKinds[0] ?? null,
    requiresConfirmation:
      confirmationMode === 'batch' || confirmationMode === 'single',
    requiresFollowUp: confirmationMode === 'follow-up',
    batchable: confirmationMode === 'batch',
  };
}

function resolveConfirmationModeForIntent(
  intent: AiAssistantIntentKind
): AiAssistantActionPlan['confirmationMode'] {
  switch (intent) {
    case 'strategic_plan':
    case 'breakdown':
    case 'dependencies':
    case 'fill_details':
      return 'batch';
    case 'review':
    case 'missing':
    case 'clarify':
      return 'single';
    default:
      return 'follow-up';
  }
}
