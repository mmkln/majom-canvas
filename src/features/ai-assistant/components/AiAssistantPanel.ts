import {
  createIconButton,
  MenuButton,
  createTextButton,
  setTextButtonState,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon, type IconName } from '../../../ui-lib/src/hud/icons.ts';
import { ComponentFactory } from '../../../ui-lib/src/core/ComponentFactory.ts';
import { GLOBAL_APP_HEADER_HEIGHT_PX } from '../../../bootstrap/GlobalAppHeader.ts';
import { AiAssistantMarkdownRenderer } from '../rendering/AiAssistantMarkdownRenderer.ts';
import {
  buildAiAssistantActionEntryModel,
  buildAiAssistantGroupedActionCardModel,
  type AiAssistantActionTagModel,
  type AiAssistantActionCardModel,
  type AiAssistantActionButtonModel,
  type AiAssistantActionEntryModel,
  type AiAssistantActionDetailBlock,
  type AiAssistantGroupedActionCardModel,
  getAiAssistantFindingSeverityBadgeTone,
  getAiAssistantReadinessBadgeTone,
  groupAiAssistantActionsForRender,
} from '../rendering/AiAssistantStructuredResultModel.ts';
import {
  AI_ASSISTANT_CONTEXT_MODE_OPTIONS,
  type AiAssistantContextMode,
} from '../services/AiAssistantContextMode.ts';
import { AiAssistantSessionController } from '../services/AiAssistantSessionController.ts';
import type {
  AiAssistantMessage,
  AiAssistantReplyProgress,
} from '../services/AiAssistantTypes.ts';
import type { WorkspaceView } from '../../shell/WorkspaceView.ts';
import {
  type AiAssistantAction,
  type AiAssistantActionExecutionHandler,
  type AiAssistantReviewFindings,
} from '../aiAssistantActions.ts';
import {
  WORKSPACE_VIEW_CHANGED_EVENT,
  isWorkspaceViewChangedDetail,
} from '../../shell/workspaceEvents.ts';
import {
  AI_ASSISTANT_CONTEXT_CHANGED_EVENT,
  isAiAssistantContextDetail,
  type AiAssistantCanvasElement,
} from '../aiAssistantEvents.ts';
import {
  capitalizeAiAssistantValue,
  getAiAssistantSelectedItems,
} from '../services/AiAssistantContent.ts';
import type { AiAssistantPreparedSubmission } from '../services/AiAssistantPreparedSubmission.ts';

type AiAssistantPanelOptions = {
  controller: AiAssistantSessionController;
  widthPx?: number;
  executeAction?: AiAssistantActionExecutionHandler;
};

const CHAT_ISLAND_MARGIN_PX = 6;
const CHAT_AUTO_SCROLL_THRESHOLD_PX = 40;
const CHAT_PANEL_BORDER = '1px solid rgba(203, 213, 225, 0.76)';
const CHAT_PANEL_SECTION_BORDER = '1px solid rgba(226, 232, 240, 0.72)';
const CHAT_PANEL_SURFACE_BORDER = '1px solid rgba(226, 232, 240, 0.82)';
const CHAT_PANEL_BACKGROUND = '#ffffff';
const CHAT_PANEL_SUBTLE_BACKGROUND = 'rgba(248, 250, 252, 0.92)';
const CHAT_PANEL_RADIUS_PX = 16;
const CHAT_ACTION_CARD_RADIUS_PX = 20;
const CHAT_ACTION_GROUP_CARD_INSET_PX = 14;
const CHAT_ACTION_CARD_PADDING_PX = 14;
const CHAT_ACTION_PREVIEW_RADIUS_PX = 14;
const CHAT_ACTION_DIVIDER_BORDER = '1px solid rgba(226, 232, 240, 0.9)';

type AiAssistantActionContentSection =
  | 'meta'
  | 'tags'
  | 'details'
  | 'description'
  | 'reason'
  | 'error';

export class AiAssistantPanel {
  private readonly container: HTMLElement;
  private readonly panel: HTMLDivElement;
  private readonly widthPx: number;
  private readonly header: HTMLDivElement;
  private readonly contextCard: HTMLDivElement;
  private readonly contextTitle: HTMLParagraphElement;
  private readonly contextMeta: HTMLParagraphElement;
  private readonly quickActionsSection: HTMLDivElement;
  private readonly quickActionsRow: HTMLDivElement;
  private readonly messagesFrame: HTMLDivElement;
  private readonly messagesViewport: HTMLDivElement;
  private readonly scrollToBottomButton: HTMLButtonElement;
  private readonly messagesToolsRow: HTMLDivElement;
  private readonly messagesList: HTMLDivElement;
  private readonly composerInput: HTMLTextAreaElement;
  private readonly pendingConfirmationBar: HTMLDivElement;
  private readonly pendingConfirmationMeta: HTMLParagraphElement;
  private readonly pendingConfirmationTitle: HTMLParagraphElement;
  private readonly pendingConfirmationButton: HTMLButtonElement;
  private readonly contextModeControl: HTMLDivElement;
  private readonly contextModeMenuButton: MenuButton;
  private readonly clearButton: HTMLButtonElement;
  private readonly sendButton: HTMLButtonElement;
  private readonly chatController: AiAssistantSessionController;
  private readonly markdownRenderer: AiAssistantMarkdownRenderer;
  private readonly executeAction?:
    | AiAssistantActionExecutionHandler
    | undefined;
  private unsubscribeController: (() => void) | null = null;
  private copyFeedback: {
    messageId: string;
    status: 'copied' | 'failed';
  } | null = null;
  private stickMessagesToBottom = true;
  private currentPendingConfirmation: ReturnType<
    AiAssistantSessionController['getState']
  >['pendingConfirmation'] = null;
  private copyFeedbackTimer: number | null = null;

  private readonly workspaceViewChangedHandler = (event: Event): void => {
    const customEvent = event as CustomEvent<unknown>;
    if (!isWorkspaceViewChangedDetail(customEvent.detail)) return;
    this.chatController.setView(customEvent.detail.view);
  };

  private readonly chatContextChangedHandler = (event: Event): void => {
    const customEvent = event as CustomEvent<unknown>;
    if (!isAiAssistantContextDetail(customEvent.detail)) return;
    this.chatController.setContext(customEvent.detail);
  };

  private readonly messagesViewportScrollHandler = (): void => {
    this.stickMessagesToBottom = this.isMessagesViewportNearBottom();
    this.updateScrollToBottomButtonVisibility();
  };

