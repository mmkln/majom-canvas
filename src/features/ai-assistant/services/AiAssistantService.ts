import { AiAssistantApiClient } from './AiAssistantApiClient.ts';
import { getAiAssistantQuickActions } from './AiAssistantQuickActions.ts';
import { AiAssistantOrchestrator } from './AiAssistantOrchestrator.ts';
import type {
  AiAssistantMessage,
  AiAssistantMessageKind,
  AiAssistantMessageRole,
  AiAssistantQuickAction,
  AiAssistantReplyProgress,
} from './AiAssistantTypes.ts';
import { buildAiAssistantWelcomeContent } from './AiAssistantWelcomeMessage.ts';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import type {
  AiAssistantAction,
  AiAssistantReviewFindings,
} from '../aiAssistantActions.ts';
import type {
  AiAssistantMemoryState,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';
import type { AiAssistantContextMode } from './AiAssistantContextMode.ts';
import type { AiAssistantToolHost } from './AiAssistantToolTypes.ts';

export type AiAssistantReplyRequest = {
  prompt: string;
  source: 'manual' | 'intent';
  intent?: AiAssistantIntentKind;
  profile?: AiAssistantProfile;
  contextMode: AiAssistantContextMode;
  memory: AiAssistantMemoryState;
  snapshot: AiAssistantCanvasSnapshot | null;
  validationSnapshot?: AiAssistantCanvasSnapshot | null;
  allowActions?: boolean;
  liveHost?: AiAssistantToolHost | null;
  onProgress?: (progress: AiAssistantReplyProgress) => void;
  signal?: AbortSignal;
};

export interface AiAssistantServiceLike {
  createMessage: (
    role: AiAssistantMessageRole,
    content: string,
    createdAt?: number,
    actions?: AiAssistantAction[],
    reviewFindings?: AiAssistantReviewFindings,
    kind?: AiAssistantMessageKind
  ) => AiAssistantMessage;
  createSystemMessage: (
    content: string,
    createdAt?: number
  ) => AiAssistantMessage;
  createWelcomeMessage: (
    context: AiAssistantCanvasSnapshot | null
  ) => AiAssistantMessage;
  getQuickActions: (
    context: AiAssistantCanvasSnapshot | null
  ) => AiAssistantQuickAction[];
  reply: (request: AiAssistantReplyRequest) => Promise<AiAssistantMessage>;
}

type AiAssistantServiceOptions = {
  apiClient?: AiAssistantApiClient;
  orchestrator?: AiAssistantOrchestrator;
};

export class AiAssistantService implements AiAssistantServiceLike {
  private readonly apiClient: AiAssistantApiClient;
  private readonly orchestrator: AiAssistantOrchestrator;

  constructor(options: AiAssistantServiceOptions = {}) {
    this.apiClient = options.apiClient ?? new AiAssistantApiClient();
    this.orchestrator =
      options.orchestrator ??
      new AiAssistantOrchestrator({
        apiClient: this.apiClient,
      });
  }

  public createMessage(
    role: AiAssistantMessageRole,
    content: string,
    createdAt = Date.now(),
    actions?: AiAssistantAction[],
    reviewFindings?: AiAssistantReviewFindings,
    kind: AiAssistantMessageKind = 'default'
  ): AiAssistantMessage {
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
  ): AiAssistantMessage {
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
    context: AiAssistantCanvasSnapshot | null
  ): AiAssistantMessage {
    return this.createSystemMessage(buildAiAssistantWelcomeContent(context));
  }

  public getQuickActions(
    context: AiAssistantCanvasSnapshot | null
  ): AiAssistantQuickAction[] {
    return getAiAssistantQuickActions(context);
  }

  public async reply(
    request: AiAssistantReplyRequest
  ): Promise<AiAssistantMessage> {
    if (!this.apiClient.isConfigured()) {
      return this.createMessage('assistant', 'AI Assistant is not configured.');
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
  AiAssistantMessage,
  AiAssistantMessageKind,
  AiAssistantMessageRole,
  AiAssistantQuickAction,
} from './AiAssistantTypes.ts';
