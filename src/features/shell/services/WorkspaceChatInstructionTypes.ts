import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import {
  isWorkspaceChatProfile,
  type WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import {
  isPlainObject,
  isWorkspaceChatContextMode,
  isWorkspaceChatToolCall,
  type WorkspaceChatToolCall,
} from './WorkspaceChatToolTypes.ts';

export type WorkspaceChatInstructionIndexEntry = {
  id: string;
  category?: string;
  title: string;
  summary: string;
  whenToUse: string;
  relatedToolNames: string[];
};

export type WorkspaceChatInstructionPacket = {
  id: string;
  category?: string;
  title: string;
  body: string;
  allowedToolNames?: string[];
  responsePolicy?: string;
};

type WorkspaceChatRouterDecisionBase = {
  profile: WorkspaceChatProfile;
  contextMode: WorkspaceChatContextMode;
};

export type WorkspaceChatLoadInstructionsDecision =
  WorkspaceChatRouterDecisionBase & {
    kind: 'load_instructions';
    instructionIds: string[];
  };

export type WorkspaceChatExecuteToolsDecision =
  WorkspaceChatRouterDecisionBase & {
    kind: 'execute_tools';
    calls: WorkspaceChatToolCall[];
  };

export type WorkspaceChatAskFollowupDecision =
  WorkspaceChatRouterDecisionBase & {
    kind: 'ask_followup';
    question: string;
  };

export type WorkspaceChatFinalizeDecision = WorkspaceChatRouterDecisionBase & {
  kind: 'finalize';
};

export type WorkspaceChatRouterDecision =
  | WorkspaceChatLoadInstructionsDecision
  | WorkspaceChatExecuteToolsDecision
  | WorkspaceChatAskFollowupDecision
  | WorkspaceChatFinalizeDecision;

export function isWorkspaceChatInstructionIndexEntry(
  value: unknown
): value is WorkspaceChatInstructionIndexEntry {
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

export function isWorkspaceChatInstructionPacket(
  value: unknown
): value is WorkspaceChatInstructionPacket {
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

export function isWorkspaceChatRouterDecision(
  value: unknown
): value is WorkspaceChatRouterDecision {
  if (!isPlainObject(value)) return false;
  if (!isWorkspaceChatProfile(value.profile)) return false;
  if (!isWorkspaceChatContextMode(value.contextMode)) return false;

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
        value.calls.every((call) => isWorkspaceChatToolCall(call))
      );
    case 'ask_followup':
      return typeof value.question === 'string' && value.question.trim().length > 0;
    case 'finalize':
      return true;
    default:
      return false;
  }
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