  constructor(options: AiAssistantPanelOptions) {
    this.widthPx = options.widthPx ?? 380;
    this.executeAction = options.executeAction;
    this.chatController = options.controller;
    this.markdownRenderer = new AiAssistantMarkdownRenderer();
    this.container = document.createElement('div');
    this.container.id = 'ai-assistant-panel';
    this.container.style.boxSizing = 'border-box';
    this.container.style.position = 'fixed';
    this.container.style.width = `${this.widthPx}px`;
    this.container.style.zIndex = '38';
    this.container.style.display = 'none';
    this.applyIslandContainerStyles();

    this.panel = document.createElement('div');
    this.panel.style.height = '100%';
    this.panel.style.display = 'flex';
    this.panel.style.flexDirection = 'column';
    this.panel.style.fontFamily = 'Poppins, sans-serif';
    this.panel.style.background = 'transparent';

    this.header = document.createElement('div');
    this.header.style.padding = '12px 18px';
    this.header.style.borderBottom = CHAT_PANEL_SECTION_BORDER;
    this.header.style.background = 'transparent';
    this.header.style.display = 'flex';
    this.header.style.flexDirection = 'column';
    this.header.style.gap = '4px';

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

    const brandIcon = createIcon('chat-bubble-left', {
      size: 16,
      strokeWidth: 1.9,
    });
    brandIcon.setAttribute('aria-hidden', 'true');
    brandIcon.style.color = '#94a3b8';

    this.contextTitle = document.createElement('p');
    this.contextTitle.style.margin = '0';
    this.contextTitle.style.fontSize = '13px';
    this.contextTitle.style.fontWeight = '600';
    this.contextTitle.style.lineHeight = '1.4';
    this.contextTitle.style.color = '#0f172a';
    this.contextTitle.style.flex = '1';
    this.contextTitle.style.minWidth = '0';
    this.contextTitle.style.whiteSpace = 'nowrap';
    this.contextTitle.style.overflow = 'hidden';
    this.contextTitle.style.textOverflow = 'ellipsis';
    this.contextTitle.textContent = 'Chat';
    brand.append(brandIcon, this.contextTitle);

    this.contextMeta = document.createElement('p');
    this.contextMeta.style.margin = '0';
    this.contextMeta.style.fontSize = '11px';
    this.contextMeta.style.lineHeight = '1.45';
    this.contextMeta.style.color = '#475569';
    this.contextMeta.style.paddingLeft = '24px';
    this.contextMeta.style.whiteSpace = 'nowrap';
    this.contextMeta.style.overflow = 'hidden';
    this.contextMeta.style.textOverflow = 'ellipsis';

    this.contextCard = document.createElement('div');
    this.contextCard.style.minWidth = '0';
    this.contextCard.style.display = 'flex';
    this.contextCard.style.flexDirection = 'column';
    this.contextCard.append(this.contextMeta);

    this.quickActionsSection = document.createElement('div');
    this.quickActionsSection.style.padding = '12px 18px 14px';
    this.quickActionsSection.style.borderBottom = 'none';
    this.quickActionsSection.style.background = 'transparent';

    this.quickActionsRow = document.createElement('div');
    this.quickActionsRow.style.display = 'flex';
    this.quickActionsRow.style.flexWrap = 'wrap';
    this.quickActionsRow.style.gap = '10px';
    this.quickActionsSection.appendChild(this.quickActionsRow);

    this.messagesFrame = document.createElement('div');
    this.messagesFrame.style.position = 'relative';
    this.messagesFrame.style.display = 'flex';
    this.messagesFrame.style.flex = '1';
    this.messagesFrame.style.minHeight = '0';

    this.messagesViewport = document.createElement('div');
    this.messagesViewport.style.flex = '1';
    this.messagesViewport.style.minHeight = '0';
    this.messagesViewport.style.overflowY = 'auto';
    this.messagesViewport.style.padding = '18px 18px 24px';
    this.messagesViewport.style.background = 'transparent';
    this.messagesViewport.addEventListener(
      'scroll',
      this.messagesViewportScrollHandler
    );

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

    this.scrollToBottomButton = this.createQuietIconButton({
      icon: 'arrow-down',
      title: 'Scroll to latest message',
      ariaLabel: 'Scroll to latest message',
      className:
        '!h-[34px] !w-[34px] !border-slate-200 !bg-white/95 shadow-none',
      onClick: () => {
        this.pinMessagesToBottom();
        this.scrollMessagesToBottom('smooth');
      },
    });
    this.scrollToBottomButton.style.position = 'absolute';
    this.scrollToBottomButton.style.left = '50%';
    this.scrollToBottomButton.style.bottom = '16px';
    this.scrollToBottomButton.style.display = 'none';
    this.scrollToBottomButton.style.alignItems = 'center';
    this.scrollToBottomButton.style.justifyContent = 'center';
    this.scrollToBottomButton.style.zIndex = '1';
    this.scrollToBottomButton.style.transform = 'translate(-50%, 6px)';
    this.scrollToBottomButton.style.transition =
      'opacity 140ms ease, transform 140ms ease';
    this.messagesFrame.append(this.messagesViewport, this.scrollToBottomButton);

    const composer = document.createElement('div');
    composer.style.padding = '14px 18px 18px';
    composer.style.display = 'flex';
    composer.style.flexDirection = 'column';
    composer.style.gap = '12px';
    composer.style.borderTop = CHAT_PANEL_SECTION_BORDER;
    composer.style.background = 'transparent';

    this.pendingConfirmationBar = this.createSubtleSurface(18);
    this.pendingConfirmationBar.style.display = 'none';
    this.pendingConfirmationBar.style.alignItems = 'center';
    this.pendingConfirmationBar.style.justifyContent = 'space-between';
    this.pendingConfirmationBar.style.gap = '12px';
    this.pendingConfirmationBar.style.padding = '12px 14px';

    const pendingConfirmationText = document.createElement('div');
    pendingConfirmationText.style.display = 'flex';
    pendingConfirmationText.style.flexDirection = 'column';
    pendingConfirmationText.style.gap = '3px';
    pendingConfirmationText.style.minWidth = '0';
    pendingConfirmationText.style.flex = '1';

    this.pendingConfirmationMeta = document.createElement('p');
    this.pendingConfirmationMeta.style.margin = '0';
    this.pendingConfirmationMeta.style.fontSize = '10px';
    this.pendingConfirmationMeta.style.fontWeight = '700';
    this.pendingConfirmationMeta.style.letterSpacing = '0.08em';
    this.pendingConfirmationMeta.style.textTransform = 'uppercase';
    this.pendingConfirmationMeta.style.color = '#64748b';

    this.pendingConfirmationTitle = document.createElement('p');
    this.pendingConfirmationTitle.style.margin = '0';
    this.pendingConfirmationTitle.style.fontSize = '12px';
    this.pendingConfirmationTitle.style.fontWeight = '600';
    this.pendingConfirmationTitle.style.lineHeight = '1.45';
    this.pendingConfirmationTitle.style.color = '#0f172a';
    this.pendingConfirmationTitle.style.whiteSpace = 'nowrap';
    this.pendingConfirmationTitle.style.overflow = 'hidden';
    this.pendingConfirmationTitle.style.textOverflow = 'ellipsis';

    pendingConfirmationText.append(
      this.pendingConfirmationMeta,
      this.pendingConfirmationTitle
    );

    this.pendingConfirmationButton = this.createPrimaryPillButton({
      text: 'Confirm',
      title: 'Confirm pending actions',
      ariaLabel: 'Confirm pending actions',
      onClick: () => {
        void this.confirmPendingSuggestion();
      },
    });

    this.pendingConfirmationBar.append(
      pendingConfirmationText,
      this.pendingConfirmationButton
    );

    const composerInput = ComponentFactory.createTextarea({
      rows: 3,
      placeholder: 'Ask about the current canvas',
    });
    this.composerInput = composerInput.getElement() as HTMLTextAreaElement;
    this.composerInput.style.resize = 'none';
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

    this.contextModeMenuButton = new MenuButton({
      label: 'Whole canvas',
      title: 'Context: Whole canvas',
      ariaLabel: 'Context: Whole canvas. Change context scope',
      size: 'xs',
      variant: 'plain',
      buttonClassName: '!min-w-[122px] !justify-between',
      placement: 'top-start',
      fallbackPlacements: ['top-end', 'bottom-start', 'bottom-end'],
      gap: 6,
      margin: 8,
      lockPlacementAfterOpen: true,
    });
    this.contextModeControl = this.contextModeMenuButton.element;
    this.contextModeControl.style.flexShrink = '0';

    this.clearButton = createTextButton({
      text: 'Clear chat',
      tone: 'text',
      size: 'xs',
      title: 'Clear chat',
      ariaLabel: 'Clear chat',
      onClick: () => {
        this.pinMessagesToBottom();
        this.chatController.clearConversation();
        this.resetCopyFeedback();
      },
    });
    this.messagesToolsRow.appendChild(this.clearButton);
    headerTopRow.append(brand, this.messagesToolsRow);
    this.header.append(headerTopRow, this.contextCard);

    this.sendButton = this.createPrimaryPillButton({
      text: 'Send',
      title: 'Send prompt',
      ariaLabel: 'Send prompt',
      onClick: () => {
        void this.submitCurrentPrompt();
      },
    });

    composerControls.append(this.contextModeControl, composerHint);
    composerFooter.append(composerControls, this.sendButton);
    composer.append(
      this.pendingConfirmationBar,
      this.composerInput,
      composerFooter
    );

    this.panel.append(
      this.header,
      this.quickActionsSection,
      this.messagesFrame,
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
    this.contextModeMenuButton.mount();
    window.addEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.workspaceViewChangedHandler
    );
    window.addEventListener(
      AI_ASSISTANT_CONTEXT_CHANGED_EVENT,
      this.chatContextChangedHandler
    );
  }

