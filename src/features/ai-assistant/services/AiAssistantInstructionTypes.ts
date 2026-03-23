import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import {
  isAiAssistantProfile,
  normalizeAiAssistantProfile,
  type AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import {
  isPlainObject,
  isAiAssistantContextMode,
  isAiAssistantToolCall,
  type AiAssistantToolCall,
} from './AiAssistantToolTypes.ts';

export type AiAssistantInstructionIndexEntry = {
  id: string;
  category?: string;
  title: string;
  summary: string;
  whenToUse: string;
  relatedToolNames: string[];
};

export type AiAssistantInstructionPacket = {
  id: string;
  category?: string;
  title: string;
  body: string;
  allowedToolNames?: string[];
  responsePolicy?: string;
};

type AiAssistantRouterDecisionBase = {
  profile: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
};

export type AiAssistantLoadInstructionsDecision =
  AiAssistantRouterDecisionBase & {
    kind: 'load_instructions';
    instructionIds: string[];
  };

export type AiAssistantExecuteToolsDecision =
  AiAssistantRouterDecisionBase & {
    kind: 'execute_tools';
    calls: AiAssistantToolCall[];
  };

export type AiAssistantAskFollowupDecision =
  AiAssistantRouterDecisionBase & {
    kind: 'ask_followup';
    question: string;
  };

export type AiAssistantFinalizeDecision = AiAssistantRouterDecisionBase & {
  kind: 'finalize';
};

export type AiAssistantRouterDecision =
  | AiAssistantLoadInstructionsDecision
  | AiAssistantExecuteToolsDecision
  | AiAssistantAskFollowupDecision
  | AiAssistantFinalizeDecision;

export function isAiAssistantInstructionIndexEntry(
  value: unknown
): value is AiAssistantInstructionIndexEntry {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    typeof value.whenToUse === 'string' &&
    isOptionalString(value.category) &&
    isStringArray(value.relatedToolNames)
  );
}

export function isAiAssistantInstructionPacket(
  value: unknown
): value is AiAssistantInstructionPacket {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isOptionalString(value.category) &&
    isOptionalString(value.responsePolicy) &&
    (value.allowedToolNames === undefined || isStringArray(value.allowedToolNames))
  );
}

export function isAiAssistantRouterDecision(
  value: unknown
): value is AiAssistantRouterDecision {
  if (!isPlainObject(value)) return false;
  if (!isAiAssistantProfile(value.profile)) return false;
  if (!isAiAssistantContextMode(value.contextMode)) return false;

  switch (value.kind) {
    case 'load_instructions':
      return (
        Array.isArray(value.instructionIds) &&
        value.instructionIds.length > 0 &&
        isStringArray(value.instructionIds)
      );
    case 'execute_tools':
      return (
        Array.isArray(value.calls) &&
        value.calls.length > 0 &&
        value.calls.every((call) => isAiAssistantToolCall(call))
      );
    case 'ask_followup':
      return typeof value.question === 'string' && value.question.trim().length > 0;
    case 'finalize':
      return true;
    default:
      return false;
  }
}

export function normalizeAiAssistantRouterDecision(
  value: unknown
): AiAssistantRouterDecision | null {
  if (!isPlainObject(value)) return null;

  const normalizedProfile = normalizeAiAssistantProfile(value.profile);
  if (!normalizedProfile) {
    return null;
  }

  const candidate: Record<string, unknown> = {
    ...value,
    profile: normalizedProfile,
  };

  return isAiAssistantRouterDecision(candidate)
    ? (candidate as AiAssistantRouterDecision)
    : null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
