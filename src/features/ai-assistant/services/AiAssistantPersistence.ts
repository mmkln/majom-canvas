import type { AiAssistantMessage } from './AiAssistantTypes.ts';
import type { AiAssistantIntentKind } from '../aiAssistantEvents.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import {
  AI_ASSISTANT_CONTEXT_MODE_STORAGE_KEY_PREFIX,
  AI_ASSISTANT_HISTORY_LIMIT,
  AI_ASSISTANT_STORAGE_KEY_PREFIX,
} from './AiAssistantConfig.ts';
import {
  isAiAssistantContextMode,
  type AiAssistantContextMode,
} from './AiAssistantContextMode.ts';
import {
  sanitizeStoredAiAssistantAction,
  sanitizeStoredAiAssistantReviewFindings,
} from './AiAssistantStructuredReplyParser.ts';

const AI_ASSISTANT_CONVERSATION_STORAGE_VERSION = 2;

export class AiAssistantPersistence {
  constructor(
    private readonly storageKeyPrefix = AI_ASSISTANT_STORAGE_KEY_PREFIX,
    private readonly historyLimit = AI_ASSISTANT_HISTORY_LIMIT,
    private readonly contextModeStorageKeyPrefix =
      AI_ASSISTANT_CONTEXT_MODE_STORAGE_KEY_PREFIX
  ) {}

  public readConversation(key: string): AiAssistantMessage[] {
    try {
      const raw = window.localStorage.getItem(this.buildStorageKey(key));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      const record = normalizeConversationRecord(parsed);
      if (!record) return [];
      const messages = record.messages
        .map((message) => this.normalizeMessage(message))
        .filter((message): message is AiAssistantMessage => message !== null);
      if (record.needsUpgrade) {
        this.saveConversation(key, messages);
      }
      return messages;
    } catch {
      return [];
    }
  }

  public saveConversation(
    key: string,
    messages: AiAssistantMessage[]
  ): void {
    try {
      window.localStorage.setItem(
        this.buildStorageKey(key),
        JSON.stringify({
          version: AI_ASSISTANT_CONVERSATION_STORAGE_VERSION,
          messages: messages.slice(-this.historyLimit),
        })
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
    fallback: AiAssistantContextMode = 'canvas'
  ): AiAssistantContextMode {
    try {
      const raw = window.localStorage.getItem(this.buildContextModeStorageKey(key));
      return isAiAssistantContextMode(raw ?? '') ? raw : fallback;
    } catch {
      return fallback;
    }
  }

  public saveContextMode(key: string, mode: AiAssistantContextMode): void {
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

  private normalizeMessage(value: unknown): AiAssistantMessage | null {
    if (!value || typeof value !== 'object') return null;
    const message = value as Partial<AiAssistantMessage>;
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
          .map((action) => sanitizeStoredAiAssistantAction(action))
          .filter((action): action is NonNullable<typeof action> => action !== null)
      : undefined;
    const reviewFindings = message.reviewFindings
      ? sanitizeStoredAiAssistantReviewFindings(message.reviewFindings)
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
      requestIntent: normalizeAiAssistantIntentKind(message.requestIntent) ?? undefined,
      requestIntentContext: normalizeAiAssistantIntentContext(
        message.requestIntentContext
      ),
      awaitingUserInput:
        message.awaitingUserInput === true ? true : undefined,
      actions: actions && actions.length > 0 ? actions : undefined,
      reviewFindings: reviewFindings ?? undefined,
    };
  }
}

function normalizeAiAssistantIntentKind(
  value: unknown
): AiAssistantIntentKind | null {
  switch (value) {
    case 'review':
    case 'breakdown':
    case 'strategic_plan':
    case 'dependencies':
    case 'missing':
    case 'clarify':
    case 'fill_details':
      return value;
    default:
      return null;
  }
}

function normalizeConversationRecord(
  value: unknown
): { messages: unknown[]; needsUpgrade: boolean } | null {
  if (Array.isArray(value)) {
    return {
      messages: value.map((message) => migrateConversationMessage(message)),
      needsUpgrade: true,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as {
    version?: unknown;
    messages?: unknown;
  };
  if (!Array.isArray(record.messages)) {
    return null;
  }

  return {
    messages: record.messages.map((message) => migrateConversationMessage(message)),
    needsUpgrade: record.version !== AI_ASSISTANT_CONVERSATION_STORAGE_VERSION,
  };
}

function migrateConversationMessage(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const message = value as Record<string, unknown>;
  const requestIntent = message.requestIntent;
  if (
    requestIntent === 'bootstrap_plan' ||
    requestIntent === 'bootstrap-plan'
  ) {
    return {
      ...message,
      requestIntent: 'strategic_plan',
    };
  }

  return message;
}

function normalizeAiAssistantIntentContext(
  value: unknown
): AiAssistantIntentContext | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const context = value as Partial<AiAssistantIntentContext>;
  const strategicPlanMode =
    context.strategicPlanMode === 'canvas_bootstrap' ||
    context.strategicPlanMode === 'goal_subgoals' ||
    context.strategicPlanMode === 'goal_replan'
      ? context.strategicPlanMode
      : undefined;
  const breakdownMode =
    context.breakdownMode === 'goal_stories' ||
    context.breakdownMode === 'story_tasks' ||
    context.breakdownMode === 'task_refine' ||
    context.breakdownMode === 'unspecified_goal_decomposition'
      ? context.breakdownMode
      : undefined;

  return strategicPlanMode || breakdownMode
    ? {
        strategicPlanMode,
        breakdownMode,
      }
    : undefined;
}
