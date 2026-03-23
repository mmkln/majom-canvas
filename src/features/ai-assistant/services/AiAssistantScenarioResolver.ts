import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import { getAiAssistantSelectedItems } from './AiAssistantContent.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import type { AiAssistantPreparedSubmission } from './AiAssistantPreparedSubmission.ts';
import {
  buildAiAssistantConversationScenario,
  buildAiAssistantScenarioTarget,
  type AiAssistantScenarioDescriptor,
  type AiAssistantScenarioResolutionInput,
  type AiAssistantScenarioTargetInput,
} from './AiAssistantScenarioTypes.ts';
import { getAiAssistantScenarioDefinition } from './AiAssistantScenarioRegistry.ts';

export function resolveAiAssistantScenarioFromSubmission(
  submission: Pick<
    AiAssistantPreparedSubmission,
    'intent' | 'intentContext' | 'source' | 'scenario'
  > & {
    snapshot: AiAssistantCanvasSnapshot | null;
    contextMode: AiAssistantContextMode;
  }
): AiAssistantScenarioDescriptor {
  if (submission.scenario) {
    return submission.scenario;
  }

  return resolveAiAssistantScenario({
    source: submission.source ?? 'manual',
    intent: submission.intent,
    intentContext: submission.intentContext,
    target: buildTargetInput(submission.snapshot),
    fallbackTarget: buildTargetInput(submission.snapshot),
  });
}

export function resolveAiAssistantScenarioFromPrompt(
  input: AiAssistantScenarioResolutionInput & {
    snapshot: AiAssistantCanvasSnapshot | null;
    contextMode: AiAssistantContextMode;
  }
): AiAssistantScenarioDescriptor {
  return resolveAiAssistantScenario({
    ...input,
    target: buildTargetInput(input.snapshot),
    fallbackTarget: buildTargetInput(input.snapshot),
  });
}

export function resolveAiAssistantScenario(
  input: AiAssistantScenarioResolutionInput
): AiAssistantScenarioDescriptor {
  const effectiveIntent =
    input.intent ?? (input.source === 'manual' ? input.fallbackIntent : undefined);
  const effectiveIntentContext =
    input.intentContext ??
    (input.source === 'manual' ? input.fallbackIntentContext : undefined);
  const targetInput =
    input.target ?? (input.source === 'manual' ? input.fallbackTarget : undefined);

  if (!effectiveIntent) {
    return buildAiAssistantConversationScenario();
  }

  const mode = resolveAiAssistantScenarioMode(
    effectiveIntent,
    effectiveIntentContext,
    targetInput
  );
  const definition = getAiAssistantScenarioDefinition(effectiveIntent, mode);
  const target = buildAiAssistantScenarioTarget(targetInput);
  const confidence = input.source === 'intent' ? 1 : 0.85;

  return {
    ...definition,
    target,
    confidence,
    missingSlots: resolveAiAssistantScenarioMissingSlots(
      definition.intent,
      target,
      mode
    ),
    intentContext: effectiveIntentContext,
  };
}

function resolveAiAssistantScenarioMode(
  intent: AiAssistantIntentKind,
  intentContext: AiAssistantIntentContext | undefined,
  targetInput: AiAssistantScenarioTargetInput | undefined
): string {
  const selectedItems = targetInput?.selectionItems ?? [];
  const selectedItem = targetInput?.selectedItem ?? selectedItems[0] ?? null;

  if (intent === 'strategic_plan') {
    if (intentContext?.strategicPlanMode) {
      return intentContext.strategicPlanMode;
    }
    if (selectedItem?.kind === 'goal') {
      return selectedItems.length > 1 ? 'goal_subgoals' : 'goal_subgoals';
    }
    return 'canvas_bootstrap';
  }

  if (intent === 'breakdown') {
    if (intentContext?.breakdownMode) {
      return intentContext.breakdownMode;
    }
    if (selectedItem?.kind === 'goal') {
      return 'goal_stories';
    }
    if (selectedItem?.kind === 'story') {
      return 'story_tasks';
    }
    if (selectedItem?.kind === 'task') {
      return 'task_refine';
    }
    return 'unspecified_goal_decomposition';
  }

  if (intent === 'review') {
    return 'review_selection';
  }
  if (intent === 'missing') {
    return 'missing_details';
  }
  if (intent === 'dependencies' || intent === 'fill_details') {
    return 'default';
  }
  if (intent === 'clarify') {
    return 'clarify_selection';
  }
  if (intent === 'next_steps') {
    return 'next_steps';
  }
  if (intent === 'recent_changes') {
    return 'recent_changes';
  }
  if (intent === 'duplicates') {
    return 'duplicate_review';
  }
  if (intent === 'capability_help') {
    return 'capability_help';
  }

  return 'general_question';
}

function resolveAiAssistantScenarioMissingSlots(
  intent: AiAssistantIntentKind | null,
  target:
    | ReturnType<typeof buildAiAssistantScenarioTarget>
    | { kind: 'conversation' },
  mode: string
): string[] {
  if (!intent) {
    return [];
  }
  if (target.kind === 'conversation') {
    if (intent === 'strategic_plan' && mode === 'goal_subgoals') {
      return ['target'];
    }
    if (intent === 'breakdown') {
      return ['target'];
    }
  }
  return [];
}

function buildTargetInput(
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantScenarioTargetInput | undefined {
  if (!snapshot) {
    return undefined;
  }
  const selectedItems = getAiAssistantSelectedItems(snapshot);
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;
  return {
    canvasId: snapshot.canvasId,
    canvasTitle: snapshot.canvasTitle,
    selectionItems: selectedItems,
    selectedItem,
  };
}
