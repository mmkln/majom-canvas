import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
} from '../aiAssistantEvents.ts';
import type { AiAssistantReviewFindingSeverity } from '../aiAssistantActions.ts';
import { getSelectionCluster } from './AiAssistantSnapshotLens.ts';
import type { AiAssistantToolDefinition } from './AiAssistantToolTypes.ts';

type AiAssistantAnalysisFinding = {
  code: string;
  severity: AiAssistantReviewFindingSeverity;
  message: string;
  targetIds: string[];
};

export const AI_ASSISTANT_ANALYSIS_TOOLS: AiAssistantToolDefinition[] = [
  {
    name: 'find_structure_gaps',
    kind: 'analysis',
    description:
      'Finds missing child structure, unattached tasks, and other basic planning structure gaps.',
    inputSchema: '{ "ids"?: string[], "scope"?: "selection" | "canvas" }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const elements = resolveTargetElements(snapshot, input);
      const findings: AiAssistantAnalysisFinding[] = [];

      elements.forEach((element) => {
        if (element.kind === 'goal' && element.childIds.length === 0) {
          findings.push({
            code: 'goal_without_children',
            severity: 'high',
            message: `Goal "${element.title || 'Untitled'}" has no child items.`,
            targetIds: [element.id],
          });
        }
        if (element.kind === 'story' && element.childIds.length === 0) {
          findings.push({
            code: 'story_without_tasks',
            severity: 'high',
            message: `Story "${element.title || 'Untitled'}" has no tasks.`,
            targetIds: [element.id],
          });
        }
        if (element.kind === 'task' && !element.parentId) {
          findings.push({
            code: 'task_without_parent',
            severity: 'medium',
            message: `Task "${element.title || 'Untitled'}" is not attached to a story.`,
            targetIds: [element.id],
          });
        }
      });

      return {
        findings,
      };
    },
  },
  {
    name: 'find_dependency_gaps',
    kind: 'analysis',
    description:
      'Looks for missing non-hierarchical relations in the current target set.',
    inputSchema: '{ "ids"?: string[], "scope"?: "selection" | "canvas" }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const elements = resolveTargetElements(snapshot, input);
      const findings: AiAssistantAnalysisFinding[] = [];
      if (!snapshot || elements.length === 0) {
        return { findings };
      }

      const targetIds = new Set(elements.map((element) => element.id));
      const nonHierarchyRelations = snapshot.connections.filter(
        (connection) =>
          connection.relationType !== 'parent_child' &&
          targetIds.has(connection.fromId) &&
          targetIds.has(connection.toId)
      );
      if (elements.length > 1 && nonHierarchyRelations.length === 0) {
        findings.push({
          code: 'missing_cluster_dependencies',
          severity: 'medium',
          message:
            'The current target cluster has no explicit non-hierarchical relations.',
          targetIds: Array.from(targetIds),
        });
      }

      elements
        .filter((element) => element.kind === 'story' || element.kind === 'goal')
        .forEach((element) => {
          const childIds = new Set(element.childIds);
          if (childIds.size < 2) return;
          const hasChildRelation = snapshot.connections.some(
            (connection) =>
              connection.relationType !== 'parent_child' &&
              childIds.has(connection.fromId) &&
              childIds.has(connection.toId)
          );
          if (!hasChildRelation) {
            findings.push({
              code: 'missing_child_dependencies',
              severity: 'low',
              message: `${capitalizeKind(element.kind)} "${element.title || 'Untitled'}" has no explicit sequencing or dependency links between child items.`,
              targetIds: [element.id, ...Array.from(childIds)],
            });
          }
        });

      return {
        findings,
      };
    },
  },
  {
    name: 'find_missing_descriptions',
    kind: 'analysis',
    description:
      'Finds selected or targeted items with empty descriptions.',
    inputSchema: '{ "ids"?: string[], "scope"?: "selection" | "canvas" }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const findings = resolveTargetElements(snapshot, input)
        .filter((element) => element.description.trim().length === 0)
        .map(
          (element): AiAssistantAnalysisFinding => ({
            code: 'missing_description',
            severity: 'medium',
            message: `${capitalizeKind(element.kind)} "${element.title || 'Untitled'}" has no description.`,
            targetIds: [element.id],
          })
        );
      return {
        findings,
      };
    },
  },
  {
    name: 'find_duplicate_titles',
    kind: 'analysis',
    description:
      'Detects duplicate normalized titles within the current target set.',
    inputSchema: '{ "ids"?: string[], "scope"?: "selection" | "canvas" }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const elements = resolveTargetElements(snapshot, input);
      const byTitle = new Map<string, AiAssistantCanvasElement[]>();
      elements.forEach((element) => {
        const normalized = element.title.trim().toLowerCase();
        if (normalized.length === 0) return;
        const bucket = byTitle.get(normalized) ?? [];
        bucket.push(element);
        byTitle.set(normalized, bucket);
      });
      const findings: AiAssistantAnalysisFinding[] = [];
      byTitle.forEach((items, normalized) => {
        if (items.length < 2) return;
        findings.push({
          code: 'duplicate_title',
          severity: 'low',
          message: `Multiple items share the title "${normalized}".`,
          targetIds: items.map((item) => item.id),
        });
      });
      return {
        findings,
      };
    },
  },
];

function resolveRuntimeSnapshot(
  runtime: { snapshot: AiAssistantCanvasSnapshot | null; liveHost?: { getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null } | null }
): AiAssistantCanvasSnapshot | null {
  return runtime.snapshot ?? runtime.liveHost?.getAiAssistantSnapshot() ?? null;
}

function resolveTargetElements(
  snapshot: AiAssistantCanvasSnapshot | null,
  input: Record<string, unknown>
): AiAssistantCanvasElement[] {
  if (!snapshot) return [];
  const ids = readOptionalStringArray(input.ids);
  if (ids && ids.length > 0) {
    const idSet = new Set(ids);
    return snapshot.elements.filter((element) => idSet.has(element.id));
  }

  if (input.scope === 'canvas') {
    return snapshot.elements.slice();
  }

  const cluster = getSelectionCluster(snapshot);
  if (cluster) {
    return cluster.elements.slice();
  }

  if (snapshot.focusId) {
    return snapshot.elements.filter((element) => element.id === snapshot.focusId);
  }

  return [];
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((item): item is string => typeof item === 'string');
  return ids.length > 0 ? ids : undefined;
}

function capitalizeKind(kind: AiAssistantCanvasElement['kind']): string {
  return kind.length > 0 ? kind[0].toUpperCase() + kind.slice(1) : kind;
}
