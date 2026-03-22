import { WorkspaceChatApiClient } from './WorkspaceChatApiClient.ts';
import { getWorkspaceChatQuickActions } from './WorkspaceChatQuickActions.ts';
import type { WorkspaceChatAssembledContext } from './WorkspaceChatContextTypes.ts';
import { parseWorkspaceChatStructuredReply } from './WorkspaceChatStructuredReplyParser.ts';
import type {
  WorkspaceChatMessage,
  WorkspaceChatMessageKind,
  WorkspaceChatMessageRole,
  WorkspaceChatQuickAction,
} from './WorkspaceChatTypes.ts';
import { buildWorkspaceChatWelcomeContent } from './WorkspaceChatWelcomeMessage.ts';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';

const workspaceChatApiClient = new WorkspaceChatApiClient();

export class WorkspaceChatService {
  public static createMessage(
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

  public static createSystemMessage(
    content: string,
    createdAt = Date.now()
  ): WorkspaceChatMessage {
    return this.createMessage(
      'assistant',
      content,
      createdAt,
      undefined,
      undefined,
      'system'
    );
  }

  public static createWelcomeMessage(
    context: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatMessage {
    return this.createSystemMessage(buildWorkspaceChatWelcomeContent(context));
  }

  public static getQuickActions(
    context: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatQuickAction[] {
    return getWorkspaceChatQuickActions(context);
  }

  public static async reply(
    prompt: string,
    context: WorkspaceChatAssembledContext,
    history: WorkspaceChatMessage[],
    options: {
      signal?: AbortSignal;
      allowActions?: boolean;
      validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
    } = {}
  ): Promise<WorkspaceChatMessage> {
    const rawContent = workspaceChatApiClient.isConfigured()
      ? await workspaceChatApiClient.reply({
          prompt: prompt.trim(),
          context,
          history,
          allowActions: options.allowActions ?? false,
          signal: options.signal,
        })
      : 'Chat is not configured.';

    const structured = parseWorkspaceChatStructuredReply(rawContent, {
      prompt,
      allowActions: options.allowActions ?? false,
      validationSnapshot: options.validationSnapshot ?? null,
    });

    return this.createMessage(
      'assistant',
      structured.replyMarkdown,
      Date.now(),
      structured.actions,
      structured.reviewFindings
    );
  }

  private static createId(): string {
    return `chat-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export type {
  WorkspaceChatMessage,
  WorkspaceChatMessageKind,
  WorkspaceChatMessageRole,
  WorkspaceChatQuickAction,
} from './WorkspaceChatTypes.ts';
