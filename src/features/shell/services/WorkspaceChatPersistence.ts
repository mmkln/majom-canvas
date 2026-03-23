import type { WorkspaceChatMessage } from './WorkspaceChatTypes.ts';
import type { WorkspaceChatIntentKind } from '../workspaceChatEvents.ts';
import {
  WORKSPACE_CHAT_CONTEXT_MODE_STORAGE_KEY_PREFIX,
  WORKSPACE_CHAT_HISTORY_LIMIT,
  WORKSPACE_CHAT_STORAGE_KEY_PREFIX,
} from './WorkspaceChatConfig.ts';
import {
  isWorkspaceChatContextMode,
  type WorkspaceChatContextMode,
} from './WorkspaceChatContextMode.ts';
import {
  sanitizeStoredWorkspaceChatAction,
  sanitizeStoredWorkspaceChatReviewFindings,
} from './WorkspaceChatStructuredReplyParser.ts';

export class WorkspaceChatPersistence {
  constructor(
    private readonly storageKeyPrefix = WORKSPACE_CHAT_STORAGE_KEY_PREFIX,
    private readonly historyLimit = WORKSPACE_CHAT_HISTORY_LIMIT,
    private readonly contextModeStorageKeyPrefix =
      WORKSPACE_CHAT_CONTEXT_MODE_STORAGE_KEY_PREFIX
  ) {}

  public readConversation(key: string): WorkspaceChatMessage[] {
    try {
      const raw = window.localStorage.getItem(this.buildStorageKey(key));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as WorkspaceChatMessage[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((message) => this.normalizeMessage(message))
        .filter((message): message is WorkspaceChatMessage => message !== null);
    } catch {
      return [];
    }
  }

  public saveConversation(
    key: string,
    messages: WorkspaceChatMessage[]
  ): void {
    try {
      window.localStorage.setItem(
        this.buildStorageKey(key),
        JSON.stringify(messages.slice(-this.historyLimit))
      );
    } catch {
      // no-op
    }
  }

  public clearConversation(key: string): void {
    try {
      window.localStorage.removeItem(this.buildStorageKey(key));
    } catch {
      // no-op
    }
  }

  public readContextMode(
    key: string,
    fallback: WorkspaceChatContextMode = 'canvas'
  ): WorkspaceChatContextMode {
    try {
      const raw = window.localStorage.getItem(this.buildContextModeStorageKey(key));
      return isWorkspaceChatContextMode(raw ?? '') ? raw : fallback;
    } catch {
      return fallback;
    }
  }

  public saveContextMode(key: string, mode: WorkspaceChatContextMode): void {
    try {
      window.localStorage.setItem(this.buildContextModeStorageKey(key), mode);
    } catch {
      // no-op
    }
  }

  private buildStorageKey(key: string): string {
    return `${this.storageKeyPrefix}${key}`;
  }

  private buildContextModeStorageKey(key: string): string {
    return `${this.contextModeStorageKeyPrefix}${key}`;
  }

  private normalizeMessage(value: unknown): WorkspaceChatMessage | null {
    if (!value || typeof value !== 'object') return null;
    const message = value as Partial<WorkspaceChatMessage>;
    if (typeof message.id !== 'string') return null;
    if (
      message.role !== 'assistant' &&
      message.role !== 'user' &&
      message.role !== 'system'
    ) {
      return null;
    }
    if (typeof message.content !== 'string') return null;
    if (typeof message.createdAt !== 'number') return null;
    const actions = Array.isArray(message.actions)
      ? message.actions
          .map((action) => sanitizeStoredWorkspaceChatAction(action))
          .filter((action): action is NonNullable<typeof action> => action !== null)
      : undefined;
    const reviewFindings = message.reviewFindings
      ? sanitizeStoredWorkspaceChatReviewFindings(message.reviewFindings)
      : undefined;
    return {
      id: message.id,
      role: message.role,
      kind:
        message.kind === 'command'
          ? 'command'
          : message.kind === 'system' || message.role === 'system'
          ? 'system'
          : 'default',
      content: message.content,
      createdAt: message.createdAt,
      requestPrompt:
        typeof message.requestPrompt === 'string' &&
        message.requestPrompt.trim().length > 0
          ? message.requestPrompt.trim()
          : undefined,
      requestIntent: normalizeWorkspaceChatIntentKind(message.requestIntent) ?? undefined,
      actions: actions && actions.length > 0 ? actions : undefined,
      reviewFindings: reviewFindings ?? undefined,
    };
  }
}

function normalizeWorkspaceChatIntentKind(
  value: unknown
): WorkspaceChatIntentKind | null {
  switch (value) {
    case 'review':
    case 'breakdown':
    case 'strategic_plan':
    case 'dependencies':
    case 'missing':
    case 'clarify':
    case 'fill_details':
      return value;
    case 'bootstrap_plan':
      return 'strategic_plan';
    default:
      return null;
  }
}
