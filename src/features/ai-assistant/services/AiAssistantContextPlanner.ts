import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type {
  AiAssistantFocusItem,
  AiAssistantMemoryState,
} from './AiAssistantContextTypes.ts';
import type {
  AiAssistantBreakdownMode,
  AiAssistantIntentContext,
  AiAssistantStrategicPlanMode,
} from './AiAssistantIntentContext.ts';
import { compileAiAssistantEvidencePacket } from './AiAssistantEvidenceCompiler.ts';
import { getAiAssistantScenarioDefinition } from './AiAssistantScenarioRegistry.ts';
import {
  buildAiAssistantScenarioTarget,
  type AiAssistantScenarioConfirmationMode,
  type AiAssistantScenarioDescriptor,
  type AiAssistantScenarioKind,
  type AiAssistantScenarioTargetScope,
} from './AiAssistantScenarioTypes.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import {
  getFocusBundle,
  getSelectionCluster,
} from './AiAssistantSnapshotLens.ts';

export type AiAssistantScenarioItemSummary = {
  id: string;
  kind: AiAssistantCanvasElement['kind'];
  title: string;
  description: string;
  status?: string;
  priority?: string;
};

export type AiAssistantScenarioConfidence = number;

export type {
  AiAssistantScenarioConfirmationMode,
  AiAssistantScenarioDescriptor,
  AiAssistantScenarioKind,
  AiAssistantScenarioTargetScope,
};

export function buildAiAssistantScenarioDescriptor(params: {
  intent: AiAssistantIntentKind;
  prompt: string;
  snapshot: AiAssistantCanvasSnapshot | null;
  toolResults: AiAssistantToolResult[];
  memory: AiAssistantMemoryState;
  intentContext?: AiAssistantIntentContext;
}): AiAssistantScenarioDescriptor {
  const focus =
    getFocusBundle(params.snapshot) ?? deriveFocusFromSnapshot(params.snapshot);
  const cluster =
    compactAiAssistantCanvasSnapshot(
      getSelectionCluster(params.snapshot) ?? params.snapshot ?? null
    );
  const selectedIds = params.snapshot?.selectionIds.slice() ?? [];
  const target = focus?.item ? toScenarioItemSummary(focus.item) : null;
  const mode = resolveScenarioMode(params.intent, params.intentContext, target);
  const definition = getAiAssistantScenarioDefinition(params.intent, mode);
  const targetScope = resolveScenarioTargetScope(
    params.intent,
    mode,
    target,
    selectedIds
  );
  const evidence = compileAiAssistantEvidencePacket({
    snapshot: params.snapshot,
    toolResults: params.toolResults,
    focus,
    selection: params.snapshot
      ? params.snapshot.elements.filter((element) =>
          selectedIds.includes(element.id)
        )
      : [],
  });

  return {
    id: definition.id,
    kind: definition.intent ?? 'conversation',
    variant: definition.kind,
    intent: definition.intent,
    contextMode: resolveContextMode(params.snapshot, selectedIds),
    targetScope,
    scope: definition.scope,
    mode,
    confidence: resolveScenarioConfidence(params.intentContext, target, selectedIds),
    confirmationMode: definition.confirmationMode,
    missingSlots: resolveScenarioMissingSlots(params.intent, mode, target),
    allowedActions: definition.allowedActions,
    target: buildAiAssistantScenarioTarget({
      canvasId: params.snapshot?.canvasId,
      canvasTitle: params.snapshot?.canvasTitle,
      selectionItems: params.snapshot?.elements.filter((element) =>
        selectedIds.includes(element.id)
      ),
      selectedItem: focus?.item ?? null,
    }),
    focus,
    cluster,
    selectedIds,
    strategicHints: params.intent === 'strategic_plan' ? extractAiAssistantStrategicHints(target) : [],
    evidence,
    intentContext: params.intentContext,
  };
}

export function resolveAiAssistantStrategicPlanMode(
  intentContext: AiAssistantIntentContext | undefined,
  selectedGoal: AiAssistantScenarioItemSummary | null
): AiAssistantStrategicPlanMode {
  const requestedMode = intentContext?.strategicPlanMode;
  if (requestedMode) {
    return requestedMode;
  }
  if (!selectedGoal) {
    return 'canvas_bootstrap';
  }
  return 'goal_subgoals';
}

