import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
} from '../aiAssistantEvents.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantFocusItem } from './AiAssistantContextTypes.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import { isPlainObject } from './AiAssistantToolTypes.ts';

export type AiAssistantContextScope =
  | 'local'
  | 'neighborhood'
  | 'branch'
  | 'canvas';

export type AiAssistantContextExpansionTarget =
  | {
      kind: 'canvas';
      id?: string;
      title?: string;
    }
  | {
      kind: 'selection';
      id?: string;
      title?: string;
    }
  | {
      kind: 'goal';
      id: string;
      title?: string;
    }
  | {
      kind: 'story';
      id: string;
      title?: string;
    }
  | {
      kind: 'task';
      id: string;
      title?: string;
    };

export type AiAssistantContextExpansionRequest = {
  scope: AiAssistantContextScope;
  target?: AiAssistantContextExpansionTarget;
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  requestedToolNames: Array<
    'get_focus_bundle' | 'get_selection_cluster' | 'get_related_relations' | 'get_recent_activity'
  >;
  maxToolCalls: 0 | 1 | 2;
  rationale: string;
};

export type AiAssistantContextBudget = {
  scope: AiAssistantContextScope;
  maxBullets: number;
  maxEvidenceIds: number;
  includeSourceContext: boolean;
  includeSelectionCluster: boolean;
  includeRecentActivity: boolean;
  includeExpansionRequest: boolean;
};

export function resolveAiAssistantContextBudget(input: {
  intent?: AiAssistantIntentKind;
  contextMode?: AiAssistantContextMode;
  snapshot?: AiAssistantCanvasSnapshot | null;
  focus?: AiAssistantFocusItem | null;
  selection?: AiAssistantCanvasElement[];
  toolResults?: AiAssistantToolResult[];
  scenario?: AiAssistantScenarioDescriptor | null;
}): AiAssistantContextBudget {
  const focus = input.focus ?? null;
  const selection = input.selection ?? [];
  const hasFocusBundle = hasSuccessfulTool(input.toolResults, 'get_focus_bundle');
  const hasSelectionCluster = hasSuccessfulTool(
    input.toolResults,
    'get_selection_cluster'
  );
  const hasRelatedRelations = hasSuccessfulTool(
    input.toolResults,
    'get_related_relations'
  );

  const scope = resolveContextScope({
    intent: input.intent,
    contextMode: input.contextMode,
    snapshot: input.snapshot,
    focus,
    selection,
    hasFocusBundle,
    hasSelectionCluster,
    hasRelatedRelations,
    scenario: input.scenario,
  });

  return {
    scope,
    maxBullets: resolveMaxBullets(scope),
    maxEvidenceIds: resolveMaxEvidenceIds(scope),
    includeSourceContext: scope !== 'local',
    includeSelectionCluster: scope !== 'local',
    includeRecentActivity: scope === 'canvas',
    includeExpansionRequest: true,
  };
}

export function buildAiAssistantContextExpansionRequest(input: {
  budget: AiAssistantContextBudget;
  intent?: AiAssistantIntentKind;
  contextMode?: AiAssistantContextMode;
  snapshot?: AiAssistantCanvasSnapshot | null;
  focus?: AiAssistantFocusItem | null;
  selection?: AiAssistantCanvasElement[];
  scenario?: AiAssistantScenarioDescriptor | null;
}): AiAssistantContextExpansionRequest {
  const focus = input.focus ?? null;
  const selection = input.selection ?? [];
  const target = resolveContextExpansionTarget({
    intent: input.intent,
    snapshot: input.snapshot,
    focus,
    selection,
    scope: input.budget.scope,
    _scenario: input.scenario ?? null,
  });

  return {
    scope: input.budget.scope,
    target,
    scenarioId: input.scenario?.id,
    scenarioMode: input.scenario?.mode,
    scenarioKind: input.scenario?.variant,
    requestedToolNames: resolveRequestedToolNames(input.budget.scope),
    maxToolCalls: resolveMaxToolCalls(input.budget.scope),
    rationale: resolveContextExpansionRationale(input.budget.scope, input.intent, input.scenario),
  };
}

