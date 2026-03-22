import type { WorkspaceView } from '../WorkspaceView.ts';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';
import { WorkspaceChatContextAssembler } from './WorkspaceChatContextAssembler.ts';
import {
  scopeWorkspaceChatContext,
  type WorkspaceChatContextMode,
} from './WorkspaceChatContextMode.ts';
import { WorkspaceChatMemoryStore } from './WorkspaceChatMemoryStore.ts';
import { resolveWorkspaceChatProfile } from './WorkspaceChatProfileResolver.ts';
import { WorkspaceChatPersistence } from './WorkspaceChatPersistence.ts';
import { WorkspaceChatService } from './WorkspaceChatService.ts';
import type {
  WorkspaceChatAssembledContext,
  WorkspaceChatMemoryState,
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import { EMPTY_WORKSPACE_CHAT_MEMORY_STATE } from './WorkspaceChatContextTypes.ts';
import type {
  WorkspaceChatMessage,
  WorkspaceChatQuickAction,
} from './WorkspaceChatTypes.ts';
import type { WorkspaceChatPreparedSubmission } from './WorkspaceChatPreparedSubmission.ts';

type WorkspaceChatServiceLike = {
  createMessage: (
    role: 'assistant' | 'user',
    content: string,
    createdAt?: number,
    actions?: WorkspaceChatAction[],
    reviewFindings?: WorkspaceChatReviewFindings
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
  reply: (
    prompt: string,
    context: WorkspaceChatAssembledContext,
    history: WorkspaceChatMessage[],
    options?: {
      signal?: AbortSignal;
      allowActions?: boolean;
      validationSnapshot?: WorkspaceChatCanvasSnapshot | null;
    }
  ) => Promise<WorkspaceChatMessage>;
};

type WorkspaceChatSessionState = {
  conversationKey: string;
  messages: WorkspaceChatMessage[];
  replying: boolean;
  pendingRequestId: string | null;
  abortController: AbortController | null;
  contextMode: WorkspaceChatContextMode;
};

export type WorkspaceChatPanelState = {
  currentView: WorkspaceView;
  context: WorkspaceChatCanvasSnapshot | null;
  messages: WorkspaceChatMessage[];
  quickActions: WorkspaceChatQuickAction[];
  replying: boolean;
  canClear: boolean;
  contextEnabled: boolean;
  contextMode: WorkspaceChatContextMode;
  composerPlaceholder: string;
};

type WorkspaceChatSessionControllerOptions = {
  persistence?: WorkspaceChatPersistence;
  service?: WorkspaceChatServiceLike;
};

export class WorkspaceChatSessionController {
  private readonly persistence: WorkspaceChatPersistence;
  private readonly service: WorkspaceChatServiceLike;
  private readonly contextAssembler = new WorkspaceChatContextAssembler();
  private readonly memoryStore = new WorkspaceChatMemoryStore();
  private readonly sessions = new Map<string, WorkspaceChatSessionState>();
  private readonly listeners = new Set<() => void>();
  private currentView: WorkspaceView = 'canvas';
  private context: WorkspaceChatCanvasSnapshot | null = null;
  private activeConversationKey = 'canvas:draft';

  constructor(options: WorkspaceChatSessionControllerOptions = {}) {
    this.persistence = options.persistence ?? new WorkspaceChatPersistence();
    this.service = options.service ?? WorkspaceChatService;
    this.switchConversationScope();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public dispose(): void {
    for (const session of this.sessions.values()) {
      session.abortController?.abort();
      session.abortController = null;
      session.pendingRequestId = null;
      session.replying = false;
    }
    this.listeners.clear();
  }

  public setView(view: WorkspaceView): void {
    if (this.currentView === view) return;
    this.currentView = view;
    this.switchConversationScope();
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
  }

  public setContext(context: WorkspaceChatCanvasSnapshot | null): void {
    this.context = this.normalizeContext(context);
    this.switchConversationScope();
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
  }

  public getState(): WorkspaceChatPanelState {
    const session = this.ensureSession(this.activeConversationKey);
    const scopedContext = this.getScopedContext(session);
    return {
      currentView: this.currentView,
      context: scopedContext,
      messages: session.messages,
      quickActions: scopedContext ? this.service.getQuickActions(scopedContext) : [],
      replying: session.replying,
      canClear:
        session.messages.length > 1 ||
        session.messages.some((message) => message.role === 'user'),
      contextEnabled: session.contextMode !== 'none',
      contextMode: session.contextMode,
      composerPlaceholder:
        session.contextMode === 'none'
          ? 'Ask without canvas context'
          : !scopedContext && this.currentView !== 'canvas'
          ? 'Canvas context is unavailable in this view'
          : !scopedContext && session.contextMode === 'selection'
          ? 'Select items to use selection context'
          : session.contextMode === 'viewport'
          ? 'Ask about the visible area'
          : session.contextMode === 'selection'
          ? 'Ask about selected items'
          : 'Ask about the current canvas',
    };
  }

  public setContextEnabled(enabled: boolean): void {
    this.setContextMode(enabled ? 'canvas' : 'none');
  }

  public setContextMode(mode: WorkspaceChatContextMode): void {
    const session = this.ensureSession(this.activeConversationKey);
    if (session.contextMode === mode) return;
    session.contextMode = mode;
    this.persistence.saveContextMode(session.conversationKey, mode);
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
  }

  public toggleContextEnabled(): void {
    const session = this.ensureSession(this.activeConversationKey);
    this.setContextMode(session.contextMode === 'none' ? 'canvas' : 'none');
  }

  public async submitPrompt(prompt: string): Promise<void> {
    await this.submitRequest(prompt);
  }

  public async submitPreparedSubmission(
    submission: WorkspaceChatPreparedSubmission
  ): Promise<void> {
    this.context = this.normalizeContext(submission.snapshot);
    this.switchConversationScope();
    const session = this.ensureSession(this.activeConversationKey);
    if (session.contextMode !== submission.contextMode) {
      session.contextMode = submission.contextMode;
      this.persistence.saveContextMode(
        session.conversationKey,
        submission.contextMode
      );
    }
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
    await this.submitRequest(submission.prompt, submission.profile);
  }

  private async submitRequest(
    prompt: string,
    profileOverride?: WorkspaceChatProfile
  ): Promise<void> {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;

    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    if (session.replying) {
      session.abortController?.abort();
    }

    const userMessage = this.service.createMessage('user', trimmed);
    session.messages = [...session.messages, userMessage];
    this.persistence.saveConversation(conversationKey, session.messages);

    const requestId = this.createRequestId();
    const abortController =
      typeof AbortController === 'undefined' ? null : new AbortController();
    session.replying = true;
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.emitChange();

    const historySnapshot = session.messages.slice();
    const contextSnapshot = this.getScopedContext(session);
    const memorySnapshot = contextSnapshot
      ? this.memoryStore.get(conversationKey)
      : { ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE };
    const profile =
      profileOverride ?? resolveWorkspaceChatProfile(trimmed, contextSnapshot);
    const assembledContext = this.contextAssembler.assemble({
      prompt: trimmed,
      snapshot: contextSnapshot,
      memory: memorySnapshot,
      contextMode: session.contextMode,
      profile,
    });

    try {
      const reply = await this.service.reply(
        trimmed,
        assembledContext,
        historySnapshot,
        {
          signal: abortController?.signal,
          allowActions: this.currentView === 'canvas',
          validationSnapshot: contextSnapshot,
        }
      );
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt: trimmed,
        reply: reply.content,
        assembledContext,
      });
      this.commitReply(conversationKey, requestId, reply);
    } catch (error) {
      if (this.isAbortError(error)) {
        this.finishPendingRequest(conversationKey, requestId);
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Failed to reach chat API.';
      this.commitReply(
        conversationKey,
        requestId,
        this.service.createMessage('assistant', `Chat request failed: ${message}`)
      );
    }
  }

  public async regenerateMessage(messageId: string): Promise<void> {
    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    if (session.replying) {
      return;
    }

    const messageIndex = session.messages.findIndex(
      (message) => message.id === messageId
    );
    if (messageIndex <= 0) return;

    const targetMessage = session.messages[messageIndex];
    const promptMessage = session.messages[messageIndex - 1];
    const isLatestMessage = messageIndex === session.messages.length - 1;
    if (
      !targetMessage ||
      !promptMessage ||
      !isLatestMessage ||
      targetMessage.role !== 'assistant' ||
      promptMessage.role !== 'user'
    ) {
      return;
    }

    const requestId = this.createRequestId();
    const abortController =
      typeof AbortController === 'undefined' ? null : new AbortController();

    session.messages = session.messages.slice(0, messageIndex);
    session.replying = true;
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.persistence.saveConversation(conversationKey, session.messages);
    this.memoryStore.clear(conversationKey);
    this.emitChange();

    const prompt = promptMessage.content.trim();
    const historySnapshot = session.messages.slice();
    const contextSnapshot = this.getScopedContext(session);
    const assembledContext = this.contextAssembler.assemble({
      prompt,
      snapshot: contextSnapshot,
      memory: { ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE },
      contextMode: session.contextMode,
      profile: resolveWorkspaceChatProfile(prompt, contextSnapshot),
    });

    try {
      const reply = await this.service.reply(
        prompt,
        assembledContext,
        historySnapshot,
        {
          signal: abortController?.signal,
          allowActions: this.currentView === 'canvas',
          validationSnapshot: contextSnapshot,
        }
      );
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt,
        reply: reply.content,
        assembledContext,
      });
      this.commitReply(conversationKey, requestId, reply);
    } catch (error) {
      if (this.isAbortError(error)) {
        this.finishPendingRequest(conversationKey, requestId);
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Failed to reach chat API.';
      this.commitReply(
        conversationKey,
        requestId,
        this.service.createMessage('assistant', `Chat request failed: ${message}`)
      );
    }
  }

  public async executeMessageAction(
    messageId: string,
    actionId: string,
    executor?: (
      request: WorkspaceChatActionExecutionRequest
    ) => Promise<WorkspaceChatActionExecutionResult>
  ): Promise<void> {
    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    const action = this.getActionFromSession(session, messageId, actionId);
    if (!action || action.status === 'applying' || action.status === 'applied') {
      return;
    }

    this.updateActionState(conversationKey, messageId, actionId, {
      status: 'applying',
      errorMessage: undefined,
    });

    const request: WorkspaceChatActionExecutionRequest = {
      action,
      allowSelectionTargeting: session.contextMode !== 'none',
    };

    try {
      const result = executor
        ? await executor(request)
        : {
            status: 'failed',
            errorMessage: 'Canvas is unavailable.',
          };

      if (result.status === 'applied') {
        this.updateActionState(conversationKey, messageId, actionId, {
          status: 'applied',
          errorMessage: undefined,
          createdElementId: result.createdElementId,
        });
        const updatedAction = this.getActionFromConversation(
          conversationKey,
          messageId,
          actionId
        );
        if (updatedAction) {
          this.appendConversationMessage(
            conversationKey,
            this.service.createSystemMessage(
              `Created ${this.describeActionTarget(updatedAction)}.`
            )
          );
        }
        return;
      }

      this.updateActionState(conversationKey, messageId, actionId, {
        status: 'failed',
        errorMessage: result.errorMessage ?? 'Failed to create item.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create item.';
      this.updateActionState(conversationKey, messageId, actionId, {
        status: 'failed',
        errorMessage: message,
      });
    }
  }

  public clearConversation(): void {
    const session = this.ensureSession(this.activeConversationKey);
    session.abortController?.abort();
    session.abortController = null;
    session.pendingRequestId = null;
    session.replying = false;
    session.messages = [];
    this.persistence.clearConversation(this.activeConversationKey);
    this.memoryStore.clear(this.activeConversationKey);
    this.ensureSeedMessage(session);
    this.emitChange();
  }

  private normalizeContext(
    context: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatCanvasSnapshot | null {
    if (!context) return null;
    const isEmptyContext =
      context.canvasId === null &&
      context.canvasTitle.trim().length === 0 &&
      context.summary.goalCount === 0 &&
      context.summary.storyCount === 0 &&
      context.summary.taskCount === 0 &&
      context.summary.selectedCount === 0 &&
      context.elements.length === 0 &&
      context.selectionIds.length === 0;
    return isEmptyContext ? null : context;
  }

  private switchConversationScope(): void {
    const nextKey = this.getConversationKey();
    this.activeConversationKey = nextKey;
    this.ensureSession(nextKey);
  }

  private getConversationKey(): string {
    if (this.currentView === 'canvas') {
      if (this.context?.canvasId) {
        return `canvas:${this.context.canvasId}`;
      }
      return 'canvas:draft';
    }
    return 'global';
  }

  private ensureSession(conversationKey: string): WorkspaceChatSessionState {
    const existing = this.sessions.get(conversationKey);
    if (existing) return existing;

    const session: WorkspaceChatSessionState = {
      conversationKey,
      messages: this.persistence.readConversation(conversationKey),
      replying: false,
      pendingRequestId: null,
      abortController: null,
      contextMode: this.persistence.readContextMode(conversationKey),
    };
    this.ensureSeedMessage(session);
    this.sessions.set(conversationKey, session);
    return session;
  }

  private ensureSeedMessage(session: WorkspaceChatSessionState): void {
    if (session.messages.length > 0) return;
    session.messages = this.createSeedMessages(session);
    if (session.messages.length === 0) return;
    this.persistence.saveConversation(session.conversationKey, session.messages);
  }

  private refreshSeedMessageIfNeeded(): void {
    const session = this.ensureSession(this.activeConversationKey);
    const hasUserMessages = session.messages.some(
      (message) => message.role === 'user'
    );
    const canReplaceSeed =
      session.messages.length === 0 ||
      (session.messages.length === 1 &&
        session.messages[0]?.role === 'assistant');
    if (hasUserMessages || !canReplaceSeed) return;
    session.messages = this.createSeedMessages(session);
    this.persistence.saveConversation(session.conversationKey, session.messages);
  }

  private createSeedMessages(
    session: WorkspaceChatSessionState
  ): WorkspaceChatMessage[] {
    if (session.contextMode === 'none') {
      return [];
    }
    return [this.service.createWelcomeMessage(this.getScopedContext(session))];
  }

  private getScopedContext(
    session: WorkspaceChatSessionState
  ): WorkspaceChatCanvasSnapshot | null {
    return scopeWorkspaceChatContext(this.context, session.contextMode);
  }

  private commitReply(
    conversationKey: string,
    requestId: string,
    reply: WorkspaceChatMessage
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session || session.pendingRequestId !== requestId) return;
    session.messages = [...session.messages, reply];
    this.persistence.saveConversation(conversationKey, session.messages);
    this.finishPendingRequest(conversationKey, requestId);
  }

  private finishPendingRequest(conversationKey: string, requestId: string): void {
    const session = this.sessions.get(conversationKey);
    if (!session || session.pendingRequestId !== requestId) return;
    session.replying = false;
    session.pendingRequestId = null;
    session.abortController = null;
    this.emitChange();
  }

  private isAbortError(error: unknown): boolean {
    if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
      return error.name === 'AbortError';
    }
    return error instanceof Error && error.name === 'AbortError';
  }

  private getActionFromSession(
    session: WorkspaceChatSessionState,
    messageId: string,
    actionId: string
  ): WorkspaceChatAction | null {
    const message = session.messages.find((entry) => entry.id === messageId);
    const action = message?.actions?.find((entry) => entry.id === actionId);
    return action ?? null;
  }

  private getActionFromConversation(
    conversationKey: string,
    messageId: string,
    actionId: string
  ): WorkspaceChatAction | null {
    const session = this.sessions.get(conversationKey);
    if (!session) return null;
    return this.getActionFromSession(session, messageId, actionId);
  }

  private updateActionState(
    conversationKey: string,
    messageId: string,
    actionId: string,
    patch: Partial<WorkspaceChatAction>
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session) return;
    let changed = false;
    session.messages = session.messages.map((message) => {
      if (message.id !== messageId || !Array.isArray(message.actions)) {
        return message;
      }
      const nextActions = message.actions.map((action) => {
        if (action.id !== actionId) return action;
        changed = true;
        return { ...action, ...patch };
      });
      return changed ? { ...message, actions: nextActions } : message;
    });
    if (!changed) return;
    this.persistence.saveConversation(conversationKey, session.messages);
    this.emitChange();
  }

  private appendConversationMessage(
    conversationKey: string,
    message: WorkspaceChatMessage
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session) return;
    session.messages = [...session.messages, message];
    this.persistence.saveConversation(conversationKey, session.messages);
    this.emitChange();
  }

  private describeActionTarget(action: WorkspaceChatAction): string {
    switch (action.kind) {
      case 'create_task':
        return `task "${action.title}"`;
      case 'create_story':
        return `story "${action.title}"`;
      case 'create_goal':
        return `goal "${action.title}"`;
      case 'suggest_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return `${action.relationType} relation between "${from}" and "${to}"`;
      }
      case 'suggest_update':
        return `update for ${action.elementKind} "${action.targetTitle || action.elementId}"`;
    }
  }

  private createRequestId(): string {
    return `chat-request-${Math.random().toString(36).slice(2, 10)}`;
  }

  private emitChange(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