  public unmount(): void {
    this.contextModeMenuButton.unmount();
    window.removeEventListener(
      WORKSPACE_VIEW_CHANGED_EVENT,
      this.workspaceViewChangedHandler
    );
    window.removeEventListener(
      AI_ASSISTANT_CONTEXT_CHANGED_EVENT,
      this.chatContextChangedHandler
    );
    this.messagesViewport.removeEventListener(
      'scroll',
      this.messagesViewportScrollHandler
    );
    this.unsubscribeController?.();
    this.unsubscribeController = null;
    if (this.copyFeedbackTimer !== null) {
      window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
    this.container.remove();
  }

  public setVisible(visible: boolean): void {
    if (!visible) {
      this.contextModeMenuButton.close();
    }
    this.container.style.display = visible ? 'block' : 'none';
  }

  public setIslandMode(enabled: boolean): void {
    if (!enabled) {
      this.container.style.top = `${GLOBAL_APP_HEADER_HEIGHT_PX}px`;
      this.container.style.right = '0';
      this.container.style.bottom = '0';
      this.container.style.border = 'none';
      this.container.style.borderLeft = '1px solid rgba(226, 232, 240, 0.92)';
      this.container.style.borderRadius = '0';
      this.container.style.background = '#ffffff';
      this.container.style.boxShadow = 'none';
      this.container.style.backdropFilter = 'none';
      this.container.style.overflow = 'visible';
      return;
    }

    this.applyIslandContainerStyles();
  }

  public getWidthPx(): number {
    return this.widthPx;
  }

  public async submitExternalPrompt(prompt: string): Promise<void> {
    this.pinMessagesToBottom();
    await this.submitPrompt(prompt);
  }

  public async submitPreparedSubmission(
    submission: AiAssistantPreparedSubmission
  ): Promise<void> {
    this.pinMessagesToBottom();
    await this.chatController.submitPreparedSubmission(submission);
  }

  private render(): void {
    const state = this.chatController.getState();
    this.renderContext(state.context, state.contextMode);
    this.renderQuickActions(state.quickActions, state.messages);
    this.renderMessages(
      state.messages,
      state.replying,
      state.replyProgress ?? null,
      state.context,
      state.contextEnabled,
      state.currentView,
      state.contextMode
    );
    this.renderPendingConfirmation(state.pendingConfirmation, state.replying);
    this.renderComposer(
      state.currentView,
      state.replying,
      state.replyProgress ?? null,
      state.composerPlaceholder,
      state.contextMode
    );
  }

  private renderPendingConfirmation(
    pendingConfirmation: ReturnType<
      AiAssistantSessionController['getState']
    >['pendingConfirmation'],
    replying: boolean
  ): void {
    this.currentPendingConfirmation = pendingConfirmation;
    if (!pendingConfirmation) {
      this.pendingConfirmationBar.style.display = 'none';
      return;
    }

    this.pendingConfirmationBar.style.display = 'flex';
    this.pendingConfirmationMeta.textContent =
      pendingConfirmation.actionCount > 1
        ? `Pending confirmation · ${pendingConfirmation.actionCount} actions`
        : 'Pending confirmation';
    this.pendingConfirmationTitle.textContent = pendingConfirmation.actionTitle;
    this.pendingConfirmationButton.textContent =
      pendingConfirmation.actionLabel;
    setTextButtonState(this.pendingConfirmationButton, {
      disabled: replying,
    });
  }

  private renderContext(
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextMode: AiAssistantContextMode
  ): void {
    this.contextTitle.textContent = 'Chat';

    if (contextMode === 'none') {
      this.contextCard.style.display = 'none';
      return;
    }

    this.contextCard.style.display = 'flex';

    if (!context) {
      this.setContextMeta(
        this.joinContextMetaParts(
          contextMode === 'selection'
            ? ['Selection', 'Select items to ground the chat']
            : contextMode === 'viewport'
              ? ['Visible area', 'Open a canvas to use the visible area']
              : ['Canvas', 'Open a canvas to ground the chat']
        )
      );
      return;
    }

    const selection = getAiAssistantSelectedItems(context);
    this.setContextMeta(
      this.formatContextMeta(contextMode, context, selection)
    );
  }

  private setContextMeta(text: string | null): void {
    if (!text) {
      this.contextMeta.textContent = '';
      this.contextMeta.style.display = 'none';
      return;
    }

    this.contextMeta.textContent = text;
    this.contextMeta.style.display = 'block';
  }
  private formatContextMeta(
    contextMode: AiAssistantContextMode,
    context: NonNullable<
      ReturnType<AiAssistantSessionController['getState']>['context']
    >,
    selection: AiAssistantCanvasElement[]
  ): string | null {
    const totalItems = this.getContextItemCount(context);
    const canvasTitle = context.canvasTitle || 'Untitled canvas';

    if (contextMode === 'selection') {
      if (selection.length === 0) {
        return this.joinContextMetaParts([
          canvasTitle,
          'Selection',
          'Select items to ground the chat',
        ]);
      }
      if (selection.length === 1) {
        return this.joinContextMetaParts([
          canvasTitle,
          'Selection',
          capitalizeAiAssistantValue(selection[0].kind),
          selection[0].title || 'Untitled',
          this.getSelectionChildCountLabel(selection[0]),
        ]);
      }
      return this.joinContextMetaParts([
        canvasTitle,
        'Selection',
        `${selection.length} selected`,
        this.formatSelectionKindSummary(selection),
      ]);
    }

    if (contextMode === 'viewport') {
      return this.joinContextMetaParts([
        canvasTitle,
        'Visible area',
        totalItems === 0 ? 'Empty' : this.formatCountLabel(totalItems, 'item'),
        selection.length === 1
          ? `${capitalizeAiAssistantValue(selection[0].kind)}: ${selection[0].title || 'Untitled'}`
          : selection.length > 1
            ? `${selection.length} selected`
            : null,
      ]);
    }

    if (totalItems === 0) {
      return this.joinContextMetaParts([canvasTitle, 'Canvas', 'Empty']);
    }

    if (selection.length === 1) {
      return this.joinContextMetaParts([
        canvasTitle,
        'Canvas',
        `${capitalizeAiAssistantValue(selection[0].kind)} selected`,
        selection[0].title || 'Untitled',
      ]);
    }

    if (selection.length > 1) {
      return this.joinContextMetaParts([
        canvasTitle,
        'Canvas',
        `${selection.length} selected`,
      ]);
    }

    return this.joinContextMetaParts([
      canvasTitle,
      'Canvas',
      this.formatCanvasSummary(context),
    ]);
  }

  private getSelectionChildCountLabel(
    item: AiAssistantCanvasElement
  ): string | null {
    if (typeof item.childCount !== 'number' || item.childCount <= 0) {
      return null;
    }

    if (item.kind === 'story') {
      return this.formatCountLabel(item.childCount, 'task');
    }

    if (item.kind === 'goal') {
      return this.formatCountLabel(item.childCount, 'child item');
    }

    return null;
  }

  private getContextItemCount(
    context: NonNullable<
      ReturnType<AiAssistantSessionController['getState']>['context']
    >
  ): number {
    const summary = context.summary;
    return summary.goalCount + summary.storyCount + summary.taskCount;
  }

  private formatCountLabel(count: number, label: string): string {
    return `${count} ${label}${count === 1 ? '' : 's'}`;
  }

  private formatCanvasSummary(
    context: NonNullable<
      ReturnType<AiAssistantSessionController['getState']>['context']
    >
  ): string {
    const parts = [
      context.summary.goalCount > 0
        ? this.formatCountLabel(context.summary.goalCount, 'goal')
        : null,
      context.summary.storyCount > 0
        ? this.formatCountLabel(context.summary.storyCount, 'story')
        : null,
      context.summary.taskCount > 0
        ? this.formatCountLabel(context.summary.taskCount, 'task')
        : null,
    ].filter((part): part is string => part !== null);

    return parts.join(' · ');
  }

  private formatSelectionKindSummary(
    selection: AiAssistantCanvasElement[]
  ): string | null {
    const counts = {
      goal: 0,
      story: 0,
      task: 0,
    };
    selection.forEach((item) => {
      counts[item.kind] += 1;
    });

    return [
      counts.goal > 0 ? this.formatCountLabel(counts.goal, 'goal') : null,
      counts.story > 0 ? this.formatCountLabel(counts.story, 'story') : null,
      counts.task > 0 ? this.formatCountLabel(counts.task, 'task') : null,
    ]
      .filter((part): part is string => part !== null)
      .join(' · ');
  }

  private joinContextMetaParts(
    parts: Array<string | null | undefined>
  ): string | null {
    const filtered = parts.filter(
      (part): part is string =>
        typeof part === 'string' && part.trim().length > 0
    );
    return filtered.length > 0 ? filtered.join(' · ') : null;
  }

  private renderQuickActions(
    actions: ReturnType<
      AiAssistantSessionController['getState']
    >['quickActions'],
    messages: AiAssistantMessage[]
  ): void {
    const hasStartedConversation =
      messages.length > 1 ||
      messages.some((message) => message.role === 'user');
    const showQuickActions = !hasStartedConversation && actions.length > 0;
    this.quickActionsSection.style.display = showQuickActions ? 'block' : 'none';
    this.header.style.borderBottom = showQuickActions
      ? 'none'
      : CHAT_PANEL_SECTION_BORDER;
    this.quickActionsSection.style.borderBottom = showQuickActions
      ? CHAT_PANEL_SECTION_BORDER
      : 'none';
    this.quickActionsRow.replaceChildren();
    actions.forEach((action) => {
      this.quickActionsRow.appendChild(this.createQuickActionButton(action));
    });
  }

  private renderMessages(
    messages: AiAssistantMessage[],
    replying: boolean,
    replyProgress: AiAssistantReplyProgress | null,
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextEnabled: boolean,
    currentView: WorkspaceView,
    contextMode: AiAssistantContextMode
  ): void {
    const shouldAutoScroll =
      this.stickMessagesToBottom || this.messagesList.childElementCount === 0;
    const preservedScrollTop = shouldAutoScroll
      ? null
      : this.messagesViewport.scrollTop;
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
      this.messagesList.appendChild(this.createTypingBubble(replyProgress));
    }
    if (!shouldAutoScroll) {
      if (preservedScrollTop !== null) {
        this.messagesViewport.scrollTop = preservedScrollTop;
      }
      this.updateScrollToBottomButtonVisibility();
      return;
    }
    window.requestAnimationFrame(() => {
      this.scrollMessagesToBottom();
    });
    this.updateScrollToBottomButtonVisibility();
  }