export function describeAiAssistantContextBudget(
  budget: AiAssistantContextBudget
): string {
  const scopeDescription = describeContextScope(budget.scope);
  const expansion = budget.includeExpansionRequest
    ? `, expansion request enabled`
    : '';
  return `${scopeDescription}; maxBullets=${budget.maxBullets}; maxEvidenceIds=${budget.maxEvidenceIds}${expansion}`;
}

export function renderAiAssistantContextExpansionRequest(
  request: AiAssistantContextExpansionRequest
): string {
  return JSON.stringify(request);
}

function resolveContextScope(input: {
  intent?: AiAssistantIntentKind;
  contextMode?: AiAssistantContextMode;
  snapshot?: AiAssistantCanvasSnapshot | null;
  focus: AiAssistantFocusItem | null;
  selection: AiAssistantCanvasElement[];
  hasFocusBundle: boolean;
  hasSelectionCluster: boolean;
  hasRelatedRelations: boolean;
  scenario?: AiAssistantScenarioDescriptor | null;
}): AiAssistantContextScope {
  const scenarioScope = resolveScenarioScope(input.scenario);
  if (scenarioScope) {
    return scenarioScope;
  }

  if (input.intent === 'strategic_plan') {
    if (input.selection.length > 1 || input.hasSelectionCluster) {
      return 'branch';
    }
    if (input.focus?.children.length || input.focus?.related.length) {
      return 'branch';
    }
    return input.focus ? 'neighborhood' : 'canvas';
  }

  if (input.intent === 'breakdown') {
    if (input.selection.length > 1 || input.hasSelectionCluster) {
      return 'branch';
    }
    if (input.focus?.children.length || input.focus?.siblings.length) {
      return 'neighborhood';
    }
    return input.focus ? 'local' : 'canvas';
  }

  if (input.intent === 'dependencies') {
    return 'neighborhood';
  }

  if (input.intent === 'fill_details') {
    return input.focus?.parent || input.focus?.related.length || input.hasRelatedRelations
      ? 'neighborhood'
      : 'local';
  }

  if (input.hasSelectionCluster || input.selection.length > 1) {
    return 'branch';
  }
  if (input.hasFocusBundle && (input.focus?.children.length || input.focus?.related.length)) {
    return 'neighborhood';
  }
  if (input.contextMode === 'selection') {
    return 'local';
  }
  if (input.contextMode === 'canvas') {
    return 'canvas';
  }
  if (input.snapshot?.selectionIds.length || input.focus) {
    return 'neighborhood';
  }
  return 'canvas';
}

function resolveContextExpansionTarget(input: {
  intent?: AiAssistantIntentKind;
  snapshot?: AiAssistantCanvasSnapshot | null;
  focus: AiAssistantFocusItem | null;
  selection: AiAssistantCanvasElement[];
  scope: AiAssistantContextScope;
  _scenario?: AiAssistantScenarioDescriptor | null;
}): AiAssistantContextExpansionTarget | undefined {
  if (input.scope === 'canvas') {
    return input.snapshot?.canvasId
      ? {
          kind: 'canvas',
          id: input.snapshot.canvasId,
          title: input.snapshot.canvasTitle || undefined,
        }
      : { kind: 'canvas' };
  }

  if (input.selection.length > 1) {
    return {
      kind: 'selection',
      id: input.snapshot?.canvasId ?? undefined,
      title: input.snapshot?.canvasTitle || undefined,
    };
  }

  if (input.focus) {
    return {
      kind: input.focus.item.kind,
      id: input.focus.item.id,
      title: input.focus.item.title || undefined,
    };
  }

  return input.snapshot?.canvasId
    ? {
        kind: 'canvas',
        id: input.snapshot.canvasId,
        title: input.snapshot.canvasTitle || undefined,
      }
    : undefined;
}

