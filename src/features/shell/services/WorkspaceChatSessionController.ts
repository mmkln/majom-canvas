import type { WorkspaceView } from '../WorkspaceView.ts';
import type { WorkspaceChatCanvasSnapshot } from '../workspaceChatEvents.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
} from '../workspaceChatActions.ts';
import {
  scopeWorkspaceChatContext,
  type WorkspaceChatContextMode,
} from './WorkspaceChatContextMode.ts';
import { WorkspaceChatMemoryStore } from './WorkspaceChatMemoryStore.ts';
import { WorkspaceChatPersistence } from './WorkspaceChatPersistence.ts';
import type {
  WorkspaceChatServiceLike,
} from './WorkspaceChatService.ts';
import { WorkspaceChatService } from './WorkspaceChatService.ts';
import type {
  WorkspaceChatProfile,
} from './WorkspaceChatContextTypes.ts';
import { EMPTY_WORKSPACE_CHAT_MEMORY_STATE } from './WorkspaceChatContextTypes.ts';
import type {
  WorkspaceChatMessage,
  WorkspaceChatQuickAction,
  WorkspaceChatReplyProgress,
} from './WorkspaceChatTypes.ts';
import type { WorkspaceChatPreparedSubmission } from './WorkspaceChatPreparedSubmission.ts';
import type { WorkspaceChatToolHost } from './WorkspaceChatToolTypes.ts';
import { resolveWorkspaceChatIntentProfile } from './WorkspaceChatIntentPlanFactory.ts';

type WorkspaceChatSessionState = {
  conversationKey: string;
  messages: WorkspaceChatMessage[];
  replying: boolean;
  replyProgress: WorkspaceChatReplyProgress | null;
  pendingRequestId: string | null;
  abortController: AbortController | null;
  contextMode: WorkspaceChatContextMode;
};

export type WorkspaceChatPanelState = {
  currentView: WorkspaceView;
  context: WorkspaceChatCanvasSnapshot | null;
  messages: WorkspaceChatMessage[];
  pendingConfirmation: WorkspaceChatPendingConfirmation | null;
  quickActions: WorkspaceChatQuickAction[];
  replying: boolean;
  replyProgress?: WorkspaceChatReplyProgress | null;
  canClear: boolean;
  contextEnabled: boolean;
  contextMode: WorkspaceChatContextMode;
  composerPlaceholder: string;
};

export type WorkspaceChatPendingConfirmation = {
  messageId: string;
  actionIds: string[];
  actionLabel: string;
  actionTitle: string;
  actionCount: number;
};

type WorkspaceChatActionStatePatch = Partial<
  Pick<
    WorkspaceChatAction,
    'status' | 'errorMessage' | 'createdElementId' | 'affectedElementIds'
  >
>;

type WorkspaceChatSessionControllerOptions = {
  persistence?: WorkspaceChatPersistence;
  service?: WorkspaceChatServiceLike;
  resolveLiveHost?: () => WorkspaceChatToolHost | null;
};

export class WorkspaceChatSessionController {
  private readonly persistence: WorkspaceChatPersistence;
  private readonly service: WorkspaceChatServiceLike;
  private readonly memoryStore = new WorkspaceChatMemoryStore();
  private readonly sessions = new Map<string, WorkspaceChatSessionState>();
  private readonly listeners = new Set<() => void>();
  private readonly resolveLiveHost?: (() => WorkspaceChatToolHost | null) | undefined;
  private currentView: WorkspaceView = 'canvas';
  private context: WorkspaceChatCanvasSnapshot | null = null;
  private activeConversationKey = 'canvas:draft';

  constructor(options: WorkspaceChatSessionControllerOptions = {}) {
    this.persistence = options.persistence ?? new WorkspaceChatPersistence();
    this.service = options.service ?? new WorkspaceChatService();
    this.resolveLiveHost = options.resolveLiveHost;
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
      session.replyProgress = null;
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
      pendingConfirmation: this.resolvePendingConfirmation(session),
      quickActions: scopedContext ? this.service.getQuickActions(scopedContext) : [],
      replying: session.replying,
      replyProgress: session.replyProgress,
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
    await this.submitRequest(submission.prompt, {
      profile: submission.profile,
      source: submission.source ?? 'manual',
      intent: submission.intent,
      liveHost: submission.liveHost ?? this.resolveLiveHost?.() ?? null,
      requestLabel: submission.requestLabel,
      requestMessageKind: submission.requestMessageKind,
    });
  }