  private createEmptyStateCard(
    currentView: WorkspaceView,
    contextMode: AiAssistantContextMode,
    context: ReturnType<AiAssistantSessionController['getState']>['context']
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
    roleLabel.style.color = '#4f46e5';

    const stateLabel = document.createElement('span');
    stateLabel.textContent = 'Start here';
    stateLabel.style.fontWeight = '500';
    stateLabel.style.color = '#94a3b8';

    meta.append(roleLabel, stateLabel);

    const bubble = this.createSubtleSurface(20);
    bubble.style.maxWidth = '94%';
    bubble.style.padding = '14px';
    bubble.style.display = 'flex';
    bubble.style.flexDirection = 'column';
    bubble.style.gap = '10px';

    const title = document.createElement('p');
    title.style.margin = '0';
    title.style.fontSize = '13px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.4';
    title.style.color = '#0f172a';

    const description = document.createElement('p');
    description.style.margin = '0';
    description.style.fontSize = '11.5px';
    description.style.lineHeight = '1.65';
    description.style.color = '#475569';

    const examplesLabel = document.createElement('p');
    examplesLabel.textContent = 'Try';
    examplesLabel.style.margin = '2px 0 0';
    examplesLabel.style.fontSize = '10px';
    examplesLabel.style.fontWeight = '700';
    examplesLabel.style.letterSpacing = '0.08em';
    examplesLabel.style.textTransform = 'uppercase';
    examplesLabel.style.color = '#94a3b8';

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
      const item = this.createSuggestionButton({
        text: line,
        title: 'Insert into message',
        onClick: () => {
          this.insertComposerDraft(line);
        },
      });
      item.style.margin = '0';
      item.style.maxWidth = '100%';
      item.style.textAlign = 'left';
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
    contextMode: AiAssistantContextMode
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
    contextMode: AiAssistantContextMode,
    context: ReturnType<AiAssistantSessionController['getState']>['context']
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
    replyProgress: AiAssistantReplyProgress | null,
    placeholder: string,
    contextMode: AiAssistantContextMode
  ): void {
    const noContext =
      placeholder === 'Canvas context is unavailable in this view';
    this.composerInput.placeholder = placeholder;
    this.composerInput.disabled = replying;
    this.composerInput.style.opacity = replying ? '0.8' : '1';
    this.composerInput.style.cursor = replying ? 'default' : 'text';
    this.composerInput.style.borderColor = replying
      ? 'rgba(203, 213, 225, 0.24)'
      : '';
    this.composerInput.style.background = replying
      ? 'rgba(248, 250, 252, 0.96)'
      : '';
    this.updateContextModeButton(contextMode, replying);
    this.contextModeControl.style.opacity = replying ? '0.55' : '1';
    setTextButtonState(this.clearButton, { disabled: replying });
    this.sendButton.disabled = replying;
    this.sendButton.textContent = replying
      ? this.getReplyButtonLabel(replyProgress)
      : 'Send';
    this.sendButton.style.opacity = replying ? '0.7' : '1';
    this.sendButton.style.cursor = replying ? 'default' : 'pointer';
    if (!noContext || currentView === 'canvas') {
      return;
    }
    this.composerInput.style.background = 'rgba(248, 250, 252, 0.96)';
  }

  private updateContextModeButton(
    contextMode: AiAssistantContextMode,
    replying: boolean
  ): void {
    const label = this.getContextModeOptionLabel(contextMode);
    this.contextModeMenuButton.setLabel(label);
    this.contextModeMenuButton.setTitle(`Context: ${label}`);
    this.contextModeMenuButton.setAriaLabel(
      `Context: ${label}. Change context scope`
    );
    this.contextModeMenuButton.setDisabled(replying);
    this.contextModeMenuButton.setItems(
      AI_ASSISTANT_CONTEXT_MODE_OPTIONS.map((option) => ({
        id: option.value,
        label: option.label,
        active: option.value === contextMode,
        disabled: replying,
        onSelect: () => {
          if (replying) return;
          this.chatController.setContextMode(option.value);
        },
      }))
    );
  }

  private getContextModeOptionLabel(
    contextMode: AiAssistantContextMode
  ): string {
    return (
      AI_ASSISTANT_CONTEXT_MODE_OPTIONS.find(
        (option) => option.value === contextMode
      )?.label ?? 'Whole canvas'
    );
  }

  private createQuickActionButton(action: {
    label: string;
    prompt: string;
    submission?: AiAssistantPreparedSubmission;
  }): HTMLButtonElement {
    return this.createQuietPillButton({
      text: action.label,
      title: action.label,
      ariaLabel: action.label,
      onClick: () => {
        this.pinMessagesToBottom();
        if (action.submission) {
          void this.submitPreparedSubmission(action.submission);
          return;
        }
        void this.submitPrompt(action.prompt);
      },
    });
  }

