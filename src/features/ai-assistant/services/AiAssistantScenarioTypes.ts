import type {
  AiAssistantActionKind,
  type AiAssistantCreateActionKind,
} from '../aiAssistantActions.ts';
import type {
  AiAssistantCanvasElement,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type {
  AiAssistantBreakdownMode,
  AiAssistantIntentContext,
  AiAssistantStrategicPlanMode,
} from './AiAssistantIntentContext.ts';

export type AiAssistantScenarioKind = 'typed' | 'fallback';

export type AiAssistantScenarioId =
  | 'strategic_plan.canvas_bootstrap'
  | 'strategic_plan.goal_subgoals'
  | 'strategic_plan.goal_replan'
  | 'breakdown.goal_stories'
  | 'breakdown.story_tasks'
  | 'breakdown.task_refine'
  | 'breakdown.unspecified_goal_decomposition'
  | 'dependencies.default'
  | 'fill_details.default'
  | 'review.default'
  | 'missing.default'
  | 'clarify.default'
  | 'next_steps.default'
  | 'recent_changes.default'
  | 'duplicates.default'
  | 'general_question.default'
  | 'capability_help.default'
  | 'conversation.default';

export type AiAssistantScenarioMode =
  | AiAssistantStrategicPlanMode
  | AiAssistantBreakdownMode
  | 'review_selection'
  | 'missing_details'
  | 'clarify_selection'
  | 'next_steps'
  | 'recent_changes'
  | 'duplicate_review'
  | 'general_question'
  | 'capability_help'
  | 'default'
  | 'conversation';

export type AiAssistantScenarioScope =
  | 'canvas'
  | 'selection'
  | 'item'
  | 'conversation';

export type AiAssistantScenarioTarget =
  | {
      kind: 'canvas';
      canvasId?: string;
      canvasTitle?: string;
    }
  | {
      kind: 'selection';
      itemIds: string[];
      itemKinds: AiAssistantCanvasElement['kind'][];
    }
  | {
      kind: 'item';
      itemId: string;
      itemKind: AiAssistantCanvasElement['kind'];
      itemTitle: string;
    }
  | {
      kind: 'conversation';
    };

export type AiAssistantScenarioConfirmationMode =
  | 'none'
  | 'single'
  | 'batch';

export type AiAssistantScenarioDescriptor = {
  id: AiAssistantScenarioId;
  kind: AiAssistantScenarioKind;
  intent: AiAssistantIntentKind | null;
  mode: AiAssistantScenarioMode;
  scope: AiAssistantScenarioScope;
  target: AiAssistantScenarioTarget;
  confidence: number;
  missingSlots: string[];
  allowedActions: AiAssistantActionKind[];
  confirmationMode: AiAssistantScenarioConfirmationMode;
  intentContext?: AiAssistantIntentContext;
};

export type AiAssistantScenarioDefinition = {
  id: AiAssistantScenarioId;
  kind: AiAssistantScenarioKind;
  intent: AiAssistantIntentKind | null;
  mode: AiAssistantScenarioMode;
  scope: AiAssistantScenarioScope;
  allowedActions: AiAssistantActionKind[];
  confirmationMode: AiAssistantScenarioConfirmationMode;
};

export type AiAssistantScenarioTargetInput = {
  canvasId?: string;
  canvasTitle?: string;
  selectionItems?: AiAssistantCanvasElement[];
  selectedItem?: AiAssistantCanvasElement | null;
};

export type AiAssistantScenarioResolutionInput = {
  source: 'manual' | 'intent';
  intent?: AiAssistantIntentKind;
  intentContext?: AiAssistantIntentContext;
  prompt?: string;
  target?: AiAssistantScenarioTargetInput;
  fallbackIntent?: AiAssistantIntentKind;
  fallbackIntentContext?: AiAssistantIntentContext;
  fallbackTarget?: AiAssistantScenarioTargetInput;
};

export function buildAiAssistantScenarioTarget(
  input: AiAssistantScenarioTargetInput | undefined
): AiAssistantScenarioTarget {
  const selectionItems = input?.selectionItems ?? [];
  if (selectionItems.length > 1) {
    return {
      kind: 'selection',
      itemIds: selectionItems.map((item) => item.id),
      itemKinds: selectionItems.map((item) => item.kind),
    };
  }
  if (selectionItems.length === 1) {
    const item = selectionItems[0];
    if (item) {
      return {
        kind: 'item',
        itemId: item.id,
        itemKind: item.kind,
        itemTitle: item.title,
      };
    }
  }
  const selectedItem = input?.selectedItem;
  if (selectedItem) {
    return {
      kind: 'item',
      itemId: selectedItem.id,
      itemKind: selectedItem.kind,
      itemTitle: selectedItem.title,
    };
  }
  if (input?.canvasId || input?.canvasTitle) {
    return {
      kind: 'canvas',
      canvasId: input.canvasId,
      canvasTitle: input.canvasTitle,
    };
  }
  return {
    kind: 'conversation',
  };
}

export function buildAiAssistantConversationScenario(
  intent: AiAssistantIntentKind | null = null
): AiAssistantScenarioDescriptor {
  return {
    id: 'conversation.default',
    kind: 'fallback',
    intent,
    mode: 'conversation',
    scope: 'conversation',
    target: { kind: 'conversation' },
    confidence: 0.2,
    missingSlots: [],
    allowedActions: [],
    confirmationMode: 'none',
  };
}

export function isAiAssistantTypedScenario(
  scenario: AiAssistantScenarioDescriptor
): boolean {
  return scenario.kind === 'typed';
}

export function getAiAssistantScenarioPrimaryActionKinds(
  scenario: AiAssistantScenarioDescriptor
): AiAssistantCreateActionKind[] | AiAssistantActionKind[] {
  return scenario.allowedActions;
}
