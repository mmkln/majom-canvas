import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
} from '../aiAssistantEvents.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantFocusItem } from './AiAssistantContextTypes.ts';
import {
  formatAiAssistantCanonicalContext,
  summarizeAiAssistantCanvas,
} from './AiAssistantContent.ts';
import {
  buildAiAssistantContextExpansionRequest,
  describeAiAssistantContextBudget,
  renderAiAssistantContextExpansionRequest,
  resolveAiAssistantContextBudget,
  type AiAssistantContextBudget,
  type AiAssistantContextExpansionRequest,
  type AiAssistantContextScope,
} from './AiAssistantContextShaping.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import { isPlainObject } from './AiAssistantToolTypes.ts';

export type AiAssistantEvidencePacket = {
  summary: string;
  bullets: string[];
  supportedBy: string[];
  evidenceIds: string[];
  scenarioId?: string;
  scenarioMode?: string;
  scenarioKind?: 'typed' | 'fallback';
  sourceContext?: string;
  contextScope?: AiAssistantContextScope;
  contextBudget?: AiAssistantContextBudget;
  contextExpansionRequest?: AiAssistantContextExpansionRequest;
};

export type AiAssistantEvidenceCompilationInput = {
  snapshot: AiAssistantCanvasSnapshot | null;
  toolResults?: AiAssistantToolResult[];
  focus?: AiAssistantFocusItem | null;
  selection?: AiAssistantCanvasElement[];
  intent?: AiAssistantIntentKind;
  scenario?: AiAssistantScenarioDescriptor | null;
  contextMode?: 'none' | 'canvas' | 'viewport' | 'selection';
  contextBudget?: AiAssistantContextBudget;
  contextExpansionRequest?: AiAssistantContextExpansionRequest;
  maxBullets?: number;
};

export function compileAiAssistantEvidencePacket(
  input: AiAssistantEvidenceCompilationInput
): AiAssistantEvidencePacket {
  const snapshot = input.snapshot;
  const focus = input.focus ?? null;
  const selection = input.selection ?? [];
  const toolResults = input.toolResults ?? [];
  const budget =
    input.contextBudget ??
    resolveAiAssistantContextBudget({
      intent: input.intent,
      scenario: input.scenario,
      contextMode: input.contextMode,
      snapshot,
      focus,
      selection,
      toolResults,
    });
  const expansionRequest =
    input.contextExpansionRequest ??
    buildAiAssistantContextExpansionRequest({
      budget,
      intent: input.intent,
      contextMode: input.contextMode,
      snapshot,
      focus,
      selection,
      scenario: input.scenario,
    });
  const bullets: string[] = [];

  if (snapshot) {
    bullets.push(summarizeAiAssistantCanvas(snapshot));
  } else {
    bullets.push('No active canvas context.');
  }

  if (focus) {
    bullets.push(formatFocusEvidence(focus, budget.scope));
  }

  if (selection.length > 0) {
    bullets.push(formatSelectionEvidence(selection, budget.scope));
  }

  toolResults.forEach((result) => {
    const summary = summarizeToolResult(result, budget.scope);
    if (summary) {
      bullets.push(summary);
    }
  });

  const limitedBullets = uniqueStrings(bullets)
    .filter((line) => line.trim().length > 0)
    .slice(0, input.maxBullets ?? budget.maxBullets);
  const evidenceIds = uniqueStrings([
    ...collectEvidenceIdsFromFocus(focus),
    ...selection.map((item) => item.id),
    ...collectEvidenceIdsFromToolResults(toolResults),
  ]).slice(0, budget.maxEvidenceIds);
  const sourceContext = buildSourceContext({
    snapshot,
    focus,
    selection,
    toolResults,
    budget,
  })?.slice(0, budget.scope === 'canvas' ? 2400 : 1800);

  return {
    summary:
      limitedBullets[0] ?? snapshot?.canvasTitle?.trim() ?? 'No active canvas context.',
    bullets: limitedBullets.slice(1),
    supportedBy: evidenceIds.slice(0, Math.min(8, budget.maxEvidenceIds)),
    evidenceIds,
    scenarioId: input.scenario?.id,
    scenarioMode: input.scenario?.mode,
    scenarioKind: input.scenario?.variant,
    sourceContext,
    contextScope: budget.scope,
    contextBudget: budget,
    contextExpansionRequest: budget.includeExpansionRequest ? expansionRequest : undefined,
  };
}