  private createMessageBubble(
    message: AiAssistantMessage,
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextEnabled: boolean,
    replying: boolean,
    canRegenerate: boolean
  ): HTMLDivElement {
    const isCommandMessage = message.kind === 'command';
    const isSystemMessage =
      !isCommandMessage &&
      (message.kind === 'system' || message.role === 'system');
    const isUserMessage = message.role === 'user';
    const isAssistantMessage = message.role === 'assistant';
    const canCopyMessage = message.content.trim().length > 0;
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = isUserMessage ? 'flex-end' : 'flex-start';
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
    roleLabel.textContent = isUserMessage
      ? 'You'
      : isCommandMessage
        ? 'Action'
        : isSystemMessage
          ? 'System'
          : 'Assistant';
    roleLabel.style.fontWeight = '700';
    roleLabel.style.color = isUserMessage
      ? '#475569'
      : isCommandMessage
        ? '#1d4ed8'
        : isSystemMessage
          ? '#6366f1'
          : '#64748b';

    const timeLabel = document.createElement('span');
    timeLabel.textContent = this.formatMessageTime(message.createdAt);
    timeLabel.style.fontWeight = '500';
    timeLabel.style.color = '#94a3b8';

    meta.append(roleLabel, timeLabel);

    const hasContent = message.content.trim().length > 0 || isUserMessage;
    wrap.append(meta);
    if (hasContent) {
      const bubble = document.createElement('div');
      bubble.style.maxWidth = isUserMessage ? '82%' : '94%';
      bubble.style.padding = '12px 14px';
      bubble.style.borderRadius = isUserMessage
        ? '20px 20px 8px 20px'
        : '20px 20px 20px 10px';
      bubble.style.fontSize = '12.5px';
      bubble.style.lineHeight = '1.6';
      bubble.style.color = isUserMessage
        ? '#0f172a'
        : isCommandMessage
          ? '#334155'
          : isSystemMessage
            ? '#334155'
            : '#1e293b';
      bubble.style.background = isUserMessage
        ? 'rgba(241, 245, 249, 0.96)'
        : isCommandMessage
          ? 'rgba(248, 250, 252, 0.92)'
          : isSystemMessage
            ? 'rgba(241, 245, 249, 0.92)'
            : 'rgba(248, 250, 252, 0.82)';
      bubble.style.border = isUserMessage
        ? '1px solid rgba(203, 213, 225, 0.82)'
        : isCommandMessage
          ? 'none'
          : isSystemMessage
            ? 'none'
            : 'none';
      bubble.appendChild(this.createMessageContent(message));
      wrap.appendChild(bubble);
    }

    if (isAssistantMessage && message.reviewFindings) {
      wrap.appendChild(this.createReviewFindingsCard(message.reviewFindings));
    }

    if (isAssistantMessage && Array.isArray(message.actions)) {
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
      !isSystemMessage &&
      !isCommandMessage &&
      (isAssistantMessage || isUserMessage) &&
      (canCopyMessage || canRegenerate)
    ) {
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.alignItems = 'center';
      actions.style.justifyContent = 'flex-start';
      actions.style.gap = '6px';
      actions.style.padding = '0 4px';

      if (canRegenerate) {
        const regenerateButton = this.createQuietIconButton({
          icon: 'arrow-path',
          size: 'sm',
          title: replying ? 'Regenerating response' : 'Regenerate response',
          ariaLabel: 'Regenerate response',
          surface: 'plain',
          className: '!h-6 !w-6 !text-slate-400',
          onClick: () => {
            this.pinMessagesToBottom();
            void this.chatController.regenerateMessage(message.id);
          },
        });
        regenerateButton.style.opacity = replying ? '0.55' : '1';
        regenerateButton.disabled = replying;
        actions.appendChild(regenerateButton);
      }

      if (canCopyMessage) {
        actions.appendChild(this.createCopyMessageButton(message));
      }
      wrap.appendChild(actions);
    }

    return wrap;
  }

  private createTypingBubble(
    replyProgress: AiAssistantReplyProgress | null
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
    roleLabel.textContent = 'Assistant';
    roleLabel.style.fontWeight = '700';
    roleLabel.style.color = '#64748b';
    const stateLabel = document.createElement('span');
    stateLabel.textContent = replyProgress?.label ?? 'Thinking';
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
    bubble.style.background = 'rgba(248, 250, 252, 0.9)';
    bubble.style.border = 'none';
    bubble.style.display = 'inline-flex';
    bubble.style.flexDirection = 'column';
    bubble.style.alignItems = 'flex-start';
    bubble.style.gap = '8px';

    const detail = document.createElement('p');
    detail.textContent = replyProgress?.detail ?? 'Working on your request.';
    detail.style.margin = '0';
    detail.style.fontSize = '11.5px';
    detail.style.lineHeight = '1.6';
    detail.style.color = '#475569';
    detail.style.whiteSpace = 'pre-wrap';
    detail.style.wordBreak = 'break-word';

    const footer = document.createElement('div');
    footer.style.display = 'inline-flex';
    footer.style.alignItems = 'center';
    footer.style.gap = '8px';

    const dots = document.createElement('div');
    dots.style.display = 'inline-flex';
    dots.style.alignItems = 'center';
    dots.style.gap = '6px';

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement('span');
      dot.style.width = '5px';
      dot.style.height = '5px';
      dot.style.borderRadius = '999px';
      dot.style.background = '#64748b';
      dot.style.opacity = ['0.35', '0.6', '0.9'][index] ?? '0.6';
      dots.appendChild(dot);
    }

    footer.appendChild(dots);

    if (
      typeof replyProgress?.currentStep === 'number' &&
      typeof replyProgress.totalSteps === 'number'
    ) {
      const step = document.createElement('span');
      step.textContent = `${replyProgress.currentStep}/${replyProgress.totalSteps}`;
      step.style.fontSize = '10px';
      step.style.fontWeight = '700';
      step.style.lineHeight = '1';
      step.style.letterSpacing = '0.04em';
      step.style.color = '#94a3b8';
      footer.appendChild(step);
    }