  private async submitRequest(
    prompt: string,
    options: {
      profile?: WorkspaceChatProfile;
      source?: 'manual' | 'intent';
      intent?: WorkspaceChatPreparedSubmission['intent'];
      liveHost?: WorkspaceChatToolHost | null;
      requestLabel?: string;
      requestMessageKind?: WorkspaceChatPreparedSubmission['requestMessageKind'];
    } = {}
  ): Promise<void> {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;

    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    if (session.replying) {
      session.abortController?.abort();
    }

    const autoIntent =
      !options.intent && (options.source === undefined || options.source === 'manual')
        ? this.resolveAutoIntent(trimmed, this.getScopedContext(session))
        : undefined;
    const continuedIntent =
      !options.intent && (options.source === undefined || options.source === 'manual')
        ? this.resolvePendingFollowupIntent(session)
        : undefined;
    const resolvedIntent = options.intent ?? continuedIntent ?? autoIntent;
    const resolvedSource = options.source ?? (resolvedIntent ? 'intent' : 'manual');
    const resolvedProfile =
      options.profile ??
      (resolvedIntent
        ? resolveWorkspaceChatIntentProfile(resolvedIntent, undefined)
        : undefined);

    const requestMessage =
      options.requestMessageKind === 'command'
        ? this.createCommandMessage(
            options.requestLabel ?? trimmed,
            trimmed,
            resolvedIntent
          )
        : options.requestMessageKind === 'system'
          ? this.service.createSystemMessage(options.requestLabel ?? trimmed)
          : {
              ...this.service.createMessage('user', trimmed),
              requestPrompt: resolvedIntent ? trimmed : undefined,
              requestIntent: resolvedIntent,
            };
    session.messages = [...session.messages, requestMessage];
    this.persistence.saveConversation(conversationKey, session.messages);

    const requestId = this.createRequestId();
    const abortController =
      typeof AbortController === 'undefined' ? null : new AbortController();
    session.replying = true;
    session.replyProgress = this.createInitialReplyProgress(resolvedSource);
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.emitChange();

    const contextSnapshot = this.getScopedContext(session);
    const memorySnapshot = contextSnapshot
      ? this.memoryStore.get(conversationKey)
      : { ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE };

    try {
      const reply = await this.service.reply({
        prompt: trimmed,
        source: resolvedSource,
        intent: resolvedIntent,
        profile: resolvedProfile,
        contextMode: session.contextMode,
        memory: memorySnapshot,
        snapshot: contextSnapshot,
        validationSnapshot: contextSnapshot,
        allowActions: this.currentView === 'canvas',
        liveHost: options.liveHost ?? this.resolveLiveHost?.() ?? null,
        onProgress: (progress) => {
          this.updateReplyProgress(conversationKey, requestId, progress);
        },
        signal: abortController?.signal,
      });
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt: trimmed,
        reply: reply.content,
        snapshot: contextSnapshot,
      });
      this.commitReply(conversationKey, requestId, {
        ...reply,
        requestIntent:
          resolvedSource === 'intent' && resolvedIntent
            ? resolvedIntent
            : reply.requestIntent,
      });
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
      (promptMessage.role !== 'user' && promptMessage.kind !== 'command')
    ) {
      return;
    }

    const requestId = this.createRequestId();
    const abortController =
      typeof AbortController === 'undefined' ? null : new AbortController();
    const requestIntent = promptMessage.requestIntent;

    session.messages = session.messages.slice(0, messageIndex);
    session.replying = true;
    session.replyProgress = this.createInitialReplyProgress(
      requestIntent ? 'intent' : 'manual'
    );
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.persistence.saveConversation(conversationKey, session.messages);
    this.memoryStore.clear(conversationKey);
    this.emitChange();

    const prompt =
      promptMessage.requestPrompt?.trim() || promptMessage.content.trim();
    const contextSnapshot = this.getScopedContext(session);
    const profile = requestIntent
      ? resolveWorkspaceChatIntentProfile(requestIntent, undefined)
      : undefined;

    try {
      const reply = await this.service.reply({
        prompt,
        source: requestIntent ? 'intent' : 'manual',
        intent: requestIntent,
        profile,
        contextMode: session.contextMode,
        memory: { ...EMPTY_WORKSPACE_CHAT_MEMORY_STATE },
        snapshot: contextSnapshot,
        validationSnapshot: contextSnapshot,
        allowActions: this.currentView === 'canvas',
        liveHost: this.resolveLiveHost?.() ?? null,
        onProgress: (progress) => {
          this.updateReplyProgress(conversationKey, requestId, progress);
        },
        signal: abortController?.signal,
      });
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt,
        reply: reply.content,
        snapshot: contextSnapshot,
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
    await this.executeMessageActions(messageId, [actionId], executor);
  }

  public async executeMessageActions(
    messageId: string,
    actionIds: string[],
    executor?: (
      request: WorkspaceChatActionExecutionRequest
    ) => Promise<WorkspaceChatActionExecutionResult>
  ): Promise<void> {
    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    const pendingActions = actionIds
      .map((actionId) => this.getActionFromSession(session, messageId, actionId))
      .filter(
        (action): action is WorkspaceChatAction =>
          action !== null &&
          action.status !== 'applying' &&
          action.status !== 'applied'
      );
    if (pendingActions.length === 0) {
      return;
    }

    pendingActions.forEach((action) => {
      this.updateActionState(conversationKey, messageId, action.id, {
        status: 'applying',
        errorMessage: undefined,
      });
    });

    const appliedActions: WorkspaceChatAction[] = [];

    for (const action of pendingActions) {
      const request: WorkspaceChatActionExecutionRequest = {
        action,
        allowSelectionTargeting: session.contextMode !== 'none',
      };

      try {
        const result: WorkspaceChatActionExecutionResult = executor
          ? await executor(request)
          : {
              status: 'failed',
              errorMessage: 'Canvas is unavailable.',
            };

        if (result.status === 'applied') {
          this.updateActionState(conversationKey, messageId, action.id, {
            status: 'applied',
            errorMessage: undefined,
            createdElementId: result.createdElementId,
            affectedElementIds: result.affectedElementIds,
          });
          const updatedAction = this.getActionFromConversation(
            conversationKey,
            messageId,
            action.id
          );
          if (updatedAction) {
            appliedActions.push(updatedAction);
          }
          continue;
        }

        this.updateActionState(conversationKey, messageId, action.id, {
          status: 'failed',
          errorMessage: result.errorMessage ?? 'Failed to apply action.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to apply action.';
        this.updateActionState(conversationKey, messageId, action.id, {
          status: 'failed',
          errorMessage: message,
        });
      }
    }

    if (appliedActions.length === 0) {
      return;
    }

    this.appendConversationMessage(
      conversationKey,
      this.service.createSystemMessage(
        this.describeAppliedActions(appliedActions)
      )
    );
  }

  public clearConversation(): void {
    const session = this.ensureSession(this.activeConversationKey);
    session.abortController?.abort();
    session.abortController = null;
    session.pendingRequestId = null;
    session.replying = false;
    session.replyProgress = null;
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
      replyProgress: null,
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
        session.messages[0]?.role === 'system');
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
    session.replyProgress = null;
    session.pendingRequestId = null;
    session.abortController = null;
    this.emitChange();
  }

  private updateReplyProgress(
    conversationKey: string,
    requestId: string,
    progress: WorkspaceChatReplyProgress
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session || session.pendingRequestId !== requestId) {
      return;
    }
    session.replyProgress = progress;
    this.emitChange();
  }

  private createInitialReplyProgress(
    source: 'manual' | 'intent'
  ): WorkspaceChatReplyProgress {
    if (source === 'intent') {
      return {
        phase: 'routing',
        label: 'Preparing workflow',
        detail: 'Selecting the workspace steps for this request.',
      };
    }

    return {
      phase: 'routing',
      label: 'Analyzing request',
      detail: 'Choosing the next workspace steps.',
    };
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
    patch: WorkspaceChatActionStatePatch
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
        return this.applyActionStatePatch(action, patch);
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

  private applyActionStatePatch<T extends WorkspaceChatAction>(
    action: T,
    patch: WorkspaceChatActionStatePatch
  ): T {
    return {
      ...action,
      ...patch,
    };
  }

  private resolvePendingFollowupIntent(
    session: WorkspaceChatSessionState
  ): WorkspaceChatPreparedSubmission['intent'] | undefined {
    const lastMessage = session.messages[session.messages.length - 1];
    if (
      !lastMessage ||
      lastMessage.role !== 'assistant' ||
      !lastMessage.requestIntent
    ) {
      return undefined;
    }
    if (
      Array.isArray(lastMessage.actions) &&
      lastMessage.actions.length > 0
    ) {
      return undefined;
    }
    if (lastMessage.reviewFindings) {
      return undefined;
    }
    return this.looksLikeFollowupQuestion(lastMessage.content)
      ? lastMessage.requestIntent
      : undefined;
  }

  private looksLikeFollowupQuestion(content: string): boolean {
    return content.includes('?');
  }

  private resolvePendingConfirmation(
    session: WorkspaceChatSessionState
  ): WorkspaceChatPendingConfirmation | null {
    const lastMessage = session.messages[session.messages.length - 1];
    if (
      !lastMessage ||
      lastMessage.role !== 'assistant' ||
      !Array.isArray(lastMessage.actions)
    ) {
      return null;
    }

    const idleActions = lastMessage.actions.filter(
      (action) => action.status === 'idle'
    );
    if (idleActions.length === 0) {
      return null;
    }

    return {
      messageId: lastMessage.id,
      actionIds: idleActions.map((action) => action.id),
      actionLabel: this.describePendingConfirmationLabel(idleActions),
      actionTitle: this.describePendingConfirmationTitle(idleActions),
      actionCount: idleActions.length,
    };
  }

  private createCommandMessage(
    content: string,
    requestPrompt: string,
    requestIntent?: WorkspaceChatPreparedSubmission['intent']
  ): WorkspaceChatMessage {
    return {
      id: `chat-${Math.random().toString(36).slice(2, 10)}`,
      role: 'system',
      kind: 'command',
      content,
      createdAt: Date.now(),
      requestPrompt,
      requestIntent,
    };
  }

  private resolveAutoIntent(
    prompt: string,
    scopedContext: WorkspaceChatCanvasSnapshot | null
  ): WorkspaceChatPreparedSubmission['intent'] | undefined {
    const normalized = prompt.trim().toLocaleLowerCase();
    if (normalized.length === 0) {
      return undefined;
    }

    if (this.isStrategicPlanPrompt(normalized, scopedContext)) {
      return 'strategic_plan';
    }

    if (this.isBreakdownPrompt(normalized, scopedContext)) {
      return 'breakdown';
    }

    // Keep this narrow: only explicit relation/dependency action requests
    // should bypass the generic manual router and enter the typed
    // dependencies command flow.
    const hasRelationSignal =
      /(?:relation|relations|dependency|dependencies|blocker|blockers|link|links|connection|connections|sequence|sequences|залежн|зв['’`]?яз|блокер)/u.test(
        normalized
      );
    if (!hasRelationSignal) {
      return undefined;
    }

    const hasRelationActionSignal =
      /(?:delete|remove|clear|unlink|disconnect|cleanup|clean up|change|update|retype|replace|connect|link|add|create|suggest|видал|прибер|очист|розірв|від['’`]?єд|змін|онов|додай|створ|зв['’`]?яж)/u.test(
        normalized
    );
    return hasRelationActionSignal ? 'dependencies' : undefined;
  }

  private isEmptyCanvasContext(
    context: WorkspaceChatCanvasSnapshot | null
  ): boolean {
    if (!context) {
      return false;
    }
    return (
      context.summary.goalCount === 0 &&
      context.summary.storyCount === 0 &&
      context.summary.taskCount === 0
    );
  }

  private isStrategicPlanPrompt(
    normalizedPrompt: string,
    context: WorkspaceChatCanvasSnapshot | null
  ): boolean {
    const selection = context?.elements.filter((element) => element.selected) ?? [];
    const selectedGoal =
      selection.length === 1 && selection[0]?.kind === 'goal' ? selection[0] : null;
    const hasSubgoalSignal =
      /(?:subgoal|subgoals|phase|phases|goal structure|strategic goal|підціл|під-ціл|фаз|структур.*ціл|стратег)/u.test(
        normalizedPrompt
      );
    if (selectedGoal && hasSubgoalSignal) {
      return true;
    }

    const hasPlanSignal =
      /(?:strateg(?:y|ic)|roadmap|plan|learning plan|starter plan|study plan|blueprint|framework|каркас|стратег|роадмап|дорожн|план|структур|схем)/u.test(
        normalizedPrompt
      );
    if (!hasPlanSignal) {
      return false;
    }

    const hasGenerationSignal =
      /(?:generate|create|build|draft|make|bootstrap|start|outline|згенер|створ|побуд|сформ|склад|накин|зроби|розпиш|сплан)/u.test(
        normalizedPrompt
      );
    if (!hasGenerationSignal) {
      return false;
    }

    if (selectedGoal && (hasSubgoalSignal || hasPlanSignal)) {
      return true;
    }

    return (
      this.isEmptyCanvasContext(context) &&
      /(?:learn|learning|study|roadmap|strategy|plan|вивчен|освоєн|навчан|стратег|план|роадмап)/u.test(
        normalizedPrompt
      )
    );
  }

  private isBreakdownPrompt(
    normalizedPrompt: string,
    context: WorkspaceChatCanvasSnapshot | null
  ): boolean {
    const selection = context?.elements.filter((element) => element.selected) ?? [];
    if (selection.length !== 1) {
      return false;
    }

    const item = selection[0];
    const hasBreakdownSignal =
      /(?:break down|breakdown|decompose|split|розбий|декомпоз|розкла|поділи)/u.test(
        normalizedPrompt
      );
    if (!hasBreakdownSignal) {
      return false;
    }

    const hasStrategicSignal =
      /(?:subgoal|subgoals|phase|phases|goal structure|strategic goal|підціл|під-ціл|фаз|структур.*ціл|стратег)/u.test(
        normalizedPrompt
      );
    if (item?.kind === 'goal' && hasStrategicSignal) {
      return false;
    }

    if (item?.kind === 'story' || item?.kind === 'task') {
      return true;
    }

    if (item?.kind === 'goal') {
      return true;
    }

    return false;
  }

  private describeActionTarget(action: WorkspaceChatAction): string {
    switch (action.kind) {
      case 'create_task':
        return `task "${action.title}"`;
      case 'create_story':
        return `story "${action.title}"`;
      case 'create_goal':
        return `goal "${action.title}"`;
      case 'create_goal_blueprint':
        return `strategic plan "${action.title}"`;
      case 'suggest_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return `${action.relationType} relation between "${from}" and "${to}"`;
      }
      case 'remove_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return `${action.relationType} relation between "${from}" and "${to}"`;
      }
      case 'update_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return `${action.currentRelationType} relation between "${from}" and "${to}" to ${action.nextRelationType}`;
      }
      case 'suggest_update':
        return `update for ${action.elementKind} "${action.targetTitle || action.elementId}"`;
    }
  }

  private describePendingConfirmationLabel(
    actions: WorkspaceChatAction[]
  ): string {
    if (actions.length === 1) {
      return actions[0]?.label ?? 'Confirm';
    }

    const kinds = new Set(actions.map((action) => action.kind));
    if (kinds.size !== 1) {
      return 'Confirm all';
    }

    switch (actions[0]?.kind) {
      case 'create_task':
      case 'create_story':
      case 'create_goal':
        return 'Create all';
      case 'suggest_relation':
      case 'remove_relation':
      case 'update_relation':
      case 'suggest_update':
      default:
        return 'Apply all';
    }
  }

  private describePendingConfirmationTitle(
    actions: WorkspaceChatAction[]
  ): string {
    if (actions.length === 1) {
      return actions[0]?.title ?? 'Pending action';
    }

    const firstAction = actions[0];
    const sharedGroupTitle = firstAction?.groupTitle?.trim();
    if (
      sharedGroupTitle &&
      actions.every(
        (action) =>
          action.groupId === firstAction?.groupId &&
          action.groupTitle?.trim() === sharedGroupTitle
      )
    ) {
      return `${sharedGroupTitle} (${actions.length})`;
    }

    const kinds = new Set(actions.map((action) => action.kind));
    if (kinds.size === 1) {
      switch (actions[0]?.kind) {
        case 'create_task':
          return `Tasks to create (${actions.length})`;
        case 'create_story':
          return `Stories to create (${actions.length})`;
        case 'create_goal':
          return `Goals to create (${actions.length})`;
        case 'suggest_relation':
          return `Suggested relations (${actions.length})`;
        case 'remove_relation':
          return `Relations to remove (${actions.length})`;
        case 'update_relation':
          return `Relation updates (${actions.length})`;
        case 'suggest_update':
          return `Suggested updates (${actions.length})`;
        default:
          break;
      }
    }

    return `Pending actions (${actions.length})`;
  }

  private describeAppliedActions(actions: WorkspaceChatAction[]): string {
    if (actions.length === 1) {
      const action = actions[0];
      if (!action) {
        return 'Applied 0 actions.';
      }
    const verb =
        action.kind === 'suggest_relation' ||
        action.kind === 'suggest_update'
          ? 'Applied'
          : action.kind === 'update_relation'
            ? 'Updated'
          : action.kind === 'remove_relation'
            ? 'Removed'
          : action.kind === 'create_goal_blueprint'
            ? 'Created'
          : 'Created';
      return `${verb} ${this.describeActionTarget(action)}.`;
    }

    const summaries = [
      this.describeAppliedActionKind(actions, 'create_task', 'Created', 'task'),
      this.describeAppliedActionKind(actions, 'create_story', 'Created', 'story'),
      this.describeAppliedActionKind(actions, 'create_goal', 'Created', 'goal'),
      this.describeAppliedActionKind(
        actions,
        'create_goal_blueprint',
        'Created',
        'plan'
      ),
      this.describeAppliedActionKind(
        actions,
        'suggest_relation',
        'Applied',
        'relation'
      ),
      this.describeAppliedActionKind(
        actions,
        'remove_relation',
        'Removed',
        'relation'
      ),
      this.describeAppliedActionKind(
        actions,
        'update_relation',
        'Updated',
        'relation'
      ),
      this.describeAppliedActionKind(
        actions,
        'suggest_update',
        'Applied',
        'update'
      ),
    ].filter((entry): entry is string => entry !== null);

    if (summaries.length === 0) {
      return `Applied ${actions.length} actions.`;
    }
    if (summaries.length === 1) {
      return `${summaries[0]}.`;
    }
    if (summaries.length === 2) {
      return `${summaries[0]} and ${this.lowercaseFirstCharacter(summaries[1])}.`;
    }
    const leading = summaries
      .slice(0, -1)
      .map((summary, index) =>
        index === 0 ? summary : this.lowercaseFirstCharacter(summary)
      )
      .join(', ');
    const trailingSummary = summaries[summaries.length - 1];
    if (!trailingSummary) {
      return `${leading}.`;
    }
    const trailing = this.lowercaseFirstCharacter(trailingSummary);
    return `${leading}, and ${trailing}.`;
  }

  private describeAppliedActionKind(
    actions: WorkspaceChatAction[],
    kind: WorkspaceChatAction['kind'],
    verb: 'Applied' | 'Created' | 'Removed' | 'Updated',
    noun: string
  ): string | null {
    const count = actions.filter((action) => action.kind === kind).length;
    if (count === 0) {
      return null;
    }
    return `${verb} ${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  private lowercaseFirstCharacter(value: string): string {
    if (value.length === 0) {
      return value;
    }
    return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
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
