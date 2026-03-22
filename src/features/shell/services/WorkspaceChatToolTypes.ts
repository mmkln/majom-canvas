import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import {
  isWorkspaceChatProfile,
  type WorkspaceChatMemoryState,
  type WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';

export type WorkspaceChatToolKind = 'read' | 'analysis';

export interface WorkspaceChatToolHost {
  getWorkspaceChatSnapshot(): WorkspaceChatCanvasSnapshot | null;
}

export type WorkspaceChatToolRuntimeContext = {
  snapshot: WorkspaceChatCanvasSnapshot | null;
  liveHost?: WorkspaceChatToolHost | null;
  memory: WorkspaceChatMemoryState;
  prompt: string;
  contextMode: WorkspaceChatContextMode;
};

export type WorkspaceChatToolCall = {
  tool: string;
  input: Record<string, unknown>;
};

export type WorkspaceChatToolResult = {
  tool: string;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export type WorkspaceChatPlannerOutput = {
  profile: WorkspaceChatProfile;
  contextMode: WorkspaceChatContextMode;
  calls: WorkspaceChatToolCall[];
};

export type WorkspaceChatExecutionPlan = WorkspaceChatPlannerOutput;

export type WorkspaceChatToolExecutionContext = {
  runtime: WorkspaceChatToolRuntimeContext;
  previousResults: WorkspaceChatToolResult[];
};

export type WorkspaceChatToolDefinition = {
  name: string;
  kind: WorkspaceChatToolKind;
  description: string;
  inputSchema: string;
  execute: (
    input: Record<string, unknown>,
    context: WorkspaceChatToolExecutionContext
  ) => Promise<unknown> | unknown;
};

export function isWorkspaceChatToolCall(value: unknown): value is WorkspaceChatToolCall {
  if (!value || typeof value !== 'object') return false;
  const call = value as Partial<WorkspaceChatToolCall>;
  return (
    typeof call.tool === 'string' &&
    isPlainObject(call.input)
  );
}

export function isWorkspaceChatPlannerOutput(
  value: unknown
): value is WorkspaceChatPlannerOutput {
  if (!value || typeof value !== 'object') return false;
  const output = value as Partial<WorkspaceChatPlannerOutput>;
  return (
    isWorkspaceChatProfile(output.profile) &&
    isWorkspaceChatContextMode(output.contextMode) &&
    Array.isArray(output.calls) &&
    output.calls.every((call) => isWorkspaceChatToolCall(call))
  );
}

export function isWorkspaceChatContextMode(
  value: unknown
): value is WorkspaceChatContextMode {
  return (
    value === 'none' ||
    value === 'canvas' ||
    value === 'viewport' ||
    value === 'selection'
  );
}

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