export function renderAiAssistantEvidencePacket(
  packet: AiAssistantEvidencePacket
): string {
  const lines = [
    `Evidence summary: ${packet.summary}`,
    ...packet.bullets.map((line) => `- ${line}`),
  ];
  if (packet.supportedBy.length > 0) {
    lines.push(`- Supported by: ${packet.supportedBy.join(', ')}`);
  }
  if (packet.evidenceIds.length > 0) {
    lines.push(`- Evidence ids: ${packet.evidenceIds.join(', ')}`);
  }
  if (packet.scenarioId || packet.scenarioMode || packet.scenarioKind) {
    const scenarioBits = [
      packet.scenarioId ? `id=${packet.scenarioId}` : null,
      packet.scenarioMode ? `mode=${packet.scenarioMode}` : null,
      packet.scenarioKind ? `kind=${packet.scenarioKind}` : null,
    ].filter(Boolean);
    lines.push(`- Scenario: ${scenarioBits.join(', ')}`);
  }
  if (packet.contextBudget) {
    lines.push(`- ${describeAiAssistantContextBudget(packet.contextBudget)}`);
  }
  if (packet.contextExpansionRequest) {
    lines.push(
      `- Context expansion request: ${renderAiAssistantContextExpansionRequest(
        packet.contextExpansionRequest
      )}`
    );
  }
  if (packet.sourceContext) {
    lines.push('Canonical context:');
    lines.push(packet.sourceContext);
  }
  return lines.join('\n');
}

function summarizeToolResult(
  result: AiAssistantToolResult,
  scope: AiAssistantContextScope
): string | null {
  if (!result.ok) {
    return null;
  }

  const data = result.data;
  if (!isPlainObject(data)) {
    return `Tool ${result.tool} returned evidence.`;
  }

  if (result.tool === 'get_focus_bundle' && isPlainObject(data.focus)) {
    const focus = data.focus as Partial<AiAssistantFocusItem> & {
      item?: { kind?: unknown; title?: unknown };
      parent?: { kind?: unknown; title?: unknown };
      children?: unknown[];
      siblings?: unknown[];
      related?: Array<{
        item?: { kind?: unknown; title?: unknown };
        relationType?: unknown;
      }>;
    };
    return formatFocusEvidence(focus as AiAssistantFocusItem, scope);
  }

  if (result.tool === 'get_selection_cluster' && isPlainObject(data.cluster)) {
    const cluster = data.cluster as {
      summary?: {
        goalCount?: unknown;
        storyCount?: unknown;
        taskCount?: unknown;
        selectedCount?: unknown;
      };
      canvasTitle?: unknown;
      elements?: Array<{
        id?: unknown;
        kind?: unknown;
        title?: unknown;
        parentId?: unknown;
        childIds?: unknown;
      }>;
      connections?: Array<{
        relationType?: unknown;
      }>;
    };
    const summary = cluster.summary;
    const elementLabels = summarizeClusterElements(cluster.elements ?? [], scope);
    if (summary || elementLabels.length > 0) {
      const countSummary = summary
        ? `Selection cluster evidence: ${describeCount(summary.goalCount, 'goal')}, ${describeCount(
            summary.storyCount,
            'story'
          )}, ${describeCount(summary.taskCount, 'task')}, ${describeCount(
            summary.selectedCount,
            'selected item'
          )}.`
        : 'Selection cluster evidence: nearby scoped items.';
      if (elementLabels.length > 0) {
        return `${countSummary} Nearby items: ${elementLabels.join(', ')}.`;
      }
      return countSummary;
    }
  }

  if (result.tool === 'get_related_relations' && Array.isArray(data.relations)) {
    return `Related relations evidence: ${data.relations.length} relation${data.relations.length === 1 ? '' : 's'}.`;
  }

  if (result.tool === 'find_missing_descriptions' && Array.isArray(data.findings)) {
    return `Missing description evidence: ${data.findings.length} item${data.findings.length === 1 ? '' : 's'} with gaps.`;
  }

  if (result.tool === 'find_structure_gaps' && Array.isArray(data.findings)) {
    return `Structure gap evidence: ${data.findings.length} finding${data.findings.length === 1 ? '' : 's'}.`;
  }

  if (result.tool === 'find_dependency_gaps' && Array.isArray(data.findings)) {
    return `Dependency gap evidence: ${data.findings.length} finding${data.findings.length === 1 ? '' : 's'}.`;
  }

  if (typeof data.summary === 'string' && data.summary.trim().length > 0) {
    return data.summary.trim().slice(0, 240);
  }

  return `Tool ${result.tool} returned structured evidence.`;
}