function resolveScenarioScope(
  scenario: AiAssistantScenarioDescriptor | null | undefined
): AiAssistantContextScope | null {
  if (!scenario || scenario.variant !== 'typed') {
    return null;
  }

  switch (scenario.mode) {
    case 'canvas_bootstrap':
      return 'canvas';
    case 'goal_subgoals':
    case 'goal_stories':
      return 'branch';
    case 'goal_replan':
    case 'story_tasks':
      return 'neighborhood';
    case 'task_refine':
      return 'local';
    case 'unspecified_goal_decomposition':
      return 'local';
    default:
      return null;
  }
}

function resolveRequestedToolNames(
  scope: AiAssistantContextScope
): AiAssistantContextExpansionRequest['requestedToolNames'] {
  switch (scope) {
    case 'local':
      return ['get_focus_bundle'];
    case 'neighborhood':
      return ['get_focus_bundle', 'get_related_relations'];
    case 'branch':
      return ['get_focus_bundle', 'get_selection_cluster'];
    case 'canvas':
    default:
      return ['get_selection_cluster', 'get_recent_activity'];
  }
}

function resolveMaxToolCalls(scope: AiAssistantContextScope): 0 | 1 | 2 {
  switch (scope) {
    case 'local':
      return 1;
    case 'neighborhood':
    case 'branch':
    case 'canvas':
    default:
      return 2;
  }
}

function resolveContextExpansionRationale(
  scope: AiAssistantContextScope,
  intent?: AiAssistantIntentKind,
  scenario?: AiAssistantScenarioDescriptor | null
): string {
  if (scenario && scenario.variant === 'typed') {
    const scenarioLabel = `${scenario.id}${scenario.mode ? ` (${scenario.mode})` : ''}`;
    switch (scope) {
      case 'local':
        return `Surface the immediate scenario context for ${scenarioLabel} with minimal surrounding context.`;
      case 'neighborhood':
        return `Surface the scenario neighborhood for ${scenarioLabel} with parent and child evidence.`;
      case 'branch':
        return `Surface the scenario branch for ${scenarioLabel} with grounded planning evidence.`;
      case 'canvas':
      default:
        return `Use canvas-level scenario context for ${scenarioLabel} without expanding beyond the current workspace view.`;
    }
  }

  const intentLabel = intent ? ` for ${intent}` : '';
  switch (scope) {
    case 'local':
      return `Surface the immediate focus item${intentLabel} with minimal surrounding context.`;
    case 'neighborhood':
      return `Surface the selected item${intentLabel} together with parent/children/related neighborhood context.`;
    case 'branch':
      return `Surface the selected branch${intentLabel} with nearby structural context for grounded planning.`;
    case 'canvas':
    default:
      return `Use canvas-level summary context${intentLabel} without expanding beyond the current workspace view.`;
  }
}

function describeContextScope(scope: AiAssistantContextScope): string {
  switch (scope) {
    case 'local':
      return 'Context scope: local';
    case 'neighborhood':
      return 'Context scope: neighborhood';
    case 'branch':
      return 'Context scope: branch';
    case 'canvas':
    default:
      return 'Context scope: canvas';
  }
}

function resolveMaxBullets(scope: AiAssistantContextScope): number {
  switch (scope) {
    case 'canvas':
      return 5;
    case 'branch':
      return 9;
    case 'neighborhood':
      return 8;
    case 'local':
    default:
      return 6;
  }
}

function resolveMaxEvidenceIds(scope: AiAssistantContextScope): number {
  switch (scope) {
    case 'canvas':
      return 10;
    case 'branch':
      return 12;
    case 'neighborhood':
      return 10;
    case 'local':
    default:
      return 8;
  }
}

function hasSuccessfulTool(
  toolResults: AiAssistantToolResult[] | undefined,
  tool: string
): boolean {
  return Boolean(
    toolResults?.some((result) => result.ok && result.tool === tool && isPlainObject(result.data))
  );
}
