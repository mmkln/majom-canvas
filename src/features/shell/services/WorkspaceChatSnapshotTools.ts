import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import { buildWorkspaceChatCapabilityContext } from './WorkspaceChatCapabilities.ts';
import {
  getFocusBundle,
  getRecentActivity,
  getRelations,
  getSelectionCluster,
} from './WorkspaceChatSnapshotLens.ts';
import type { WorkspaceChatToolDefinition } from './WorkspaceChatToolTypes.ts';

export const WORKSPACE_CHAT_SNAPSHOT_TOOLS: WorkspaceChatToolDefinition[] = [
  {
    name: 'get_focus_bundle',
    kind: 'read',
    description:
      'Returns the primary focus item together with its parent, children, siblings, and related items.',
    inputSchema:
      '{ "target"?: "selection" | "focus" | "prompt" | "id", "elementId"?: string }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const target = readFocusTarget(input.target);
      return {
        focus: getFocusBundle(snapshot, {
          target,
          elementId: readOptionalString(input.elementId),
          prompt:
            target === 'prompt'
              ? readOptionalString(input.prompt) ?? context.runtime.prompt
              : undefined,
        }),
      };
    },
  },
  {
    name: 'get_selection_cluster',
    kind: 'read',
    description:
      'Returns a scoped snapshot around selected or explicitly targeted items, including parents, children, and linked neighbors.',
    inputSchema: '{ "ids"?: string[] }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const ids = readOptionalStringArray(input.ids);
      return {
        cluster: getSelectionCluster(snapshot, ids),
      };
    },
  },
  {
    name: 'get_related_relations',
    kind: 'read',
    description:
      'Returns relations touching selected or explicitly targeted items.',
    inputSchema: '{ "ids"?: string[] }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const ids = resolveToolTargetIds(snapshot, readOptionalStringArray(input.ids));
      return {
        ids,
        relations: getRelations(snapshot, ids),
      };
    },
  },
  {
    name: 'get_chat_capabilities',
    kind: 'read',
    description:
      'Returns the current workspace chat capabilities, available quick actions, AI actions, context modes, and operating constraints from the frontend runtime.',
    inputSchema: '{}',
    execute: (_input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const capabilities =
        context.runtime.liveHost?.getWorkspaceChatCapabilities?.() ??
        buildWorkspaceChatCapabilityContext({
          currentView: 'canvas',
          snapshot,
        });
      return {
        capabilities,
      };
    },
  },
  {
    name: 'get_recent_activity',
    kind: 'read',
    description:
      'Returns recent activity globally or filtered to selected or explicitly targeted items.',
    inputSchema: '{ "ids"?: string[] }',
    execute: (input, context) => {
      const snapshot = resolveRuntimeSnapshot(context.runtime);
      const ids = resolveToolTargetIds(snapshot, readOptionalStringArray(input.ids));
      return {
        ids,
        recentActivity: getRecentActivity(snapshot, ids),
      };
    },
  },
];

function resolveRuntimeSnapshot(
  runtime: { snapshot: WorkspaceChatCanvasSnapshot | null; liveHost?: { getWorkspaceChatSnapshot(): WorkspaceChatCanvasSnapshot | null } | null }
): WorkspaceChatCanvasSnapshot | null {
  return runtime.snapshot ?? runtime.liveHost?.getWorkspaceChatSnapshot() ?? null;
}

function resolveToolTargetIds(
  snapshot: WorkspaceChatCanvasSnapshot | null,
  ids?: string[]
): string[] {
  if (!snapshot) return [];
  if (ids && ids.length > 0) return ids;
  if (snapshot.selectionIds.length > 0) return snapshot.selectionIds.slice();
  return snapshot.focusId ? [snapshot.focusId] : [];
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((item): item is string => typeof item === 'string');
  return ids.length > 0 ? ids : undefined;
}

function readFocusTarget(
  value: unknown
): 'selection' | 'focus' | 'prompt' | 'id' | undefined {
  return value === 'selection' ||
    value === 'focus' ||
    value === 'prompt' ||
    value === 'id'
    ? value
    : undefined;
}
