import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
} from '../aiAssistantEvents.ts';
import type { AiAssistantFocusItem } from './AiAssistantContextTypes.ts';
import {
  formatAiAssistantCanonicalContext,
  summarizeAiAssistantCanvas,
} from './AiAssistantContent.ts';
import type { AiAssistantToolResult } from './AiAssistantToolTypes.ts';
import { isPlainObject } from './AiAssistantToolTypes.ts';

export type AiAssistantEvidencePacket = {
  summary: string;
  bullets: string[];
  supportedBy: string[];
  evidenceIds: string[];
  sourceContext?: string;
};

export type AiAssistantEvidenceCompilationInput = {
  snapshot: AiAssistantCanvasSnapshot | null;
  toolResults?: AiAssistantToolResult[];
  focus?: AiAssistantFocusItem | null;
  selection?: AiAssistantCanvasElement[];
  maxBullets?: number;
};

export function compileAiAssistantEvidencePacket(
  input: AiAssistantEvidenceCompilationInput
): AiAssistantEvidencePacket {
  const snapshot = input.snapshot;
  const focus = input.focus ?? null;
  const selection = input.selection ?? [];
  const toolResults = input.toolResults ?? [];
  const bullets: string[] = [];

  if (snapshot) {
    bullets.push(summarizeAiAssistantCanvas(snapshot));
  } else {
    bullets.push('No active canvas context.');
  }

  if (focus) {
    bullets.push(formatFocusEvidence(focus));
  }

  if (selection.length > 0) {
    bullets.push(
      `Selection: ${selection.length} item${selection.length === 1 ? '' : 's'}.`
    );
  }

  toolResults.forEach((result) => {
    const summary = summarizeToolResult(result);
    if (summary) {
      bullets.push(summary);
    }
  });

  const limitedBullets = uniqueStrings(bullets)
    .filter((line) => line.trim().length > 0)
    .slice(0, input.maxBullets ?? 6);
  const evidenceIds = uniqueStrings([
    ...collectEvidenceIdsFromFocus(focus),
    ...selection.map((item) => item.id),
    ...collectEvidenceIdsFromToolResults(toolResults),
  ]);
  const sourceContext = snapshot
    ? formatAiAssistantCanonicalContext({
        ...snapshot,
        viewport: null,
        recentActivity: [],
      }).slice(0, 2400)
    : undefined;

  return {
    summary:
      limitedBullets[0] ?? snapshot?.canvasTitle?.trim() ?? 'No active canvas context.',
    bullets: limitedBullets.slice(1),
    supportedBy: evidenceIds.slice(0, 8),
    evidenceIds,
    sourceContext,
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
  if (packet.sourceContext) {
    lines.push('Canonical context:');
    lines.push(packet.sourceContext);
  }
  return lines.join('\n');
}

function summarizeToolResult(result: AiAssistantToolResult): string | null {
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
      children?: unknown[];
      siblings?: unknown[];
      related?: unknown[];
    };
    const kind =
      typeof focus.item?.kind === 'string' ? focus.item.kind : 'item';
    const title =
      typeof focus.item?.title === 'string' && focus.item.title.trim().length > 0
        ? focus.item.title.trim()
        : 'Untitled';
    const childCount = Array.isArray(focus.children) ? focus.children.length : 0;
    const siblingCount = Array.isArray(focus.siblings) ? focus.siblings.length : 0;
    const relatedCount = Array.isArray(focus.related) ? focus.related.length : 0;
    return `Focus ${kind} "${title}" with ${childCount} children, ${siblingCount} siblings, and ${relatedCount} related items.`;
  }

  if (result.tool === 'get_selection_cluster' && isPlainObject(data.cluster)) {
    const cluster = data.cluster as {
      summary?: {
        goalCount?: unknown;
        storyCount?: unknown;
        taskCount?: unknown;
        selectedCount?: unknown;
      };
    };
    const summary = cluster.summary;
    if (summary) {
      return `Selection cluster evidence: ${describeCount(summary.goalCount, 'goal')}, ${describeCount(summary.storyCount, 'story')}, ${describeCount(summary.taskCount, 'task')}, ${describeCount(summary.selectedCount, 'selected item')}.`;
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

function formatFocusEvidence(focus: AiAssistantFocusItem): string {
  const itemKind = focus.item.kind;
  const title =
    focus.item.title.trim().length > 0 ? focus.item.title.trim() : 'Untitled';
  const childCount = focus.children.length;
  const siblingCount = focus.siblings.length;
  const relatedCount = focus.related.length;
  const parentLabel = focus.parent
    ? `${focus.parent.kind} "${focus.parent.title.trim() || 'Untitled'}"`
    : 'no parent';
  return `Focus ${itemKind} "${title}" with ${childCount} children, ${siblingCount} siblings, ${relatedCount} related items, and ${parentLabel}.`;
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