function collectEvidenceIdsFromFocus(
  focus: AiAssistantFocusItem | null
): string[] {
  if (!focus) {
    return [];
  }

  const ids = new Set<string>();
  ids.add(focus.item.id);
  if (focus.parent) {
    ids.add(focus.parent.id);
  }
  focus.children.forEach((item) => ids.add(item.id));
  focus.siblings.forEach((item) => ids.add(item.id));
  focus.related.forEach((entry) => ids.add(entry.item.id));
  return Array.from(ids);
}

function collectEvidenceIdsFromToolResults(
  toolResults: AiAssistantToolResult[]
): string[] {
  const ids = new Set<string>();
  toolResults.forEach((result) => {
    if (!result.ok || !isPlainObject(result.data)) {
      return;
    }
    const data = result.data as {
      id?: unknown;
      elementId?: unknown;
      targetIds?: unknown;
      ids?: unknown;
      items?: unknown;
      findings?: unknown;
      relations?: unknown;
      focus?: unknown;
      cluster?: unknown;
    };

    if (typeof data.id === 'string') {
      ids.add(data.id);
    }
    if (typeof data.elementId === 'string') {
      ids.add(data.elementId);
    }
    collectStringArray(data.targetIds).forEach((id) => ids.add(id));
    collectStringArray(data.ids).forEach((id) => ids.add(id));
    collectNestedIds(data.items).forEach((id) => ids.add(id));
    collectNestedIds(data.findings).forEach((id) => ids.add(id));
    collectNestedIds(data.relations).forEach((id) => ids.add(id));
    collectNestedIds(data.focus).forEach((id) => ids.add(id));
    collectNestedIds(data.cluster).forEach((id) => ids.add(id));
  });
  return Array.from(ids);
}

function collectStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function formatFocusEvidence(
  focus: AiAssistantFocusItem,
  scope: AiAssistantContextScope
): string {
  const itemKind = focus.item.kind;
  const title =
    focus.item.title.trim().length > 0 ? focus.item.title.trim() : 'Untitled';
  const childLabel = describeFocusRelatedItems('children', focus.children, scope);
  const siblingLabel = describeFocusRelatedItems(
    'siblings',
    focus.siblings,
    scope
  );
  const relatedLabel = describeFocusRelatedRelations(focus.related);
  const parentLabel = focus.parent
    ? `parent ${focus.parent.kind} "${focus.parent.title.trim() || 'Untitled'}"`
    : 'no parent';
  const details = [parentLabel, childLabel, siblingLabel, relatedLabel]
    .filter((part) => part.length > 0)
    .join('; ');
  return details.length > 0
    ? `Focus ${itemKind} "${title}" with ${details}.`
    : `Focus ${itemKind} "${title}".`;
}

