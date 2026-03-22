import { createIcon } from '../../../ui-lib/src/hud/icons.ts';
import { ComponentFactory } from '../../../ui-lib/src/core/ComponentFactory.ts';
import { GLOBAL_APP_HEADER_HEIGHT_PX } from '../../../bootstrap/GlobalAppHeader.ts';
import { WorkspaceChatMarkdownRenderer } from '../rendering/WorkspaceChatMarkdownRenderer.ts';
import {
  buildWorkspaceChatActionTagModels,
  getWorkspaceChatActionAccentColor,
  getWorkspaceChatActionButtonLabel,
  getWorkspaceChatActionReason,
  getWorkspaceChatActionSecondaryText,
  getWorkspaceChatFindingSeverityBadgeTone,
  getWorkspaceChatReadinessBadgeTone,
  getWorkspaceChatReviewAccentColor,
  groupWorkspaceChatActionsForRender,
} from '../rendering/WorkspaceChatStructuredResultModel.ts';
import {
  WORKSPACE_CHAT_CONTEXT_MODE_OPTIONS,
  type WorkspaceChatContextMode,
} from '../services/WorkspaceChatContextMode.ts';
import { WorkspaceChatSessionController } from '../services/WorkspaceChatSessionController.ts';
import type { WorkspaceChatMessage } from '../services/WorkspaceChatService.ts';
import type { WorkspaceView } from '../WorkspaceView.ts';
import type {
  WorkspaceChatAction,
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
  WorkspaceChatReviewFindings,
} from '../workspaceChatActions.ts';
import {
  WORKSPACE_VIEW_CHANGED_EVENT,
  isWorkspaceViewChangedDetail,
} from '../workspaceEvents.ts';
import {
  WORKSPACE_CHAT_CONTEXT_CHANGED_EVENT,
  isWorkspaceChatContextDetail,
} from '../workspaceChatEvents.ts';
import { getWorkspaceChatSelectedItems } from '../services/WorkspaceChatContent.ts';
import type { WorkspaceChatPreparedSubmission } from '../services/WorkspaceChatPreparedSubmission.ts';

type GlobalChatPanelOptions = {
  widthPx?: number;
  executeAction?: (
    request: WorkspaceChatActionExecutionRequest
  ) => Promise<WorkspaceChatActionExecutionResult>;
};

const CHAT_ISLAND_MARGIN_PX = 8;
const CHAT_ISLAND_RADIUS_PX = 22;

export class GlobalChatPanel {
  private readonly container: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly widthPx: number;
  private readonly header: HTMLDivElement;
  private readonly contextCard: HTMLDivElement;
  private readonly contextTitle: HTMLParagraphElement;
  private readonly contextMeta: HTMLParagraphElement;
  private readonly quickActionsSection: HTMLDivElement;
  private readonly quickActionsRow: HTMLDivElement;
  private readonly messagesViewport: HTMLDivElement;
  private readonly messagesToolsRow: HTMLDivElement;
  private readonly messagesList: HTMLDivElement;
  private readonly composerInput: HTMLTextAreaElement;
  private readonly contextModeControl: HTMLDivElement;
  private readonly contextModeSelect: HTMLSelectElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly sendButton: HTMLButtonElement;
  private readonly chatController: WorkspaceChatSessionController;
  private readonly markdownRenderer: WorkspaceChatMarkdownRenderer;
  private readonly executeAction?:
    | ((
        request: WorkspaceChatActionExecutionRequest
      ) => Promise<WorkspaceChatActionExecutionResult>)
    | undefined;
  private unsubscribeController: (() => void) | null = null;
  private copyFeedback: {
    messageId: string;
    status: 'copied' | 'failed';
  } | null = null;
  private copyFeedbackTimer: number | null = null;

  private readonly workspaceViewChangedHandler = (event: Event): void => {
    const customEvent = event as CustomEvent<unknown>;
    if (!isWorkspaceViewChangedDetail(customEvent.detail)) return;
    this.chatController.setView(customEvent.detail.view);
  };

  private readonly chatContextChangedHandler = (event: Event): void => {
    const customEvent = event as CustomEvent<unknown>;
    if (!isWorkspaceChatContextDetail(customEvent.detail)) return;
    this.chatController.setContext(customEvent.detail);
  };

