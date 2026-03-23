import type {
  AiAssistantAction,
  AiAssistantReviewFindings,
} from '../aiAssistantActions.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantPreparedSubmission } from './AiAssistantPreparedSubmission.ts';

export type AiAssistantMessageRole = 'assistant' | 'user' | 'system';
export type AiAssistantMessageKind = 'default' | 'system' | 'command';
export type AiAssistantReplyPhase =
  | 'routing'
  | 'instructions'
  | 'tools'
  | 'drafting'
  | 'repairing';

export type AiAssistantReplyProgress = {
  phase: AiAssistantReplyPhase;
  label: string;
  detail?: string;
  currentStep?: number;
  totalSteps?: number;
};

export type AiAssistantMessage = {
  id: string;
  role: AiAssistantMessageRole;
  kind: AiAssistantMessageKind;
  content: string;
  createdAt: number;
  requestPrompt?: string;
  requestIntent?: AiAssistantIntentKind;
  requestIntentContext?: AiAssistantPreparedSubmission['intentContext'];
  awaitingUserInput?: boolean;
  actions?: AiAssistantAction[];
  reviewFindings?: AiAssistantReviewFindings;
};

export type AiAssistantQuickAction = {
  id: string;
  label: string;
  prompt: string;
  submission?: AiAssistantPreparedSubmission;
};

export function isAiAssistantHistoryMessage(
  message: AiAssistantMessage
): boolean {
  if (
    message.kind === 'system' ||
    message.kind === 'command' ||
    message.role === 'system'
  ) {
    return false;
  }
  const normalized = message.content.trim();
  if (normalized.length === 0) return false;
  return (
    normalized !== 'AI Assistant is not configured.' &&
    !normalized.startsWith('AI Assistant request failed:')
  );
}