function formatSelectionEvidence(
  selection: AiAssistantCanvasElement[],
  scope: AiAssistantContextScope
): string {
  const labels = selection
    .slice(0, scope === 'branch' ? 5 : 3)
    .map((item) => formatCanvasElementLabel(item))
    .filter((label) => label.length > 0);
  if (labels.length === 0) {
    return `Selection: ${selection.length} item${selection.length === 1 ? '' : 's'}.`;
  }
  const suffix =
    selection.length > labels.length
      ? ` (${selection.length - labels.length} more selected)`
      : '';
  return `Selection: ${labels.join(', ')}${suffix}.`;
}

function formatCanvasElementLabel(item: AiAssistantCanvasElement): string {
  const title = item.title.trim().length > 0 ? item.title.trim() : 'Untitled';
  return `${item.kind} "${title}"`;
}

function summarizeClusterElements(
  elements: Array<{
    id?: unknown;
    kind?: unknown;
    title?: unknown;
    parentId?: unknown;
    childIds?: unknown;
  }>,
  scope: AiAssistantContextScope
): string[] {
  const maxItems = scope === 'canvas' ? 4 : scope === 'branch' ? 6 : 4;
  return elements
    .slice(0, maxItems)
    .map((item) => {
      if (typeof item.kind !== 'string') {
        return null;
      }
      const title =
        typeof item.title === 'string' && item.title.trim().length > 0
          ? item.title.trim()
          : 'Untitled';
      return `${item.kind} "${title}"`;
    })
    .filter((item): item is string => item !== null);
}

function describeFocusRelatedItems(
  label: 'children' | 'siblings',
  items: AiAssistantCanvasElement[],
  scope: AiAssistantContextScope
): string {
  if (items.length === 0) {
    return '';
  }
  const titles = items
    .slice(0, scope === 'local' ? 2 : 4)
    .map((item) => formatCanvasElementLabel(item))
    .filter((value) => value.length > 0);
  const suffix =
    items.length > titles.length ? ` (+${items.length - titles.length} more)` : '';
  return `${label} (${items.length}): ${titles.join(', ')}${suffix}`;
}

function describeFocusRelatedRelations(
  related: AiAssistantFocusItem['related']
): string {
  if (related.length === 0) {
    return '';
  }
  const titles = related
    .slice(0, 4)
    .map((entry) => {
      const title =
        entry.item.title.trim().length > 0 ? entry.item.title.trim() : 'Untitled';
      return `${entry.item.kind} "${title}" via ${entry.relationType}`;
    })
    .filter((value) => value.length > 0);
  const suffix =
    related.length > titles.length ? ` (+${related.length - titles.length} more)` : '';
  return `related (${related.length}): ${titles.join(', ')}${suffix}`;
}

function buildSourceContext(input: {
  snapshot: AiAssistantCanvasSnapshot | null;
  focus: AiAssistantFocusItem | null;
  selection: AiAssistantCanvasElement[];
  toolResults: AiAssistantToolResult[];
  budget: AiAssistantContextBudget;
}): string | undefined {
  const scopedSnapshot =
    input.snapshot && input.budget.scope !== 'canvas'
      ? buildNeighborhoodSourceSnapshot(input.snapshot)
      : input.snapshot;

  if (scopedSnapshot) {
    return formatAiAssistantCanonicalContext(scopedSnapshot);
  }

  const focusSource = input.focus ? formatFocusEvidence(input.focus, input.budget.scope) : null;
  const selectionSource =
    input.selection.length > 0
      ? formatSelectionEvidence(input.selection, input.budget.scope)
      : null;
  const toolSource = input.toolResults
    .map((result) => summarizeToolResult(result, input.budget.scope))
    .filter((line): line is string => typeof line === 'string' && line.length > 0);

  const parts = [focusSource, selectionSource, ...toolSource].filter(
    (line): line is string => typeof line === 'string' && line.length > 0
  );
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join('\n');
}

