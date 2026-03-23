import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantEvidencePacket } from './AiAssistantEvidenceCompiler.ts';
import type { AiAssistantFocusItem } from './AiAssistantContextTypes.ts';
import type {
  AiAssistantBreakdownMode,
  AiAssistantIntentContext,
  AiAssistantStrategicPlanMode,
} from './AiAssistantIntentContext.ts';
import type { AiAssistantStructuredActionEntryKind } from './AiAssistantStructuredTransport.ts';

export type AiAssistantScenarioVariant = 'typed' | 'fallback';

export type AiAssistantScenarioKind =
  | AiAssistantIntentKind
  | 'conversation';

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

export type AiAssistantScenarioTargetScope =
  | 'none'
  | 'canvas'
  | 'selection'
  | 'selected_goal'
  | 'selected_story'
  | 'selected_task';

export type AiAssistantScenarioTarget = {
  id: string;
  kind: AiAssistantCanvasElement['kind'];
  title: string;
  description: string;
  status?: string;
  priority?: string;
} | null;

export type AiAssistantScenarioConfirmationMode =
  | 'none'
  | 'single'
  | 'batch';

export type AiAssistantScenarioDescriptor = {
  id: AiAssistantScenarioId;
  kind: AiAssistantScenarioKind;
  variant: AiAssistantScenarioVariant;
  intent: AiAssistantIntentKind | null;
  contextMode?: AiAssistantContextMode;
  mode: AiAssistantScenarioMode;
  scope: AiAssistantScenarioScope;
  target: AiAssistantScenarioTarget;
  confidence: number;
  missingSlots: string[];
  allowedActions: AiAssistantStructuredActionEntryKind[];
  confirmationMode: AiAssistantScenarioConfirmationMode;
  targetScope?: AiAssistantScenarioTargetScope;
  focus?: AiAssistantFocusItem | null;
  cluster?: AiAssistantCanvasSnapshot | null;
  selectedIds?: string[];
  strategicHints?: string[];
  evidence?: AiAssistantEvidencePacket;
  intentContext?: AiAssistantIntentContext;
};

export type AiAssistantScenarioDefinition = {
  id: AiAssistantScenarioId;
  kind: AiAssistantScenarioVariant;
  intent: AiAssistantIntentKind | null;
  mode: AiAssistantScenarioMode;
  scope: AiAssistantScenarioScope;
  allowedActions: AiAssistantStructuredActionEntryKind[];
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
  contextMode?: AiAssistantContextMode;
  prompt?: string;
  target?: AiAssistantScenarioTargetInput;
  fallbackIntent?: AiAssistantIntentKind;
  fallbackIntentContext?: AiAssistantIntentContext;
  fallbackTarget?: AiAssistantScenarioTargetInput;
};

export type AiAssistantScenarioClassification = {
  intent: AiAssistantIntentKind | null;
  strategicPlanMode?: AiAssistantStrategicPlanMode;
  breakdownMode?: AiAssistantBreakdownMode;
  confidence: number;
  intentContext?: AiAssistantIntentContext;
};

export type AiAssistantScenarioClassifierTarget = {
  canvasTitle: string | null;
  selectionCount: number;
  focus: {
    id: string;
    kind: AiAssistantCanvasElement['kind'];
    title: string;
  } | null;
  selection: Array<{
    id: string;
    kind: AiAssistantCanvasElement['kind'];
    title: string;
  }>;
  summary?: AiAssistantCanvasSnapshot['summary'];
};

export function buildAiAssistantScenarioTarget(
  input: AiAssistantScenarioTargetInput | undefined
): AiAssistantScenarioTarget {
  const selectionItems = input?.selectionItems ?? [];
  if (selectionItems.length > 1) {
    const item = selectionItems[0];
    if (!item) {
      return null;
    }
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      status: typeof item.status === 'string' ? item.status : undefined,
      priority: typeof item.priority === 'string' ? item.priority : undefined,
    };
  }
  if (selectionItems.length === 1) {
    const item = selectionItems[0];
    if (item) {
      return {
        id: item.id,
        kind: item.kind,
        title: item.title,
        description: item.description,
        status: typeof item.status === 'string' ? item.status : undefined,
        priority: typeof item.priority === 'string' ? item.priority : undefined,
      };
    }
  }
  const selectedItem = input?.selectedItem;
  if (selectedItem) {
    return {
      id: selectedItem.id,
      kind: selectedItem.kind,
      title: selectedItem.title,
      description: selectedItem.description,
      status: typeof selectedItem.status === 'string' ? selectedItem.status : undefined,
      priority:
        typeof selectedItem.priority === 'string'
          ? selectedItem.priority
          : undefined,
    };
  }
  return null;
}

export function buildAiAssistantConversationScenario(
  intent: AiAssistantIntentKind | null = null
): AiAssistantScenarioDescriptor {
  return {
    id: 'conversation.default',
    kind: 'conversation',
    variant: 'fallback',
    intent,
    mode: 'conversation',
    scope: 'conversation',
    target: null,
    confidence: 0.2,
    missingSlots: [],
    allowedActions: [],
    confirmationMode: 'none',
  };
}

export function isAiAssistantTypedScenario(
  scenario: AiAssistantScenarioDescriptor
): boolean {
  return scenario.variant === 'typed';
}

export function getAiAssistantScenarioPrimaryActionKinds(
  scenario: AiAssistantScenarioDescriptor
): AiAssistantStructuredActionEntryKind[] {
  return scenario.allowedActions;
}
