import { WorkspaceChatApiClient } from './WorkspaceChatApiClient.ts';
import { getWorkspaceChatQuickActions } from './WorkspaceChatQuickActions.ts';
import { WorkspaceChatOrchestrator } from './WorkspaceChatOrchestrator.ts';
import type {
  WorkspaceChatMessage,
  WorkspaceChatMessageKind,
  WorkspaceChatMessageRole,
  WorkspaceChatQuickAction,
  WorkspaceChatReplyProgress,
} from './WorkspaceChatTypes.ts';
import { buildWorkspaceChatWelcomeContent } from './WorkspaceChatWelcomeMessage.ts';
import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatIntentKind,
} from '../workspaceChatEvents.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';
import type {
  WorkspaceChatMemoryState,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatContextMode } from './WorkspaceChatContextMode.ts';
import type { WorkspaceChatToolHost } from './WorkspaceChatToolTypes.ts';

export type WorkspaceChatReplyRequest = {
  prompt: string;
  source: 'manual' | 'intent';
  intent?: WorkspaceChatIntentKind;
  profile?: WorkspaceChatProfile;
  contextMode: WorkspaceChatContextMode;
  memory: WorkspaceChatMemoryState;
  snapshot: WorkspaceChatCanvasSnapshot | null;
  validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
  allowActions?: boolean;
  liveHost?: WorkspaceChatToolHost | null;
  onProgress?: (progress: WorkspaceChatReplyProgress) => void;
  signal?: AbortSignal;
};

export interface WorkspaceChatServiceLike {
  createMessage: (
    role: WorkspaceChatMessageRole,
    content: string,
    createdAt?: number,
    actions?: WorkspaceChatAction[],
    reviewFindings?: WorkspaceChatReviewFindings,
    kind?: WorkspaceChatMessageKind
  ) => WorkspaceChatMessage;
  createSystemMessage: (
    content: string,
    createdAt?: number
  ) => WorkspaceChatMessage;
  createWelcomeMessage: (
    context: WorkspaceChatCanvasSnapshot | null
  ) => WorkspaceChatMessage;
  getQuickActions: (
    context: WorkspaceChatCanvasSnapshot | null
  ) => WorkspaceChatQuickAction[];
  reply: (request: WorkspaceChatReplyRequest) => Promise<WorkspaceChatMessage>;
}

type WorkspaceChatServiceOptions = {
  apiClient?: WorkspaceChatApiClient;
  orchestrator?: WorkspaceChatOrchestrator;
};

export class WorkspaceChatService implements WorkspaceChatServiceLike {
  private readonly apiClient: WorkspaceChatApiClient;
  private readonly orchestrator: WorkspaceChatOrchestrator;

  constructor(options: WorkspaceChatServiceOptions = {}) {
    this.apiClient = options.apiClient ?? new WorkspaceChatApiClient();
    this.orchestrator =
      options.orchestrator ??
      new WorkspaceChatOrchestrator({
        apiClient: this.apiClient,
      });
  }

  public createMessage(
    role: WorkspaceChatMessageRole,
    content: string,
    createdAt = Date.now(),
    actions?: WorkspaceChatAction[],
    reviewFindings?: WorkspaceChatReviewFindings,
    kind: WorkspaceChatMessageKind = 'default'
  ): WorkspaceChatMessage {
    return {
      id: this.createId(),
      role,
      kind,
      content,
      createdAt,
      actions: actions && actions.length > 0 ? actions : undefined,
      reviewFindings,
    };
  }

  public createSystemMessage(
    content: string,
    createdAt = Date.now()
  ): WorkspaceChatMessage {
    return this.createMessage(
      'system',
      content,
      createdAt,
      undefined,
      undefined,
      'system'
    );
  }

  public createWelcomeMessage(
    context: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatMessage {
    return this.createSystemMessage(buildWorkspaceChatWelcomeContent(context));
  }

  public getQuickActions(
    context: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatQuickAction[] {
    return getWorkspaceChatQuickActions(context);
  }

  public async reply(
    request: WorkspaceChatReplyRequest
  ): Promise<WorkspaceChatMessage> {
    if (!this.apiClient.isConfigured()) {
      return this.createMessage('assistant', 'Chat is not configured.');
    }

    const structured = await this.orchestrator.reply({
      prompt: request.prompt,
      source: request.source,
      intent: request.intent,
      profile: request.profile,
      snapshot: request.snapshot,
      contextMode: request.contextMode,
      memory: request.memory,
      allowActions: request.allowActions ?? false,
      validationSnapshot: request.validationSnapshot ?? request.snapshot,
      liveHost: request.liveHost ?? null,
      onProgress: request.onProgress,
      signal: request.signal,
    });
    return this.createMessage(
      'assistant',
      structured.replyMarkdown,
      Date.now(),
      structured.actions,
      structured.reviewFindings
    );
  }

  private createId(): string {
    return `chat-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export type {
  WorkspaceChatMessage,
  WorkspaceChatMessageKind,
  WorkspaceChatMessageRole,
  WorkspaceChatQuickAction,
} from './WorkspaceChatTypes.ts';
