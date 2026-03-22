import type {
  WorkspaceChatAction,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';

export type WorkspaceChatMessageRole = 'assistant' | 'user';
export type WorkspaceChatMessageKind = 'default' | 'system';

export type WorkspaceChatMessage = {
  id: string;
  role: WorkspaceChatMessageRole;
  kind: WorkspaceChatMessageKind;
  content: string;
  createdAt: number;
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
  if (message.kind === 'system') return false;
  const normalized = message.content.trim();
  if (normalized.length === 0) return false;
  return (
    normalized !== 'Chat is not configured.' &&
    !normalized.startsWith('Chat request failed:')
  );
}
