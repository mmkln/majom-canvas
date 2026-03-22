import type {
  WorkspaceChatAction,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';
import type { WorkspaceChatIntentKind } from '../workspaceChatEvents.ts';

export type WorkspaceChatMessageRole = 'assistant' | 'user' | 'system';
export type WorkspaceChatMessageKind = 'default' | 'system' | 'command';

export type WorkspaceChatMessage = {
  id: string;
  role: WorkspaceChatMessageRole;
  kind: WorkspaceChatMessageKind;
  content: string;
  createdAt: number;
  requestPrompt?: string;
  requestIntent?: WorkspaceChatIntentKind;
  actions?: WorkspaceChatAction[];
  reviewFindings?: WorkspaceChatReviewFindings;
};

export type WorkspaceChatQuickAction = {
  id: string;
  label: string;
  prompt: string;
};

export function isWorkspaceChatHistoryMessage(
  message: WorkspaceChatMessage
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
    normalized !== 'Chat is not configured.' &&
    !normalized.startsWith('Chat request failed:')
  );
}
