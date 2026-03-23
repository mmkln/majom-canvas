import type { AiAssistantCanvasSnapshot } from '../aiAssistantEvents.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantCapabilityContext } from './AiAssistantCapabilities.ts';
import {
  isAiAssistantProfile,
  type AiAssistantMemoryState,
  type AiAssistantProfile,
} from './AiAssistantContextTypes.ts';

export type AiAssistantToolKind = 'read' | 'analysis';

export interface AiAssistantToolHost {
  getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null;
  getAiAssistantCapabilities?(): AiAssistantCapabilityContext | null;
}

export type AiAssistantToolRuntimeContext = {
  snapshot: AiAssistantCanvasSnapshot | null;
  liveHost?: AiAssistantToolHost | null;
  memory: AiAssistantMemoryState;
  prompt: string;
  contextMode: AiAssistantContextMode;
};

export type AiAssistantToolCall = {
  tool: string;
  input: Record<string, unknown>;
};

export type AiAssistantToolResult = {
  tool: string;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export type AiAssistantPlannerOutput = {
  profile: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
  calls: AiAssistantToolCall[];
};

export type AiAssistantExecutionPlan = AiAssistantPlannerOutput;

export type AiAssistantToolExecutionContext = {
  runtime: AiAssistantToolRuntimeContext;
  previousResults: AiAssistantToolResult[];
};

export type AiAssistantToolDefinition = {
  name: string;
  kind: AiAssistantToolKind;
  description: string;
  inputSchema: string;
  execute: (
    input: Record<string, unknown>,
    context: AiAssistantToolExecutionContext
  ) => Promise<unknown> | unknown;
};

export function isAiAssistantToolCall(value: unknown): value is AiAssistantToolCall {
  if (!value || typeof value !== 'object') return false;
  const call = value as Partial<AiAssistantToolCall>;
  return (
    typeof call.tool === 'string' &&
    isPlainObject(call.input)
  );
}

export function isAiAssistantPlannerOutput(
  value: unknown
): value is AiAssistantPlannerOutput {
  if (!value || typeof value !== 'object') return false;
  const output = value as Partial<AiAssistantPlannerOutput>;
  return (
    isAiAssistantProfile(output.profile) &&
    isAiAssistantContextMode(output.contextMode) &&
    Array.isArray(output.calls) &&
    output.calls.every((call) => isAiAssistantToolCall(call))
  );
}

export function isAiAssistantContextMode(
  value: unknown
): value is AiAssistantContextMode {
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