    bubble.append(detail, footer);
    wrap.append(meta, bubble);
    return wrap;
  }

  private async submitCurrentPrompt(): Promise<void> {
    await this.submitPrompt(this.composerInput.value);
  }

  private async submitPrompt(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;
    if (this.currentPendingConfirmation && this.isConfirmPrompt(trimmed)) {
      this.composerInput.value = '';
      this.pinMessagesToBottom();
      await this.confirmPendingSuggestion();
      return;
    }
    this.composerInput.value = '';
    this.pinMessagesToBottom();
    await this.chatController.submitPrompt(trimmed);
  }

  private async confirmPendingSuggestion(): Promise<void> {
    const pendingConfirmation = this.currentPendingConfirmation;
    if (!pendingConfirmation) {
      return;
    }

    this.pinMessagesToBottom();
    await this.chatController.executeMessageActions(
      pendingConfirmation.messageId,
      pendingConfirmation.actionIds,
      this.executeAction
    );
  }

  private pinMessagesToBottom(): void {
    this.stickMessagesToBottom = true;
    this.updateScrollToBottomButtonVisibility();
  }

  private scrollMessagesToBottom(behavior: ScrollBehavior = 'auto'): void {
    const top = this.messagesViewport.scrollHeight;
    if (
      behavior === 'smooth' &&
      typeof this.messagesViewport.scrollTo === 'function'
    ) {
      this.messagesViewport.scrollTo({ top, behavior });
    } else {
      this.messagesViewport.scrollTop = top;
    }
    this.stickMessagesToBottom = true;
    this.updateScrollToBottomButtonVisibility();
  }

  private isMessagesViewportNearBottom(): boolean {
    const distanceFromBottom =
      this.messagesViewport.scrollHeight -
      this.messagesViewport.scrollTop -
      this.messagesViewport.clientHeight;
    return distanceFromBottom <= CHAT_AUTO_SCROLL_THRESHOLD_PX;
  }

  private updateScrollToBottomButtonVisibility(): void {
    const shouldShow =
      !this.stickMessagesToBottom && this.messagesList.childElementCount > 0;
    this.scrollToBottomButton.style.display = shouldShow
      ? 'inline-flex'
      : 'none';
    this.scrollToBottomButton.style.opacity = shouldShow ? '1' : '0';
    this.scrollToBottomButton.style.transform = shouldShow
      ? 'translate(-50%, 0)'
      : 'translate(-50%, 6px)';
  }

  private isConfirmPrompt(prompt: string): boolean {
    const normalized = prompt.trim().toLocaleLowerCase().replace(/[!.]/g, '');
    return (
      normalized === 'confirm' ||
      normalized === 'confirmed' ||
      normalized === 'yes' ||
      normalized === 'ok' ||
      normalized === 'okay' ||
      normalized === 'apply' ||
      normalized === 'підтверджую' ||
      normalized === 'підтвердити' ||
      normalized === 'так' ||
      normalized === 'ок'
    );
  }

  private getRegeneratableMessageId(
    messages: AiAssistantMessage[]
  ): string | null {
    const lastMessage = messages[messages.length - 1];
    const previousMessage = messages[messages.length - 2];
    if (
      !lastMessage ||
      !previousMessage ||
      lastMessage.role !== 'assistant' ||
      (previousMessage.role !== 'user' && previousMessage.kind !== 'command')
    ) {
      return null;
    }
    return lastMessage.id;
  }

  private createActionCards(
    message: AiAssistantMessage,
    actions: AiAssistantAction[],
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement | null {
    if (actions.length === 0) return null;
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';
    list.style.width = '100%';
    list.style.maxWidth = '94%';

    groupAiAssistantActionsForRender(actions).forEach((entry) => {
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
    actions: AiAssistantAction[],
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement {
    const groupModel = buildAiAssistantGroupedActionCardModel(
      actions,
      context,
      contextEnabled
    );
    const card = this.createActionCardSurface({
      kind: 'group',
      gap: '12px',
      paddingPx: CHAT_ACTION_GROUP_CARD_INSET_PX,
    });

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.gap = '6px';

    const label = this.createActionEyebrow(groupModel.header.eyebrow);
    header.appendChild(label);

    if (groupModel.header.summary) {
      const summary = document.createElement('p');
      summary.textContent = groupModel.header.summary;
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

    groupModel.entries.forEach((entryModel) => {
      const row = this.createActionEntry(messageId, entryModel);
      rows.appendChild(row);
    });

    const groupFooter = this.createActionGroupFooter(messageId, groupModel);
    card.append(header, rows);
    if (groupFooter) {
      card.appendChild(groupFooter);
    }
    return card;
  }

  private createActionCard(
    messageId: string,
    action: AiAssistantAction,
    context: ReturnType<AiAssistantSessionController['getState']>['context'],
    contextEnabled: boolean
  ): HTMLDivElement {
    const entryModel = buildAiAssistantActionEntryModel(
      action,
      context,
      contextEnabled
    );
    const card = this.createActionCardSurface({
      kind: 'single',
      status: entryModel.status,
      gap: '0',
    });

    card.appendChild(this.createActionEntry(messageId, entryModel));
    return card;
  }

  private createActionEntry(
    messageId: string,
    entryModel: AiAssistantActionEntryModel
  ): HTMLDivElement {
    const entry = document.createElement('div');
    entry.style.display = 'flex';
    entry.style.flexDirection = 'column';
    entry.style.alignItems = 'stretch';
    entry.style.gap = '8px';

    const textWrap = document.createElement('div');
    textWrap.style.display = 'flex';
    textWrap.style.flexDirection = 'column';
    textWrap.style.gap = '5px';
    textWrap.style.minWidth = '0';
    textWrap.style.flex = '1';

    this.appendActionHeader(textWrap, entryModel.card, {
      showLeadingTag: true,
    });

    this.appendActionContentSections(textWrap, entryModel.card, {
      sections: ['meta', 'tags', 'details', 'description', 'reason', 'error'],
      skipEyebrowTag: true,
      bodyFontSize: '11.5px',
      bodyLineHeight: '1.6',
    });

    entry.append(
      textWrap,
      this.createActionFooter(this.createActionButton(messageId, entryModel))
    );
    return entry;
  }

  private createActionButton(
    messageId: string,
    entryModel: AiAssistantActionEntryModel
  ): HTMLButtonElement {
    return this.createActionCtaButton(entryModel.button, () => {
      if (entryModel.button.disabled) {
        return;
      }
      this.pinMessagesToBottom();
      void this.chatController.executeMessageAction(
        messageId,
        entryModel.actionId,
        this.executeAction
      );
    });
  }

  private createActionCtaButton(
    buttonModel: AiAssistantActionButtonModel,
    onClick: () => void
  ): HTMLButtonElement {
    const buttonFactory =
      buttonModel.tone === 'quiet'
        ? this.createQuietPillButton.bind(this)
        : this.createPrimaryPillButton.bind(this);
    const button = buttonFactory({
      text: buttonModel.label,
      title: buttonModel.label,
      ariaLabel: buttonModel.label,
      onClick: () => {
        onClick();
      },
    });

    setTextButtonState(button, {
      disabled: buttonModel.disabled,
    });
    button.style.opacity = buttonModel.dimmed ? '0.7' : '1';
    return button;
  }

  private createActionGroupFooter(
    messageId: string,
    groupModel: AiAssistantGroupedActionCardModel
  ): HTMLDivElement | null {
    const footerModel = groupModel.footer;
    if (!footerModel) {
      return null;
    }

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '2px';
    footer.style.marginLeft = `-${CHAT_ACTION_GROUP_CARD_INSET_PX}px`;
    footer.style.marginRight = `-${CHAT_ACTION_GROUP_CARD_INSET_PX}px`;
    footer.style.paddingTop = '12px';
    footer.style.paddingLeft = `${CHAT_ACTION_GROUP_CARD_INSET_PX}px`;
    footer.style.paddingRight = `${CHAT_ACTION_GROUP_CARD_INSET_PX}px`;
    footer.style.borderTop = CHAT_ACTION_DIVIDER_BORDER;

    const button = this.createActionCtaButton(footerModel.button, () => {
      this.pinMessagesToBottom();
      void this.chatController.executeMessageActions(
        messageId,
        footerModel.actionIds,
        this.executeAction
      );
    });

    footer.appendChild(button);
    return footer;
  }

  private createActionTagRowFromModels(
    tagModels: AiAssistantActionTagModel[],
    options: {
      skipCount?: number;
    } = {}
  ): HTMLDivElement | null {
    const visibleTags = tagModels.slice(options.skipCount ?? 0);
    if (visibleTags.length === 0) return null;

    const tags = document.createElement('div');
    tags.style.display = 'flex';
    tags.style.flexWrap = 'wrap';
    tags.style.gap = '6px';

    visibleTags.forEach((tag) => {
      tags.appendChild(this.createActionTag(tag.text, tag.tone));
    });

    return tags;
  }

  private createActionEyebrow(text: string): HTMLSpanElement {
    return this.createActionLabelText(text, {
      letterSpacing: '0.08em',
    });
  }

  private createActionSectionLabel(text: string): HTMLSpanElement {
    return this.createActionLabelText(text, {
      letterSpacing: '0.04em',
    });
  }

  private createActionLabelText(
    text: string,
    options: {
      letterSpacing: string;
    }
  ): HTMLSpanElement {
    const label = document.createElement('span');
    label.textContent = text;
    label.style.fontSize = '10px';
    label.style.fontWeight = '700';
    label.style.letterSpacing = options.letterSpacing;
    label.style.textTransform = 'uppercase';
    label.style.color = '#64748b';
    return label;
  }

  private createActionMetaParagraph(text: string): HTMLParagraphElement {
    return this.createActionTextParagraph(text, {
      fontSize: '11px',
      lineHeight: '1.5',
      color: '#6b7280',
    });
  }

  private createActionTextParagraph(
    text: string,
    options: {
      fontSize: string;
      lineHeight: string;
      color: string;
    }
  ): HTMLParagraphElement {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    paragraph.style.margin = '0';
    paragraph.style.fontSize = options.fontSize;
    paragraph.style.lineHeight = options.lineHeight;
    paragraph.style.color = options.color;
    return paragraph;
  }

  private appendActionHeader(
    container: HTMLElement,
    cardModel: AiAssistantActionCardModel,
    options: {
      showLeadingTag: boolean;
    }
  ): void {
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'flex-start';
    topRow.style.justifyContent = 'space-between';
    topRow.style.gap = '10px';

    topRow.appendChild(this.createActionEyebrow(cardModel.eyebrow));

    if (options.showLeadingTag) {
      const leadingTag = cardModel.tags[0];
      if (leadingTag) {
        topRow.appendChild(this.createActionTag(leadingTag.text, leadingTag.tone));
      }
    }

    container.appendChild(topRow);

    const title = document.createElement('p');
    title.textContent = cardModel.title;
    title.style.margin = '0';
    title.style.fontSize = '13.5px';
    title.style.fontWeight = '600';
    title.style.lineHeight = '1.45';
    title.style.color = '#0f172a';
    container.appendChild(title);
  }

  private createActionPreviewSurface(options: {
    gap?: string;
  } = {}): HTMLDivElement {
    const container = this.createSubtleSurface(CHAT_ACTION_PREVIEW_RADIUS_PX);
    container.dataset.actionPreview = 'true';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = options.gap ?? '8px';
    container.style.padding = '10px 12px';
    return container;
  }

  private createActionCardSurface(options: {
    kind: 'single' | 'group';
    status?: AiAssistantAction['status'];
    gap: string;
    paddingPx?: number;
  }): HTMLDivElement {
    const surface = this.createFlatSurface(CHAT_ACTION_CARD_RADIUS_PX);
    surface.dataset.actionCard = options.kind;
    if (options.status) {
      surface.dataset.actionStatus = options.status;
    }
    surface.style.padding = `${options.paddingPx ?? CHAT_ACTION_CARD_PADDING_PX}px`;
    surface.style.display = 'flex';
    surface.style.flexDirection = 'column';
    surface.style.gap = options.gap;
    return surface;
  }

  private createActionDetailBlock(
    block: AiAssistantActionDetailBlock
  ): HTMLDivElement {
    switch (block.kind) {
      case 'kv-list':
        return this.createActionPreviewSection(
          block.title,
          this.createActionPreviewDetailList(block.entries)
        );
      case 'text-list':
        return this.createActionPreviewSection(
          block.title,
          this.createActionPreviewTextList(block.items)
        );
      case 'hierarchy-list':
        return this.createActionPreviewSection(
          block.title,
          this.createActionPreviewHierarchyList(block.items)
        );
      case 'entity-list':
        return this.createActionPreviewSection(
          block.title,
          this.createActionPreviewEntityList(block.items)
        );
      default: {
        const exhaustiveCheck: never = block;
        throw new Error(`Unsupported action detail block: ${String(exhaustiveCheck)}`);
      }
    }
  }

  private createActionPreviewSection(
    title: string,
    content: HTMLElement
  ): HTMLDivElement {
    const surface = this.createActionPreviewSurface();
    const section = document.createElement('div');
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = '6px';
    section.append(this.createActionSectionLabel(title), content);
    surface.appendChild(section);
    return surface;
  }

  private createActionPreviewDetailList(
    entries: Array<{ label: string; value: string }>
  ): HTMLDivElement {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '6px';

    entries.forEach((entry) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'baseline';
      row.style.flexWrap = 'wrap';
      row.style.columnGap = '6px';
      row.style.rowGap = '2px';
      row.append(
        this.createActionSectionLabel(`${entry.label}:`),
        this.createActionInlineValue(entry.value)
      );
      list.appendChild(row);
    });

    return list;
  }

  private createActionPreviewTextList(items: string[]): HTMLDivElement {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '5px';

    items.forEach((item) => {
      list.appendChild(
        this.createActionTextParagraph(item, {
          fontSize: '11px',
          lineHeight: '1.5',
          color: '#334155',
        })
      );
    });

    return list;
  }

  private createActionPreviewHierarchyList(
    items: Array<{
      title: string;
      description?: string;
      depth: number;
    }>
  ): HTMLDivElement {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '5px';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '2px';
      row.style.paddingLeft = `${item.depth * 16}px`;

      const title = document.createElement('p');
      title.textContent = `${item.depth > 0 ? '-> ' : ''}${item.title}`;
      title.style.margin = '0';
      title.style.fontSize = '11.5px';
      title.style.fontWeight = item.depth === 0 ? '700' : '600';
      title.style.lineHeight = '1.45';
      title.style.color = '#0f172a';
      row.appendChild(title);

      if (item.description) {
        row.appendChild(
          this.createActionTextParagraph(item.description, {
            fontSize: '10.5px',
            lineHeight: '1.5',
            color: '#475569',
          })
        );
      }

      list.appendChild(row);
    });

    return list;
  }

  private createActionPreviewEntityList(
    items: Array<{
      title: string;
      description?: string;
      meta?: string[];
    }>
  ): HTMLDivElement {
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.gap = '3px';

      row.appendChild(
        this.createActionTextParagraph(item.title, {
          fontSize: '11.5px',
          lineHeight: '1.45',
          color: '#0f172a',
        })
      );

      if (item.meta && item.meta.length > 0) {
        row.appendChild(this.createActionMetaParagraph(item.meta.join(' · ')));
      }

      if (item.description) {
        row.appendChild(
          this.createActionTextParagraph(item.description, {
            fontSize: '10.5px',
            lineHeight: '1.5',
            color: '#475569',
          })
        );
      }

      list.appendChild(row);
    });

    return list;
  }

  private createActionInlineValue(text: string): HTMLSpanElement {
    const value = document.createElement('span');
    value.textContent = text;
    value.style.fontSize = '11.5px';
    value.style.lineHeight = '1.55';
    value.style.color = '#0f172a';
    value.style.whiteSpace = 'pre-wrap';
    value.style.wordBreak = 'break-word';
    return value;
  }

  private appendActionContentSections(
    container: HTMLElement,
    cardModel: AiAssistantActionCardModel,
    options: {
      sections: AiAssistantActionContentSection[];
      skipEyebrowTag?: boolean;
      bodyFontSize: string;
      bodyLineHeight: string;
    }
  ): void {
    const sectionNodes = this.createActionContentSectionNodes(cardModel, {
      skipEyebrowTag: options.skipEyebrowTag ?? false,
      bodyFontSize: options.bodyFontSize,
      bodyLineHeight: options.bodyLineHeight,
    });

    options.sections.forEach((section) => {
      sectionNodes[section].forEach((node) => {
        container.appendChild(node);
      });
    });
  }

  private createActionContentSectionNodes(
    cardModel: AiAssistantActionCardModel,
    options: {
      skipEyebrowTag: boolean;
      bodyFontSize: string;
      bodyLineHeight: string;
    }
  ): Record<AiAssistantActionContentSection, HTMLElement[]> {
    const sectionNodes: Record<AiAssistantActionContentSection, HTMLElement[]> = {
      meta: [this.createActionMetaParagraph(cardModel.meta)],
      tags: [],
      details: cardModel.detailBlocks.map((block) =>
        this.createActionDetailBlock(block)
      ),
      description: [],
      reason: [],
      error: [],
    };

    const tags = this.createActionTagRowFromModels(cardModel.tags, {
      skipCount: options.skipEyebrowTag ? 1 : 0,
    });
    if (tags) {
      sectionNodes.tags.push(tags);
    }

    if (cardModel.description) {
      sectionNodes.description.push(
        this.createActionTextParagraph(cardModel.description, {
          fontSize: options.bodyFontSize,
          lineHeight: options.bodyLineHeight,
          color: '#334155',
        })
      );
    }

    if (cardModel.reason) {
      sectionNodes.reason.push(
        this.createActionTextParagraph(cardModel.reason, {
          fontSize: options.bodyFontSize,
          lineHeight: options.bodyLineHeight,
          color: '#334155',
        })
      );
    }

    if (cardModel.error) {
      sectionNodes.error.push(
        this.createActionTextParagraph(cardModel.error, {
          fontSize: '11px',
          lineHeight: '1.45',
          color: '#b91c1c',
        })
      );
    }

    return sectionNodes;
  }

  private createActionFooter(button: HTMLButtonElement): HTMLDivElement {
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-start';
    footer.style.paddingTop = '2px';
    footer.appendChild(button);
    return footer;
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
    tag.style.fontSize = '9.5px';
    tag.style.fontWeight = '600';
    tag.style.lineHeight = '1';
    tag.style.borderRadius = '999px';
    tag.style.padding = '4px 7px';
    tag.style.whiteSpace = 'nowrap';
    tag.style.border = `1px solid ${options.border}`;
    tag.style.background = options.background;
    tag.style.color = options.color;
    return tag;
  }

  private applyIslandContainerStyles(): void {
    this.container.style.top = `${CHAT_ISLAND_MARGIN_PX + GLOBAL_APP_HEADER_HEIGHT_PX}px`;
    this.container.style.right = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.bottom = `${CHAT_ISLAND_MARGIN_PX}px`;
    this.container.style.border = CHAT_PANEL_BORDER;
    this.container.style.borderLeft = '';
    this.container.style.borderRadius = `${CHAT_PANEL_RADIUS_PX}px`;
    this.container.style.background = CHAT_PANEL_BACKGROUND;
    this.container.style.backdropFilter = 'none';
    this.container.style.overflow = 'hidden';
  }

  private createFlatSurface(radiusPx = CHAT_PANEL_RADIUS_PX): HTMLDivElement {
    return this.createPanelSurface({
      radiusPx,
      background: CHAT_PANEL_BACKGROUND,
      border: CHAT_PANEL_SURFACE_BORDER,
    });
  }

  private createSubtleSurface(radiusPx = CHAT_PANEL_RADIUS_PX): HTMLDivElement {
    return this.createPanelSurface({
      radiusPx,
      background: CHAT_PANEL_SUBTLE_BACKGROUND,
      border: 'none',
    });
  }

  private createPanelSurface(options: {
    radiusPx: number;
    background: string;
    border?: string;
  }): HTMLDivElement {
    const surface = document.createElement('div');
    surface.style.boxSizing = 'border-box';
    surface.style.border = options.border ?? CHAT_PANEL_SURFACE_BORDER;
    surface.style.borderRadius = `${options.radiusPx}px`;
    surface.style.background = options.background;
    surface.style.boxShadow = 'none';
    return surface;
  }

  private createQuietPillButton(options: {
    text: string;
    title: string;
    ariaLabel: string;
    onClick: (event: MouseEvent) => void;
  }): HTMLButtonElement {
    return createTextButton({
      text: options.text,
      tone: 'text',
      size: 'sm',
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
      className:
        '!h-8 !rounded-full !border !border-slate-200 !bg-slate-50 !px-3 !text-[11px] !font-semibold !text-slate-700 hover:!bg-white hover:!text-slate-800',
    });
  }

  private createPrimaryPillButton(options: {
    text: string;
    title: string;
    ariaLabel: string;
    onClick: (event: MouseEvent) => void;
  }): HTMLButtonElement {
    return createTextButton({
      text: options.text,
      tone: 'primary',
      size: 'sm',
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
      className:
        '!h-8 !rounded-full !px-3.5 !text-[11px] !font-semibold tracking-[0.01em] shadow-none',
    });
  }

  private createQuietIconButton(options: {
    icon: IconName;
    title: string;
    ariaLabel: string;
    onClick: (event: MouseEvent) => void;
    size?: 'sm' | 'md' | 'lg';
    tone?: 'soft' | 'secondary' | 'text' | 'danger';
    surface?: 'outlined' | 'plain';
    className?: string;
  }): HTMLButtonElement {
    const surfaceClass =
      options.surface === 'plain'
        ? '!border-transparent !bg-transparent hover:!bg-slate-100'
        : '!border-slate-200 !bg-slate-50 hover:!bg-white';
    return createIconButton({
      icon: options.icon,
      title: options.title,
      ariaLabel: options.ariaLabel,
      onClick: options.onClick,
      size: options.size ?? 'sm',
      tone: options.tone ?? 'text',
      className:
        `!rounded-full border ${surfaceClass} ${options.className ?? ''}`.trim(),
    });
  }

  private createSuggestionButton(options: {
    text: string;
    title: string;
    onClick: (event: MouseEvent) => void;
  }): HTMLButtonElement {
    const button = this.createQuietPillButton({
      text: options.text,
      title: options.title,
      ariaLabel: options.title,
      onClick: options.onClick,
    });
    button.classList.remove('truncate');
    button.style.height = 'auto';
    button.style.whiteSpace = 'normal';
    button.style.lineHeight = '1.55';
    button.style.padding = '8px 10px';
    return button;
  }

  private createReviewFindingsCard(
    review: AiAssistantReviewFindings
  ): HTMLDivElement {
    const card = this.createFlatSurface(20);
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '12px';
    card.style.width = '100%';
    card.style.maxWidth = '94%';
    card.style.padding = '14px';

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

    card.append(header);

    if (typeof review.readinessScore === 'number' || review.readinessVerdict) {
      const readiness = document.createElement('div');
      readiness.style.display = 'flex';
      readiness.style.alignItems = 'center';
      readiness.style.flexWrap = 'wrap';
      readiness.style.gap = '8px';

      if (typeof review.readinessScore === 'number') {
        const readinessTone = getAiAssistantReadinessBadgeTone(
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
      const item = this.createSubtleSurface(16);
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '6px';
      item.style.padding = '11px 12px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'flex-start';
      header.style.flexWrap = 'wrap';
      header.style.gap = '8px';

      const severityTone = getAiAssistantFindingSeverityBadgeTone(
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

  private async copyMessage(message: AiAssistantMessage): Promise<void> {
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

  private createCopyMessageButton(
    message: AiAssistantMessage
  ): HTMLButtonElement {
    const feedbackForMessage =
      this.copyFeedback?.messageId === message.id ? this.copyFeedback : null;
    const copyButton = this.createQuietIconButton({
      icon:
        feedbackForMessage?.status === 'copied'
          ? 'check'
          : feedbackForMessage?.status === 'failed'
            ? 'x-mark'
            : 'square-2-stack',
      size: 'sm',
      tone: feedbackForMessage?.status === 'failed' ? 'danger' : 'text',
      title: feedbackForMessage
        ? feedbackForMessage.status === 'copied'
          ? 'Copied to clipboard'
          : 'Copy to clipboard failed'
        : 'Copy message to clipboard',
      ariaLabel: 'Copy message to clipboard',
      surface: 'plain',
      className:
        feedbackForMessage?.status === 'copied'
          ? '!h-6 !w-6 !bg-emerald-50 !text-emerald-600'
          : '!h-6 !w-6 !text-slate-400',
      onClick: () => {
        void this.copyMessage(message);
      },
    });
    copyButton.style.transition =
      'transform 140ms ease, color 140ms ease, border-color 140ms ease';
    copyButton.style.transform =
      feedbackForMessage?.status === 'copied' ? 'scale(1.08)' : 'scale(1)';
    return copyButton;
  }

  private createMessageContent(message: AiAssistantMessage): HTMLElement {
    if (message.role === 'assistant') {
      return this.markdownRenderer.render(message.content);
    }

    const content = document.createElement('div');
    content.style.whiteSpace = 'pre-wrap';
    content.style.wordBreak = 'break-word';
    content.textContent = message.content;
    return content;
  }

  private getReplyButtonLabel(
    replyProgress: AiAssistantReplyProgress | null
  ): string {
    switch (replyProgress?.phase) {
      case 'drafting':
        return 'Drafting...';
      case 'repairing':
        return 'Repairing...';
      case 'instructions':
      case 'routing':
      case 'tools':
      default:
        return 'Working...';
    }
  }
}
