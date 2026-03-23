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
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import {
  getFocusBundle,
  getSelectionCluster,
} from './AiAssistantSnapshotLens.ts';
import {
  compileAiAssistantEvidencePacket,
  type AiAssistantEvidencePacket,
} from './AiAssistantEvidenceCompiler.ts';

export type AiAssistantScenarioKind =
  | 'dependencies'
  | 'fill_details'
  | 'strategic_plan'
  | 'breakdown';

export type AiAssistantScenarioTargetScope =
  | 'none'
  | 'canvas'
  | 'selection'
  | 'selected_goal'
  | 'selected_story'
  | 'selected_task';

export type AiAssistantScenarioConfirmationMode =
  | 'batch'
  | 'single'
  | 'follow-up';

export type AiAssistantScenarioConfidence = 'high' | 'medium' | 'low';

export type AiAssistantScenarioItemSummary = {
  id: string;
  kind: AiAssistantCanvasElement['kind'];
  title: string;
  description: string;
  status?: string;
  priority?: string;
};

export type AiAssistantScenarioDescriptor = {
  kind: AiAssistantScenarioKind;
  contextMode: AiAssistantContextMode;
  targetScope: AiAssistantScenarioTargetScope;
  mode:
    | AiAssistantStrategicPlanMode
    | AiAssistantBreakdownMode
    | 'dependencies'
    | 'fill_details';
  confidence: AiAssistantScenarioConfidence;
  confirmationMode: AiAssistantScenarioConfirmationMode;
  missingSlots: string[];
  allowedActions: string[];
  target: AiAssistantScenarioItemSummary | null;
  focus: AiAssistantFocusItem | null;
  cluster: AiAssistantCanvasSnapshot | null;
  selectedIds: string[];
  strategicHints: string[];
  evidence: AiAssistantEvidencePacket;
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

  if (params.intent === 'strategic_plan') {
    const mode = resolveAiAssistantStrategicPlanMode(
      params.intentContext,
      target
    );
    return {
      kind: 'strategic_plan',
      contextMode: resolveContextMode(params.snapshot, selectedIds),
      targetScope: resolveStrategicTargetScope(mode, target, selectedIds),
      mode,
      confidence: resolveScenarioConfidence(params.intentContext, target, selectedIds),
      confirmationMode: 'batch',
      missingSlots: mode === 'goal_replan' && !target ? ['selected_goal'] : [],
      allowedActions: ['create_goals', 'create_goal_blueprint'],
      target,
      focus,
      cluster,
      selectedIds,
      strategicHints: extractAiAssistantStrategicHints(target),
      evidence,
    };
  }

  if (params.intent === 'breakdown') {
    const mode = resolveAiAssistantBreakdownMode(params.intentContext, target);
    return {
      kind: 'breakdown',
      contextMode: resolveContextMode(params.snapshot, selectedIds),
      targetScope: resolveBreakdownTargetScope(mode, target, selectedIds),
      mode,
      confidence: resolveScenarioConfidence(params.intentContext, target, selectedIds),
      confirmationMode: mode === 'unspecified_goal_decomposition' ? 'follow-up' : 'batch',
      missingSlots:
        mode === 'unspecified_goal_decomposition' ? ['decomposition_level'] : [],
      allowedActions:
        mode === 'goal_stories'
          ? ['create_batch_stories']
          : mode === 'story_tasks'
            ? ['create_batch_tasks']
            : ['suggest_update'],
      target,
      focus,
      cluster,
      selectedIds,
      strategicHints: [],
      evidence,
    };
  }

  if (params.intent === 'dependencies') {
    return {
      kind: 'dependencies',
      contextMode: resolveContextMode(params.snapshot, selectedIds),
      targetScope: selectedIds.length > 1 ? 'selection' : target?.kind === 'goal' ? 'selected_goal' : 'selection',
      mode: 'dependencies',
      confidence: resolveScenarioConfidence(params.intentContext, target, selectedIds),
      confirmationMode: 'batch',
      missingSlots: [],
      allowedActions: [
        'suggest_relation',
        'suggest_relations',
        'remove_relation',
        'remove_relations',
        'update_relation',
        'update_relations',
      ],
      target,
      focus,
      cluster,
      selectedIds,
      strategicHints: [],
      evidence,
    };
  }

  return {
    kind: 'fill_details',
    contextMode: resolveContextMode(params.snapshot, selectedIds),
    targetScope: target ? 'selected_goal' : 'selection',
    mode: 'fill_details',
    confidence: resolveScenarioConfidence(params.intentContext, target, selectedIds),
    confirmationMode: 'batch',
    missingSlots: [],
    allowedActions: ['suggest_update', 'suggest_updates'],
    target,
    focus,
    cluster,
    selectedIds,
    strategicHints: [],
    evidence,
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

function resolveScenarioConfidence(
  intentContext: AiAssistantIntentContext | undefined,
  target: AiAssistantScenarioItemSummary | null,
  selectedIds: string[]
): AiAssistantScenarioConfidence {
  if (intentContext) {
    return 'high';
  }
  if (target || selectedIds.length > 0) {
    return 'medium';
  }
  return 'low';
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
    if (char === ',' || char === ';' || char === ':' || char === '.' || char === '\n') {
      flush();
      continue;
    }
    current += char;
  }

  flush();
  return fragments;
}