export function resolveAiAssistantBreakdownMode(
  intentContext: AiAssistantIntentContext | undefined,
  target: AiAssistantScenarioItemSummary | null
): AiAssistantBreakdownMode {
  const requestedMode = intentContext?.breakdownMode;
  if (requestedMode) {
    return requestedMode;
  }
  if (!target) {
    return 'unspecified_goal_decomposition';
  }
  if (target.kind === 'story') {
    return 'story_tasks';
  }
  if (target.kind === 'task') {
    return 'task_refine';
  }
  if (target.kind === 'goal') {
    return 'goal_stories';
  }
  return 'unspecified_goal_decomposition';
}

export function extractAiAssistantStrategicHints(
  selectedGoal: AiAssistantScenarioItemSummary | null
): string[] {
  if (!selectedGoal) {
    return [];
  }

  const source = selectedGoal.description.trim();
  if (source.length === 0) {
    return [];
  }

  return splitTextIntoFragments(source)
    .filter((part) => part.length >= 4)
    .slice(0, 8);
}

function resolveScenarioMode(
  intent: AiAssistantIntentKind,
  intentContext: AiAssistantIntentContext | undefined,
  target: AiAssistantScenarioItemSummary | null
):
  | AiAssistantStrategicPlanMode
  | AiAssistantBreakdownMode
  | 'dependencies'
  | 'fill_details'
  | 'review_selection'
  | 'missing_details'
  | 'clarify_selection'
  | 'next_steps'
  | 'recent_changes'
  | 'duplicate_review'
  | 'general_question'
  | 'capability_help' {
  if (intent === 'strategic_plan') {
    return resolveAiAssistantStrategicPlanMode(intentContext, target);
  }
  if (intent === 'breakdown') {
    return resolveAiAssistantBreakdownMode(intentContext, target);
  }
  if (intent === 'dependencies') {
    return 'dependencies';
  }
  if (intent === 'fill_details') {
    return 'fill_details';
  }
  if (intent === 'review') {
    return 'review_selection';
  }
  if (intent === 'missing') {
    return 'missing_details';
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

function resolveScenarioTargetScope(
  intent: AiAssistantIntentKind,
  mode:
    | AiAssistantStrategicPlanMode
    | AiAssistantBreakdownMode
    | 'dependencies'
    | 'fill_details'
    | 'review_selection'
    | 'missing_details'
    | 'clarify_selection'
    | 'next_steps'
    | 'recent_changes'
    | 'duplicate_review'
    | 'general_question'
    | 'capability_help',
  target: AiAssistantScenarioItemSummary | null,
  selectedIds: string[]
): AiAssistantScenarioTargetScope {
  if (intent === 'strategic_plan') {
    return resolveStrategicTargetScope(mode as AiAssistantStrategicPlanMode, target, selectedIds);
  }
  if (intent === 'breakdown') {
    return resolveBreakdownTargetScope(mode as AiAssistantBreakdownMode, target, selectedIds);
  }
  if (intent === 'dependencies' || intent === 'fill_details') {
    return selectedIds.length > 1
      ? 'selection'
      : target?.kind === 'goal'
        ? 'selected_goal'
        : target?.kind === 'story'
          ? 'selected_story'
          : target?.kind === 'task'
            ? 'selected_task'
            : 'selection';
  }
  if (intent === 'review' || intent === 'missing' || intent === 'clarify') {
    return selectedIds.length > 0 ? 'selection' : 'conversation';
  }
  if (intent === 'next_steps' || intent === 'recent_changes' || intent === 'duplicates') {
    return 'canvas';
  }
  if (intent === 'capability_help' || intent === 'general_question') {
    return 'conversation';
  }
  return target ? 'selection' : 'conversation';
}

function resolveScenarioMissingSlots(
  intent: AiAssistantIntentKind,
  mode:
    | AiAssistantStrategicPlanMode
    | AiAssistantBreakdownMode
    | 'dependencies'
    | 'fill_details'
    | 'review_selection'
    | 'missing_details'
    | 'clarify_selection'
    | 'next_steps'
    | 'recent_changes'
    | 'duplicate_review'
    | 'general_question'
    | 'capability_help',
  target: AiAssistantScenarioItemSummary | null
): string[] {
  if (intent === 'strategic_plan') {
    return mode === 'goal_replan' && !target ? ['selected_goal'] : [];
  }
  if (intent === 'breakdown') {
    return mode === 'unspecified_goal_decomposition' ? ['decomposition_level'] : [];
  }
  if (intent === 'dependencies' || intent === 'fill_details') {
    return target ? [] : ['selection'];
  }
  return [];
}

function resolveScenarioConfidence(
  intentContext: AiAssistantIntentContext | undefined,
  target: AiAssistantScenarioItemSummary | null,
  selectedIds: string[]
): number {
  if (intentContext) {
    return 0.9;
  }
  if (target || selectedIds.length > 0) {
    return 0.75;
  }
  return 0.4;
}

function resolveContextMode(
  snapshot: AiAssistantCanvasSnapshot | null,
  selectedIds: string[]
): AiAssistantContextMode {
  if (!snapshot) {
    return 'none';
  }
  if (selectedIds.length > 0) {
    return 'selection';
  }
  if ((snapshot.viewport?.visibleElementIds ?? []).length > 0) {
    return 'viewport';
  }
  return 'canvas';
}

function resolveStrategicTargetScope(
  mode: AiAssistantStrategicPlanMode,
  target: AiAssistantScenarioItemSummary | null,
  selectedIds: string[]
): AiAssistantScenarioTargetScope {
  if (mode === 'canvas_bootstrap') {
    return 'canvas';
  }
  if (selectedIds.length > 1) {
    return 'selection';
  }
  if (target?.kind === 'goal') {
    return 'selected_goal';
  }
  return target?.kind === 'story'
    ? 'selected_story'
    : target?.kind === 'task'
      ? 'selected_task'
      : 'selection';
}

function resolveBreakdownTargetScope(
  mode: AiAssistantBreakdownMode,
  target: AiAssistantScenarioItemSummary | null,
  selectedIds: string[]
): AiAssistantScenarioTargetScope {
  if (mode === 'unspecified_goal_decomposition') {
    return target ? 'selection' : 'none';
  }
  if (selectedIds.length > 1) {
    return 'selection';
  }
  if (target?.kind === 'goal') {
    return 'selected_goal';
  }
  if (target?.kind === 'story') {
    return 'selected_story';
  }
  if (target?.kind === 'task') {
    return 'selected_task';
  }
  return 'selection';
}

function toScenarioItemSummary(
  element: AiAssistantCanvasElement
): AiAssistantScenarioItemSummary {
  return {
    id: element.id,
    kind: element.kind,
    title: element.title,
    description: element.description,
    status: typeof element.status === 'string' ? element.status : undefined,
    priority: typeof element.priority === 'string' ? element.priority : undefined,
  };
}

function compactAiAssistantCanvasSnapshot(
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantCanvasSnapshot | null {
  if (!snapshot) {
    return null;
  }

  const compact = { ...snapshot };
  delete compact.viewport;
  delete compact.recentActivity;

  return {
    ...compact,
  };
}

function deriveFocusFromSnapshot(
  snapshot: AiAssistantCanvasSnapshot | null
): AiAssistantFocusItem | null {
  if (!snapshot || !snapshot.focusId) {
    return null;
  }

  const item = snapshot.elements.find((element) => element.id === snapshot.focusId);
  if (!item) {
    return null;
  }

  const parent = item.parentId
    ? snapshot.elements.find((element) => element.id === item.parentId) ?? null
    : null;
  const children = snapshot.elements.filter((element) =>
    item.childIds.includes(element.id)
  );
  const siblings = parent
    ? snapshot.elements.filter(
        (element) => element.parentId === parent.id && element.id !== item.id
      )
    : [];

  return {
    item,
    parent,
    children,
    siblings,
    related: [],
  };
}

function splitTextIntoFragments(text: string): string[] {
  const fragments: string[] = [];
  let current = '';

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed.length > 0) {
      fragments.push(trimmed);
    }
    current = '';
  };

  for (const char of text) {
    if (
      char === ',' ||
      char === ';' ||
      char === ':' ||
      char === '.' ||
      char === '\n'
    ) {
      flush();
      continue;
    }
    current += char;
  }

  flush();
  return fragments;
}