  constructor(options: GlobalChatPanelOptions = {}) {
    this.widthPx = options.widthPx ?? 380;
    this.executeAction = options.executeAction;
    this.chatController = new WorkspaceChatSessionController();
    this.markdownRenderer = new WorkspaceChatMarkdownRenderer();
    this.container = document.createElement('aside');
    this.container.id = 'workspace-chat-panel';
    this.container.style.position = 'fixed';
    this.container.style.top = `${CHAT_ISLAND_MARGIN_PX + GLOBAL_APP_HEADER_HEIGHT_PX}px`;
    this.container.style.right = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.bottom = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.width = `${this.widthPx}px`;
    this.container.style.zIndex = '38';
    this.container.style.border = '1px solid rgba(255, 255, 255, 0.42)';
    this.container.style.borderRadius = `${CHAT_ISLAND_RADIUS_PX}px`;
    this.container.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.82))';
    this.container.style.display = 'none';
    this.container.style.boxShadow =
      '0 28px 64px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.78)';
    this.container.style.backdropFilter = 'blur(20px) saturate(140%)';
    this.container.style.overflow = 'hidden';

    this.panel = document.createElement('div');
    this.panel.style.height = '100%';
    this.panel.style.display = 'flex';
    this.panel.style.flexDirection = 'column';
    this.panel.style.fontFamily = 'Poppins, sans-serif';
    this.panel.style.background = 'transparent';

    this.header = document.createElement('div');
    this.header.style.padding = '12px 18px';
    this.header.style.borderBottom = '1px solid rgba(148, 163, 184, 0.14)';
    this.header.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.08))';
    this.header.style.display = 'flex';
    this.header.style.flexDirection = 'column';
    this.header.style.gap = '8px';

    const headerTopRow = document.createElement('div');
    headerTopRow.style.display = 'flex';
    headerTopRow.style.alignItems = 'center';
    headerTopRow.style.justifyContent = 'space-between';
    headerTopRow.style.gap = '12px';

    const brand = document.createElement('div');
    brand.style.display = 'flex';
    brand.style.alignItems = 'center';
    brand.style.gap = '8px';
    brand.style.minWidth = '0';

    const brandIconWrap = document.createElement('div');
    brandIconWrap.style.display = 'inline-flex';
    brandIconWrap.style.alignItems = 'center';
    brandIconWrap.style.justifyContent = 'center';
    brandIconWrap.style.width = '28px';
    brandIconWrap.style.height = '28px';
    brandIconWrap.style.borderRadius = '999px';
    brandIconWrap.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    brandIconWrap.style.background = 'rgba(248, 250, 252, 0.96)';
    brandIconWrap.style.boxShadow =
      '0 8px 18px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.84)';
    const brandIcon = createIcon('chat-bubble-left', {
      size: 13,
      strokeWidth: 1.9,
    });
    brandIcon.setAttribute('aria-hidden', 'true');
    brandIconWrap.appendChild(brandIcon);

    const brandText = document.createElement('div');
    brandText.style.display = 'flex';
    brandText.style.flexDirection = 'column';
    brandText.style.minWidth = '0';

    const brandTitle = document.createElement('p');
    brandTitle.textContent = 'Workspace chat';
    brandTitle.style.margin = '0';
    brandTitle.style.fontSize = '11px';
    brandTitle.style.fontWeight = '700';
    brandTitle.style.letterSpacing = '0.08em';
    brandTitle.style.textTransform = 'uppercase';
    brandTitle.style.color = '#0f172a';

    brandText.append(brandTitle);
    brand.append(brandIconWrap, brandText);

    this.contextTitle = document.createElement('p');
    this.contextTitle.style.margin = '0';
    this.contextTitle.style.fontSize = '12px';
    this.contextTitle.style.fontWeight = '600';
    this.contextTitle.style.lineHeight = '1.4';
    this.contextTitle.style.color = '#0f172a';
    this.contextTitle.style.letterSpacing = '0.02em';
    this.contextTitle.style.whiteSpace = 'nowrap';
    this.contextTitle.style.overflow = 'hidden';
    this.contextTitle.style.textOverflow = 'ellipsis';

    this.contextMeta = document.createElement('p');
    this.contextMeta.style.margin = '0';
    this.contextMeta.style.fontSize = '11px';
    this.contextMeta.style.lineHeight = '1.5';
    this.contextMeta.style.color = '#475569';
    this.contextMeta.style.whiteSpace = 'nowrap';
    this.contextMeta.style.overflow = 'hidden';
    this.contextMeta.style.textOverflow = 'ellipsis';

    this.contextCard = document.createElement('div');
    this.contextCard.style.display = 'flex';
    this.contextCard.style.flexDirection = 'column';
    this.contextCard.style.gap = '3px';
    this.contextCard.style.padding = '9px 11px';
    this.contextCard.style.border = '1px solid rgba(148, 163, 184, 0.14)';
    this.contextCard.style.borderRadius = '14px';
    this.contextCard.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.62))';
    this.contextCard.style.boxShadow =
      'inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 8px 18px rgba(15, 23, 42, 0.03)';
    this.contextCard.append(this.contextTitle, this.contextMeta);

    this.quickActionsSection = document.createElement('div');
    this.quickActionsSection.style.padding = '12px 18px 14px';
    this.quickActionsSection.style.borderBottom =
      '1px solid rgba(148, 163, 184, 0.14)';
    this.quickActionsSection.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.08))';

    this.quickActionsRow = document.createElement('div');
    this.quickActionsRow.style.display = 'flex';
    this.quickActionsRow.style.flexWrap = 'wrap';
    this.quickActionsRow.style.gap = '10px';
    this.quickActionsSection.appendChild(this.quickActionsRow);

    this.messagesViewport = document.createElement('div');
    this.messagesViewport.style.flex = '1';
    this.messagesViewport.style.minHeight = '0';
    this.messagesViewport.style.overflowY = 'auto';
    this.messagesViewport.style.padding = '18px 18px 24px';
    this.messagesViewport.style.background =
      'linear-gradient(180deg, rgba(248, 250, 252, 0.76), rgba(243, 244, 246, 0.42) 52%, rgba(248, 250, 252, 0.68))';

    this.messagesToolsRow = document.createElement('div');
    this.messagesToolsRow.style.display = 'none';
    this.messagesToolsRow.style.alignItems = 'center';
    this.messagesToolsRow.style.justifyContent = 'flex-end';
    this.messagesToolsRow.style.flexShrink = '0';

    this.messagesList = document.createElement('div');
    this.messagesList.style.display = 'flex';
    this.messagesList.style.flexDirection = 'column';
    this.messagesList.style.gap = '16px';
    this.messagesViewport.appendChild(this.messagesList);

    const composer = document.createElement('div');
    composer.style.padding = '14px 18px 18px';
    composer.style.display = 'flex';
    composer.style.flexDirection = 'column';
    composer.style.gap = '12px';
    composer.style.borderTop = '1px solid rgba(148, 163, 184, 0.12)';
    composer.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.44), rgba(248, 250, 252, 0.86))';

    this.composerInput = document.createElement('textarea');
    this.composerInput.rows = 3;
    this.composerInput.placeholder = 'Ask about the current canvas';
    this.composerInput.style.width = '100%';
    this.composerInput.style.resize = 'none';
    this.composerInput.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    this.composerInput.style.borderRadius = '18px';
    this.composerInput.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))';
    this.composerInput.style.boxShadow =
      '0 10px 24px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.84)';
    this.composerInput.style.padding = '13px 14px';
    this.composerInput.style.fontFamily = 'inherit';
    this.composerInput.style.fontSize = '13px';
    this.composerInput.style.lineHeight = '1.5';
    this.composerInput.style.color = '#0f172a';
    this.composerInput.style.outline = 'none';
    this.composerInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      void this.submitCurrentPrompt();
    });

    const composerFooter = document.createElement('div');
    composerFooter.style.display = 'flex';
    composerFooter.style.alignItems = 'center';
    composerFooter.style.justifyContent = 'space-between';
    composerFooter.style.gap = '14px';

    const composerControls = document.createElement('div');
    composerControls.style.display = 'flex';
    composerControls.style.alignItems = 'center';
    composerControls.style.gap = '12px';

    const composerHint = document.createElement('span');
    composerHint.textContent = 'Enter to send, Shift+Enter for a new line';
    composerHint.style.fontSize = '11px';
    composerHint.style.lineHeight = '1.4';
    composerHint.style.letterSpacing = '0.01em';
    composerHint.style.color = '#94a3b8';

    this.contextModeControl = document.createElement('div');
    this.contextModeControl.style.flexShrink = '0';

    const contextModeSelect = ComponentFactory.createSelect({
      variant: 'default',
      items: WORKSPACE_CHAT_CONTEXT_MODE_OPTIONS,
      selectedValue: 'canvas',
      onChange: (value: string) => {
        this.chatController.setContextMode(value as WorkspaceChatContextMode);
      },
      className:
        '!w-auto !h-9 !rounded-full !border-slate-200 !bg-white !px-3 !text-xs !font-semibold !text-slate-600 focus:!border-slate-300 focus:!ring-slate-200',
    });
    contextModeSelect.render(this.contextModeControl);
    this.contextModeSelect =
      contextModeSelect.getElement() as HTMLSelectElement;
    this.contextModeSelect.style.border = '1px solid rgba(148, 163, 184, 0.16)';
    this.contextModeSelect.style.borderRadius = '999px';
    this.contextModeSelect.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))';
    this.contextModeSelect.style.boxShadow =
      '0 8px 18px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.82)';

    this.clearButton = document.createElement('button');
    this.clearButton.type = 'button';
    this.clearButton.textContent = 'Clear chat';
    this.clearButton.style.border = '1px solid rgba(148, 163, 184, 0.16)';
    this.clearButton.style.borderRadius = '999px';
    this.clearButton.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88))';
    this.clearButton.style.boxShadow =
      '0 8px 18px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.82)';
    this.clearButton.style.color = '#64748b';
    this.clearButton.style.padding = '7px 11px';
    this.clearButton.style.fontSize = '11px';
    this.clearButton.style.fontWeight = '700';
    this.clearButton.style.letterSpacing = '0.01em';
    this.clearButton.style.cursor = 'pointer';
    this.clearButton.style.lineHeight = '1.1';
    this.clearButton.addEventListener('click', () => {
      this.chatController.clearConversation();
      this.resetCopyFeedback();
    });
    this.messagesToolsRow.appendChild(this.clearButton);
    headerTopRow.append(brand, this.messagesToolsRow);
    this.header.append(headerTopRow, this.contextCard);

    this.sendButton = document.createElement('button');
    this.sendButton.type = 'button';
    this.sendButton.textContent = 'Send';
    this.sendButton.style.border = '1px solid rgba(15, 23, 42, 0.82)';
    this.sendButton.style.borderRadius = '999px';
    this.sendButton.style.background =
      'linear-gradient(180deg, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1))';
    this.sendButton.style.color = '#ffffff';
    this.sendButton.style.boxShadow =
      '0 16px 28px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.16)';
    this.sendButton.style.padding = '10px 16px';
    this.sendButton.style.fontSize = '12px';
    this.sendButton.style.fontWeight = '700';
    this.sendButton.style.letterSpacing = '0.01em';
    this.sendButton.style.cursor = 'pointer';
    this.sendButton.addEventListener('click', () => {
      void this.submitCurrentPrompt();
    });

    composerControls.append(this.contextModeControl, composerHint);
    composerFooter.append(composerControls, this.sendButton);
    composer.append(this.composerInput, composerFooter);

    this.panel.append(
      this.header,
      this.quickActionsSection,
      this.messagesViewport,
      composer
    );
    this.container.appendChild(this.panel);

    this.unsubscribeController = this.chatController.subscribe(() => {
      this.render();
    });
    this.render();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
    window.addEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.workspaceViewChangedHandler
    );
    window.addEventListener(
      WORKSPACE_CHAT_CONTEXT_CHANGED_EVENT,
      this.chatContextChangedHandler
    );
  }

  public unmount(): void {
    window.removeEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.workspaceViewChangedHandler
    );
    window.removeEventListener(
      WORKSPACE_CHAT_CONTEXT_CHANGED_EVENT,
      this.chatContextChangedHandler
    );
    this.unsubscribeController?.();
    this.unsubscribeController = null;
    this.chatController.dispose();
    if (this.copyFeedbackTimer !== null) {
      window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
    this.container.remove();
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }

  public setIslandMode(enabled: boolean): void {
    if (!enabled) {
      this.container.style.top = `${GLOBAL_APP_HEADER_HEIGHT_PX}px`;
      this.container.style.right = '0';
      this.container.style.bottom = '0';
      this.container.style.border = 'none';
      this.container.style.borderLeft = '1px solid rgba(148, 163, 184, 0.12)';
      this.container.style.borderRadius = '0';
      this.container.style.background =
        'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96))';
      this.container.style.boxShadow = 'none';
      this.container.style.backdropFilter = 'none';
      this.container.style.overflow = 'visible';
      return;
    }

    this.container.style.top = `${CHAT_ISLAND_MARGIN_PX + GLOBAL_APP_HEADER_HEIGHT_PX}px`;
    this.container.style.right = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.bottom = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.border = '1px solid rgba(255, 255, 255, 0.42)';
    this.container.style.borderLeft = '1px solid rgba(255, 255, 255, 0.42)';
    this.container.style.borderRadius = `${CHAT_ISLAND_RADIUS_PX}px`;
    this.container.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.82))';
    this.container.style.boxShadow =
      '0 28px 64px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.78)';
    this.container.style.backdropFilter = 'blur(20px) saturate(140%)';
    this.container.style.overflow = 'hidden';
  }

  public getWidthPx(): number {
    return this.widthPx;
  }

  public async submitExternalPrompt(prompt: string): Promise<void> {
    await this.submitPrompt(prompt);
  }

  public async submitPreparedSubmission(
    submission: WorkspaceChatPreparedSubmission
  ): Promise<void> {
    await this.chatController.submitPreparedSubmission(submission);
  }

  private render(): void {
    const state = this.chatController.getState();
    this.renderContext(state.context, state.contextMode);
    this.renderQuickActions(state.quickActions, state.messages);
    this.renderMessages(
      state.messages,
      state.replying,
      state.context,
      state.contextEnabled,
      state.currentView,
      state.contextMode
    );
    this.renderComposer(
      state.currentView,
      state.replying,
      state.composerPlaceholder,
      state.contextMode
    );
  }

  private renderContext(
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextMode: WorkspaceChatContextMode
  ): void {
    if (contextMode === 'none') {
      this.contextCard.style.display = 'none';
      return;
    }

    this.contextCard.style.display = 'flex';

    if (!context) {
      this.contextTitle.textContent = 'Context unavailable';
      this.contextMeta.textContent = 'Open a canvas to ground the chat.';
      return;
    }

    const summary = context.summary;
    const selection = getWorkspaceChatSelectedItems(context);
    this.contextTitle.textContent = context.canvasTitle || 'Untitled canvas';
    const selectionText = this.formatSelectionSummary(selection);
    this.contextMeta.textContent = `${summary.goalCount} goals, ${summary.storyCount} stories, ${summary.taskCount} tasks. ${selectionText}.`;
  }

  private formatSelectionSummary(
    selection: ReturnType<typeof getWorkspaceChatSelectedItems>
  ): string {
    if (selection.length === 0) {
      return 'Nothing selected';
    }
    return `Selected: ${selection.length}`;
  }

  private renderQuickActions(
    actions: ReturnType<
      WorkspaceChatSessionController['getState']
    >['quickActions'],
    messages: WorkspaceChatMessage[]
  ): void {
    const hasStartedConversation =
      messages.length > 1 ||
      messages.some((message) => message.role === 'user');
    this.quickActionsSection.style.display =
      !hasStartedConversation && actions.length > 0 ? 'block' : 'none';
    this.quickActionsRow.replaceChildren();
    actions.forEach((action) => {
      this.quickActionsRow.appendChild(this.createQuickActionButton(action));
    });
  }

  private renderMessages(
    messages: WorkspaceChatMessage[],
    replying: boolean,
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextEnabled: boolean,
    currentView: WorkspaceView,
    contextMode: WorkspaceChatContextMode
  ): void {
    const canClear =
      messages.length > 1 ||
      messages.some((message) => message.role === 'user');
    const regeneratableMessageId = this.getRegeneratableMessageId(messages);
    this.messagesToolsRow.style.display = canClear ? 'flex' : 'none';
    this.messagesList.replaceChildren();
    if (messages.length === 0 && !replying) {
      this.messagesList.appendChild(
        this.createEmptyStateCard(currentView, contextMode, context)
      );
    }
    messages.forEach((message) => {
      this.messagesList.appendChild(
        this.createMessageBubble(
          message,
          context,
          contextEnabled,
          replying,
          message.id === regeneratableMessageId
        )
      );
    });
    if (replying) {
      this.messagesList.appendChild(this.createTypingBubble());
    }
    window.requestAnimationFrame(() => {
      this.messagesViewport.scrollTop = this.messagesViewport.scrollHeight;
    });
  }

  private createEmptyStateCard(
    currentView: WorkspaceView,
    contextMode: WorkspaceChatContextMode,
    context: ReturnType<WorkspaceChatSessionController['getState']>['context']
  ): HTMLDivElement {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';
    wrap.style.gap = '6px';

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.alignItems = 'center';
    meta.style.gap = '7px';
    meta.style.padding = '0 4px';
    meta.style.fontSize = '10px';
    meta.style.fontWeight = '600';
    meta.style.letterSpacing = '0.03em';
    meta.style.color = '#94a3b8';

    const roleLabel = document.createElement('span');
    roleLabel.textContent = 'System';
    roleLabel.style.fontWeight = '700';
    roleLabel.style.color = '#7c3aed';

    const stateLabel = document.createElement('span');
    stateLabel.textContent = 'Start here';
    stateLabel.style.fontWeight = '500';
    stateLabel.style.color = '#a78bfa';

    meta.append(roleLabel, stateLabel);

    const bubble = document.createElement('div');
    bubble.style.maxWidth = '94%';
    bubble.style.padding = '14px';
    bubble.style.borderRadius = '20px 20px 20px 10px';
    bubble.style.background = 'rgba(245, 238, 255, 0.98)';
    bubble.style.border = '1px solid rgba(196, 181, 253, 0.72)';
    bubble.style.boxShadow =
      '0 18px 40px rgba(91, 33, 182, 0.08), 0 2px 8px rgba(91, 33, 182, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.84)';
    bubble.style.display = 'flex';
    bubble.style.flexDirection = 'column';
    bubble.style.gap = '10px';

    const title = document.createElement('p');
    title.style.margin = '0';
    title.style.fontSize = '13px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.4';
    title.style.color = '#5b21b6';

    const description = document.createElement('p');
    description.style.margin = '0';
    description.style.fontSize = '11.5px';
    description.style.lineHeight = '1.65';
    description.style.color = '#6b21a8';

    const examplesLabel = document.createElement('p');
    examplesLabel.textContent = 'Try';
    examplesLabel.style.margin = '2px 0 0';
    examplesLabel.style.fontSize = '10px';
    examplesLabel.style.fontWeight = '700';
    examplesLabel.style.letterSpacing = '0.08em';
    examplesLabel.style.textTransform = 'uppercase';
    examplesLabel.style.color = '#a78bfa';

    const examples = document.createElement('div');
    examples.style.display = 'flex';
    examples.style.flexWrap = 'wrap';
    examples.style.gap = '6px';

    const exampleLines = this.getEmptyStateExamples(
      currentView,
      contextMode,
      context
    );
    exampleLines.forEach((line) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = line;
      item.style.margin = '0';
      item.style.padding = '8px 10px';
      item.style.borderRadius = '14px';
      item.style.border = '1px solid rgba(216, 180, 254, 0.7)';
      item.style.background = 'rgba(250, 232, 255, 0.92)';
      item.style.boxShadow =
        'inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 4px 10px rgba(168, 85, 247, 0.05)';
      item.style.fontSize = '11.5px';
      item.style.lineHeight = '1.55';
      item.style.color = '#6b21a8';
      item.style.textAlign = 'left';
      item.style.cursor = 'pointer';
      item.title = 'Insert into message';
      item.addEventListener('click', () => {
        this.insertComposerDraft(line);
      });
      examples.appendChild(item);
    });

    const copy = this.getEmptyStateCopy(currentView, contextMode);
    title.textContent = copy.title;
    description.textContent = copy.description;

    bubble.append(title, description, examplesLabel, examples);
    wrap.append(meta, bubble);
    return wrap;
  }

  private getEmptyStateCopy(
    currentView: WorkspaceView,
    contextMode: WorkspaceChatContextMode
  ): {
    title: string;
    description: string;
  } {
    if (currentView !== 'canvas') {
      return {
        title: 'Start with a simple question',
        description:
          'This chat works without canvas context here. Ask directly, or switch back to canvas when you want grounded planning help.',
      };
    }

    switch (contextMode) {
      case 'none':
        return {
          title: 'Start without canvas context',
          description:
            'Ask anything directly, or switch the context mode when you want the chat to use the canvas, visible area, or selected items.',
        };
      case 'selection':
        return {
          title: 'Select items, then ask',
          description:
            'Use this mode when you want feedback on specific goals, stories, or tasks instead of the whole board.',
        };
      case 'viewport':
        return {
          title: 'Ask about what is on screen',
          description:
            'This mode follows the visible area of the canvas, so it works best when you are focused on one part of the board.',
        };
      case 'canvas':
      default:
        return {
          title: 'Use chat as a planning copilot',
          description:
            'Ask for review, breakdown, gaps, or dependency suggestions across the current canvas.',
        };
    }
  }

  private getEmptyStateExamples(
    currentView: WorkspaceView,
    contextMode: WorkspaceChatContextMode,
    context: ReturnType<WorkspaceChatSessionController['getState']>['context']
  ): string[] {
    if (currentView !== 'canvas') {
      return [
        'Review this idea and point out what is unclear.',
        'Turn this rough plan into 3 concrete next steps.',
      ];
    }

    switch (contextMode) {
      case 'none':
        return [
          'Turn this rough idea into a clear goal: ...',
          'Draft a task title and description from this idea: ...',
        ];
      case 'selection':
        if (!context || context.selectionIds.length === 0) {
          return [
            'What is missing in the selected items?',
            'Break the selected story into tasks.',
          ];
        }
        return [
          'Review the selected items and tell me what is missing.',
          'Break this story into tasks.',
        ];
      case 'viewport':
        return [
          'Summarize this area of the canvas.',
          'What dependencies are missing in this part of the plan?',
        ];
      case 'canvas':
      default:
        return [
          'Review the canvas and find structural gaps.',
          'Suggest missing dependencies and next tasks.',
        ];
    }
  }

  private insertComposerDraft(text: string): void {
    this.composerInput.value = text;
    this.composerInput.focus();
    const end = this.composerInput.value.length;
    this.composerInput.setSelectionRange(end, end);
  }

  private renderComposer(
    currentView: WorkspaceView,
    replying: boolean,
    placeholder: string,
    contextMode: WorkspaceChatContextMode
  ): void {
    const noContext =
      placeholder === 'Canvas context is unavailable in this view';
    this.composerInput.placeholder = placeholder;
    this.composerInput.disabled = replying;
    this.composerInput.style.opacity = replying ? '0.8' : '1';
    this.composerInput.style.cursor = replying ? 'default' : 'text';
    this.composerInput.style.borderColor = replying
      ? 'rgba(203, 213, 225, 0.24)'
      : 'rgba(148, 163, 184, 0.18)';
    this.composerInput.style.background = replying
      ? 'linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.94))'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94))';
    this.contextModeSelect.value = contextMode;
    this.contextModeSelect.disabled = replying;
    this.contextModeControl.style.opacity = replying ? '0.55' : '1';
    this.clearButton.disabled = replying;
    this.clearButton.style.opacity = replying ? '0.55' : '1';
    this.clearButton.style.cursor = replying ? 'default' : 'pointer';
    this.sendButton.disabled = replying;
    this.sendButton.textContent = replying ? 'Thinking...' : 'Send';
    this.sendButton.style.opacity = replying ? '0.7' : '1';
    this.sendButton.style.cursor = replying ? 'default' : 'pointer';
    if (!noContext || currentView === 'canvas') {
      return;
    }
    this.composerInput.style.background =
      'linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96))';
  }

  private createQuickActionButton(action: {
    label: string;
    prompt: string;
  }): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.style.border = '1px solid rgba(148, 163, 184, 0.2)';
    button.style.borderRadius = '999px';
    button.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92))';
    button.style.color = '#334155';
    button.style.padding = '7px 12px';
    button.style.fontSize = '11px';
    button.style.fontWeight = '600';
    button.style.lineHeight = '1.1';
    button.style.letterSpacing = '0.01em';
    button.style.cursor = 'pointer';
    button.addEventListener('click', () => {
      void this.submitPrompt(action.prompt);
    });
    return button;
  }

  private createMessageBubble(
    message: WorkspaceChatMessage,
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextEnabled: boolean,
    replying: boolean,
    canRegenerate: boolean
  ): HTMLDivElement {
    const isSystemMessage = message.kind === 'system';
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = message.role === 'user' ? 'flex-end' : 'flex-start';
    wrap.style.gap = '6px';

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.alignItems = 'center';
    meta.style.gap = '7px';
    meta.style.padding = '0 4px';
    meta.style.fontSize = '10px';
    meta.style.fontWeight = '600';
    meta.style.letterSpacing = '0.03em';
    meta.style.color = '#94a3b8';

    const roleLabel = document.createElement('span');
    roleLabel.textContent =
      message.role === 'user'
        ? 'You'
        : isSystemMessage
          ? 'System'
          : 'Assistant';
    roleLabel.style.fontWeight = '700';
    roleLabel.style.color =
      message.role === 'user'
        ? '#475569'
        : isSystemMessage
          ? '#7c3aed'
          : '#64748b';

    const timeLabel = document.createElement('span');
    timeLabel.textContent = this.formatMessageTime(message.createdAt);
    timeLabel.style.fontWeight = '500';
    timeLabel.style.color = '#94a3b8';

    meta.append(roleLabel, timeLabel);

    const hasContent =
      message.content.trim().length > 0 || message.role === 'user';
    wrap.append(meta);
    if (hasContent) {
      const bubble = document.createElement('div');
      bubble.style.maxWidth = message.role === 'user' ? '82%' : '94%';
      bubble.style.padding = '12px 14px';
      bubble.style.borderRadius =
        message.role === 'user' ? '20px 20px 8px 20px' : '20px 20px 20px 10px';
      bubble.style.fontSize = '12.5px';
      bubble.style.lineHeight = '1.6';
      bubble.style.color =
        message.role === 'user'
          ? '#0f172a'
          : isSystemMessage
            ? '#5b21b6'
            : '#1f2937';
      bubble.style.background =
        message.role === 'user'
          ? 'rgba(237, 242, 247, 0.98)'
          : isSystemMessage
            ? 'rgba(245, 238, 255, 0.98)'
            : 'rgba(255, 255, 255, 0.99)';
      bubble.style.border =
        message.role === 'user'
          ? '1px solid rgba(148, 163, 184, 0.28)'
          : isSystemMessage
            ? '1px solid rgba(196, 181, 253, 0.72)'
            : '1px solid rgba(148, 163, 184, 0.18)';
      bubble.appendChild(this.createMessageContent(message));
      wrap.appendChild(bubble);
    }

    if (message.role === 'assistant' && message.reviewFindings) {
      wrap.appendChild(this.createReviewFindingsCard(message.reviewFindings));
    }

    if (message.role === 'assistant' && Array.isArray(message.actions)) {
      const actionsList = this.createActionCards(
        message,
        message.actions,
        context,
        contextEnabled
      );
      if (actionsList) {
        wrap.appendChild(actionsList);
      }
    }

    if (
      message.role === 'assistant' &&
      !isSystemMessage &&
      (message.content.trim().length > 0 || canRegenerate)
    ) {
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.alignItems = 'center';
      actions.style.justifyContent = 'flex-start';
      actions.style.gap = '6px';
      actions.style.padding = '0 4px';

      if (canRegenerate) {
        const regenerateButton = document.createElement('button');
        regenerateButton.type = 'button';
        regenerateButton.setAttribute('aria-label', 'Regenerate response');
        regenerateButton.title = replying
          ? 'Regenerating response'
          : 'Regenerate response';
        regenerateButton.style.display = 'inline-flex';
        regenerateButton.style.alignItems = 'center';
        regenerateButton.style.justifyContent = 'center';
        regenerateButton.style.width = '24px';
        regenerateButton.style.height = '24px';
        regenerateButton.style.border = '1px solid rgba(148, 163, 184, 0.16)';
        regenerateButton.style.borderRadius = '999px';
        regenerateButton.style.background =
          'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88))';
        regenerateButton.style.padding = '0';
        regenerateButton.style.color = '#94a3b8';
        regenerateButton.style.cursor = replying ? 'default' : 'pointer';
        regenerateButton.style.opacity = replying ? '0.55' : '1';
        regenerateButton.disabled = replying;

        const regenerateIcon = createIcon('arrow-path', {
          size: 12,
          strokeWidth: 1.9,
        });
        regenerateIcon.setAttribute('aria-hidden', 'true');
        regenerateButton.append(regenerateIcon);
        regenerateButton.addEventListener('click', () => {
          void this.chatController.regenerateMessage(message.id);
        });
        actions.appendChild(regenerateButton);
      }

      if (message.content.trim().length > 0) {
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.setAttribute('aria-label', 'Copy response to clipboard');
        copyButton.title =
          this.copyFeedback?.messageId === message.id
            ? this.copyFeedback.status === 'copied'
              ? 'Copied to clipboard'
              : 'Copy to clipboard failed'
            : 'Copy response to clipboard';
        copyButton.style.display = 'inline-flex';
        copyButton.style.alignItems = 'center';
        copyButton.style.justifyContent = 'center';
        copyButton.style.width = '24px';
        copyButton.style.height = '24px';
        copyButton.style.border = '1px solid rgba(148, 163, 184, 0.16)';
        copyButton.style.borderRadius = '999px';
        copyButton.style.background =
          'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.88))';
        copyButton.style.padding = '0';
        copyButton.style.transition =
          'transform 140ms ease, color 140ms ease, border-color 140ms ease';
        copyButton.style.color =
          this.copyFeedback?.messageId === message.id &&
          this.copyFeedback.status === 'failed'
            ? '#b91c1c'
            : '#94a3b8';
        copyButton.style.cursor = 'pointer';
        copyButton.style.transform =
          this.copyFeedback?.messageId === message.id &&
          this.copyFeedback.status === 'copied'
            ? 'scale(1.08)'
            : 'scale(1)';

        const iconName =
          this.copyFeedback?.messageId === message.id &&
          this.copyFeedback.status === 'copied'
            ? 'check'
            : this.copyFeedback?.messageId === message.id &&
                this.copyFeedback.status === 'failed'
              ? 'x-mark'
              : 'square-2-stack';
        const actionIcon = createIcon(iconName, {
          size: 12,
          strokeWidth: 1.9,
        });
        actionIcon.setAttribute('aria-hidden', 'true');
        copyButton.append(actionIcon);
        copyButton.addEventListener('click', () => {
          void this.copyMessage(message);
        });

        actions.appendChild(copyButton);
      }
      wrap.appendChild(actions);
    }

    return wrap;
  }

  private createTypingBubble(): HTMLDivElement {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';
    wrap.style.gap = '6px';

    const meta = document.createElement('div');
    meta.style.display = 'flex';
    meta.style.alignItems = 'center';
    meta.style.gap = '7px';
    meta.style.padding = '0 4px';
    meta.style.fontSize = '10px';
    meta.style.fontWeight = '600';
    meta.style.letterSpacing = '0.03em';
    meta.style.color = '#94a3b8';

    const roleLabel = document.createElement('span');
    roleLabel.textContent = 'Assistant';
    roleLabel.style.fontWeight = '700';
    roleLabel.style.color = '#64748b';
    const stateLabel = document.createElement('span');
    stateLabel.textContent = 'Thinking';
    stateLabel.style.fontWeight = '500';
    stateLabel.style.color = '#94a3b8';
    meta.append(roleLabel, stateLabel);

    const bubble = document.createElement('div');
    bubble.style.maxWidth = '94%';
    bubble.style.padding = '12px 14px';
    bubble.style.borderRadius = '20px 20px 20px 10px';
    bubble.style.fontSize = '12.5px';
    bubble.style.lineHeight = '1.6';
    bubble.style.color = '#64748b';
    bubble.style.background = 'rgba(255, 255, 255, 0.99)';
    bubble.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    bubble.style.display = 'inline-flex';
    bubble.style.alignItems = 'center';
    bubble.style.gap = '6px';

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement('span');
      dot.style.width = '5px';
      dot.style.height = '5px';
      dot.style.borderRadius = '999px';
      dot.style.background = '#64748b';
      dot.style.opacity = ['0.35', '0.6', '0.9'][index] ?? '0.6';
      bubble.appendChild(dot);
    }

    wrap.append(meta, bubble);
    return wrap;
  }

  private async submitCurrentPrompt(): Promise<void> {
    await this.submitPrompt(this.composerInput.value);
  }

  private async submitPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;
    this.composerInput.value = '';
    await this.chatController.submitPrompt(trimmed);
  }

  private getRegeneratableMessageId(
    messages: WorkspaceChatMessage[]
  ): string | null {
    const lastMessage = messages[messages.length - 1];
    const previousMessage = messages[messages.length - 2];
    if (
      !lastMessage ||
      !previousMessage ||
      lastMessage.role !== 'assistant' ||
      previousMessage.role !== 'user'
    ) {
      return null;
    }
    return lastMessage.id;
  }

  private createActionCards(
    message: WorkspaceChatMessage,
    actions: WorkspaceChatAction[],
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement | null {
    if (actions.length === 0) return null;
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';
    list.style.width = '100%';
    list.style.maxWidth = '94%';

    groupWorkspaceChatActionsForRender(actions).forEach((entry) => {
      if (entry.groupId) {
        list.appendChild(
          this.createGroupedActionCard(
            message.id,
            entry.actions,
            context,
            contextEnabled
          )
        );
        return;
      }

      entry.actions.forEach((action) => {
        list.appendChild(
          this.createActionCard(message.id, action, context, contextEnabled)
        );
      });
    });

    return list;
  }

  private createGroupedActionCard(
    messageId: string,
    actions: WorkspaceChatAction[],
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement {
    const group = actions[0]!;
    const card = document.createElement('div');
    card.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    card.style.borderRadius = '20px';
    card.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(250, 250, 249, 0.96) 44%, rgba(248, 250, 252, 0.94))';
    card.style.padding = '14px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '12px';

    const accent = document.createElement('div');
    accent.style.width = '42px';
    accent.style.height = '2px';
    accent.style.borderRadius = '999px';
    accent.style.background = getWorkspaceChatActionAccentColor(group);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '6px';

    const label = document.createElement('span');
    label.textContent = group.groupTitle || group.label;
    label.style.fontSize = '10px';
    label.style.fontWeight = '700';
    label.style.letterSpacing = '0.08em';
    label.style.textTransform = 'uppercase';
    label.style.color = '#64748b';
    header.appendChild(label);

    if (group.groupSummary) {
      const summary = document.createElement('p');
      summary.textContent = group.groupSummary;
      summary.style.margin = '0';
      summary.style.fontSize = '11.5px';
      summary.style.lineHeight = '1.6';
      summary.style.color = '#334155';
      header.appendChild(summary);
    }

    const rows = document.createElement('div');
    rows.style.display = 'flex';
    rows.style.flexDirection = 'column';
    rows.style.gap = '10px';

    actions.forEach((action, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.alignItems = 'stretch';
      row.style.gap = '8px';
      if (index > 0) {
        row.style.paddingTop = '10px';
        row.style.borderTop = '1px solid rgba(226, 232, 240, 0.82)';
      }

      const textWrap = document.createElement('div');
      textWrap.style.display = 'flex';
      textWrap.style.flexDirection = 'column';
      textWrap.style.gap = '5px';
      textWrap.style.minWidth = '0';
      textWrap.style.flex = '1';

      const rowTitle = document.createElement('p');
      rowTitle.textContent = action.title;
      rowTitle.style.margin = '0';
      rowTitle.style.fontSize = '13px';
      rowTitle.style.fontWeight = '600';
      rowTitle.style.lineHeight = '1.45';
      rowTitle.style.color = '#0f172a';
      textWrap.appendChild(rowTitle);

      const rowMeta = document.createElement('p');
      rowMeta.textContent = getWorkspaceChatActionSecondaryText(
        action,
        context,
        contextEnabled
      );
      rowMeta.style.margin = '0';
      rowMeta.style.fontSize = '11px';
      rowMeta.style.lineHeight = '1.5';
      rowMeta.style.color = '#6b7280';
      textWrap.appendChild(rowMeta);

      const tags = this.createActionTagRow(action);
      if (tags) {
        textWrap.appendChild(tags);
      }

      const reason = getWorkspaceChatActionReason(action);
      if (reason) {
        const reasonText = document.createElement('p');
        reasonText.textContent = reason;
        reasonText.style.margin = '0';
        reasonText.style.fontSize = '11px';
        reasonText.style.lineHeight = '1.55';
        reasonText.style.color = '#334155';
        textWrap.appendChild(reasonText);
      }

      if (action.status === 'failed' && action.errorMessage) {
        const error = document.createElement('p');
        error.textContent = action.errorMessage;
        error.style.margin = '0';
        error.style.fontSize = '11px';
        error.style.lineHeight = '1.45';
        error.style.color = '#b91c1c';
        textWrap.appendChild(error);
      }

      const footer = document.createElement('div');
      footer.style.display = 'flex';
      footer.style.justifyContent = 'flex-start';
      footer.style.paddingTop = '2px';
      footer.appendChild(this.createActionButton(messageId, action));

      row.append(textWrap, footer);
      rows.appendChild(row);
    });

    card.append(accent, header, rows);
    return card;
  }

  private createActionCard(
    messageId: string,
    action: WorkspaceChatAction,
    context: ReturnType<WorkspaceChatSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement {
    const card = document.createElement('div');
    card.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    card.style.borderRadius = '20px';
    card.style.background =
      action.status === 'applied'
        ? 'linear-gradient(180deg, rgba(249, 250, 251, 0.99), rgba(241, 245, 249, 0.96))'
        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(250, 250, 249, 0.96) 44%, rgba(248, 250, 252, 0.94))';
    card.style.padding = '14px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '10px';

    const accent = document.createElement('div');
    accent.style.width = '42px';
    accent.style.height = '2px';
    accent.style.borderRadius = '999px';
    accent.style.background = getWorkspaceChatActionAccentColor(action);

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'flex-start';
    topRow.style.justifyContent = 'space-between';
    topRow.style.gap = '10px';

    const label = document.createElement('span');
    label.textContent = action.label;
    label.style.fontSize = '10px';
    label.style.fontWeight = '700';
    label.style.letterSpacing = '0.08em';
    label.style.textTransform = 'uppercase';
    label.style.color = '#64748b';

    topRow.appendChild(label);

    const tags = this.createActionTagRow(action);
    if (tags) {
      const firstTag = tags.firstElementChild;
      if (firstTag) {
        topRow.appendChild(firstTag);
      }
    }

    const title = document.createElement('p');
    title.textContent = action.title;
    title.style.margin = '0';
    title.style.fontSize = '13.5px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.45';
    title.style.color = '#0f172a';

    const meta = document.createElement('p');
    meta.textContent = getWorkspaceChatActionSecondaryText(
      action,
      context,
      contextEnabled
    );
    meta.style.margin = '0';
    meta.style.fontSize = '11px';
    meta.style.lineHeight = '1.5';
    meta.style.color = '#6b7280';

    card.append(accent, topRow, title);

    const extraTags = this.createActionTagRow(action);
    if (extraTags && extraTags.childElementCount > 1) {
      extraTags.firstElementChild?.remove();
      card.appendChild(extraTags);
    }

    if ('description' in action && action.description) {
      const description = document.createElement('p');
      description.textContent = action.description;
      description.style.margin = '0';
      description.style.fontSize = '11.5px';
      description.style.lineHeight = '1.6';
      description.style.color = '#334155';
      card.appendChild(description);
    }

    const reason = getWorkspaceChatActionReason(action);
    if (reason) {
      const reasonText = document.createElement('p');
      reasonText.textContent = reason;
      reasonText.style.margin = '0';
      reasonText.style.fontSize = '11.5px';
      reasonText.style.lineHeight = '1.6';
      reasonText.style.color = '#334155';
      card.appendChild(reasonText);
    }

    card.appendChild(meta);

    if (action.status === 'failed' && action.errorMessage) {
      const error = document.createElement('p');
      error.textContent = action.errorMessage;
      error.style.margin = '0';
      error.style.fontSize = '11px';
      error.style.lineHeight = '1.45';
      error.style.color = '#b91c1c';
      card.appendChild(error);
    }

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-start';
    footer.style.paddingTop = '2px';
    footer.appendChild(this.createActionButton(messageId, action));
    card.appendChild(footer);
    return card;
  }

  private createActionButton(
    messageId: string,
    action: WorkspaceChatAction
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = getWorkspaceChatActionButtonLabel(action);
    button.style.borderRadius = '999px';
    button.style.padding = '9px 14px';
    button.style.fontSize = '11px';
    button.style.fontWeight = '700';
    button.style.lineHeight = '1.1';
    button.style.letterSpacing = '0.01em';
    button.style.whiteSpace = 'nowrap';
    button.style.transition =
      'background 140ms ease, color 140ms ease, border-color 140ms ease';

    if (action.status === 'applied') {
      button.style.border = '1px solid rgba(148, 163, 184, 0.18)';
      button.style.background =
        'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.9))';
      button.style.color = '#64748b';
    } else if (action.status === 'failed') {
      button.style.border = '1px solid rgba(251, 191, 36, 0.46)';
      button.style.background =
        'linear-gradient(180deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 237, 0.94))';
      button.style.color = '#9a3412';
    } else {
      button.style.border = '1px solid rgba(15, 23, 42, 0.82)';
      button.style.background =
        'linear-gradient(180deg, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1))';
      button.style.color = '#ffffff';
    }

    button.style.cursor =
      action.status === 'applied' || action.status === 'applying'
        ? 'default'
        : 'pointer';
    button.style.opacity = action.status === 'applying' ? '0.7' : '1';
    button.disabled =
      action.status === 'applied' || action.status === 'applying';
    button.addEventListener('click', () => {
      void this.chatController.executeMessageAction(
        messageId,
        action.id,
        this.executeAction
      );
    });
    return button;
  }

  private createActionTagRow(
    action: WorkspaceChatAction
  ): HTMLDivElement | null {
    const tagModels = buildWorkspaceChatActionTagModels(action);
    if (tagModels.length === 0) return null;

    const tags = document.createElement('div');
    tags.style.display = 'flex';
    tags.style.flexWrap = 'wrap';
    tags.style.gap = '6px';

    tagModels.forEach((tag) => {
      tags.appendChild(this.createActionTag(tag.text, tag.tone));
    });

    return tags;
  }

  private createActionTag(
    text: string,
    options: {
      background: string;
      color: string;
      border: string;
    }
  ): HTMLSpanElement {
    const tag = document.createElement('span');
    tag.textContent = text;
    tag.style.fontSize = '10px';
    tag.style.fontWeight = '700';
    tag.style.lineHeight = '1';
    tag.style.borderRadius = '999px';
    tag.style.padding = '4px 8px';
    tag.style.whiteSpace = 'nowrap';
    tag.style.border = `1px solid ${options.border}`;
    tag.style.background = options.background;
    tag.style.color = options.color;
    return tag;
  }

  private createReviewFindingsCard(
    review: WorkspaceChatReviewFindings
  ): HTMLDivElement {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '12px';
    card.style.width = '100%';
    card.style.maxWidth = '94%';
    card.style.border = '1px solid rgba(148, 163, 184, 0.18)';
    card.style.borderRadius = '20px';
    card.style.background =
      'linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(250, 250, 249, 0.96) 44%, rgba(248, 250, 252, 0.94))';
    card.style.padding = '14px';

    const accent = document.createElement('div');
    accent.style.width = '42px';
    accent.style.height = '2px';
    accent.style.borderRadius = '999px';
    accent.style.background = getWorkspaceChatReviewAccentColor(review);

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '6px';

    const label = document.createElement('span');
    label.textContent = review.title;
    label.style.fontSize = '10px';
    label.style.fontWeight = '700';
    label.style.letterSpacing = '0.08em';
    label.style.textTransform = 'uppercase';
    label.style.color = '#64748b';
    header.appendChild(label);

    if (review.summary) {
      const summary = document.createElement('p');
      summary.textContent = review.summary;
      summary.style.margin = '0';
      summary.style.fontSize = '11.5px';
      summary.style.lineHeight = '1.6';
      summary.style.color = '#334155';
      header.appendChild(summary);
    }

    card.append(accent, header);

    if (typeof review.readinessScore === 'number' || review.readinessVerdict) {
      const readiness = document.createElement('div');
      readiness.style.display = 'flex';
      readiness.style.alignItems = 'center';
      readiness.style.flexWrap = 'wrap';
      readiness.style.gap = '8px';

      if (typeof review.readinessScore === 'number') {
        const readinessTone = getWorkspaceChatReadinessBadgeTone(
          review.readinessScore
        );
        readiness.appendChild(
          this.createActionTag(`Readiness ${review.readinessScore}`, {
            background: readinessTone.background,
            color: readinessTone.color,
            border: readinessTone.border,
          })
        );
      }

      if (review.readinessVerdict) {
        const verdict = document.createElement('span');
        verdict.textContent = review.readinessVerdict;
        verdict.style.fontSize = '11px';
        verdict.style.lineHeight = '1.5';
        verdict.style.color = '#475569';
        readiness.appendChild(verdict);
      }

      card.appendChild(readiness);
    }

    const findings = document.createElement('div');
    findings.style.display = 'flex';
    findings.style.flexDirection = 'column';
    findings.style.gap = '10px';

    review.findings.forEach((finding) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '6px';
      item.style.padding = '11px 12px';
      item.style.border = '1px solid rgba(148, 163, 184, 0.14)';
      item.style.borderRadius = '16px';
      item.style.background = 'rgba(255, 255, 255, 0.72)';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'flex-start';
      header.style.flexWrap = 'wrap';
      header.style.gap = '8px';

      const severityTone = getWorkspaceChatFindingSeverityBadgeTone(
        finding.severity
      );
      const severity = this.createActionTag(finding.severity, {
        background: severityTone.background,
        color: severityTone.color,
        border: severityTone.border,
      });

      const title = document.createElement('p');
      title.textContent = finding.title;
      title.style.margin = '0';
      title.style.fontSize = '12.5px';
      title.style.fontWeight = '600';
      title.style.lineHeight = '1.45';
      title.style.color = '#0f172a';

      const category = document.createElement('p');
      category.textContent = finding.category;
      category.style.margin = '0';
      category.style.fontSize = '10px';
      category.style.fontWeight = '600';
      category.style.letterSpacing = '0.04em';
      category.style.textTransform = 'uppercase';
      category.style.color = '#94a3b8';

      const detail = document.createElement('p');
      detail.textContent = finding.detail;
      detail.style.margin = '0';
      detail.style.fontSize = '11px';
      detail.style.lineHeight = '1.6';
      detail.style.color = '#334155';

      const text = document.createElement('div');
      text.style.display = 'flex';
      text.style.flexDirection = 'column';
      text.style.gap = '4px';
      text.style.minWidth = '0';
      text.style.flex = '1';
      text.append(title, category);

      header.append(severity, text);
      item.append(header, detail);
      findings.appendChild(item);
    });

    card.appendChild(findings);
    return card;
  }

  private formatMessageTime(timestamp: number): string {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(timestamp);
    } catch {
      return '';
    }
  }

  private async copyMessage(message: WorkspaceChatMessage): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      this.setCopyFeedback(message.id, 'copied');
    } catch {
      this.setCopyFeedback(message.id, 'failed');
    }
  }

  private setCopyFeedback(
    messageId: string,
    status: 'copied' | 'failed'
  ): void {
    this.copyFeedback = { messageId, status };
    if (this.copyFeedbackTimer !== null) {
      window.clearTimeout(this.copyFeedbackTimer);
    }
    this.copyFeedbackTimer = window.setTimeout(() => {
      this.copyFeedback = null;
      this.copyFeedbackTimer = null;
      this.render();
    }, 1400);
    this.render();
  }

  private resetCopyFeedback(): void {
    this.copyFeedback = null;
    if (this.copyFeedbackTimer !== null) {
      window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
  }

  private createMessageContent(message: WorkspaceChatMessage): HTMLElement {
    if (message.role === 'assistant') {
      return this.markdownRenderer.render(message.content);
    }

    const content = document.createElement('div');
    content.style.whiteSpace = 'pre-wrap';
    content.style.wordBreak = 'break-word';
    content.textContent = message.content;
    return content;
  }
}
