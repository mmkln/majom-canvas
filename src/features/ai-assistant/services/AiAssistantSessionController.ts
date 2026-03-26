import type { WorkspaceView } from '../../shell/WorkspaceView.ts';
import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
} from '../aiAssistantEvents.ts';
import {
  getAiAssistantActionGroupButtonLabel,
  getAiAssistantActionLabel,
  type AiAssistantAction,
  type AiAssistantActionExecutionHandler,
  type AiAssistantActionExecutionRequest,
  type AiAssistantActionExecutionResult,
} from '../aiAssistantActions.ts';
import {
  scopeAiAssistantContext,
  type AiAssistantContextMode,
} from './AiAssistantContextMode.ts';
import { AiAssistantMemoryStore } from './AiAssistantMemoryStore.ts';
import { AiAssistantPersistence } from './AiAssistantPersistence.ts';
import type {
  AiAssistantServiceLike,
} from './AiAssistantService.ts';
import { AiAssistantService } from './AiAssistantService.ts';
import type {
  AiAssistantProfile,
  AiAssistantActiveScenario,
} from './AiAssistantContextTypes.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import type { AiAssistantScenarioDescriptor } from './AiAssistantScenarioTypes.ts';
import {
  buildAiAssistantScenarioTargetInputFromSnapshot,
  resolveAiAssistantScenarioFromPrompt,
  resolveAiAssistantScenarioFromSubmission,
  resolveAiAssistantScenario,
} from './AiAssistantScenarioResolver.ts';
import {
  buildAiAssistantTelemetryScenarioContext,
  type AiAssistantTelemetryCollector,
} from './AiAssistantTelemetryTypes.ts';
import { getSharedAiAssistantTelemetryCollector } from './AiAssistantTelemetryStore.ts';
import type {
  AiAssistantMessage,
  AiAssistantQuickAction,
  AiAssistantReplyProgress,
} from './AiAssistantTypes.ts';
import type { AiAssistantPreparedSubmission } from './AiAssistantPreparedSubmission.ts';
import type { AiAssistantToolHost } from './AiAssistantToolTypes.ts';
import { resolveAiAssistantIntentProfile } from './AiAssistantIntentPlanFactory.ts';
import { buildAiAssistantConversationScenario } from './AiAssistantScenarioTypes.ts';
import { type AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';

type AiAssistantSessionState = {
  conversationKey: string;
  messages: AiAssistantMessage[];
  replying: boolean;
  replyProgress: AiAssistantReplyProgress | null;
  pendingRequestId: string | null;
  abortController: AbortController | null;
  contextMode: AiAssistantContextMode;
};

export type AiAssistantPanelState = {
  currentView: WorkspaceView;
  context: AiAssistantCanvasSnapshot | null;
  messages: AiAssistantMessage[];
  pendingConfirmation: AiAssistantPendingConfirmation | null;
  quickActions: AiAssistantQuickAction[];
  replying: boolean;
  replyProgress?: AiAssistantReplyProgress | null;
  canClear: boolean;
  contextEnabled: boolean;
  contextMode: AiAssistantContextMode;
  composerPlaceholder: string;
};

export type AiAssistantPendingConfirmation = {
  messageId: string;
  actionIds: string[];
  actionLabel: string;
  actionTitle: string;
  actionCount: number;
};

type AiAssistantActionStatePatch = Partial<
  Pick<
    AiAssistantAction,
    'status' | 'errorMessage' | 'createdElementId' | 'affectedElementIds'
  >
>;

type AiAssistantPreparedExecutionRequest = {
  sourceAction: AiAssistantAction;
  action: AiAssistantActionExecutionRequest['action'];
  allowSelectionTargeting: boolean;
};

const TYPED_INITIAL_REPLY_PROGRESS = {
  phase: 'routing' as const,
  label: 'Preparing workflow',
  detail: 'Selecting the steps for this request.',
};

const FALLBACK_INITIAL_REPLY_PROGRESS = {
  phase: 'routing' as const,
  label: 'Analyzing request',
  detail: 'Choosing the next steps.',
};

function buildInitialReplyProgress(
  scenario: AiAssistantScenarioDescriptor,
  i18n?: Pick<I18nService, 't'>
): AiAssistantReplyProgress {
  return scenario.variant === 'typed'
    ? {
        ...TYPED_INITIAL_REPLY_PROGRESS,
        label:
          i18n?.t('aiChat.progress.preparingWorkflowLabel') ??
          TYPED_INITIAL_REPLY_PROGRESS.label,
        detail:
          i18n?.t('aiChat.progress.preparingWorkflowDetail') ??
          TYPED_INITIAL_REPLY_PROGRESS.detail,
      }
    : {
        ...FALLBACK_INITIAL_REPLY_PROGRESS,
        label:
          i18n?.t('aiChat.progress.analyzingRequestLabel') ??
          FALLBACK_INITIAL_REPLY_PROGRESS.label,
        detail:
          i18n?.t('aiChat.progress.analyzingRequestDetail') ??
          FALLBACK_INITIAL_REPLY_PROGRESS.detail,
      };
}

type AiAssistantSessionControllerOptions = {
  persistence?: AiAssistantPersistence;
  service?: AiAssistantServiceLike;
  resolveLiveHost?: () => AiAssistantToolHost | null;
  telemetry?: AiAssistantTelemetryCollector;
  runtime?: AppRuntime;
};

export class AiAssistantSessionController {
  private readonly persistence: AiAssistantPersistence;
  private readonly service: AiAssistantServiceLike;
  private readonly memoryStore = new AiAssistantMemoryStore();
  private readonly sessions = new Map<string, AiAssistantSessionState>();
  private readonly listeners = new Set<() => void>();
  private readonly resolveLiveHost?: (() => AiAssistantToolHost | null) | undefined;
  private readonly telemetry: AiAssistantTelemetryCollector;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private currentView: WorkspaceView = 'canvas';
  private context: AiAssistantCanvasSnapshot | null = null;
  private activeConversationKey = 'canvas:draft';

  constructor(options: AiAssistantSessionControllerOptions = {}) {
    this.persistence = options.persistence ?? new AiAssistantPersistence();
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.telemetry =
      options.telemetry ?? getSharedAiAssistantTelemetryCollector();
    this.service =
      options.service ??
      new AiAssistantService({
        telemetry: this.telemetry,
        i18n: this.i18n,
      });
    this.resolveLiveHost = options.resolveLiveHost;
    this.switchConversationScope();
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshSeedMessageIfNeeded();
      this.emitChange();
    });
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
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
  }

  public setView(view: WorkspaceView): void {
    if (this.currentView === view) return;
    this.currentView = view;
    this.switchConversationScope();
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
  }

  public setContext(context: AiAssistantCanvasSnapshot | null): void {
    this.context = this.normalizeContext(context);
    this.switchConversationScope();
    this.refreshSeedMessageIfNeeded();
    this.emitChange();
  }

  public getState(): AiAssistantPanelState {
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
          ? this.i18n.t('aiChat.placeholder.noContext')
          : !scopedContext && this.currentView !== 'canvas'
          ? this.i18n.t('aiChat.placeholder.unavailableInView')
          : !scopedContext && session.contextMode === 'selection'
          ? this.i18n.t('aiChat.placeholder.selectItems')
          : session.contextMode === 'viewport'
          ? this.i18n.t('aiChat.placeholder.viewport')
          : session.contextMode === 'selection'
          ? this.i18n.t('aiChat.placeholder.selection')
          : this.i18n.t('aiChat.placeholder.canvas'),
    };
  }

  public setContextEnabled(enabled: boolean): void {
    this.setContextMode(enabled ? 'canvas' : 'none');
  }

  public setContextMode(mode: AiAssistantContextMode): void {
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
    submission: AiAssistantPreparedSubmission
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
    const scenario =
      submission.scenario ??
      resolveAiAssistantScenarioFromSubmission({
        intent: submission.intent,
        intentContext: submission.intentContext,
        source: submission.source ?? 'manual',
        snapshot: submission.snapshot,
        contextMode: submission.contextMode,
      });
    await this.submitRequest(submission.prompt, {
      profile: submission.profile,
      source: submission.source ?? 'manual',
      intent: submission.intent,
      intentContext: submission.intentContext,
      scenario,
      liveHost: submission.liveHost ?? this.resolveLiveHost?.() ?? null,
      requestLabel: submission.requestLabel,
      requestMessageKind: submission.requestMessageKind,
    });
  }

  private async submitRequest(
    prompt: string,
    options: {
      profile?: AiAssistantProfile;
      source?: 'manual' | 'intent';
      intent?: AiAssistantPreparedSubmission['intent'];
      intentContext?: AiAssistantIntentContext;
      scenario?: AiAssistantScenarioDescriptor;
      liveHost?: AiAssistantToolHost | null;
      requestLabel?: string;
      requestMessageKind?: AiAssistantPreparedSubmission['requestMessageKind'];
    } = {}
  ): Promise<void> {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;

    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    if (session.replying) {
      session.abortController?.abort();
    }
    const contextSnapshot = this.getScopedContext(session);

    const continuedScenario =
      !options.scenario &&
      !options.intent &&
      (options.source === undefined || options.source === 'manual')
        ? this.resolvePendingFollowupScenario(
            conversationKey,
            contextSnapshot,
            session.contextMode
          )
        : undefined;
    const resolvedScenario =
      options.scenario ??
      continuedScenario ??
      resolveAiAssistantScenarioFromPrompt({
        prompt: trimmed,
        source: options.source ?? 'manual',
        intent: options.intent,
        intentContext: options.intentContext,
        snapshot: contextSnapshot,
        contextMode: session.contextMode,
      });
    const resolvedIntent = resolvedScenario.intent;
    const resolvedIntentContext = resolvedScenario.intentContext;
    const resolvedSource =
      options.source ?? (options.intent ? 'intent' : 'manual');
    const resolvedProfile =
      options.profile ??
      (resolvedSource === 'intent' && resolvedIntent
        ? resolveAiAssistantIntentProfile(resolvedIntent, undefined)
        : undefined);
    const requestIntent =
      resolvedSource === 'intent' ? (resolvedIntent ?? undefined) : undefined;
    const requestIntentContext =
      resolvedSource === 'intent' ? resolvedIntentContext : undefined;

    const requestMessage =
      options.requestMessageKind === 'command'
        ? this.createCommandMessage(
            options.requestLabel ?? trimmed,
            trimmed,
            requestIntent,
            requestIntentContext
          )
        : options.requestMessageKind === 'system'
        ? this.service.createSystemMessage(options.requestLabel ?? trimmed)
        : {
            ...this.service.createMessage('user', trimmed),
            requestPrompt: requestIntent ? trimmed : undefined,
            requestIntent,
            requestIntentContext,
          };
    session.messages = [...session.messages, requestMessage];
    this.persistence.saveConversation(conversationKey, session.messages);

    const requestId = this.createRequestId();
    const abortController =
      typeof AbortController === 'undefined' ? null : new AbortController();
    session.replying = true;
    session.replyProgress = buildInitialReplyProgress(resolvedScenario, this.i18n);
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.emitChange();

    const memoryScenario = this.toMemoryScenario(resolvedScenario);
    const memorySnapshot = this.memoryStore.recordUserInput({
      conversationKey,
      prompt: trimmed,
      snapshot: contextSnapshot,
      intent: resolvedIntent ?? null,
      intentContext: resolvedIntentContext,
      scenario: memoryScenario,
    });

    try {
      const reply = await this.service.reply({
        prompt: trimmed,
        source: resolvedSource,
        intent: requestIntent,
        intentContext: requestIntentContext,
        scenario: options.scenario ?? resolvedScenario,
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
        telemetryContext: {
          conversationKey,
          requestId,
        },
      });
      const awaitingUserInput = this.shouldMarkAwaitingUserInput(
        reply,
        resolvedScenario
      );
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt: trimmed,
        reply: reply.content,
        snapshot: contextSnapshot,
        awaitingUserInput,
        scenario: memoryScenario,
      });
      this.commitReply(conversationKey, requestId, {
        ...reply,
        requestIntent:
          resolvedSource === 'intent' && requestIntent
            ? requestIntent
            : reply.requestIntent,
        requestIntentContext:
          resolvedSource === 'intent' && requestIntentContext
            ? requestIntentContext
            : reply.requestIntentContext,
      }, resolvedScenario);
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
        this.service.createMessage('assistant', `AI Assistant request failed: ${message}`)
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
    const activeScenario = this.memoryStore.get(conversationKey).activeScenario;
    const contextSnapshot = this.getScopedContext(session);
    const scenario = activeScenario
      ? this.hydrateScenarioDescriptorFromActiveScenario(
          activeScenario,
          contextSnapshot,
          session.contextMode
        )
      : buildAiAssistantConversationScenario();

    session.messages = session.messages.slice(0, messageIndex);
    session.replying = true;
    session.replyProgress = buildInitialReplyProgress(scenario, this.i18n);
    session.pendingRequestId = requestId;
    session.abortController = abortController;
    this.persistence.saveConversation(conversationKey, session.messages);
    this.memoryStore.clear(conversationKey);
    this.emitChange();

    const prompt =
      promptMessage.requestPrompt?.trim() || promptMessage.content.trim();
    const memorySnapshot = this.memoryStore.recordUserInput({
      conversationKey,
      prompt,
      snapshot: contextSnapshot,
      intent: activeScenario?.intent ?? null,
      intentContext: activeScenario?.intentContext,
      scenario: activeScenario ?? null,
    });

    try {
      const reply = await this.service.reply({
        prompt,
        source: 'manual',
        intent: undefined,
        intentContext: undefined,
        scenario,
        profile: undefined,
        contextMode: session.contextMode,
        memory: memorySnapshot,
        snapshot: contextSnapshot,
        validationSnapshot: contextSnapshot,
        allowActions: this.currentView === 'canvas',
        liveHost: this.resolveLiveHost?.() ?? null,
        onProgress: (progress) => {
          this.updateReplyProgress(conversationKey, requestId, progress);
        },
        signal: abortController?.signal,
        telemetryContext: {
          conversationKey,
          requestId,
        },
      });
      const awaitingUserInput = this.shouldMarkAwaitingUserInput(reply);
      this.memoryStore.updateAfterReply({
        conversationKey,
        prompt,
        reply: reply.content,
        snapshot: contextSnapshot,
        awaitingUserInput,
        scenario: activeScenario ?? null,
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
        this.service.createMessage('assistant', `AI Assistant request failed: ${message}`)
      );
    }
  }

  public async executeMessageAction(
    messageId: string,
    actionId: string,
    executor?: AiAssistantActionExecutionHandler
  ): Promise<void> {
    await this.executeMessageActions(messageId, [actionId], executor);
  }

  public async executeMessageActions(
    messageId: string,
    actionIds: string[],
    executor?: AiAssistantActionExecutionHandler
  ): Promise<void> {
    const conversationKey = this.activeConversationKey;
    const session = this.ensureSession(conversationKey);
    const pendingActions = actionIds
      .map((actionId) => this.getActionFromSession(session, messageId, actionId))
      .filter(
        (action): action is AiAssistantAction =>
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

    const appliedActions: AiAssistantAction[] = [];
    const executionGroups: Array<{
      sourceAction: AiAssistantAction;
      preparedRequests: AiAssistantPreparedExecutionRequest[];
      executionRequests: AiAssistantActionExecutionRequest[];
    }> = pendingActions.map((action) => {
      const preparedRequests = this.expandExecutionRequestsForAction(action, session);
      return {
        sourceAction: action,
        preparedRequests,
        executionRequests: preparedRequests.map((request) =>
          this.toExecutionRequest(request)
        ),
      };
    });
    const requests = executionGroups.reduce<AiAssistantActionExecutionRequest[]>(
      (allRequests, group) => {
        allRequests.push(...group.executionRequests);
        return allRequests;
      },
      []
    );
    if (requests.length === 0) {
      return;
    }

    if (requests.length > 1 && executor?.executeBatch) {
      try {
        const results = await executor.executeBatch(requests);
        let resultIndex = 0;
        executionGroups.forEach((group) => {
          const groupResults = results.slice(
            resultIndex,
            resultIndex + group.executionRequests.length
          );
          resultIndex += group.executionRequests.length;
          this.commitExpandedActionExecutionResults(
            conversationKey,
            messageId,
            group.sourceAction,
            group.executionRequests,
            groupResults,
            appliedActions
          );
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to apply action.';
        pendingActions.forEach((action) => {
          this.updateActionState(conversationKey, messageId, action.id, {
            status: 'failed',
            errorMessage: message,
          });
        });
      }
    } else {
      for (const group of executionGroups) {
        const resultsForGroup: AiAssistantActionExecutionResult[] = [];
        for (const request of group.executionRequests) {
          try {
            const result: AiAssistantActionExecutionResult = executor
              ? await executor(request)
              : {
                  status: 'failed',
                  errorMessage: 'Canvas is unavailable.',
                };
            resultsForGroup.push(result);
          } catch (error) {
            resultsForGroup.push({
              status: 'failed',
              errorMessage:
                error instanceof Error ? error.message : 'Failed to apply action.',
            });
          }
        }
        this.commitExpandedActionExecutionResults(
          conversationKey,
          messageId,
          group.sourceAction,
          group.executionRequests,
          resultsForGroup,
          appliedActions
        );
      }
    }

    if (appliedActions.length === 0) {
      return;
    }

    const activeScenario = this.memoryStore.get(conversationKey).activeScenario;
    this.memoryStore.recordAppliedActions({
      conversationKey,
      actions: appliedActions,
      sourceMessageId: messageId,
      scenario: activeScenario,
    });
    const scenarioTelemetry = buildAiAssistantTelemetryScenarioContext({
      scenario: activeScenario,
      fallbackReason:
        activeScenario?.kind === 'fallback' ? 'fallback_scenario' : undefined,
    });
    this.telemetry.record({
      kind: 'action_execution',
      timestamp: Date.now(),
      context: {
        conversationKey,
        requestId: messageId,
      },
      ...(scenarioTelemetry ?? {}),
      messageId,
      appliedActionCount: appliedActions.length,
      pendingActionCount: pendingActions.length,
      actionKinds: appliedActions.map((action) => action.kind),
    });

    this.appendConversationMessage(
      conversationKey,
      this.service.createSystemMessage(
        this.describeAppliedActions(appliedActions)
      )
    );
  }

  private commitActionExecutionResult(
    conversationKey: string,
    messageId: string,
    action: AiAssistantAction,
    result: AiAssistantActionExecutionResult | undefined,
    appliedActions: AiAssistantAction[]
  ): void {
    if (result?.status === 'applied') {
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
      return;
    }

    this.updateActionState(conversationKey, messageId, action.id, {
      status: 'failed',
      errorMessage: result?.errorMessage ?? 'Failed to apply action.',
    });
  }

  private commitExpandedActionExecutionResults(
    conversationKey: string,
    messageId: string,
    sourceAction: AiAssistantAction,
    executionRequests: AiAssistantActionExecutionRequest[],
    results: AiAssistantActionExecutionResult[],
    appliedActions: AiAssistantAction[]
  ): void {
    if (sourceAction.kind === 'create_goals') {
      this.commitCreateGoalsExecutionResults(
        conversationKey,
        messageId,
        sourceAction,
        executionRequests,
        results,
        appliedActions
      );
      return;
    }

    const request = executionRequests[0];
    if (!request) {
      return;
    }
    this.commitActionExecutionResult(
      conversationKey,
      messageId,
      request.action,
      results[0],
      appliedActions
    );
  }

  private commitCreateGoalsExecutionResults(
    conversationKey: string,
    messageId: string,
    sourceAction: AiAssistantAction,
    executionRequests: AiAssistantActionExecutionRequest[],
    results: AiAssistantActionExecutionResult[],
    appliedActions: AiAssistantAction[]
  ): void {
    const createdElementIds = results
      .map((result) => result.createdElementId)
      .filter((value): value is string => typeof value === 'string');
    const affectedElementIds = results.reduce<string[]>((ids, result) => {
      const nextIds = result.affectedElementIds ?? [];
      nextIds.forEach((id) => {
        if (!ids.includes(id)) {
          ids.push(id);
        }
      });
      return ids;
    }, []);
    const failure = results.find((result) => result.status === 'failed');
    const allApplied =
      results.length === executionRequests.length &&
      results.every((result) => result.status === 'applied');

    if (!allApplied) {
      this.updateActionState(conversationKey, messageId, sourceAction.id, {
        status: 'failed',
        errorMessage: failure?.errorMessage ?? 'Failed to apply action.',
      });
      return;
    }

    this.updateActionState(conversationKey, messageId, sourceAction.id, {
      status: 'applied',
      errorMessage: undefined,
      createdElementId: createdElementIds[0],
      affectedElementIds:
        createdElementIds.length > 0
          ? createdElementIds
          : affectedElementIds.length > 0
            ? affectedElementIds
            : undefined,
    });
    const updatedAction = this.getActionFromConversation(
      conversationKey,
      messageId,
      sourceAction.id
    );
    if (updatedAction) {
      appliedActions.push(updatedAction);
    }
  }

  private expandExecutionRequestsForAction(
    action: AiAssistantAction,
    session: AiAssistantSessionState
  ): AiAssistantPreparedExecutionRequest[] {
    const allowSelectionTargeting = session.contextMode !== 'none';

    if (action.kind !== 'create_goals') {
      return [
        {
          sourceAction: action,
          action,
          allowSelectionTargeting,
        },
      ];
    }

    const baseEvidence = {
      supportedBy: action.supportedBy,
      evidenceIds: action.evidenceIds,
      sourceContext: action.sourceContext,
    };

    return action.items.map((item, index) => ({
      sourceAction: action,
      allowSelectionTargeting,
      action: {
        id: `${action.id}-goal-${index + 1}`,
        kind: 'create_goal',
        label: getAiAssistantActionLabel('create_goal', this.i18n),
        title: item.title,
        status: 'idle',
        description: item.description,
        priority: item.priority,
        elementStatus: item.elementStatus,
        target: item.target ?? action.target,
        supportedBy: item.supportedBy ?? baseEvidence.supportedBy,
        evidenceIds: item.evidenceIds ?? baseEvidence.evidenceIds,
        sourceContext: item.sourceContext ?? baseEvidence.sourceContext,
        groupId: action.groupId,
        groupTitle: action.groupTitle,
        groupSummary: action.groupSummary,
      } as AiAssistantAction,
    }));
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
    context: AiAssistantCanvasSnapshot | null
  ): AiAssistantCanvasSnapshot | null {
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

  private ensureSession(conversationKey: string): AiAssistantSessionState {
    const existing = this.sessions.get(conversationKey);
    if (existing) return existing;

    const session: AiAssistantSessionState = {
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

  private ensureSeedMessage(session: AiAssistantSessionState): void {
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
    session: AiAssistantSessionState
  ): AiAssistantMessage[] {
    if (session.contextMode === 'none') {
      return [];
    }
    return [this.service.createWelcomeMessage(this.getScopedContext(session))];
  }

  private getScopedContext(
    session: AiAssistantSessionState
  ): AiAssistantCanvasSnapshot | null {
    return scopeAiAssistantContext(this.context, session.contextMode);
  }

  private commitReply(
    conversationKey: string,
    requestId: string,
    reply: AiAssistantMessage,
    scenario?: AiAssistantScenarioDescriptor
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session || session.pendingRequestId !== requestId) return;
    session.messages = [
      ...session.messages,
      this.decorateAssistantReply(reply, scenario),
    ];
    this.persistence.saveConversation(conversationKey, session.messages);
    this.finishPendingRequest(conversationKey, requestId);
  }

  private decorateAssistantReply(
    reply: AiAssistantMessage,
    scenario?: AiAssistantScenarioDescriptor
  ): AiAssistantMessage {
    if (reply.role !== 'assistant') {
      return reply;
    }

    const awaitingUserInput = this.shouldMarkAwaitingUserInput(reply, scenario);

    return awaitingUserInput ? { ...reply, awaitingUserInput: true } : reply;
  }

  private shouldMarkAwaitingUserInput(
    reply: AiAssistantMessage,
    scenario?: AiAssistantScenarioDescriptor
  ): boolean {
    return (
      !reply.reviewFindings &&
      (!Array.isArray(reply.actions) || reply.actions.length === 0) &&
      scenario?.variant === 'typed'
    );
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
    progress: AiAssistantReplyProgress
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session || session.pendingRequestId !== requestId) {
      return;
    }
    session.replyProgress = progress;
    this.emitChange();
  }

  private toMemoryScenario(
    scenario: AiAssistantScenarioDescriptor
  ): AiAssistantActiveScenario {
    const allowedActionCount = Array.isArray(scenario.allowedActions)
      ? scenario.allowedActions.length
      : 0;
    return {
      id: scenario.id,
      kind: scenario.variant,
      intent: scenario.intent,
      intentContext: scenario.intentContext,
      mode: scenario.mode,
      scope: scenario.scope,
      confidence: scenario.confidence,
      confirmationMode: scenario.confirmationMode,
      routeLength:
        scenario.variant === 'typed' && scenario.confirmationMode === 'batch'
          ? 'long'
          : scenario.variant === 'typed'
            ? 'short'
            : 'long',
      proposalStyle:
        scenario.confirmationMode === 'none' ? 'direct' : 'clarify-first',
      targetSummary: scenario.target?.title?.trim() || scenario.target?.id,
      missingSlots: [...scenario.missingSlots],
      allowedActionCount,
    };
  }

  private resolvePendingFollowupScenario(
    conversationKey: string,
    contextSnapshot: AiAssistantCanvasSnapshot | null,
    contextMode: AiAssistantContextMode
  ): AiAssistantScenarioDescriptor | null {
    const memory = this.memoryStore.get(conversationKey);
    if (!memory.awaitingInput || !memory.activeScenario) {
      return null;
    }
    return this.hydrateScenarioDescriptorFromActiveScenario(
      memory.activeScenario,
      contextSnapshot,
      contextMode
    );
  }

  private hydrateScenarioDescriptorFromActiveScenario(
    activeScenario: AiAssistantActiveScenario,
    contextSnapshot: AiAssistantCanvasSnapshot | null,
    contextMode: AiAssistantContextMode
  ): AiAssistantScenarioDescriptor {
    return resolveAiAssistantScenario({
      source: 'manual',
      intent: normalizeActiveScenarioIntent(activeScenario.intent),
      intentContext: activeScenario.intentContext,
      contextMode,
      target: buildAiAssistantScenarioTargetInputFromSnapshot(contextSnapshot),
    });
  }

  private isAbortError(error: unknown): boolean {
    if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
      return error.name === 'AbortError';
    }
    return error instanceof Error && error.name === 'AbortError';
  }

  private getActionFromSession(
    session: AiAssistantSessionState,
    messageId: string,
    actionId: string
  ): AiAssistantAction | null {
    const message = session.messages.find((entry) => entry.id === messageId);
    const action = message?.actions?.find((entry) => entry.id === actionId);
    return action ?? null;
  }

  private getActionFromConversation(
    conversationKey: string,
    messageId: string,
    actionId: string
  ): AiAssistantAction | null {
    const session = this.sessions.get(conversationKey);
    if (!session) return null;
    return this.getActionFromSession(session, messageId, actionId);
  }

  private updateActionState(
    conversationKey: string,
    messageId: string,
    actionId: string,
    patch: AiAssistantActionStatePatch
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
    message: AiAssistantMessage
  ): void {
    const session = this.sessions.get(conversationKey);
    if (!session) return;
    session.messages = [...session.messages, message];
    this.persistence.saveConversation(conversationKey, session.messages);
    this.emitChange();
  }

  private applyActionStatePatch<T extends AiAssistantAction>(
    action: T,
    patch: AiAssistantActionStatePatch
  ): T {
    return {
      ...action,
      ...patch,
    };
  }

  private resolvePendingConfirmation(
    session: AiAssistantSessionState
  ): AiAssistantPendingConfirmation | null {
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
      actionLabel: getAiAssistantActionGroupButtonLabel(idleActions, {
        singleActionMode: 'action-label',
      }, this.i18n),
      actionTitle: this.describePendingConfirmationTitle(idleActions),
      actionCount: idleActions.length,
    };
  }

  private createCommandMessage(
    content: string,
    requestPrompt: string,
    requestIntent?: AiAssistantPreparedSubmission['intent'],
    requestIntentContext?: AiAssistantIntentContext
  ): AiAssistantMessage {
    return {
      id: `chat-${Math.random().toString(36).slice(2, 10)}`,
      role: 'system',
      kind: 'command',
      content,
      createdAt: Date.now(),
      requestPrompt,
      requestIntent,
      requestIntentContext,
    };
  }

  private describeActionTarget(action: AiAssistantAction): string {
    switch (action.kind) {
      case 'create_task':
        return this.i18n.t('aiChat.applied.target.task', {
          title: action.title,
        });
      case 'create_story':
        return this.i18n.t('aiChat.applied.target.story', {
          title: action.title,
        });
      case 'create_goal':
        return this.i18n.t('aiChat.applied.target.goal', {
          title: action.title,
        });
      case 'create_goals':
        return this.i18n.t('aiChat.applied.target.strategicGoals', {
          count: action.items.length,
        });
      case 'create_goal_blueprint':
        return this.i18n.t('aiChat.applied.target.plan', {
          title: action.title,
        });
      case 'suggest_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return this.i18n.t('aiChat.applied.target.relation', {
          relation: this.formatRelationTypeLabel(action.relationType),
          from,
          to,
        });
      }
      case 'remove_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return this.i18n.t('aiChat.applied.target.relation', {
          relation: this.formatRelationTypeLabel(action.relationType),
          from,
          to,
        });
      }
      case 'update_relation': {
        const from = action.fromLabel || action.fromId;
        const to = action.toLabel || action.toId;
        return this.i18n.t('aiChat.applied.target.updatedRelation', {
          currentRelation: this.formatRelationTypeLabel(
            action.currentRelationType
          ),
          from,
          to,
          nextRelation: this.formatRelationTypeLabel(action.nextRelationType),
        });
      }
      case 'suggest_update':
        return this.i18n.t('aiChat.applied.target.update', {
          kind: this.formatElementKindLabel(action.elementKind),
          title: action.targetTitle || action.elementId,
        });
    }
  }

  private describePendingConfirmationTitle(
    actions: AiAssistantAction[]
  ): string {
    if (actions.length === 1) {
      const action = actions[0];
      if (!action) {
        return this.i18n.t('aiChat.pending.singleFallback');
      }
      if (action.kind === 'create_goals') {
        return `${
          action.title || this.i18n.t('aiChat.pending.strategicGoals')
        } (${action.items.length})`;
      }
      return action.title ?? this.i18n.t('aiChat.pending.singleFallback');
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
          return this.i18n.t('aiChat.pending.tasksToCreate', {
            count: actions.length,
          });
        case 'create_story':
          return this.i18n.t('aiChat.pending.storiesToCreate', {
            count: actions.length,
          });
        case 'create_goal':
          return this.i18n.t('aiChat.pending.goalsToCreate', {
            count: actions.length,
          });
        case 'create_goals':
          return this.i18n.t('aiChat.pending.goalsToCreate', {
            count:
              firstAction?.kind === 'create_goals'
                ? firstAction.items.length
                : actions.length,
          });
        case 'suggest_relation':
          return this.i18n.t('aiChat.pending.suggestedRelations', {
            count: actions.length,
          });
        case 'remove_relation':
          return this.i18n.t('aiChat.pending.relationsToRemove', {
            count: actions.length,
          });
        case 'update_relation':
          return this.i18n.t('aiChat.pending.relationUpdates', {
            count: actions.length,
          });
        case 'suggest_update':
          return this.i18n.t('aiChat.pending.suggestedUpdates', {
            count: actions.length,
          });
        default:
          break;
      }
    }

    return this.i18n.t('aiChat.pending.multiple', {
      count: actions.length,
    });
  }

  private describeAppliedActions(actions: AiAssistantAction[]): string {
    if (actions.length === 1) {
      const action = actions[0];
      if (!action) {
        return this.i18n.t('aiChat.applied.none');
      }
      const verb =
        action.kind === 'suggest_relation' ||
        action.kind === 'suggest_update'
          ? this.i18n.t('aiChat.applied.verb.applied')
          : action.kind === 'update_relation'
            ? this.i18n.t('aiChat.applied.verb.updated')
          : action.kind === 'remove_relation'
            ? this.i18n.t('aiChat.applied.verb.removed')
          : action.kind === 'create_goal_blueprint'
            ? this.i18n.t('aiChat.applied.verb.created')
            : action.kind === 'create_goals'
              ? this.i18n.t('aiChat.applied.verb.created')
          : this.i18n.t('aiChat.applied.verb.created');
      return `${verb} ${this.describeActionTarget(action)}.`;
    }

    const summaries = [
      this.describeAppliedActionKind(actions, 'create_task', 'createdTasks'),
      this.describeAppliedActionKind(actions, 'create_story', 'createdStories'),
      this.describeAppliedActionKind(actions, 'create_goal', 'createdGoals'),
      this.describeAppliedActionKind(
        actions,
        'create_goals',
        'createdStrategicGoals',
        (action) => action.items.length
      ),
      this.describeAppliedActionKind(
        actions,
        'create_goal_blueprint',
        'createdPlans'
      ),
      this.describeAppliedActionKind(
        actions,
        'suggest_relation',
        'appliedRelations'
      ),
      this.describeAppliedActionKind(
        actions,
        'remove_relation',
        'removedRelations'
      ),
      this.describeAppliedActionKind(
        actions,
        'update_relation',
        'updatedRelations'
      ),
      this.describeAppliedActionKind(
        actions,
        'suggest_update',
        'appliedUpdates'
      ),
    ].filter((entry): entry is string => entry !== null);

    if (summaries.length === 0) {
      return this.i18n.t('aiChat.applied.actions', {
        count: actions.length,
      });
    }

    return `${summaries.join('; ')}.`;
  }

  private describeAppliedActionKind<K extends AiAssistantAction['kind']>(
    actions: AiAssistantAction[],
    kind: K,
    summaryKey:
      | 'createdTasks'
      | 'createdStories'
      | 'createdGoals'
      | 'createdStrategicGoals'
      | 'createdPlans'
      | 'appliedRelations'
      | 'removedRelations'
      | 'updatedRelations'
      | 'appliedUpdates',
    countSelector?: (action: Extract<AiAssistantAction, { kind: K }>) => number
  ): string | null {
    const count = actions.reduce((total, action) => {
      if (action.kind !== kind) {
        return total;
      }
      return total + (countSelector ? countSelector(action as Extract<AiAssistantAction, { kind: K }>) : 1);
    }, 0);
    if (count === 0) {
      return null;
    }
    switch (summaryKey) {
      case 'createdTasks':
        return this.i18n.t('aiChat.applied.createdTasks', { count });
      case 'createdStories':
        return this.i18n.t('aiChat.applied.createdStories', { count });
      case 'createdGoals':
        return this.i18n.t('aiChat.applied.createdGoals', { count });
      case 'createdStrategicGoals':
        return this.i18n.t('aiChat.applied.createdStrategicGoals', { count });
      case 'createdPlans':
        return this.i18n.t('aiChat.applied.createdPlans', { count });
      case 'appliedRelations':
        return this.i18n.t('aiChat.applied.appliedRelations', { count });
      case 'removedRelations':
        return this.i18n.t('aiChat.applied.removedRelations', { count });
      case 'updatedRelations':
        return this.i18n.t('aiChat.applied.updatedRelations', { count });
      case 'appliedUpdates':
        return this.i18n.t('aiChat.applied.appliedUpdates', { count });
    }
  }

  private toExecutionRequest(
    request: AiAssistantPreparedExecutionRequest
  ): AiAssistantActionExecutionRequest {
    return {
      action: request.action,
      allowSelectionTargeting: request.allowSelectionTargeting,
    };
  }

  private formatRelationTypeLabel(
    relationType: 'blocks' | 'leads_to' | 'relates_to'
  ): string {
    switch (relationType) {
      case 'blocks':
        return this.i18n.t('aiChat.relation.blocks');
      case 'leads_to':
        return this.i18n.t('aiChat.relation.leadsTo');
      case 'relates_to':
      default:
        return this.i18n.t('aiChat.relation.relatesTo');
    }
  }

  private formatElementKindLabel(
    kind: 'goal' | 'story' | 'task'
  ): string {
    switch (kind) {
      case 'goal':
        return this.i18n.t('aiChat.kind.goal');
      case 'story':
        return this.i18n.t('aiChat.kind.story');
      case 'task':
      default:
        return this.i18n.t('aiChat.kind.task');
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

function normalizeActiveScenarioIntent(
  intent: string | null
): AiAssistantIntentKind | undefined {
  switch (intent) {
    case 'review':
    case 'breakdown':
    case 'strategic_plan':
    case 'dependencies':
    case 'missing':
    case 'clarify':
    case 'fill_details':
    case 'next_steps':
    case 'recent_changes':
    case 'duplicates':
    case 'capability_help':
    case 'general_question':
      return intent;
    default:
      return undefined;
  }
}