function buildNeighborhoodSourceSnapshot(
  snapshot: AiAssistantCanvasSnapshot
): AiAssistantCanvasSnapshot {
  const elementsById = new Map(snapshot.elements.map((item) => [item.id, item]));
  const includedIds = new Set<string>();

  snapshot.selectionIds.forEach((id) => {
    if (!elementsById.has(id)) {
      return;
    }
    includedIds.add(id);
    const element = elementsById.get(id);
    if (!element) {
      return;
    }
    if (element.parentId && elementsById.has(element.parentId)) {
      includedIds.add(element.parentId);
    }
    element.childIds.forEach((childId) => {
      if (elementsById.has(childId)) {
        includedIds.add(childId);
      }
    });
    snapshot.connections.forEach((connection) => {
      if (connection.fromId === id && elementsById.has(connection.toId)) {
        includedIds.add(connection.toId);
      }
      if (connection.toId === id && elementsById.has(connection.fromId)) {
        includedIds.add(connection.fromId);
      }
    });
  });

  if (includedIds.size === 0 && snapshot.focusId && elementsById.has(snapshot.focusId)) {
    includedIds.add(snapshot.focusId);
    const focused = elementsById.get(snapshot.focusId);
    if (focused?.parentId && elementsById.has(focused.parentId)) {
      includedIds.add(focused.parentId);
    }
    focused?.childIds.forEach((childId) => {
      if (elementsById.has(childId)) {
        includedIds.add(childId);
      }
    });
  }

  if (includedIds.size === 0) {
    return snapshot;
  }

  const selectionIds = snapshot.selectionIds.filter((id) => includedIds.has(id));
  const highlightedIds = snapshot.highlightedIds.filter((id) =>
    includedIds.has(id)
  );
  const focusId =
    snapshot.focusId && includedIds.has(snapshot.focusId)
      ? snapshot.focusId
      : null;
  const elements = snapshot.elements
    .filter((element) => includedIds.has(element.id))
    .map((element): AiAssistantCanvasElement => ({
      ...element,
      parentId:
        element.parentId && includedIds.has(element.parentId)
          ? element.parentId
          : null,
      childIds: element.childIds.filter((childId) => includedIds.has(childId)),
      selected: selectionIds.includes(element.id),
      focused: focusId === element.id,
      highlighted: highlightedIds.includes(element.id),
    }));
  const connections = snapshot.connections.filter(
    (connection) =>
      includedIds.has(connection.fromId) && includedIds.has(connection.toId)
  );

  return {
    ...snapshot,
    selectionIds,
    focusId,
    highlightedIds,
    elements,
    connections,
    summary: {
      goalCount: elements.filter((element) => element.kind === 'goal').length,
      storyCount: elements.filter((element) => element.kind === 'story').length,
      taskCount: elements.filter((element) => element.kind === 'task').length,
      selectedCount: selectionIds.length,
    },
  };
}

function collectNestedIds(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.reduce<string[]>((accumulator, item) => {
      accumulator.push(...collectNestedIds(item));
      return accumulator;
    }, []);
  }

  if (!isPlainObject(value)) {
    return [];
  }

  const ids = new Set<string>();
  const record = value;
  if (typeof record.id === 'string') {
    ids.add(record.id);
  }
  if (typeof record.elementId === 'string') {
    ids.add(record.elementId);
  }
  collectStringArray(record.targetIds).forEach((id) => ids.add(id));
  collectStringArray(record.ids).forEach((id) => ids.add(id));
  if (Array.isArray(record.items)) {
    record.items.forEach((item) => {
      collectNestedIds(item).forEach((id) => ids.add(id));
    });
  }
  return Array.from(ids);
}

function describeCount(value: unknown, noun: string): string {
  const count = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}
