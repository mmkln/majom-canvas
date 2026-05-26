import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { createPaneModalShell } from '../../../ui-lib/src/components/PaneModal.ts';
import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';
import { Textarea } from '../../../ui-lib/src/components/Textarea.ts';
import {
  TagPickerField,
  type TagPickerItem,
} from '../../../ui-lib/src/components/TagPickerField.ts';
import type {
  Board,
  BoardColumn,
  Card,
  CardCheckItem,
  CardChecklist,
  CardChecklistSummary,
  CardEntityLink,
  CardEntityLinkType,
  CardPlacement,
  Tag,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  AnchoredMenu,
  MenuButton,
  createDivider,
  createDropdownItem,
  createSurface,
  createInputBase,
  createIconButton,
  setIconButtonContent,
  createTextButton,
  createFormMessage,
  HudSegmentedControl,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon, type IconName } from '../../../ui-lib/src/hud/icons.ts';
import { renderInlineComposer } from '../../../ui-lib/src/workspace-board/index.ts';
import type {
  BoardCardPatch,
  BoardCardPlacementTarget,
  BoardEntityCatalogPort,
  BoardEntityLinkSearchItem,
  BoardTagCatalogPort,
  BoardsIntentHandlers,
  BoardsState,
} from '../domain/types.ts';
import {
  BOARDS_EXCHANGE_SCHEMA,
  BOARDS_EXCHANGE_VERSION,
  createDefaultBoardsImportPolicies,
  type BoardsExchangeFormat,
  type BoardsExchangeScope,
  type BoardsExportRequest,
  type BoardsExportResult,
  type BoardsImportMatchStrategy,
  type BoardsImportMode,
  type BoardsImportPlan,
  type BoardsImportPolicies,
  type BoardsImportRequest,
  type BoardsImportTarget,
  type BoardsImportUnknownFieldPolicy,
} from '../exchange/schema.ts';
import { getCardPlacementId } from '../domain/cardIdentity.ts';
import {
  getBoardCardTagIds,
  normalizeBoardCardTagIds,
} from '../domain/cardTags.ts';
import {
  generateBoardGroupId,
  getBoardGroup,
  getBoardRecentTimestamp,
  getUniqueBoardGroups,
  isBoardStarred,
  type BoardGroup,
} from '../domain/boardMeta.ts';
import { resolveCardPlacementTarget } from '../domain/placementTargetResolver.ts';
import { BoardColumnDragController } from './BoardColumnDragController.ts';
import { BoardDragController } from './BoardDragController.ts';
import {
  boardsModalClassNames,
  boardsViewClassNames,
  installBoardsViewStyles,
} from './boardsViewStyles.ts';
import {
  captureBoardsScroll,
  restoreBoardsScroll,
} from './boardsScrollState.ts';
import { notify } from '../../../ui-lib/src/services/NotificationService.ts';
import {
  createCardDetailsPatch,
  hasCardDetailsPatch,
  hasRequestedCardDetailsTagIds,
} from '../domain/cardDetailsSession.ts';
import { CardDetailsSessionController } from '../state/CardDetailsSessionController.ts';

type BoardsViewOptions = {
  runtime?: AppRuntime;
  tagCatalog?: BoardTagCatalogPort;
  entityCatalog?: BoardEntityCatalogPort;
  handlers: BoardsIntentHandlers;
};

type CardDraft = {
  title: HTMLTextAreaElement;
};

type CardLocation = {
  board: Board;
  column: BoardColumn;
  card: Card;
  placementId: CardPlacement['id'];
};

type MoveCardPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type ListActionsPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type CardActionsPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type CardLabelsPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  picker: TagPickerField;
  trigger: HTMLButtonElement;
};

type CardChecklistPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type CardCheckItemMenuPopoverController = {
  itemId: CardCheckItem['id'];
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type CardEntityLinkMenuPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
};

type ImportPreviewModalScope = {
  scope: BoardsExchangeScope;
  titleKey: string;
  target?: BoardsImportTarget;
};

type ExportOutputModalConfig = {
  titleKey: string;
  request: BoardsExportRequest;
};

type ImportFormatGuideHandle = {
  element: HTMLElement;
  refresh: () => void;
};

type CardChecklistPanelStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'error';

type CardChecklistPanelState = {
  cardId: Card['id'];
  status: CardChecklistPanelStatus;
  checklists: CardChecklist[];
  error: string | null;
};

type BoardPickerPopoverController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  trigger: HTMLButtonElement;
  viewState: BoardPickerViewState;
  actionsMenu: BoardPickerActionsMenuController | null;
};

type BoardPickerActionsMenuController = {
  menu: AnchoredMenu;
  panel: HTMLElement;
  boardId: Board['id'];
};

type CardWithOptionalFrontMetadata = Card & {
  commentCount?: number;
  commentsCount?: number;
  comments_count?: number;
  comments?: unknown[];
};

type PlacementTargetSelection = BoardCardPlacementTarget & {
  column: BoardColumn['id'];
};

type TagCatalogStatus = 'idle' | 'loading' | 'ready' | 'error';
type CardEntityLinkPickerStatus = 'idle' | 'loading' | 'ready' | 'error';
type CardFrontBadgeTone = 'plain' | 'neutral' | 'task' | 'story' | 'goal';
type BoardPickerFilter = 'all' | 'starred' | 'recent';
type BoardPickerSectionId = string;
type BoardPickerViewState = {
  query: string;
  activeFilter: BoardPickerFilter;
  collapsedSections: Record<BoardPickerSectionId, boolean>;
};

const CARD_BACK_TITLE_EDITOR_ROWS = 1;
const CARD_BACK_TITLE_MAX_LENGTH = 16384;
const BOARD_PICKER_COVER_CLASSES = [
  boardsViewClassNames.boardPickerCoverA,
  boardsViewClassNames.boardPickerCoverB,
  boardsViewClassNames.boardPickerCoverC,
  boardsViewClassNames.boardPickerCoverD,
  boardsViewClassNames.boardPickerCoverE,
  boardsViewClassNames.boardPickerCoverF,
] as const;
const DEFAULT_BOARD_PICKER_COLLAPSED_SECTIONS: Record<
  BoardPickerSectionId,
  boolean
> = {
  starred: false,
  yourBoards: false,
};

const QUICK_CARD_EDITOR_GEOMETRY = {
  formWidth: 256,
  actionsWidth: 220,
  actionsGap: 8,
  viewportMargin: 12,
  minVisibleHeight: 220,
} as const;
const IMPORT_ACTION_LABEL_KEYS = {
  create: 'boards.import.action.create',
  update: 'boards.import.action.update',
  skip: 'boards.import.action.skip',
  conflict: 'boards.import.action.conflict',
} as const;
const IMPORT_ENTITY_LABEL_KEYS = {
  board: 'boards.import.entity.board',
  column: 'boards.import.entity.column',
  card: 'boards.import.entity.card',
  checklist: 'boards.import.entity.checklist',
  checkItem: 'boards.import.entity.checkItem',
} as const;
const IMPORT_ACTION_GROUP_LABEL_KEYS = {
  create: 'boards.import.group.create',
  update: 'boards.import.group.update',
  skip: 'boards.import.group.skip',
  conflict: 'boards.import.group.conflict',
} as const;

function isMirrorCard(card: Card): boolean {
  return card.mirror_source != null;
}

function isCardCompleted(card: Card): boolean {
  return card.completedAt != null;
}

function prependButtonIcon(button: HTMLButtonElement, icon: IconName): void {
  const label = button.textContent ?? '';
  button.textContent = '';
  const iconElement = createIcon(icon, { size: 16, strokeWidth: 2 });
  iconElement.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.textContent = label;
  button.append(iconElement, text);
}

function setMenuButtonIconOnly(
  menu: MenuButton,
  icon: IconName,
  label: string
): void {
  const button = menu.getButtonElement();
  button.className = boardsViewClassNames.headerMenuButton;
  const iconElement = createIcon(icon, { size: 16, strokeWidth: 2 });
  iconElement.setAttribute('aria-hidden', 'true');
  button.replaceChildren(iconElement);
  button.title = label;
  button.setAttribute('aria-label', label);
}

function syncHeaderMenuButtonOpenState(menu: MenuButton, open: boolean): void {
  const button = menu.getButtonElement();
  button.classList.remove('!bg-slate-100', '!text-slate-800');
  button.dataset.boardsHeaderMenuOpen = open ? 'true' : 'false';
}

function getCardCommentCount(card: Card): number {
  const candidate = card as CardWithOptionalFrontMetadata;
  const count =
    candidate.commentsCount ??
    candidate.commentCount ??
    candidate.comments_count ??
    candidate.comments?.length ??
    0;
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function mapTagToPickerItem(tag: Tag): TagPickerItem {
  return {
    id: tag.id,
    title: tag.title,
    color: tag.color,
  };
}

function getBoardPickerCoverClass(board: Board): string {
  const seed = Array.from(board.id).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );
  return (
    BOARD_PICKER_COVER_CLASSES[seed % BOARD_PICKER_COVER_CLASSES.length] ??
    BOARD_PICKER_COVER_CLASSES[0]
  );
}

function getBoardPickerInitial(board: Board): string {
  return board.title.trim().charAt(0) || '?';
}

function getCardLabelTextColor(color: string): string {
  const hex = color.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#172b4d';
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.58 ? '#172b4d' : '#ffffff';
}

function getCardChecklistSummary(card: Card): CardChecklistSummary {
  const summary = card.checklist_summary;
  const total = Number(summary?.total ?? 0);
  const completed = Number(summary?.completed ?? 0);
  return {
    total: Number.isFinite(total) ? total : 0,
    completed: Number.isFinite(completed) ? completed : 0,
  };
}

function getCardEntityLinks(card: Card): CardEntityLink[] {
  return card.entity_links ?? [];
}

function countCardEntityLinksByType(
  card: Card
): Record<CardEntityLinkType, number> {
  return getCardEntityLinks(card).reduce<Record<CardEntityLinkType, number>>(
    (counts, link) => {
      counts[link.entity_type] += 1;
      return counts;
    },
    { task: 0, story: 0, goal: 0 }
  );
}

function getCardEntityIcon(entityType: CardEntityLinkType): IconName {
  if (entityType === 'task') return 'check-box';
  if (entityType === 'story') return 'bookmark';
  return 'goal-circle';
}

function getCardEntityTypeLabelKey(entityType: CardEntityLinkType): string {
  if (entityType === 'task') return 'boards.cardLinks.task';
  if (entityType === 'story') return 'boards.cardLinks.story';
  return 'boards.cardLinks.goal';
}

function getCreateCardEntityLabelKey(entityType: CardEntityLinkType): string {
  if (entityType === 'task') return 'boards.cardLinks.createTask';
  if (entityType === 'story') return 'boards.cardLinks.createStory';
  return 'boards.cardLinks.createGoal';
}

function getCardEntityLinkTitle(link: CardEntityLink): string {
  return link.entity?.title?.trim() || link.entity_id;
}

export class BoardsView {
  private readonly runtime: AppRuntime;
  private readonly tagCatalog: BoardTagCatalogPort | null;
  private readonly entityCatalog: BoardEntityCatalogPort | null;
  private readonly handlers: BoardsIntentHandlers;
  private readonly disposeRuntimeSubscription: () => void;
  private state: BoardsState | null = null;
  private columnTitleTextarea: HTMLTextAreaElement | null = null;
  private expandedCardComposerColumnId: BoardColumn['id'] | null = null;
  private isColumnComposerExpanded = false;
  private editingBoardTitleId: Board['id'] | null = null;
  private boardTitleEditInput: HTMLInputElement | null = null;
  private editingColumnTitleId: BoardColumn['id'] | null = null;
  private columnTitleEditInput: HTMLInputElement | null = null;
  private headerMenu: MenuButton | null = null;
  private boardPickerPopover: BoardPickerPopoverController | null = null;
  private importPreviewOverlay: HTMLDivElement | null = null;
  private exportOutputOverlay: HTMLDivElement | null = null;
  private quickEditorOverlay: HTMLDivElement | null = null;
  private activeCardPlacementId: CardPlacement['id'] | null = null;
  private cardModalOverlay: HTMLDivElement | null = null;
  private moveCardPopover: MoveCardPopoverController | null = null;
  private listActionsPopover: ListActionsPopoverController | null = null;
  private cardActionsPopover: CardActionsPopoverController | null = null;
  private cardLabelsPopover: CardLabelsPopoverController | null = null;
  private cardChecklistPopover: CardChecklistPopoverController | null = null;
  private cardCheckItemMenuPopover: CardCheckItemMenuPopoverController | null =
    null;
  private cardEntityLinkMenuPopover: CardEntityLinkMenuPopoverController | null =
    null;
  private cardModalLabelsHost: HTMLDivElement | null = null;
  private cardModalQuickActionList: HTMLUListElement | null = null;
  private cardModalChecklistHost: HTMLDivElement | null = null;
  private cardChecklistPanelState: CardChecklistPanelState | null = null;
  private cardChecklistLoadVersion = 0;
  private readonly hiddenCheckedChecklistIds = new Set<CardChecklist['id']>();
  private readonly expandedCheckItemComposerIds = new Set<
    CardChecklist['id']
  >();
  private tagItems: TagPickerItem[] = [];
  private tagCatalogStatus: TagCatalogStatus = 'idle';
  private lastNotifiedErrorKey: string | null = null;
  private readonly dragController: BoardDragController;
  private readonly columnDragController: BoardColumnDragController;
  private readonly cardDetailsSession = new CardDetailsSessionController();
  private readonly cardDrafts = new Map<BoardColumn['id'], CardDraft>();

  constructor(
    private readonly root: HTMLElement,
    options: BoardsViewOptions
  ) {
    installBoardsViewStyles();
    this.runtime = options.runtime ?? createAppRuntime();
    this.tagCatalog = options.tagCatalog ?? null;
    this.entityCatalog = options.entityCatalog ?? null;
    this.handlers = options.handlers;
    this.dragController = new BoardDragController({
      root: this.root,
      getState: () => this.state,
      onDrop: (placementId, target) =>
        this.handlers.onPatchCardPlacement(placementId, target),
      onDragStart: () => this.closeTransientBoardOverlays(),
    });
    this.columnDragController = new BoardColumnDragController({
      root: this.root,
      getState: () => this.state,
      onDrop: (columnId, target) =>
        this.handlers.onPatchColumn(columnId, target),
      onDragStart: () => this.closeTransientBoardOverlays(),
    });
    this.dragController.mount();
    this.columnDragController.mount();
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshFromRuntime(),
      { emitCurrent: false }
    );
    this.root.className = boardsViewClassNames.root;
  }

  public render(state: BoardsState): void {
    const previousSelectedBoardId = this.state?.selectedBoardId ?? null;
    const scrollSnapshot =
      previousSelectedBoardId === state.selectedBoardId
        ? captureBoardsScroll(this.root)
        : null;
    const reopenBoardPicker = this.boardPickerPopover
      ? {
          ...this.boardPickerPopover.viewState,
          collapsedSections: {
            ...this.boardPickerPopover.viewState.collapsedSections,
          },
        }
      : null;
    this.state = state;
    this.notifyStateError(state.error);
    this.ensureTagCatalogLoaded();
    this.dragController.cancelDrag();
    this.columnDragController.cancelDrag();
    this.cardDrafts.clear();
    this.unmountHeaderMenu();
    this.closeBoardPickerPopover();
    this.closeListActionsPopover();
    this.closeCardActionsPopover();
    this.closeMoveCardPopover();
    this.closeCardChecklistPopover();
    this.closeCardCheckItemMenuPopover();
    this.closeCardEntityLinkMenuPopover();
    this.closeQuickCardEditor();
    this.root.replaceChildren(this.renderShell(state));
    if (scrollSnapshot) {
      restoreBoardsScroll(this.root, scrollSnapshot);
      requestAnimationFrame(() =>
        restoreBoardsScroll(this.root, scrollSnapshot)
      );
    }
    this.syncCardModal(state);
    if (reopenBoardPicker) {
      requestAnimationFrame(() => {
        const trigger = this.root.querySelector<HTMLButtonElement>(
          '[data-testid="board-picker-button"]'
        );
        if (trigger && !trigger.disabled) {
          this.openBoardPickerPopover(trigger, state, reopenBoardPicker);
        }
      });
    }
  }

  public destroy(): void {
    this.disposeRuntimeSubscription();
    this.dragController.unmount();
    this.columnDragController.unmount();
    this.unmountHeaderMenu();
    this.closeBoardPickerPopover();
    this.closeCardLabelsPopover();
    this.closeCardChecklistPopover();
    this.closeCardCheckItemMenuPopover();
    this.closeCardEntityLinkMenuPopover();
    this.closeListActionsPopover();
    this.closeCardActionsPopover();
    this.closeMoveCardPopover();
    this.closeQuickCardEditor();
    this.closeImportPreviewModal();
    this.closeExportOutputModal();
    this.closeCardModal();
    this.cardDrafts.clear();
    this.root.replaceChildren();
  }

  private notifyStateError(messageKey: string | null): void {
    if (!messageKey) {
      this.lastNotifiedErrorKey = null;
      return;
    }
    if (messageKey === this.lastNotifiedErrorKey) return;
    this.lastNotifiedErrorKey = messageKey;
    notify(this.runtime.i18n.t(messageKey), 'error');
  }

  private refreshFromRuntime(): void {
    if (!this.state) return;
    this.render(this.state);
  }

  private closeTransientBoardOverlays(): void {
    this.closeBoardPickerPopover();
    this.closeListActionsPopover();
    this.closeCardActionsPopover();
    this.closeCardLabelsPopover();
    this.closeCardChecklistPopover();
    this.closeCardCheckItemMenuPopover();
    this.closeCardEntityLinkMenuPopover();
    this.closeMoveCardPopover();
    this.closeQuickCardEditor();
  }

  private ensureTagCatalogLoaded(): void {
    if (!this.tagCatalog || this.tagCatalogStatus !== 'idle') return;
    this.tagCatalogStatus = 'loading';
    void this.tagCatalog
      .loadTags()
      .then((tags) => {
        this.tagItems = tags.map(mapTagToPickerItem);
        this.tagCatalogStatus = 'ready';
        this.rerenderCurrentState();
      })
      .catch(() => {
        this.tagItems = [];
        this.tagCatalogStatus = 'error';
        this.rerenderCurrentState();
      });
  }

  private getTagPickerErrorMessage(): string | null {
    return this.tagCatalogStatus === 'error'
      ? this.runtime.i18n.t('boards.cardBack.tagsLoadFailed')
      : null;
  }

  private renderShell(state: BoardsState): HTMLElement {
    const shell = document.createElement('section');
    shell.className = boardsViewClassNames.shell;
    shell.append(this.renderHeader(state));

    if (state.status === 'loading' && state.boards.length === 0) {
      shell.append(this.renderMessage(this.runtime.i18n.t('boards.loading')));
      return shell;
    }

    if (state.boards.length === 0) {
      shell.append(this.renderEmptyState());
      return shell;
    }

    const selectedBoard = this.getSelectedBoard(state);
    shell.append(
      selectedBoard
        ? this.renderBoard(selectedBoard, state)
        : this.renderMessage(this.runtime.i18n.t('boards.empty'))
    );
    return shell;
  }

  private renderHeader(state: BoardsState): HTMLElement {
    const header = document.createElement('header');
    header.className = boardsViewClassNames.header;
    const selectedBoard = this.getSelectedBoard(state);

    const titleBlock = document.createElement('div');
    titleBlock.className = boardsViewClassNames.titleBlock;
    const titleRow = document.createElement('div');
    titleRow.className = boardsViewClassNames.titleRow;
    titleRow.append(this.renderBoardTitle(selectedBoard, state));
    if (state.boards.length > 0) {
      titleRow.append(this.renderBoardPickerButton(selectedBoard, state));
    }
    titleBlock.append(titleRow);

    const actions = document.createElement('div');
    actions.className = boardsViewClassNames.headerActions;
    actions.append(this.renderHeaderMenu(selectedBoard, state));

    header.append(titleBlock, actions);
    return header;
  }

  private renderBoardTitle(
    board: Board | null,
    state: BoardsState
  ): HTMLElement {
    const title = document.createElement('h1');
    title.className = boardsViewClassNames.title;
    if (!board || this.editingBoardTitleId !== board.id) {
      const titleButton = document.createElement('button');
      titleButton.type = 'button';
      titleButton.className = boardsViewClassNames.titleButton;
      titleButton.textContent =
        board?.title ?? this.runtime.i18n.t('boards.title');
      titleButton.disabled = !board || state.status === 'saving';
      titleButton.title = this.runtime.i18n.t('boards.actions.renameBoard');
      titleButton.setAttribute(
        'aria-label',
        this.runtime.i18n.t('boards.actions.renameBoard')
      );
      titleButton.addEventListener('click', () => {
        if (!board) return;
        this.startBoardTitleEdit(board.id);
      });
      title.append(titleButton);
      return title;
    }

    this.boardTitleEditInput = createInputBase({
      variant: 'inline',
      type: 'text',
      value: board.title,
      autoComplete: 'off',
      maxLength: 512,
      className: boardsViewClassNames.titleEditInput,
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.finishBoardTitleEdit(board, true);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.finishBoardTitleEdit(board, false);
        }
      },
    });
    this.boardTitleEditInput.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.boardTitlePlaceholder')
    );
    this.boardTitleEditInput.addEventListener('blur', () => {
      this.finishBoardTitleEdit(board, true);
    });
    title.append(this.boardTitleEditInput);
    requestAnimationFrame(() => {
      this.boardTitleEditInput?.focus();
      this.boardTitleEditInput?.select();
    });
    return title;
  }

  private renderBoardPickerButton(
    board: Board | null,
    state: BoardsState
  ): HTMLButtonElement {
    const label = this.runtime.i18n.t('boards.boardPicker.open');
    const button = createIconButton({
      icon: 'kanban',
      tone: 'text',
      size: 'sm',
      className: boardsViewClassNames.boardPickerButton,
      title: label,
      ariaLabel: label,
      disabled: !board || state.status === 'saving',
    });
    const content = document.createElement('span');
    content.className = boardsViewClassNames.boardPickerButtonContent;
    const boardIcon = createIcon('kanban', { size: 16, strokeWidth: 2 });
    boardIcon.setAttribute('aria-hidden', 'true');
    const chevronIcon = createIcon('chevron-down', {
      size: 14,
      strokeWidth: 2,
    });
    chevronIcon.setAttribute('aria-hidden', 'true');
    content.append(boardIcon, chevronIcon);
    setIconButtonContent(button, content);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('data-testid', 'board-picker-button');
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.boardPickerPopover?.trigger === button) {
        this.closeBoardPickerPopover();
        return;
      }
      this.openBoardPickerPopover(button, state);
    });
    return button;
  }

  private openBoardPickerPopover(
    trigger: HTMLButtonElement,
    state: BoardsState,
    initialViewState?: BoardPickerViewState
  ): void {
    this.closeTransientBoardOverlays();

    const viewState: BoardPickerViewState = initialViewState
      ? {
          query: initialViewState.query,
          activeFilter: initialViewState.activeFilter,
          collapsedSections: { ...initialViewState.collapsedSections },
        }
      : {
          query: '',
          activeFilter: 'all',
          collapsedSections: { ...DEFAULT_BOARD_PICKER_COLLAPSED_SECTIONS },
        };
    const selectedBoard = this.getSelectedBoard(state);
    const panel = createSurface({
      elevated: true,
      className: `${boardsViewClassNames.boardPickerPopover} hidden`,
    });
    panel.setAttribute('data-testid', 'board-picker-popover');

    const searchWrap = document.createElement('div');
    searchWrap.className = boardsViewClassNames.boardPickerSearchWrap;
    const searchIcon = createIcon('magnifying-glass', {
      size: 18,
      strokeWidth: 2,
    });
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.classList.add(boardsViewClassNames.boardPickerSearchIcon);
    const searchInput = createInputBase({
      type: 'search',
      autoComplete: 'off',
      placeholder: this.runtime.i18n.t('boards.boardPicker.searchPlaceholder'),
      className: boardsViewClassNames.boardPickerSearchInput,
      onInput: (value) => {
        viewState.query = value.trim().toLowerCase();
        renderResults();
      },
      onKeyDown: (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeBoardPickerPopover();
        }
      },
    });
    searchInput.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.boardPicker.searchLabel')
    );
    searchInput.value = viewState.query;
    searchWrap.append(searchIcon, searchInput);

    const chips = document.createElement('div');
    chips.className = boardsViewClassNames.boardPickerChips;
    const renderFilters = (): void => {
      chips.replaceChildren(
        ...this.getBoardPickerFilterOptions().map((filter) =>
          this.renderBoardPickerChip({
            label: filter.label,
            selected: viewState.activeFilter === filter.value,
            onClick: () => {
              viewState.activeFilter = filter.value;
              renderFilters();
              renderResults();
              searchInput.focus();
            },
          })
        )
      );
    };

    const sections = document.createElement('div');
    sections.className = boardsViewClassNames.boardPickerSections;

    const renderResults = (): void => {
      sections.replaceChildren();
      const visibleBoards = this.getBoardPickerVisibleBoards(
        state.boards,
        viewState.activeFilter,
        viewState.query
      );
      const groupedBoards = this.getBoardPickerGroupedBoards(visibleBoards);
      if (viewState.activeFilter === 'all') {
        const starredBoards = visibleBoards.filter(isBoardStarred);
        if (starredBoards.length > 0) {
          sections.append(
            this.renderBoardPickerSection({
              id: 'starred',
              label: this.runtime.i18n.t('boards.boardPicker.starred'),
              boards: starredBoards,
              selectedBoardId: selectedBoard?.id,
              viewState,
              allowEmpty: false,
              onToggle: renderResults,
            })
          );
        }
      }
      groupedBoards.groups.forEach((group) => {
        sections.append(
          this.renderBoardPickerSection({
            id: `group:${group.id}`,
            label: group.name,
            boards: group.boards,
            allBoards: state.boards,
            selectedBoardId: selectedBoard?.id,
            viewState,
            allowEmpty: false,
            onToggle: renderResults,
          })
        );
      });
      if (
        groupedBoards.ungrouped.length > 0 ||
        groupedBoards.groups.length === 0 ||
        visibleBoards.length === 0
      ) {
        sections.append(
          this.renderBoardPickerSection({
            id: 'yourBoards',
            label: this.runtime.i18n.t('boards.boardPicker.yourBoards'),
            boards:
              groupedBoards.groups.length > 0
                ? groupedBoards.ungrouped
                : visibleBoards,
            allBoards: state.boards,
            selectedBoardId: selectedBoard?.id,
            viewState,
            allowEmpty: true,
            showCreateBoardCard: viewState.activeFilter === 'all',
            onToggle: renderResults,
          })
        );
      }
    };

    panel.append(searchWrap, chips, sections);

    const menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 290,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.boardPickerPopover?.menu === menu) {
          this.closeBoardPickerPopover();
        }
      },
    });
    menu.mount();
    this.boardPickerPopover = {
      menu,
      panel,
      trigger,
      viewState,
      actionsMenu: null,
    };
    renderFilters();
    renderResults();
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-start',
      fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
    requestAnimationFrame(() => searchInput.focus());
  }

  private getBoardPickerFilterOptions(): Array<{
    value: BoardPickerFilter;
    label: string;
  }> {
    return [
      {
        value: 'all',
        label: this.runtime.i18n.t('boards.boardPicker.all'),
      },
      {
        value: 'starred',
        label: this.runtime.i18n.t('boards.boardPicker.starred'),
      },
      {
        value: 'recent',
        label: this.runtime.i18n.t('boards.boardPicker.recent'),
      },
    ];
  }

  private getBoardPickerVisibleBoards(
    boards: Board[],
    filter: BoardPickerFilter,
    query: string
  ): Board[] {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = boards.filter((board) => {
      if (
        normalizedQuery &&
        !board.title.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      if (filter === 'starred') return isBoardStarred(board);
      if (filter === 'recent') return getBoardRecentTimestamp(board) !== null;
      return true;
    });

    if (filter !== 'recent') return filtered;
    return [...filtered].sort(
      (left, right) =>
        (getBoardRecentTimestamp(right) ?? 0) -
        (getBoardRecentTimestamp(left) ?? 0)
    );
  }

  private getBoardPickerGroupedBoards(boards: Board[]): {
    groups: Array<BoardGroup & { boards: Board[] }>;
    ungrouped: Board[];
  } {
    const groups = new Map<string, BoardGroup & { boards: Board[] }>();
    const ungrouped: Board[] = [];
    boards.forEach((board) => {
      const group = getBoardGroup(board);
      if (!group) {
        ungrouped.push(board);
        return;
      }
      const existing = groups.get(group.id);
      if (existing) {
        existing.boards.push(board);
        return;
      }
      groups.set(group.id, { ...group, boards: [board] });
    });
    return {
      groups: Array.from(groups.values()).sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
      ungrouped,
    };
  }

  private renderBoardPickerChip(options: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = options.selected
      ? boardsViewClassNames.boardPickerChipSelected
      : boardsViewClassNames.boardPickerChip;
    chip.textContent = options.label;
    chip.addEventListener('click', options.onClick);
    return chip;
  }

  private renderBoardPickerSection(options: {
    id: BoardPickerSectionId;
    label: string;
    boards: Board[];
    allBoards: Board[];
    selectedBoardId: Board['id'] | null | undefined;
    viewState: BoardPickerViewState;
    allowEmpty: boolean;
    showCreateBoardCard?: boolean;
    onToggle: () => void;
  }): HTMLElement {
    const collapsed = options.viewState.collapsedSections[options.id];
    const section = document.createElement('section');
    section.className = boardsViewClassNames.boardPickerSection;
    section.dataset.boardPickerSection = options.id;

    const heading = document.createElement('h2');
    heading.className = boardsViewClassNames.boardPickerSectionTitle;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = boardsViewClassNames.boardPickerSectionToggle;
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    const sectionIcon = createIcon('chevron-down', {
      size: 16,
      strokeWidth: 2,
    });
    sectionIcon.setAttribute('aria-hidden', 'true');
    sectionIcon.classList.toggle(
      boardsViewClassNames.boardPickerSectionIconCollapsed,
      collapsed
    );
    const sectionLabel = document.createElement('span');
    sectionLabel.textContent = options.label;
    toggle.append(sectionIcon, sectionLabel);
    toggle.addEventListener('click', () => {
      options.viewState.collapsedSections[options.id] = !collapsed;
      options.onToggle();
    });
    heading.append(toggle);

    const grid = document.createElement('div');
    grid.className = boardsViewClassNames.boardPickerGrid;
    grid.hidden = collapsed;
    if (options.boards.length === 0 && options.allowEmpty) {
      const empty = document.createElement('p');
      empty.className = boardsViewClassNames.boardPickerEmpty;
      empty.textContent = this.runtime.i18n.t('boards.boardPicker.noResults');
      grid.append(empty);
    } else {
      options.boards.forEach((board) => {
        grid.append(
          this.renderBoardPickerCard(
            board,
            options.selectedBoardId,
            options.allBoards
          )
        );
      });
    }
    if (options.showCreateBoardCard) {
      grid.append(this.renderBoardPickerCreateCard());
    }

    section.append(heading, grid);
    return section;
  }

  private renderBoardPickerCreateCard(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsViewClassNames.boardPickerCreateCard;
    button.textContent = this.runtime.i18n.t('boards.boardPicker.createBoard');
    button.addEventListener('click', () => {
      this.closeBoardPickerPopover();
      this.handlers.onCreateBoard(
        this.runtime.i18n.t('boards.defaultBoardTitle')
      );
    });
    return button;
  }

  private renderBoardPickerCard(
    board: Board,
    selectedBoardId: Board['id'] | null | undefined,
    allBoards: Board[]
  ): HTMLElement {
    const selected = board.id === selectedBoardId;
    const starred = isBoardStarred(board);
    const card = document.createElement('div');
    card.className = selected
      ? boardsViewClassNames.boardPickerCardSelected
      : boardsViewClassNames.boardPickerCard;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsViewClassNames.boardPickerCardButton;
    button.setAttribute('aria-label', board.title);
    button.setAttribute('aria-current', selected ? 'true' : 'false');
    button.dataset.boardPickerBoardId = board.id;
    button.addEventListener('click', () => {
      this.closeBoardPickerPopover();
      this.handlers.onSelectBoard(board.id);
    });

    const cover = document.createElement('div');
    cover.className =
      `${boardsViewClassNames.boardPickerCover} ${getBoardPickerCoverClass(board)}`.trim();
    const initial = document.createElement('span');
    initial.className = boardsViewClassNames.boardPickerCoverInitial;
    initial.textContent = getBoardPickerInitial(board);
    cover.append(initial);

    const title = document.createElement('span');
    title.className = boardsViewClassNames.boardPickerCardTitle;
    title.textContent = board.title;

    button.append(cover, title);
    const starButton = createIconButton({
      icon: starred ? 'star-solid' : 'star',
      tone: 'text',
      size: 'sm',
      className: starred
        ? boardsViewClassNames.boardPickerStarButtonActive
        : boardsViewClassNames.boardPickerStarButton,
      title: this.runtime.i18n.t(
        starred ? 'boards.boardPicker.unstar' : 'boards.boardPicker.star'
      ),
      ariaLabel: this.runtime.i18n.t(
        starred ? 'boards.boardPicker.unstar' : 'boards.boardPicker.star'
      ),
      onClick: (event) => {
        event.stopPropagation();
        this.handlers.onToggleBoardStar(board.id);
      },
    });
    starButton.setAttribute('aria-pressed', starred ? 'true' : 'false');
    const actionsButton = createIconButton({
      icon: 'ellipsis-horizontal',
      tone: 'text',
      size: 'sm',
      className: boardsViewClassNames.boardPickerActionsButton,
      title: this.runtime.i18n.t('boards.boardPicker.actions'),
      ariaLabel: this.runtime.i18n.t('boards.boardPicker.actions'),
      onClick: (event) => {
        event.stopPropagation();
        this.openBoardPickerActionsMenu(board, allBoards, actionsButton);
      },
    });
    card.append(button, starButton, actionsButton);
    return card;
  }

  private openBoardPickerActionsMenu(
    board: Board,
    boards: Board[],
    anchor: HTMLButtonElement
  ): void {
    const popover = this.boardPickerPopover;
    if (!popover) return;
    if (popover.actionsMenu?.boardId === board.id) {
      this.closeBoardPickerActionsMenu();
      return;
    }
    this.closeBoardPickerActionsMenu();
    const panel = createSurface({
      elevated: true,
      className: `${boardsViewClassNames.boardPickerActionsMenu} hidden`,
    });
    panel.addEventListener('mousedown', (event) => event.stopPropagation());
    const menu = new AnchoredMenu({
      container: anchor,
      panel,
      positioning: 'viewport',
      panelZIndex: 310,
      onOpenChange: (open) => {
        if (!open && this.boardPickerPopover?.actionsMenu?.menu === menu) {
          this.closeBoardPickerActionsMenu();
        }
      },
    });
    popover.panel.append(panel);
    menu.mount();
    popover.actionsMenu = { menu, panel, boardId: board.id };
    this.renderBoardPickerActionsMenu(board, boards);
    menu.openAt({
      anchor,
      placement: 'right-start',
      fallbackPlacements: ['left-start', 'bottom-end', 'top-end'],
      gap: 4,
      margin: 8,
      lockPlacementAfterOpen: true,
    });
  }

  private renderBoardPickerActionsMenu(
    board: Board,
    boards: Board[],
    mode: 'menu' | 'createGroup' = 'menu'
  ): void {
    const actionsMenu = this.boardPickerPopover?.actionsMenu;
    if (!actionsMenu) return;
    actionsMenu.panel.replaceChildren();
    if (mode === 'createGroup') {
      actionsMenu.panel.append(
        this.renderBoardPickerCreateGroupInput(board, boards)
      );
      return;
    }

    const currentGroup = getBoardGroup(board);
    getUniqueBoardGroups(boards)
      .filter((group) => group.id !== currentGroup?.id)
      .forEach((group) => {
        actionsMenu.panel.append(
          createDropdownItem({
            label: this.runtime.i18n.t('boards.boardPicker.moveToGroup', {
              group: group.name,
            }),
            onClick: (event) => {
              event.stopPropagation();
              this.handlers.onUpdateBoardGroup(board.id, group);
              this.closeBoardPickerActionsMenu();
            },
          })
        );
      });

    if (currentGroup) {
      actionsMenu.panel.append(
        createDropdownItem({
          label: this.runtime.i18n.t('boards.boardPicker.removeFromGroup'),
          onClick: (event) => {
            event.stopPropagation();
            this.handlers.onUpdateBoardGroup(board.id, null);
            this.closeBoardPickerActionsMenu();
          },
        })
      );
    }

    if (actionsMenu.panel.childElementCount > 0) {
      actionsMenu.panel.append(createDivider({ tone: 'soft' }));
    }
    actionsMenu.panel.append(
      createDropdownItem({
        label: this.runtime.i18n.t('boards.boardPicker.createGroup'),
        onClick: (event) => {
          event.stopPropagation();
          this.renderBoardPickerActionsMenu(board, boards, 'createGroup');
        },
      })
    );
  }

  private renderBoardPickerCreateGroupInput(
    board: Board,
    boards: Board[]
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = boardsViewClassNames.boardPickerActionsInputRow;
    const input = createInputBase({
      variant: 'inline',
      value: '',
      type: 'text',
      className: boardsViewClassNames.boardPickerActionsInput,
    });
    input.placeholder = this.runtime.i18n.t(
      'boards.boardPicker.newGroupPlaceholder'
    );
    let finished = false;
    const finishEdit = (apply: boolean): void => {
      if (finished) return;
      finished = true;
      const name = apply ? input.value.trim() : '';
      if (!name) {
        this.renderBoardPickerActionsMenu(board, boards);
        return;
      }
      const existingGroup = getUniqueBoardGroups(boards).find(
        (group) => group.name.toLowerCase() === name.toLowerCase()
      );
      const targetGroup = existingGroup ?? {
        id: generateBoardGroupId(name, boards),
        name,
      };
      this.handlers.onUpdateBoardGroup(board.id, targetGroup);
      this.closeBoardPickerActionsMenu();
    };
    input.addEventListener('blur', () => finishEdit(true));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        finishEdit(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finishEdit(false);
      }
    });
    row.append(input);
    requestAnimationFrame(() => input.focus());
    return row;
  }

  private renderHeaderMenu(
    board: Board | null,
    state: BoardsState
  ): HTMLElement {
    let menu: MenuButton;
    menu = new MenuButton({
      label: this.runtime.i18n.t('boards.actions.menu'),
      ariaLabel: this.runtime.i18n.t('boards.actions.menu'),
      title: this.runtime.i18n.t('boards.actions.menu'),
      variant: 'plain',
      size: 'md',
      buttonClassName: boardsViewClassNames.headerMenuButton,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      onOpenChange: (open) => syncHeaderMenuButtonOpenState(menu, open),
      items: [
        {
          id: 'create-board',
          label: this.runtime.i18n.t('boards.actions.createBoard'),
          disabled: state.status === 'saving',
          onSelect: () => {
            this.handlers.onCreateBoard(
              this.runtime.i18n.t('boards.defaultBoardTitle')
            );
          },
        },
        {
          id: 'import-board',
          label: this.runtime.i18n.t('boards.import.actions.importBoard'),
          disabled: !board || state.status === 'saving',
          onSelect: () => {
            this.openImportPreviewModal({
              scope: 'board',
              titleKey: 'boards.import.title.board',
            });
          },
        },
        {
          id: 'export-board-markdown',
          label: this.runtime.i18n.t('boards.export.actions.boardMarkdown'),
          disabled: !board,
          onSelect: () => {
            if (!board) return;
            void this.openExportOutputModal({
              titleKey: 'boards.export.title.board',
              request: {
                scope: 'board',
                format: 'markdown',
                boardId: board.id,
              },
            });
          },
        },
        {
          id: 'export-board-json',
          label: this.runtime.i18n.t('boards.export.actions.boardJson'),
          disabled: !board,
          onSelect: () => {
            if (!board) return;
            void this.openExportOutputModal({
              titleKey: 'boards.export.title.board',
              request: { scope: 'board', format: 'json', boardId: board.id },
            });
          },
        },
        {
          id: 'delete-board',
          label: this.runtime.i18n.t('boards.actions.deleteBoard'),
          disabled: !board || state.status === 'saving',
          onSelect: () => {
            if (!board) return;
            this.handlers.onDeleteBoard(board.id);
          },
        },
      ],
    });
    setMenuButtonIconOnly(
      menu,
      'ellipsis-horizontal',
      this.runtime.i18n.t('boards.actions.menu')
    );
    this.headerMenu = menu;
    menu.mount();
    return menu.element;
  }

  private renderBoard(board: Board, state: BoardsState): HTMLElement {
    const body = document.createElement('div');
    body.className = boardsViewClassNames.body;

    const canvas = document.createElement('div');
    canvas.className = boardsViewClassNames.canvas;
    canvas.setAttribute('aria-label', board.title);
    canvas.dataset.boardCanvas = 'true';

    board.columns.forEach((column) => {
      canvas.append(this.renderColumn(board, column, state));
    });
    canvas.append(this.renderColumnComposer(board, state));

    body.append(canvas);
    return body;
  }

  private renderColumn(
    board: Board,
    column: BoardColumn,
    state: BoardsState
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = boardsViewClassNames.column;
    section.dataset.boardColumnId = String(column.id);
    section.dataset.boardColumnDraggable = 'true';

    const header = document.createElement('header');
    header.className = boardsViewClassNames.columnHeader;
    header.append(this.renderColumnTitle(column, state));

    const menuButton = createIconButton({
      icon: 'ellipsis-horizontal',
      tone: 'text',
      size: 'sm',
      className: `${boardsViewClassNames.iconButton} ${boardsViewClassNames.columnMenuButton}`,
      title: this.runtime.i18n.t('boards.listActions.title'),
      ariaLabel: this.runtime.i18n.t('boards.listActions.title'),
      disabled: state.status === 'saving',
    });
    menuButton.setAttribute('aria-haspopup', 'dialog');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('data-testid', 'list-actions-menu-button');
    menuButton.dataset.boardDragIgnore = 'true';
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.listActionsPopover?.trigger === menuButton) {
        this.closeListActionsPopover();
        return;
      }
      this.openListActionsPopover(menuButton, board, column);
    });
    header.append(menuButton);

    const cards = document.createElement('div');
    cards.className = boardsViewClassNames.cards;
    cards.dataset.boardCardsContainer = 'true';
    column.cards.forEach((card) => cards.append(this.renderCard(card)));

    section.append(header, cards, this.renderCardComposer(column, state));
    return section;
  }

  private renderColumnTitle(
    column: BoardColumn,
    state: BoardsState
  ): HTMLElement {
    if (this.editingColumnTitleId === column.id) {
      this.columnTitleEditInput = document.createElement('input');
      this.columnTitleEditInput.className =
        boardsViewClassNames.columnTitleInput;
      this.columnTitleEditInput.type = 'text';
      this.columnTitleEditInput.value = column.title;
      this.columnTitleEditInput.maxLength = 512;
      this.columnTitleEditInput.autocomplete = 'off';
      this.columnTitleEditInput.setAttribute(
        'aria-label',
        this.runtime.i18n.t('boards.columnTitlePlaceholder')
      );
      this.columnTitleEditInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.finishColumnTitleEdit(column, true);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          this.finishColumnTitleEdit(column, false);
        }
      });
      this.columnTitleEditInput.addEventListener('blur', () => {
        this.finishColumnTitleEdit(column, true);
      });
      requestAnimationFrame(() => {
        this.columnTitleEditInput?.focus();
        this.columnTitleEditInput?.select();
      });
      return this.columnTitleEditInput;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsViewClassNames.columnTitleButton;
    button.disabled = state.status === 'saving';
    button.title = this.runtime.i18n.t('boards.actions.renameColumn');
    button.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.actions.renameColumn')
    );
    button.addEventListener('click', () =>
      this.startColumnTitleEdit(column.id)
    );
    const title = document.createElement('span');
    title.className = boardsViewClassNames.columnTitle;
    title.textContent = column.title;
    button.append(title);
    return button;
  }

  private openListActionsPopover(
    trigger: HTMLButtonElement,
    board: Board,
    column: BoardColumn
  ): void {
    this.closeListActionsPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.listActionsPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'list-actions-menu');
    panel.setAttribute('data-testid', 'list-actions-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const header = document.createElement('header');
    header.className = boardsModalClassNames.listActionsHeader;
    const title = document.createElement('h2');
    title.id = 'list-actions-menu';
    title.className = boardsModalClassNames.listActionsTitle;
    title.textContent = this.runtime.i18n.t('boards.listActions.title');
    const close = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      className: boardsModalClassNames.iconButton,
      ariaLabel: this.runtime.i18n.t('common.close'),
      title: this.runtime.i18n.t('common.close'),
      onClick: () => this.closeListActionsPopover(),
    });
    header.append(title, close);

    const body = document.createElement('div');
    body.className = boardsModalClassNames.listActionsBody;

    body.append(
      this.renderListActionList([
        this.createListActionButton({
          labelKey: 'boards.listActions.addCard',
          testId: 'list-actions-add-card-button',
          onClick: () => {
            this.closeListActionsPopover();
            this.expandCardComposer(column.id);
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.import.actions.importColumn',
          testId: 'list-actions-import-column-button',
          onClick: () => {
            this.closeListActionsPopover();
            this.openImportPreviewModal({
              scope: 'column',
              titleKey: 'boards.import.title.column',
              target: { boardId: board.id, columnId: column.id },
            });
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.export.actions.columnMarkdown',
          testId: 'list-actions-export-column-markdown-button',
          onClick: () => {
            this.closeListActionsPopover();
            void this.openExportOutputModal({
              titleKey: 'boards.export.title.column',
              request: {
                scope: 'column',
                format: 'markdown',
                columnId: column.id,
              },
            });
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.export.actions.columnJson',
          testId: 'list-actions-export-column-json-button',
          onClick: () => {
            this.closeListActionsPopover();
            void this.openExportOutputModal({
              titleKey: 'boards.export.title.column',
              request: { scope: 'column', format: 'json', columnId: column.id },
            });
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.copyList',
          testId: 'list-actions-copy-list-button',
          disabled: true,
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.moveList',
          testId: 'list-actions-move-list-button',
          disabled: true,
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.moveAllCards',
          testId: 'list-actions-move-all-cards-button',
          disabled: true,
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.sortBy',
          disabled: true,
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.watch',
          testId: 'list-actions-watch-list-button',
          disabled: true,
        }),
      ]),
      this.renderListActionsDivider(),
      this.renderListActionsColorSection(),
      this.renderListActionsDivider(),
      this.renderListActionList([
        this.createListActionButton({
          labelKey: 'boards.listActions.archiveList',
          testId: 'list-actions-archive-list-button',
          onClick: () => {
            this.closeListActionsPopover();
            this.handlers.onDeleteColumn(column.id);
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.deleteList',
          testId: 'list-actions-delete-list-button',
          onClick: () => {
            this.closeListActionsPopover();
            this.handlers.onDeleteColumn(column.id);
          },
        }),
        this.createListActionButton({
          labelKey: 'boards.listActions.archiveAllCards',
          disabled: true,
        }),
      ])
    );
    panel.append(header, body);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 290,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.listActionsPopover?.menu === menu) {
          this.closeListActionsPopover();
        }
      },
    });
    menu.mount();
    this.listActionsPopover = { menu, panel, trigger };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderListActionList(buttons: HTMLButtonElement[]): HTMLElement {
    const list = document.createElement('ul');
    list.className = boardsModalClassNames.listActionsList;
    buttons.forEach((button) => {
      const item = document.createElement('li');
      item.className = boardsModalClassNames.listActionsItem;
      item.append(button);
      list.append(item);
    });
    return list;
  }

  private createListActionButton(options: {
    labelKey: string;
    testId?: string;
    disabled?: boolean;
    onClick?: () => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      text: this.runtime.i18n.t(options.labelKey),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.listActionsButton,
      disabled: options.disabled,
      onClick: options.onClick,
    });
    if (options.testId) button.setAttribute('data-testid', options.testId);
    return button;
  }

  private renderListActionsDivider(): HTMLElement {
    const divider = document.createElement('div');
    divider.className = boardsModalClassNames.listActionsDivider;
    divider.setAttribute('role', 'separator');
    return divider;
  }

  private renderListActionsColorSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = boardsModalClassNames.listActionsSection;
    const button = createTextButton({
      text: this.runtime.i18n.t('boards.listActions.changeListColor'),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.listActionsSectionButton,
      disabled: true,
    });
    const chevron = createIcon('chevron-up', { size: 16, strokeWidth: 2 });
    chevron.setAttribute('aria-hidden', 'true');
    button.append(chevron);
    const upgrade = document.createElement('div');
    upgrade.className = boardsModalClassNames.listActionsUpgrade;
    const title = document.createElement('p');
    title.className = boardsModalClassNames.listActionsUpgradeTitle;
    title.textContent = this.runtime.i18n.t(
      'boards.listActions.colorUpgradeTitle'
    );
    const copy = document.createElement('p');
    copy.className = boardsModalClassNames.listActionsUpgradeCopy;
    copy.textContent = this.runtime.i18n.t(
      'boards.listActions.colorUpgradeBody'
    );
    upgrade.append(title, copy);
    section.append(button, upgrade);
    return section;
  }

  private renderCard(card: Card): HTMLElement {
    const placementId = getCardPlacementId(card);
    const isCompleted = isCardCompleted(card);
    const article = document.createElement('article');
    const baseCardClass = isCompleted
      ? boardsViewClassNames.cardCompleted
      : boardsViewClassNames.card;
    article.className = isMirrorCard(card)
      ? `${baseCardClass} ${boardsViewClassNames.cardMirror}`
      : baseCardClass;
    article.dataset.boardCardId = String(card.id);
    article.dataset.boardCardPlacementId = String(placementId);
    article.dataset.boardCardDraggable = 'true';
    article.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openQuickCardEditor(placementId, article.getBoundingClientRect());
    });

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = boardsViewClassNames.cardOpenButton;
    openButton.dataset.boardCardOpen = String(placementId);
    openButton.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.actions.openCard')
    );
    openButton.addEventListener('click', () => this.openCardModal(placementId));

    const title = document.createElement('h3');
    title.className = boardsViewClassNames.cardTitle;
    title.textContent = card.title;
    const completeToggle = this.createCardCompletionToggle(card, {
      className: isCompleted
        ? boardsViewClassNames.cardCompleteToggleCompleted
        : boardsViewClassNames.cardCompleteToggle,
      testId: 'board-card-completion-toggle',
    });
    const sourceLabel = this.renderCardMirrorSourceLabel(
      card,
      boardsViewClassNames.cardSourceLabel
    );
    const tags = this.renderCardFrontTags(card);
    if (sourceLabel) openButton.append(sourceLabel);
    if (tags) openButton.append(tags);
    openButton.append(title);

    const badges = this.renderCardFrontBadges(card);
    if (badges) {
      openButton.append(badges);
    }

    article.append(completeToggle, openButton);
    return article;
  }

  private createCardCompletionToggle(
    card: Card,
    options: { className: string; testId: string }
  ): HTMLButtonElement {
    const isCompleted = isCardCompleted(card);
    const label = this.runtime.i18n.t(
      isCompleted
        ? 'boards.cardBack.markIncomplete'
        : 'boards.cardBack.markComplete',
      { title: card.title }
    );
    const hint = this.runtime.i18n.t(
      isCompleted
        ? 'boards.cardBack.markIncompleteHint'
        : 'boards.cardBack.markCompleteHint'
    );
    const button = document.createElement('button');
    button.type = 'button';
    button.className = options.className;
    button.title = hint;
    button.dataset.testid = options.testId;
    button.dataset.boardDragIgnore = 'true';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', isCompleted ? 'true' : 'false');
    const mark = document.createElement('span');
    mark.className = 'majom-boards__completion-mark';
    mark.setAttribute('aria-hidden', 'true');
    button.append(mark);
    button.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleCardCompletion(card);
    });
    return button;
  }

  private toggleCardCompletion(card: Card): void {
    const patch: BoardCardPatch = {
      completedAt: isCardCompleted(card) ? null : new Date(),
    };
    this.handlers.onPatchCard(card.id, patch);
  }

  private renderCardFrontTags(card: Card): HTMLElement | null {
    if (!card.tags?.length) return null;
    const tags = document.createElement('div');
    tags.className = boardsViewClassNames.cardTags;
    tags.setAttribute('data-testid', 'board-card-tags');
    card.tags.forEach((tag) => {
      tags.append(this.createCardTagChip(tag, boardsViewClassNames.cardTag));
    });
    return tags;
  }

  private createCardTagChip(tag: Tag, className: string): HTMLElement {
    const chip = document.createElement('span');
    chip.className = className;
    chip.title = tag.title;
    chip.setAttribute('aria-label', tag.title);
    chip.setAttribute('role', 'img');
    chip.setAttribute('data-testid', 'compact-card-label');
    chip.style.backgroundColor = tag.color;
    return chip;
  }

  private renderCardFrontBadges(card: Card): HTMLElement | null {
    const badges = document.createElement('div');
    badges.className = boardsViewClassNames.cardBadges;

    if (card.description.trim()) {
      badges.append(
        this.createCardFrontBadge(
          'bars-3-bottom-left',
          this.runtime.i18n.t('boards.cardDescriptionLabel'),
          undefined,
          'plain'
        )
      );
    }

    const commentCount = getCardCommentCount(card);
    if (commentCount > 0) {
      badges.append(
        this.createCardFrontBadge(
          'chat-bubble-bottom-center-text',
          this.runtime.i18n.t('boards.cardBack.comments'),
          String(commentCount),
          'neutral'
        )
      );
    }

    const checklistSummary = getCardChecklistSummary(card);
    if (checklistSummary.total > 0) {
      badges.append(
        this.createCardFrontBadge(
          'check-box',
          this.runtime.i18n.t('boards.cardBack.checklist'),
          `${checklistSummary.completed}/${checklistSummary.total}`,
          'neutral'
        )
      );
    }

    const entityLinkCounts = countCardEntityLinksByType(card);
    const entityBadgeSpecs: Array<{
      type: CardEntityLinkType;
      tone: CardFrontBadgeTone;
      labelKey: string;
    }> = [
      {
        type: 'goal',
        tone: 'goal',
        labelKey: 'boards.cardLinks.goalBadge',
      },
      {
        type: 'story',
        tone: 'story',
        labelKey: 'boards.cardLinks.storyBadge',
      },
      {
        type: 'task',
        tone: 'task',
        labelKey: 'boards.cardLinks.taskBadge',
      },
    ];
    entityBadgeSpecs.forEach((spec) => {
      const count = entityLinkCounts[spec.type];
      if (count <= 0) return;
      badges.append(
        this.createCardFrontBadge(
          getCardEntityIcon(spec.type),
          this.runtime.i18n.t(spec.labelKey),
          String(count),
          spec.tone
        )
      );
    });

    return badges.childElementCount > 0 ? badges : null;
  }

  private renderCardMirrorSourceLabel(
    card: Card,
    className: string
  ): HTMLElement | null {
    if (!card.mirror_source) return null;
    const source = card.mirror_source;
    const sourceText = this.runtime.i18n.t('boards.cardMirror.sourceLocation', {
      board: source.board_title,
      list: source.column_title,
    });
    const label = document.createElement('span');
    label.className = className;
    label.setAttribute('data-testid', 'card-mirror-source-label');
    label.textContent = sourceText;
    label.title = this.runtime.i18n.t('boards.cardMirror.sourceLabel', {
      source: sourceText,
    });
    label.setAttribute('aria-label', label.title);
    return label;
  }

  private createCardFrontBadge(
    icon: IconName,
    label: string,
    text?: string,
    tone: CardFrontBadgeTone = 'neutral'
  ): HTMLElement {
    const badge = document.createElement('span');
    const badgeClassNames: Record<CardFrontBadgeTone, string> = {
      plain: boardsViewClassNames.cardBadgePlain,
      neutral: boardsViewClassNames.cardBadgeNeutral,
      task: boardsViewClassNames.cardBadgeTask,
      story: boardsViewClassNames.cardBadgeStory,
      goal: boardsViewClassNames.cardBadgeGoal,
    };
    badge.className = badgeClassNames[tone];
    badge.title = label;
    badge.setAttribute('aria-label', text ? `${label}: ${text}` : label);
    const badgeIcon = createIcon(icon, { size: 16, strokeWidth: 2 });
    badgeIcon.setAttribute('aria-hidden', 'true');
    badge.append(badgeIcon);
    if (text) {
      const count = document.createElement('span');
      count.textContent = text;
      badge.append(count);
    }
    return badge;
  }

  private renderCardComposer(
    column: BoardColumn,
    state: BoardsState
  ): HTMLElement {
    return renderInlineComposer({
      expanded: this.expandedCardComposerColumnId === column.id,
      collapsedLabel: this.runtime.i18n.t('boards.actions.createCard'),
      submitLabel: this.runtime.i18n.t('boards.actions.createCard'),
      cancelLabel: this.runtime.i18n.t('boards.actions.cancelNewCard'),
      placeholder: this.runtime.i18n.t('boards.cardComposerPlaceholder'),
      ariaLabel: this.runtime.i18n.t('boards.cardTitleLabel'),
      classNames: {
        root: boardsViewClassNames.cardComposer,
        collapsedButton: boardsViewClassNames.cardComposerCollapsed,
        expandedForm: boardsViewClassNames.cardComposerExpanded,
        textarea: boardsViewClassNames.cardComposerTextarea,
        actions: boardsViewClassNames.composerActions,
        submitButton: boardsViewClassNames.primaryButton,
        cancelButton: boardsViewClassNames.composerCancelButton,
      },
      disabled: state.status === 'saving',
      rows: 2,
      textareaTestId: 'list-card-composer-textarea',
      focusOnRender: true,
      dragIgnoreDatasetKey: 'boardDragIgnore',
      onExpand: () => this.expandCardComposer(column.id),
      onTextareaCreated: (title) => this.cardDrafts.set(column.id, { title }),
      onSubmit: () => this.submitCard(column.id),
      onCancel: () => this.collapseCardComposer(),
    }).element;
  }

  private renderColumnComposer(board: Board, state: BoardsState): HTMLElement {
    const panel = document.createElement('aside');
    panel.className = this.isColumnComposerExpanded
      ? boardsViewClassNames.columnComposerExpandedPanel
      : boardsViewClassNames.columnComposerCollapsedPanel;
    panel.dataset.boardColumnComposer = 'true';

    if (!this.isColumnComposerExpanded) {
      const addButton = createTextButton({
        text: this.runtime.i18n.t('boards.addColumnPanelTitle'),
        tone: 'text',
        size: 'md',
        fullWidth: true,
        className: boardsViewClassNames.columnComposerCollapsed,
        disabled: state.status === 'saving',
        onClick: () => this.expandColumnComposer(),
      });
      addButton.setAttribute('data-testid', 'list-composer-button');
      addButton.setAttribute('data-drag-scroll-disabled', 'true');
      prependButtonIcon(addButton, 'plus');
      panel.append(addButton);
      return panel;
    }

    const form = document.createElement('form');
    form.className = boardsViewClassNames.columnComposerExpanded;
    form.setAttribute('data-focus-lock-disabled', 'false');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submitColumnTitle(board.id);
    });

    this.columnTitleTextarea = document.createElement('textarea');
    this.columnTitleTextarea.className =
      boardsViewClassNames.listComposerTextarea;
    this.columnTitleTextarea.placeholder = this.runtime.i18n.t(
      'boards.columnTitlePlaceholder'
    );
    this.columnTitleTextarea.name = this.runtime.i18n.t(
      'boards.columnTitlePlaceholder'
    );
    this.columnTitleTextarea.dir = 'auto';
    this.columnTitleTextarea.rows = 1;
    this.columnTitleTextarea.maxLength = 512;
    this.columnTitleTextarea.spellcheck = false;
    this.columnTitleTextarea.setAttribute('data-testid', 'list-name-textarea');
    this.columnTitleTextarea.setAttribute('autocomplete', 'off');
    this.columnTitleTextarea.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.columnTitlePlaceholder')
    );
    this.columnTitleTextarea.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      this.submitColumnTitle(board.id);
    });

    const actions = document.createElement('div');
    actions.className = boardsViewClassNames.composerActions;
    actions.append(
      createTextButton({
        text: this.runtime.i18n.t('boards.actions.createColumn'),
        tone: 'primary',
        size: 'sm',
        type: 'submit',
        className: boardsViewClassNames.primaryButton,
        disabled: state.status === 'saving',
      }),
      createIconButton({
        icon: 'x-mark',
        tone: 'text',
        size: 'md',
        type: 'button',
        title: this.runtime.i18n.t('boards.actions.cancelNewColumn'),
        ariaLabel: this.runtime.i18n.t('boards.actions.cancelNewColumn'),
        className: boardsViewClassNames.composerCancelButton,
        onClick: () => this.collapseColumnComposer(),
      })
    );

    form.append(this.columnTitleTextarea, actions);
    panel.append(form);
    requestAnimationFrame(() => this.columnTitleTextarea?.focus());
    return panel;
  }

  private renderEmptyState(): HTMLElement {
    const empty = document.createElement('div');
    empty.className = boardsViewClassNames.empty;
    const content = document.createElement('div');
    content.className = boardsViewClassNames.emptyContent;
    const title = document.createElement('h2');
    title.className = boardsViewClassNames.emptyTitle;
    title.textContent = this.runtime.i18n.t('boards.emptyTitle');
    const copy = document.createElement('p');
    copy.className = boardsViewClassNames.emptyCopy;
    copy.textContent = this.runtime.i18n.t('boards.emptyBody');
    content.append(title, copy);
    empty.append(content);
    return empty;
  }

  private renderMessage(message: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = boardsViewClassNames.messageWrapper;
    const label = document.createElement('p');
    label.className = boardsViewClassNames.messageLabel;
    label.textContent = message;
    wrapper.append(label);
    return wrapper;
  }

  private openQuickCardEditor(
    placementId: CardPlacement['id'],
    anchorRect: DOMRect
  ): void {
    if (!this.state) return;
    const location = this.findCardLocation(placementId, this.state);
    if (!location) return;

    this.closeQuickCardEditor();
    const overlay = document.createElement('div');
    overlay.className = boardsModalClassNames.quickEditorOverlay;
    overlay.addEventListener('pointerdown', (event) => {
      if (event.target === overlay) this.closeQuickCardEditor();
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeQuickCardEditor();
      }
    });

    const editor = this.renderQuickCardEditor(location);
    this.positionQuickCardEditor(editor, anchorRect);
    overlay.append(editor);
    document.body.append(overlay);
    this.quickEditorOverlay = overlay;

    requestAnimationFrame(() => {
      editor
        .querySelector<HTMLTextAreaElement>(
          '[data-testid="quick-card-editor-card-title"]'
        )
        ?.focus();
    });
  }

  private renderQuickCardEditor(location: CardLocation): HTMLElement {
    const { card } = location;
    const editor = document.createElement('div');
    editor.className = boardsModalClassNames.quickEditor;
    editor.setAttribute('data-elevation', '1');
    editor.addEventListener('pointerdown', (event) => event.stopPropagation());

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.quickEditor.menuLabel')
    );
    dialog.setAttribute('data-testid', 'quick-card-editor-menu');

    const form = document.createElement('form');
    form.className = boardsModalClassNames.quickEditorForm;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveQuickCardEditor(card, title);
    });

    const cardFront = createSurface({
      elevated: true,
      className: isMirrorCard(card)
        ? `${boardsModalClassNames.quickEditorCard} ${boardsModalClassNames.quickEditorCardMirror}`
        : boardsModalClassNames.quickEditorCard,
    });
    cardFront.setAttribute('data-testid', 'quick-card-editor-card-front');
    const cardInner = document.createElement('div');
    cardInner.className = boardsModalClassNames.quickEditorCardInner;

    const title = document.createElement('textarea');
    title.className = boardsModalClassNames.quickEditorTitle;
    title.setAttribute('data-testid', 'quick-card-editor-card-title');
    title.dir = 'auto';
    title.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.quickEditor.editCardName')
    );
    title.value = card.title;
    title.rows = 2;
    title.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey) return;
      event.preventDefault();
      this.saveQuickCardEditor(card, title);
    });

    const badges = this.renderCardFrontBadges(card);
    const sourceLabel = this.renderCardMirrorSourceLabel(
      card,
      boardsViewClassNames.cardSourceLabel
    );
    if (sourceLabel) cardInner.append(sourceLabel);
    cardInner.append(title);
    if (badges) cardInner.append(badges);
    cardFront.append(cardInner);

    const save = createTextButton({
      text: this.runtime.i18n.t('common.save'),
      tone: 'primary',
      size: 'md',
      className: `${boardsViewClassNames.primaryButton} ${boardsModalClassNames.quickEditorSave}`,
      type: 'submit',
    });
    const validate = (): void => {
      save.disabled = title.value.trim().length === 0;
    };
    title.addEventListener('input', validate);
    validate();
    form.append(cardFront, save);

    dialog.append(form, this.renderQuickCardEditorActions(location));
    editor.append(dialog);
    return editor;
  }

  private renderQuickCardEditorActions(location: CardLocation): HTMLElement {
    const { board, column, card, placementId } = location;
    const menuWrap = document.createElement('div');
    menuWrap.className = boardsModalClassNames.quickEditorActions;
    const list = document.createElement('ul');
    list.className = boardsModalClassNames.quickEditorButtons;
    list.setAttribute('data-testid', 'quick-card-editor-buttons');

    const items: Array<{
      testId: string;
      labelKey: string;
      icon: IconName;
      onClick: (event: MouseEvent) => void;
      danger?: boolean;
    }> = [
      {
        testId: 'quick-card-editor-open-card',
        labelKey: 'boards.quickEditor.openCard',
        icon: 'rectangle-stack',
        onClick: () => {
          this.closeQuickCardEditor();
          this.openCardModal(placementId);
        },
      },
      {
        testId: 'quick-card-editor-edit-labels',
        labelKey: 'boards.quickEditor.editLabels',
        icon: 'tag',
        onClick: () => {
          this.closeQuickCardEditor();
          this.openCardModal(placementId);
        },
      },
      {
        testId: 'quick-card-editor-move',
        labelKey: 'boards.quickEditor.move',
        icon: 'arrow-right',
        onClick: (event) => {
          this.openMoveCardPopover(
            event.currentTarget as HTMLButtonElement,
            board,
            column,
            card,
            'move'
          );
        },
      },
      {
        testId: 'mirror-new-button',
        labelKey: 'boards.quickEditor.mirror',
        icon: 'rectangle-stack',
        onClick: (event) => {
          this.openMoveCardPopover(
            event.currentTarget as HTMLButtonElement,
            board,
            column,
            card,
            'mirror'
          );
        },
      },
      {
        testId: 'quick-card-editor-archive',
        labelKey: isMirrorCard(card)
          ? 'boards.quickEditor.removeFromBoard'
          : 'boards.quickEditor.archive',
        icon: 'archive-box',
        onClick: () => {
          this.closeQuickCardEditor();
          this.archiveOrRemoveCard(card, placementId);
        },
      },
      {
        testId: 'quick-card-editor-delete-card',
        labelKey: 'boards.actions.deleteCard',
        icon: 'trash',
        danger: true,
        onClick: () => void this.deleteSharedCardFromQuickEditor(card),
      },
    ];

    items.forEach((item) => {
      const li = document.createElement('li');
      if (item.danger) {
        li.className = boardsModalClassNames.quickEditorDangerItem;
      }
      const button = createTextButton({
        text: this.runtime.i18n.t(item.labelKey),
        tone: item.danger ? 'danger' : 'text',
        size: 'md',
        className: item.danger
          ? `${boardsModalClassNames.quickEditorButton} ${boardsModalClassNames.quickEditorDangerButton}`
          : boardsModalClassNames.quickEditorButton,
        onClick: item.onClick,
      });
      button.setAttribute('data-testid', item.testId);
      prependButtonIcon(button, item.icon);
      li.append(button);
      list.append(li);
    });

    menuWrap.append(list);
    return menuWrap;
  }

  private positionQuickCardEditor(
    editor: HTMLElement,
    anchorRect: DOMRect
  ): void {
    const {
      formWidth,
      actionsWidth,
      actionsGap,
      viewportMargin,
      minVisibleHeight,
    } = QUICK_CARD_EDITOR_GEOMETRY;
    const left = Math.min(
      Math.max(anchorRect.left, viewportMargin),
      Math.max(
        viewportMargin,
        window.innerWidth -
          formWidth -
          actionsWidth -
          actionsGap -
          viewportMargin
      )
    );
    const top = Math.min(
      Math.max(anchorRect.top, viewportMargin),
      Math.max(
        viewportMargin,
        window.innerHeight - minVisibleHeight - viewportMargin
      )
    );
    editor.style.left = `${left}px`;
    editor.style.top = `${top}px`;
  }

  private saveQuickCardEditor(
    card: Card,
    titleInput: HTMLTextAreaElement
  ): void {
    const nextTitle = titleInput.value.trim();
    if (!nextTitle) return;
    this.closeQuickCardEditor();
    if (nextTitle !== card.title) {
      this.handlers.onPatchCard(card.id, { title: nextTitle });
    }
  }

  private openCardModal(placementId: CardPlacement['id']): void {
    if (!this.state) return;
    const location = this.findCardLocation(placementId, this.state);
    if (!location) return;
    const shouldLoadBackendDetails = !this.isPendingCardLocation(location);
    this.activeCardPlacementId = placementId;
    this.cardDetailsSession.open(location.card, placementId, {
      isResolved: shouldLoadBackendDetails,
    });
    this.hiddenCheckedChecklistIds.clear();
    this.expandedCheckItemComposerIds.clear();
    this.cardChecklistPanelState = {
      cardId: location.card.id,
      status: 'idle',
      checklists: [],
      error: null,
    };
    this.renderCardModal(location);
    if (shouldLoadBackendDetails) {
      void this.loadCardModalChecklists(location.card.id);
    }
  }

  private isPendingCardLocation(location: CardLocation): boolean {
    return this.isPendingCard(location.card, location.placementId);
  }

  private isPendingCard(
    card: Card,
    placementId: CardPlacement['id'] = getCardPlacementId(card)
  ): boolean {
    if (!this.state) return false;
    return (
      this.state.optimistic.cards[card.id] === 'creating' ||
      this.state.optimistic.placements[placementId] === 'creating'
    );
  }

  private syncCardModal(state: BoardsState): void {
    if (this.activeCardPlacementId === null) return;
    const previousChecklistCardId =
      this.cardChecklistPanelState?.cardId ?? null;
    const location = this.resolveActiveCardModalLocation(state);
    if (!location) {
      this.closeCardModal();
      return;
    }
    this.cardDetailsSession.reconcile(location.card, location.placementId, {
      isResolved: !this.isPendingCardLocation(location),
    });
    if (previousChecklistCardId !== location.card.id) {
      this.cardChecklistPanelState = {
        cardId: location.card.id,
        status: 'idle',
        checklists: [],
        error: null,
      };
    }
    this.renderCardModal(location);
    if (
      previousChecklistCardId !== location.card.id &&
      !this.isPendingCardLocation(location)
    ) {
      void this.loadCardModalChecklists(location.card.id);
    }
    this.flushQueuedCardDetailsSubmit();
  }

  private resolveActiveCardModalLocation(
    state: BoardsState
  ): CardLocation | null {
    if (this.activeCardPlacementId === null) return null;
    const directLocation = this.findCardLocation(
      this.activeCardPlacementId,
      state
    );
    if (directLocation) return directLocation;

    const resolvedPlacementId =
      state.optimistic.resolved.placements[this.activeCardPlacementId];
    if (!resolvedPlacementId) return null;

    const resolvedLocation = this.findCardLocation(resolvedPlacementId, state);
    if (!resolvedLocation) return null;
    this.activeCardPlacementId = resolvedPlacementId;
    return resolvedLocation;
  }

  private flushQueuedCardDetailsSubmit(): void {
    const session = this.cardDetailsSession.snapshot;
    if (!session?.pendingSubmit || !session.identity.isResolved) return;
    const patch = createCardDetailsPatch(session);
    if (hasCardDetailsPatch(patch)) {
      this.handlers.onPatchCard(session.identity.cardId, patch);
      this.cardDetailsSession.markSubmitted();
    }
    if (session.closeAfterSubmit) {
      this.closeCardModal();
    }
  }

  private renderCardModal(location: CardLocation): void {
    this.closeCardLabelsPopover();
    this.closeCardChecklistPopover();
    this.closeCardCheckItemMenuPopover();
    this.closeCardEntityLinkMenuPopover();
    this.closeMoveCardPopover();
    this.cardModalOverlay?.remove();
    this.cardModalOverlay = null;
    this.cardModalLabelsHost = null;
    this.cardModalQuickActionList = null;
    this.cardModalChecklistHost = null;

    const { board, column, card } = location;
    if (!this.cardDetailsSession.snapshot) {
      this.cardDetailsSession.open(card, location.placementId, {
        isResolved: !this.isPendingCardLocation(location),
      });
    }
    const session = this.cardDetailsSession.snapshot;
    const draft = session?.draft ?? {
      title: card.title,
      description: card.description ?? '',
      tagIds: getBoardCardTagIds(card),
    };
    const { overlay, container, header, divider, body } = createPaneModalShell(
      draft.title,
      {
        onClose: () => this.closeCardModal(),
        hideCloseButton: true,
        intent: 'form',
        presentation: 'dialog',
        zIndex: 270,
      }
    );

    header.classList.add(boardsModalClassNames.hiddenShellPart);
    divider.classList.add(boardsModalClassNames.hiddenShellPart);

    container.classList.add(boardsModalClassNames.container);
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
    });
    body.className = boardsModalClassNames.body;

    const titleInput = document.createElement('textarea');
    titleInput.className = boardsModalClassNames.titleEditor;
    titleInput.dataset.boardCardModalTitle = 'true';
    titleInput.dir = 'auto';
    titleInput.rows = CARD_BACK_TITLE_EDITOR_ROWS;
    titleInput.maxLength = CARD_BACK_TITLE_MAX_LENGTH;
    titleInput.value = draft.title;
    titleInput.setAttribute('aria-label', draft.title);
    titleInput.addEventListener('input', () => {
      this.cardDetailsSession.updateDraft({ title: titleInput.value });
    });

    const description = document.createElement('textarea');
    description.className = boardsModalClassNames.descriptionEditor;
    description.dataset.boardCardModalDescription = 'true';
    description.value = draft.description;
    description.placeholder = this.runtime.i18n.t(
      'boards.cardDescriptionPlaceholder'
    );
    description.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardDescriptionLabel')
    );

    const cardBack = document.createElement('div');
    cardBack.className = boardsModalClassNames.cardBack;
    description.addEventListener('input', () => {
      this.cardDetailsSession.updateDraft({
        description: description.value,
      });
    });
    cardBack.append(
      this.renderCardBackTopbar(board, column, card),
      this.renderCardBackLayout(board, column, card, titleInput, description)
    );
    body.append(cardBack);
    container.setAttribute('aria-labelledby', 'card-back-name');
    container.setAttribute('data-focus-lock', 'cardback');

    this.cardModalOverlay = overlay;
  }

  private renderCardBackTopbar(
    board: Board,
    column: BoardColumn,
    card: Card
  ): HTMLElement {
    const topbar = document.createElement('header');
    topbar.className = boardsModalClassNames.topbar;

    const start = document.createElement('div');
    start.className = boardsModalClassNames.topbarStart;
    const listBadge = document.createElement('button');
    listBadge.type = 'button';
    listBadge.className = boardsModalClassNames.listBadge;
    listBadge.setAttribute('data-testid', 'card-back-list-button');
    listBadge.title = column.title;
    listBadge.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.changeList', {
        column: column.title,
      })
    );
    listBadge.setAttribute('aria-haspopup', 'dialog');
    listBadge.setAttribute('aria-expanded', 'false');
    listBadge.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.moveCardPopover?.trigger === listBadge) {
        this.closeMoveCardPopover();
        return;
      }
      this.openMoveCardPopover(listBadge, board, column, card);
    });
    const listLabel = document.createElement('span');
    listLabel.textContent = column.title;
    const chevron = createIcon('chevron-down', { size: 14, strokeWidth: 2 });
    chevron.setAttribute('aria-hidden', 'true');
    listBadge.append(listLabel, chevron);
    start.append(listBadge);
    const sourceLabel = this.renderCardMirrorSourceLabel(
      card,
      boardsModalClassNames.sourceLabel
    );
    if (sourceLabel) start.append(sourceLabel);

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.topbarActions;
    const actionsButton = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.iconButton,
      ariaLabel: this.runtime.i18n.t('boards.cardBack.actions'),
      title: this.runtime.i18n.t('boards.cardBack.actions'),
    });
    actionsButton.setAttribute('aria-haspopup', 'dialog');
    actionsButton.setAttribute('aria-expanded', 'false');
    actionsButton.setAttribute('data-testid', 'card-back-actions-button');
    actionsButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.cardActionsPopover?.trigger === actionsButton) {
        this.closeCardActionsPopover();
        return;
      }
      this.openCardActionsPopover(actionsButton, board, column, card);
    });

    actions.append(
      actionsButton,
      createIconButton({
        icon: 'x-mark',
        tone: 'text',
        size: 'md',
        className: boardsModalClassNames.iconButton,
        ariaLabel: this.runtime.i18n.t('common.close'),
        title: this.runtime.i18n.t('common.close'),
        onClick: () => this.closeCardModal(),
      })
    );

    topbar.append(start, actions);
    return topbar;
  }

  private openCardActionsPopover(
    trigger: HTMLButtonElement,
    board: Board,
    column: BoardColumn,
    card: Card
  ): void {
    this.closeCardActionsPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.cardActionsPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.actions')
    );
    panel.setAttribute('data-testid', 'card-back-actions-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const body = document.createElement('div');
    body.className = boardsModalClassNames.cardActionsBody;
    const list = document.createElement('ul');
    list.className = boardsModalClassNames.cardActionsList;
    list.append(
      this.renderCardActionItem({
        testId: 'card-back-move-card-button',
        labelKey: 'boards.quickEditor.move',
        icon: 'arrow-right',
        disabled: true,
      }),
      this.renderCardActionItem({
        testId: 'card-back-copy-card-button',
        labelKey: 'boards.quickEditor.copyCard',
        icon: 'square-2-stack',
        disabled: true,
      }),
      this.renderCardActionItem({
        testId: 'card-back-mirror-card-button',
        labelKey: 'boards.quickEditor.mirror',
        icon: 'rectangle-stack',
        onClick: () => {
          this.closeCardActionsPopover();
          this.openMoveCardPopover(trigger, board, column, card, 'mirror');
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-link-entity-button',
        labelKey: 'boards.cardLinks.link',
        icon: 'link',
        onClick: () => {
          this.closeCardActionsPopover();
          this.openCardEntityLinkModal(card);
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-import-card-button',
        labelKey: 'boards.import.actions.importCard',
        icon: 'arrow-down',
        onClick: () => {
          this.closeCardActionsPopover();
          this.openImportPreviewModal({
            scope: 'card',
            titleKey: 'boards.import.title.card',
            target: { cardId: card.id, columnId: column.id, boardId: board.id },
          });
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-export-card-markdown-button',
        labelKey: 'boards.export.actions.cardMarkdown',
        icon: 'document',
        onClick: () => {
          this.closeCardActionsPopover();
          void this.openExportOutputModal({
            titleKey: 'boards.export.title.card',
            request: {
              scope: 'card',
              format: 'markdown',
              cardId: card.id,
            },
          });
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-export-card-json-button',
        labelKey: 'boards.export.actions.cardJson',
        icon: 'document',
        onClick: () => {
          this.closeCardActionsPopover();
          void this.openExportOutputModal({
            titleKey: 'boards.export.title.card',
            request: { scope: 'card', format: 'json', cardId: card.id },
          });
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-create-task-button',
        labelKey: 'boards.cardLinks.createTask',
        icon: 'check-box',
        onClick: () => void this.createEntityFromCard(card, 'task'),
      }),
      this.renderCardActionItem({
        testId: 'card-back-create-story-button',
        labelKey: 'boards.cardLinks.createStory',
        icon: 'document',
        onClick: () => void this.createEntityFromCard(card, 'story'),
      }),
      this.renderCardActionItem({
        testId: 'card-back-create-goal-button',
        labelKey: 'boards.cardLinks.createGoal',
        icon: 'goal-circle',
        onClick: () => void this.createEntityFromCard(card, 'goal'),
      }),
      this.renderCardActionsDivider(),
      this.renderCardActionItem({
        testId: 'card-back-archive-button',
        labelKey: isMirrorCard(card)
          ? 'boards.quickEditor.removeFromBoard'
          : 'boards.quickEditor.archive',
        icon: 'archive-box',
        onClick: () => {
          this.closeCardActionsPopover();
          this.closeCardModal();
          this.archiveOrRemoveCard(card, getCardPlacementId(card));
        },
      }),
      this.renderCardActionItem({
        testId: 'card-back-delete-card-button',
        labelKey: 'boards.actions.deleteCard',
        icon: 'trash',
        onClick: () => void this.deleteSharedCardFromDetails(card),
      })
    );
    body.append(list);
    panel.append(body);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 300,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.cardActionsPopover?.menu === menu) {
          this.closeCardActionsPopover();
        }
      },
    });
    menu.mount();
    this.cardActionsPopover = { menu, panel, trigger };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderCardActionItem(options: {
    testId: string;
    labelKey: string;
    icon: IconName;
    disabled?: boolean;
    onClick?: () => void;
  }): HTMLLIElement {
    const item = document.createElement('li');
    item.className = boardsModalClassNames.cardActionsItem;
    const button = createTextButton({
      text: this.runtime.i18n.t(options.labelKey),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.cardActionsButton,
      disabled: options.disabled,
      onClick: options.onClick,
    });
    button.setAttribute('data-testid', options.testId);
    prependButtonIcon(button, options.icon);
    item.append(button);
    return item;
  }

  private renderCardActionsDivider(): HTMLLIElement {
    const item = document.createElement('li');
    item.className = boardsModalClassNames.cardActionsDivider;
    item.setAttribute('role', 'separator');
    return item;
  }

  private openImportPreviewModal(config: ImportPreviewModalScope): void {
    this.closeImportPreviewModal();
    this.closeTransientBoardOverlays();

    let format: BoardsExchangeFormat = 'markdown';
    const policies: BoardsImportPolicies = {
      ...createDefaultBoardsImportPolicies(),
      mode: 'create',
    };
    let lastPreviewRequest: BoardsImportRequest | null = null;
    let lastPreviewPlan: BoardsImportPlan | null = null;
    let hasCompletedPreview = false;
    let importModalMode: 'edit' | 'review' = 'edit';
    let importOperation: 'idle' | 'previewing' | 'applying' = 'idle';
    let importStatusOverride: {
      messageKey: string;
      tone: 'error' | 'info' | 'success' | 'warning';
    } | null = null;

    const { overlay, container, body, footer } = createModalShell(
      this.runtime.i18n.t(config.titleKey),
      {
        intent: 'info',
        zIndex: 370,
        onClose: () => this.closeImportPreviewModal(),
      }
    );
    container.classList.add(boardsModalClassNames.importModal);
    overlay.setAttribute('data-testid', 'boards-import-preview-modal');

    const editContent = document.createElement('div');
    editContent.className = boardsModalClassNames.importLayout;
    editContent.setAttribute('data-testid', 'boards-import-edit-mode');
    const reviewContent = document.createElement('section');
    reviewContent.className = boardsModalClassNames.importReview;
    reviewContent.setAttribute('data-testid', 'boards-import-review-mode');

    const sourcePanel = document.createElement('section');
    sourcePanel.className = boardsModalClassNames.importPanel;

    let guide: ImportFormatGuideHandle | null = null;
    const formatControl = new HudSegmentedControl<BoardsExchangeFormat>({
      value: format,
      size: 'sm',
      fullWidth: true,
      ariaLabel: this.runtime.i18n.t('boards.import.format'),
      options: [
        {
          id: 'markdown',
          value: 'markdown',
          label: this.runtime.i18n.t('boards.import.formatMarkdown'),
        },
        {
          id: 'json',
          value: 'json',
          label: this.runtime.i18n.t('boards.import.formatJson'),
        },
      ],
      onChange: (value) => {
        format = value;
        invalidatePreview();
        guide?.refresh();
        syncImportControls();
      },
    });

    const sourceField = document.createElement('section');
    sourceField.className = boardsModalClassNames.importField;
    const sourceHeader = document.createElement('div');
    sourceHeader.className = boardsModalClassNames.importSourceHeader;
    const sourceLabel = document.createElement('label');
    sourceLabel.className = boardsModalClassNames.importLabel;
    sourceLabel.htmlFor = 'boards-import-source';
    sourceLabel.textContent = this.runtime.i18n.t('boards.import.source');
    const sourceInput = new Textarea({
      id: 'boards-import-source',
      rows: 14,
      placeholder: this.runtime.i18n.t('boards.import.sourcePlaceholder'),
      className: boardsModalClassNames.importSource,
      onInput: () => {
        invalidatePreview();
        syncImportControls();
      },
    }).createElement();
    sourceInput.spellcheck = false;
    sourceInput.autocomplete = 'off';
    sourceInput.wrap = 'off';

    const configPanel = document.createElement('section');
    configPanel.className = boardsModalClassNames.importPanel;
    configPanel.append(
      this.createImportSelect<BoardsImportMode>({
        id: 'boards-import-mode',
        labelKey: 'boards.import.mode',
        value: policies.mode,
        options: [
          ['merge', 'boards.import.mode.merge'],
          ['create', 'boards.import.mode.create'],
          ['replace', 'boards.import.mode.replace'],
        ],
        onChange: (value) => {
          policies.mode = value;
          invalidatePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportMatchStrategy>({
        id: 'boards-import-match',
        labelKey: 'boards.import.match',
        value: policies.matchStrategy,
        options: [
          ['title', 'boards.import.match.title'],
          ['id', 'boards.import.match.id'],
          ['external_ref', 'boards.import.match.externalRef'],
        ],
        onChange: (value) => {
          policies.matchStrategy = value;
          invalidatePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportPolicies['missingFieldPolicy']>({
        id: 'boards-import-missing',
        labelKey: 'boards.import.missingFields',
        value: policies.missingFieldPolicy,
        options: [
          ['keep_existing', 'boards.import.missing.keepExisting'],
          ['use_defaults', 'boards.import.missing.useDefaults'],
          ['clear_on_replace', 'boards.import.missing.clearOnReplace'],
        ],
        onChange: (value) => {
          policies.missingFieldPolicy = value;
          invalidatePreview();
          syncImportControls();
        },
      }),
      this.createImportSelect<BoardsImportUnknownFieldPolicy>({
        id: 'boards-import-unknown',
        labelKey: 'boards.import.unknownFields',
        value: policies.unknownFieldPolicy,
        options: [
          ['warn_and_ignore', 'boards.import.unknown.warn'],
          ['strict_error', 'boards.import.unknown.strict'],
        ],
        onChange: (value) => {
          policies.unknownFieldPolicy = value;
          invalidatePreview();
          syncImportControls();
        },
      })
    );

    const previewPanel = document.createElement('section');
    previewPanel.className = boardsModalClassNames.importPreviewPanel;
    previewPanel.setAttribute('data-testid', 'boards-import-preview-panel');
    this.renderImportPreviewPlan(previewPanel, null);
    reviewContent.append(previewPanel);

    const message = createFormMessage({
      className: boardsModalClassNames.importMessage,
      ariaLive: 'polite',
    });
    guide = this.createImportFormatGuide({
      scope: config.scope,
      getFormat: () => format,
      onInsertTemplate: () => {
        sourceInput.value = this.getImportTemplate(config.scope, format);
        invalidatePreview();
        syncImportControls();
        sourceInput.focus();
      },
      onCopyAiPrompt: () => {
        void this.copyImportAiPrompt(config.scope, format);
      },
      onClear: () => {
        sourceInput.value = '';
        invalidatePreview();
        syncImportControls();
        sourceInput.focus();
      },
    });
    sourceHeader.append(sourceLabel, guide.element);
    sourceField.append(sourceHeader, sourceInput);
    sourcePanel.replaceChildren(formatControl.element, sourceField);
    const sidePanel = document.createElement('aside');
    sidePanel.className = boardsModalClassNames.importSidePanel;
    sidePanel.append(configPanel);
    editContent.append(sourcePanel, sidePanel);

    const row = document.createElement('div');
    row.className = boardsModalClassNames.importActions;
    row.setAttribute('data-testid', 'boards-import-action-row');
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = boardsModalClassNames.importActionButtonSecondary;
    previewButton.textContent = this.runtime.i18n.t('boards.import.preview');
    previewButton.setAttribute('data-testid', 'boards-import-preview-button');

    const applyButton = document.createElement('button');
    applyButton.type = 'button';
    applyButton.className = boardsModalClassNames.importActionButtonPrimary;
    applyButton.textContent = this.runtime.i18n.t('boards.import.apply');
    applyButton.disabled = true;
    applyButton.setAttribute('data-testid', 'boards-import-apply-button');

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = boardsModalClassNames.importActionButtonSecondary;
    backButton.textContent = this.runtime.i18n.t('boards.import.backToEdit');
    backButton.setAttribute('data-testid', 'boards-import-back-button');
    backButton.addEventListener('click', () => {
      importModalMode = 'edit';
      renderImportMode();
      syncImportControls();
      requestAnimationFrame(() => sourceInput.focus());
    });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = boardsModalClassNames.importActionButtonSecondary;
    closeButton.textContent = this.runtime.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.closeImportPreviewModal());

    const runPreview = async (): Promise<void> => {
      const raw = sourceInput.value.trim();
      if (!raw) return;
      const request: BoardsImportRequest = {
        raw,
        format,
        scope: config.scope,
        target: config.target,
        policies: { ...policies },
      };
      importOperation = 'previewing';
      syncImportControls();
      try {
        const plan = await this.handlers.onPreviewImport(request);
        lastPreviewRequest = request;
        lastPreviewPlan = plan;
        hasCompletedPreview = true;
        importStatusOverride = null;
        this.renderImportPreviewPlan(
          previewPanel,
          plan,
          request.policies.mode === 'create'
        );
        importModalMode = 'review';
        renderImportMode();
      } catch {
        lastPreviewRequest = null;
        lastPreviewPlan = null;
        importStatusOverride = {
          messageKey: 'boards.import.previewFailed',
          tone: 'error',
        };
        this.renderImportPreviewPlan(previewPanel, null);
      } finally {
        importOperation = 'idle';
        syncImportControls();
      }
    };

    const applyImport = async (): Promise<void> => {
      if (!lastPreviewRequest || !lastPreviewPlan?.canApply) return;
      if (lastPreviewRequest.policies.mode !== 'create') return;
      importOperation = 'applying';
      syncImportControls();
      try {
        const result = await this.handlers.onApplyImport(lastPreviewRequest);
        if (!result) {
          importStatusOverride = {
            messageKey: 'boards.import.applyFailed',
            tone: 'error',
          };
          return;
        }
        this.closeImportPreviewModal();
        notify(this.runtime.i18n.t('boards.import.applied'), 'success');
      } catch {
        importStatusOverride = {
          messageKey: 'boards.import.applyFailed',
          tone: 'error',
        };
      } finally {
        importOperation = 'idle';
        syncImportControls();
      }
    };

    const renderImportStalePreview = (): void => {
      this.renderImportPreviewPlan(previewPanel, null);
    };

    function invalidatePreview(): void {
      lastPreviewRequest = null;
      lastPreviewPlan = null;
      importStatusOverride = null;
      renderImportStalePreview();
    }

    const renderImportMode = (): void => {
      body.replaceChildren(
        importModalMode === 'review' ? reviewContent : editContent
      );
    };

    const syncImportControls = (): void => {
      const hasSource = sourceInput.value.trim().length > 0;
      const busy = importOperation !== 'idle';
      const hasFreshPreview = lastPreviewRequest !== null;
      const previewCanApply = lastPreviewPlan?.canApply === true;
      const canApplyMode = lastPreviewRequest?.policies.mode === 'create';
      const reviewMode = importModalMode === 'review';

      previewButton.disabled = busy || !hasSource;
      applyButton.disabled =
        busy ||
        !reviewMode ||
        !hasFreshPreview ||
        !previewCanApply ||
        !canApplyMode;
      previewButton.hidden = reviewMode;
      backButton.hidden = !reviewMode;
      applyButton.hidden = !reviewMode;
      previewButton.className = boardsModalClassNames.importActionButtonPrimary;
      applyButton.className = applyButton.disabled
        ? boardsModalClassNames.importActionButtonSecondary
        : boardsModalClassNames.importActionButtonPrimary;
      previewButton.textContent = this.runtime.i18n.t(
        hasCompletedPreview
          ? 'boards.import.previewUpdate'
          : 'boards.import.preview'
      );

      if (importOperation === 'previewing') {
        message.show(this.runtime.i18n.t('boards.import.previewing'), 'info');
      } else if (importOperation === 'applying') {
        message.show(this.runtime.i18n.t('boards.import.applying'), 'info');
      } else if (importStatusOverride) {
        message.show(
          this.runtime.i18n.t(importStatusOverride.messageKey),
          importStatusOverride.tone
        );
      } else if (!hasSource) {
        message.show(this.runtime.i18n.t('boards.import.needSource'), 'info');
      } else if (!reviewMode) {
        if (hasFreshPreview) {
          message.clear();
        } else {
          message.show(
            this.runtime.i18n.t('boards.import.previewRequired'),
            'info'
          );
        }
      } else if (!hasFreshPreview) {
        message.show(
          this.runtime.i18n.t('boards.import.previewRequired'),
          'info'
        );
      } else if (!previewCanApply) {
        message.show(
          this.runtime.i18n.t('boards.import.blockedByPlan'),
          'error'
        );
      } else if (!canApplyMode) {
        message.show(
          this.runtime.i18n.t('boards.import.unsupportedMode'),
          'warning'
        );
      } else {
        message.clear();
      }

      const applyReason = applyButton.disabled
        ? message.element.textContent?.trim()
        : '';
      if (applyReason) {
        applyButton.title = applyReason;
      } else {
        applyButton.removeAttribute('title');
      }
    };

    previewButton.addEventListener('click', () => void runPreview());
    applyButton.addEventListener('click', () => void applyImport());
    row.append(closeButton, backButton, previewButton, applyButton);
    footer.replaceChildren(message.element, row);
    renderImportMode();
    syncImportControls();

    this.importPreviewOverlay = overlay;
    requestAnimationFrame(() => sourceInput.focus());
  }

  private createImportField(labelKey: string, id: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.className = boardsModalClassNames.importField;
    label.htmlFor = id;
    const text = document.createElement('span');
    text.className = boardsModalClassNames.importLabel;
    text.textContent = this.runtime.i18n.t(labelKey);
    label.append(text);
    return label;
  }

  private createImportSelect<TValue extends string>(options: {
    id: string;
    labelKey: string;
    value: TValue;
    options: Array<[TValue, string]>;
    onChange: (value: TValue) => void;
  }): HTMLElement {
    const field = this.createImportField(options.labelKey, options.id);
    const select = document.createElement('select');
    select.id = options.id;
    select.className = boardsModalClassNames.importSelect;
    for (const [value, labelKey] of options.options) {
      select.append(
        this.createSelectOption(value, this.runtime.i18n.t(labelKey))
      );
    }
    select.value = options.value;
    select.addEventListener('change', () => {
      options.onChange(select.value as TValue);
    });
    field.append(select);
    return field;
  }

  private createImportFormatGuide(options: {
    scope: BoardsExchangeScope;
    getFormat: () => BoardsExchangeFormat;
    onInsertTemplate: () => void;
    onCopyAiPrompt: () => void;
    onClear: () => void;
  }): ImportFormatGuideHandle {
    const section = document.createElement('section');
    section.className = boardsModalClassNames.importGuide;
    section.setAttribute('data-testid', 'boards-import-format-guide');

    const helpButton = createIconButton({
      icon: 'light-bulb',
      size: 'sm',
      tone: 'text',
      className: boardsModalClassNames.importGuideHelp,
      ariaLabel: this.runtime.i18n.t('boards.import.guide.title'),
      title: this.runtime.i18n.t('boards.import.guide.title'),
    });
    helpButton.setAttribute('data-testid', 'boards-import-format-help');

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.importGuideActions;
    actions.append(
      helpButton,
      this.createImportGuideButton(
        'boards.import.guide.insertTemplate',
        'boards-import-insert-template-button',
        options.onInsertTemplate
      ),
      this.createImportGuideButton(
        'boards.import.guide.copyAiPrompt',
        'boards-import-copy-ai-prompt-button',
        options.onCopyAiPrompt
      ),
      this.createImportGuideButton(
        'boards.import.guide.clear',
        'boards-import-clear-source-button',
        options.onClear
      )
    );

    const refresh = (): void => {
      const format = options.getFormat();
      helpButton.title = this.getImportGuideTooltip(format);
      helpButton.setAttribute(
        'aria-label',
        this.runtime.i18n.t('boards.import.guide.title')
      );
    };

    section.append(actions);
    refresh();
    return { element: section, refresh };
  }

  private getImportGuideTooltip(format: BoardsExchangeFormat): string {
    return [
      this.runtime.i18n.t('boards.import.guide.title'),
      this.runtime.i18n.t(
        format === 'markdown'
          ? 'boards.import.guide.markdownSummary'
          : 'boards.import.guide.jsonSummary'
      ),
      this.runtime.i18n.t(
        format === 'markdown'
          ? 'boards.import.guide.markdownRequired'
          : 'boards.import.guide.jsonRequired'
      ),
      this.runtime.i18n.t('boards.import.guide.optional'),
      this.runtime.i18n.t('boards.import.guide.partial'),
      this.runtime.i18n.t('boards.import.guide.createOnly'),
    ].join('\n');
  }

  private createImportGuideButton(
    labelKey: string,
    testId: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsModalClassNames.importGuideButton;
    button.textContent = this.runtime.i18n.t(labelKey);
    button.setAttribute('data-testid', testId);
    button.addEventListener('click', onClick);
    return button;
  }

  private getImportTemplate(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): string {
    if (format === 'json') {
      return JSON.stringify(
        {
          schema: BOARDS_EXCHANGE_SCHEMA,
          version: BOARDS_EXCHANGE_VERSION,
          scope,
          payload: this.getJsonImportTemplatePayload(scope),
        },
        null,
        2
      );
    }

    if (scope === 'column') {
      return [
        '## Column: Backlog',
        '',
        '### Card: First task',
        'Description:',
        'Optional description.',
        '',
        '### Card: Second task',
      ].join('\n');
    }

    if (scope === 'card') {
      return [
        '### Card: First task',
        'Description:',
        'Optional description.',
        '',
        'Checklist: Steps',
        '- [ ] First step',
        '- [ ] Second step',
      ].join('\n');
    }

    return [
      '---',
      'title: "Project board"',
      '---',
      '',
      '## Column: Backlog',
      '',
      '### Card: First task',
      'Description:',
      'Short task description.',
      '',
      'Checklist: Setup',
      '- [ ] Prepare data',
      '- [x] Confirm format',
    ].join('\n');
  }

  private getJsonImportTemplatePayload(
    scope: BoardsExchangeScope
  ): Record<string, unknown> {
    const card = {
      title: 'First task',
      description: 'Optional description.',
      checklists: [
        {
          title: 'Steps',
          items: [
            { title: 'First step', state: 'incomplete' },
            { title: 'Second step', state: 'complete' },
          ],
        },
      ],
    };

    if (scope === 'card') return card;
    const column = { title: 'Backlog', cards: [card] };
    if (scope === 'column') return column;
    return { title: 'Project board', columns: [column] };
  }

  private getImportAiPrompt(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): string {
    const scopeLabel =
      scope === 'board' ? 'board' : scope === 'column' ? 'list' : 'card';
    if (format === 'json') {
      return [
        `Generate a Majom Boards JSON import for one ${scopeLabel}.`,
        `Use schema "${BOARDS_EXCHANGE_SCHEMA}" and version "${BOARDS_EXCHANGE_VERSION}".`,
        'Use this shape:',
        this.getImportTemplate(scope, 'json'),
        'Return only valid JSON.',
      ].join('\n\n');
    }

    return [
      `Generate a Majom Boards Markdown import for one ${scopeLabel}.`,
      'Use this format:',
      '- YAML front matter with title for board imports',
      '- ## Column: column name',
      '- ### Card: card title',
      '- Description: optional multiline description',
      '- Checklist: optional checklist title',
      '- - [ ] unchecked item',
      '- - [x] completed item',
      'Missing optional fields are allowed.',
      'Return only Markdown.',
      '',
      this.getImportTemplate(scope, 'markdown'),
    ].join('\n');
  }

  private async copyImportAiPrompt(
    scope: BoardsExchangeScope,
    format: BoardsExchangeFormat
  ): Promise<void> {
    const prompt = this.getImportAiPrompt(scope, format);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = prompt;
        fallback.style.position = 'fixed';
        fallback.style.left = '-9999px';
        document.body.append(fallback);
        fallback.select();
        document.execCommand('copy');
        fallback.remove();
      }
      notify(this.runtime.i18n.t('boards.import.aiPromptCopied'), 'success');
    } catch {
      notify(
        this.runtime.i18n.t('boards.import.aiPromptCopyFailed'),
        'warning'
      );
    }
  }

  private renderImportPreviewPlan(
    host: HTMLElement,
    plan: BoardsImportPlan | null,
    applyModeSupported = true
  ): void {
    host.replaceChildren();

    if (!plan) {
      const title = document.createElement('h3');
      title.className = boardsModalClassNames.importPreviewTitle;
      title.textContent = this.runtime.i18n.t('boards.import.previewTitle');
      const empty = document.createElement('p');
      empty.className = boardsModalClassNames.importEmpty;
      empty.textContent = this.runtime.i18n.t('boards.import.previewEmpty');
      host.append(title, empty);
      return;
    }

    const header = document.createElement('header');
    header.className = boardsModalClassNames.importReviewHeader;
    const headerText = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = boardsModalClassNames.importReviewEyebrow;
    eyebrow.textContent = this.runtime.i18n.t('boards.import.previewTitle');
    const headline = document.createElement('h3');
    headline.className = boardsModalClassNames.importReviewHeadline;
    headline.textContent = this.runtime.i18n.t(
      plan.canApply
        ? applyModeSupported
          ? 'boards.import.status.ready'
          : 'boards.import.status.previewOnly'
        : 'boards.import.status.blocked'
    );
    headerText.append(eyebrow, headline);
    header.append(headerText);
    host.append(header);

    if (plan.items.length > 0) {
      const groups = document.createElement('div');
      groups.className = boardsModalClassNames.importPlanGroups;
      (['create', 'update', 'skip', 'conflict'] as const).forEach((action) => {
        const groupItems = plan.items
          .filter((planItem) => planItem.action === action)
          .slice(0, 40);
        if (groupItems.length === 0) return;
        const group = document.createElement('section');
        group.className = `${boardsModalClassNames.importPlanGroup} majom-boards-import__plan-group--${action}`;
        const groupHeader = document.createElement('header');
        groupHeader.className = boardsModalClassNames.importPlanGroupHeader;
        const groupTitle = document.createElement('h4');
        groupTitle.className = boardsModalClassNames.importPlanGroupTitle;
        groupTitle.textContent = this.runtime.i18n.t(
          IMPORT_ACTION_GROUP_LABEL_KEYS[action]
        );
        groupHeader.append(groupTitle);

        const list = document.createElement('ul');
        list.className = boardsModalClassNames.importItems;
        groupItems.forEach((planItem) => {
          const item = document.createElement('li');
          item.className = boardsModalClassNames.importItem;
          const entity = document.createElement('span');
          entity.className = boardsModalClassNames.importItemEntity;
          entity.textContent = this.runtime.i18n.t(
            IMPORT_ENTITY_LABEL_KEYS[planItem.entity]
          );
          const text = document.createElement('span');
          const main = document.createElement('span');
          main.className = boardsModalClassNames.importItemMain;
          main.textContent = planItem.title;
          text.append(main);
          const metaText = this.getImportPlanItemMeta(planItem);
          if (metaText) {
            const meta = document.createElement('span');
            meta.className = boardsModalClassNames.importItemMeta;
            meta.textContent = metaText;
            text.append(meta);
          }
          item.append(entity, text);
          list.append(item);
        });
        group.append(groupHeader, list);
        groups.append(group);
      });
      host.append(groups);
    }

    if (plan.diagnostics.length > 0) {
      const diagnostics = document.createElement('ul');
      diagnostics.className = boardsModalClassNames.importDiagnostics;
      plan.diagnostics.slice(0, 20).forEach((diagnostic) => {
        const item = document.createElement('li');
        item.className =
          diagnostic.level === 'error'
            ? boardsModalClassNames.importDiagnosticError
            : boardsModalClassNames.importDiagnosticWarning;
        item.textContent = diagnostic.path
          ? `${diagnostic.path}: ${diagnostic.message}`
          : diagnostic.message;
        diagnostics.append(item);
      });
      host.append(diagnostics);
    }
  }

  private getImportPlanItemMeta(
    planItem: BoardsImportPlan['items'][number]
  ): string | null {
    if (planItem.action === 'create') return null;

    const reasonLabels: Record<string, string> = {
      'ambiguous-title-match': this.runtime.i18n.t(
        'boards.import.reason.ambiguousTitle'
      ),
      'invalid-source': this.runtime.i18n.t(
        'boards.import.reason.invalidSource'
      ),
      'matched-by-title': this.runtime.i18n.t(
        'boards.import.reason.matchedByTitle'
      ),
      'replace-target-not-found': this.runtime.i18n.t(
        'boards.import.reason.replaceTargetNotFound'
      ),
      'target-board-not-found': this.runtime.i18n.t(
        'boards.import.reason.targetBoardNotFound'
      ),
      'target-column-not-found': this.runtime.i18n.t(
        'boards.import.reason.targetColumnNotFound'
      ),
    };

    if (planItem.reason) return reasonLabels[planItem.reason] ?? planItem.path;
    if (planItem.targetId) {
      return this.runtime.i18n.t('boards.import.reason.existingTarget');
    }
    return planItem.path;
  }

  private closeImportPreviewModal(): void {
    this.importPreviewOverlay?.remove();
    this.importPreviewOverlay = null;
  }

  private async openExportOutputModal(
    config: ExportOutputModalConfig
  ): Promise<void> {
    this.closeExportOutputModal();
    this.closeImportPreviewModal();

    const result = await this.handlers.onExportData(config.request);
    if (!result) {
      notify(this.runtime.i18n.t('boards.export.failed'), 'error');
      return;
    }

    const { overlay, container, body, footer } = createModalShell(
      this.runtime.i18n.t(config.titleKey),
      {
        intent: 'info',
        zIndex: 380,
        onClose: () => this.closeExportOutputModal(),
      }
    );
    container.classList.add(boardsModalClassNames.exportModal);
    overlay.setAttribute('data-testid', 'boards-export-output-modal');

    const content = document.createElement('div');
    content.className = boardsModalClassNames.exportContent;

    const meta = document.createElement('p');
    meta.className = boardsModalClassNames.exportMeta;
    meta.textContent = `${result.fileName} · ${result.format.toUpperCase()}`;

    const output = new Textarea({
      rows: 18,
      value: result.content,
      className: boardsModalClassNames.exportOutput,
    }).createElement();
    output.readOnly = true;
    output.setAttribute('data-testid', 'boards-export-output');
    output.addEventListener('focus', () => output.select());

    content.append(meta, output);
    body.replaceChildren(content);

    const row = createModalActionRow({ variant: 'confirm' });
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = getModalActionButtonClass('default');
    closeButton.textContent = this.runtime.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.closeExportOutputModal());

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = getModalActionButtonClass('wide');
    copyButton.textContent = this.runtime.i18n.t('boards.export.copy');
    copyButton.setAttribute('data-testid', 'boards-export-copy-button');
    copyButton.addEventListener('click', () => {
      void this.copyExportContent(result, output);
    });

    row.append(closeButton, copyButton);
    footer.replaceChildren(row);
    this.exportOutputOverlay = overlay;
    requestAnimationFrame(() => output.focus());
  }

  private async copyExportContent(
    result: BoardsExportResult,
    output: HTMLTextAreaElement
  ): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.content);
      } else {
        output.select();
        document.execCommand('copy');
      }
      notify(this.runtime.i18n.t('boards.export.copied'), 'success');
    } catch {
      output.select();
      notify(this.runtime.i18n.t('boards.export.copyFailed'), 'warning');
    }
  }

  private closeExportOutputModal(): void {
    this.exportOutputOverlay?.remove();
    this.exportOutputOverlay = null;
  }

  private archiveOrRemoveCard(
    card: Card,
    placementId: CardPlacement['id']
  ): void {
    if (isMirrorCard(card)) {
      this.handlers.onDeleteCardPlacement(placementId);
      return;
    }
    this.handlers.onDeleteCard(card.id);
  }

  private createPlacementTargetFromPosition(
    column: BoardColumn,
    position: number,
    movingPlacementId?: CardPlacement['id']
  ): PlacementTargetSelection {
    return resolveCardPlacementTarget({
      columnId: column.id,
      cards: column.cards,
      movingPlacementId: movingPlacementId ?? '',
      insertionIndex: position - 1,
    }) as PlacementTargetSelection;
  }

  private openMoveCardPopover(
    trigger: HTMLButtonElement,
    currentBoard: Board,
    currentColumn: BoardColumn,
    card: Card,
    mode: 'move' | 'mirror' = 'move'
  ): void {
    const boards = this.state?.boards ?? [currentBoard];
    const placementId = getCardPlacementId(card);
    let selectedBoardId = currentBoard.id;
    let selectedColumnId = currentColumn.id;
    let selectedPosition = currentColumn.cards.findIndex(
      (candidate) => getCardPlacementId(candidate) === placementId
    );
    selectedPosition = selectedPosition >= 0 ? selectedPosition + 1 : 1;
    const titleKey =
      mode === 'mirror' ? 'boards.cardMirror.title' : 'boards.cardMove.title';
    const actionKey =
      mode === 'mirror' ? 'boards.cardMirror.create' : 'boards.cardMove.move';

    this.closeMoveCardPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.movePopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'move-card-popover');
    panel.setAttribute('data-testid', 'move-card-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const header = document.createElement('header');
    header.className = boardsModalClassNames.movePopoverHeader;
    const title = document.createElement('h2');
    title.id = 'move-card-popover';
    title.className = boardsModalClassNames.movePopoverTitle;
    title.textContent = this.runtime.i18n.t(titleKey);
    const close = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      className: boardsModalClassNames.iconButton,
      ariaLabel: this.runtime.i18n.t('common.close'),
      title: this.runtime.i18n.t('common.close'),
      onClick: () => this.closeMoveCardPopover(),
    });
    header.append(title, close);

    const body = document.createElement('div');
    body.className = boardsModalClassNames.movePopoverBody;
    const content = document.createElement('div');
    content.className = boardsModalClassNames.movePopoverContent;

    const tabs = document.createElement('div');
    tabs.className = boardsModalClassNames.moveTabs;
    tabs.setAttribute('role', 'tablist');
    tabs.append(
      this.renderMoveCardTab('boards.cardMove.inbox', false),
      this.renderMoveCardTab('boards.cardMove.board', true)
    );

    const sectionTitle = document.createElement('h3');
    sectionTitle.className = boardsModalClassNames.moveSectionTitle;
    sectionTitle.textContent = this.runtime.i18n.t(
      'boards.cardMove.selectDestination'
    );

    const fields = document.createElement('div');
    fields.className = boardsModalClassNames.moveFields;

    const boardSelect = this.createMoveSelectField({
      id: 'move-card-board-select',
      label: this.runtime.i18n.t('boards.cardMove.board'),
    });
    const listSelect = this.createMoveSelectField({
      id: 'move-card-list-select',
      label: this.runtime.i18n.t('boards.cardMove.list'),
    });
    const positionSelect = this.createMoveSelectField({
      id: 'move-card-board-list-position-select',
      label: this.runtime.i18n.t('boards.cardMove.position'),
    });

    const selectedBoard = (): Board | null =>
      boards.find((board) => board.id === selectedBoardId) ?? null;
    const selectedColumn = (): BoardColumn | null =>
      selectedBoard()?.columns.find(
        (column) => column.id === selectedColumnId
      ) ?? null;
    const hasExistingMirrorInSelectedColumn = (): boolean => {
      if (mode !== 'mirror') return false;
      return (
        selectedColumn()?.cards.some((candidate) => candidate.id === card.id) ??
        false
      );
    };
    const getPositionCount = (): number => {
      const column = selectedColumn();
      if (!column) return 0;
      if (mode === 'mirror') return column.cards.length + 1;
      return column.id === currentColumn.id
        ? column.cards.length
        : column.cards.length + 1;
    };
    let moveButton!: HTMLButtonElement;
    const renderSelectOptions = (): void => {
      boardSelect.select.replaceChildren(
        ...boards.map((board) =>
          this.createSelectOption(
            board.id,
            board.title,
            board.id === selectedBoardId
          )
        )
      );

      const board = selectedBoard();
      const columns = board?.columns ?? [];
      if (!columns.some((column) => column.id === selectedColumnId)) {
        selectedColumnId = columns[0]?.id ?? '';
      }
      listSelect.select.replaceChildren(
        ...columns.map((column) =>
          this.createSelectOption(
            column.id,
            column.title,
            column.id === selectedColumnId
          )
        )
      );

      const positionCount = getPositionCount();
      selectedPosition = Math.min(
        Math.max(selectedPosition, 1),
        positionCount || 1
      );
      positionSelect.select.replaceChildren(
        ...Array.from({ length: positionCount }, (_, index) =>
          this.createSelectOption(
            index + 1,
            String(index + 1),
            index + 1 === selectedPosition
          )
        )
      );
      if (hasExistingMirrorInSelectedColumn()) {
        statusMessage.show(
          this.runtime.i18n.t('boards.cardMirror.duplicateDestination'),
          'warning'
        );
      } else if (!selectedColumn()) {
        statusMessage.show(
          this.runtime.i18n.t('boards.cardMirror.noDestination'),
          'error'
        );
      } else {
        statusMessage.clear();
      }
      moveButton.disabled = !selectedColumn();
    };
    const statusMessage = createFormMessage({
      tone: 'error',
      className: 'mb-3',
    });

    boardSelect.select.addEventListener('change', () => {
      selectedBoardId = boardSelect.select.value;
      selectedColumnId =
        boards.find((board) => board.id === selectedBoardId)?.columns[0]?.id ??
        '';
      selectedPosition = 1;
      renderSelectOptions();
    });
    listSelect.select.addEventListener('change', () => {
      selectedColumnId = listSelect.select.value;
      selectedPosition =
        selectedColumnId === currentColumn.id ? selectedPosition : 1;
      renderSelectOptions();
    });
    positionSelect.select.addEventListener('change', () => {
      selectedPosition = Number(positionSelect.select.value);
    });

    moveButton = createTextButton({
      text: this.runtime.i18n.t(actionKey),
      tone: 'primary',
      size: 'md',
      className: boardsModalClassNames.moveButton,
      onClick: () => {
        const column = selectedColumn();
        if (!column) return;
        const target = this.createPlacementTargetFromPosition(
          column,
          selectedPosition,
          mode === 'move' ? placementId : undefined
        );
        const currentOrder = currentColumn.cards.findIndex(
          (candidate) => getCardPlacementId(candidate) === placementId
        );
        this.closeMoveCardPopover();
        if (mode === 'mirror') {
          this.closeQuickCardEditor();
          const { column: targetColumn, ...placementTarget } = target;
          this.handlers.onCreateCardMirror(
            card.id,
            targetColumn,
            placementTarget
          );
          return;
        }
        if (
          column.id === currentColumn.id &&
          selectedPosition - 1 === currentOrder
        ) {
          this.closeQuickCardEditor();
          return;
        }
        this.closeQuickCardEditor();
        this.handlers.onPatchCardPlacement(placementId, target);
      },
    });
    moveButton.setAttribute('data-testid', 'move-card-popover-move-button');

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.moveActions;
    actions.append(moveButton);

    fields.append(boardSelect.field, listSelect.field, positionSelect.field);
    content.append(tabs, sectionTitle, fields, statusMessage.element);
    body.append(content, actions);
    panel.append(header, body);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 300,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.moveCardPopover?.menu === menu) {
          this.closeMoveCardPopover();
        }
      },
    });
    menu.mount();
    this.moveCardPopover = { menu, panel, trigger };
    renderSelectOptions();
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-start',
      fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderMoveCardTab(labelKey: string, selected: boolean): HTMLElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = selected
      ? boardsModalClassNames.moveTabSelected
      : boardsModalClassNames.moveTab;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.disabled = !selected;
    tab.textContent = this.runtime.i18n.t(labelKey);
    return tab;
  }

  private createMoveSelectField(options: { id: string; label: string }): {
    field: HTMLElement;
    select: HTMLSelectElement;
  } {
    const field = document.createElement('label');
    field.className = boardsModalClassNames.moveField;
    field.htmlFor = options.id;
    const label = document.createElement('span');
    label.className = boardsModalClassNames.moveLabel;
    label.textContent = options.label;
    const select = document.createElement('select');
    select.id = options.id;
    select.className = boardsModalClassNames.moveSelect;
    select.setAttribute('data-testid', `${options.id}-select`);
    field.append(label, select);
    return { field, select };
  }

  private createSelectOption(
    value: string | number,
    label: string,
    selected: boolean
  ): HTMLOptionElement {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = label;
    option.selected = selected;
    return option;
  }

  private renderCardBackLayout(
    board: Board,
    column: BoardColumn,
    card: Card,
    titleInput: HTMLTextAreaElement,
    description: HTMLTextAreaElement
  ): HTMLElement {
    const layout = document.createElement('div');
    layout.className = boardsModalClassNames.layout;

    const main = document.createElement('main');
    main.className = boardsModalClassNames.main;
    main.setAttribute('data-auto-scrollable', 'true');
    main.append(
      this.renderCardBackTitleSection(card, titleInput),
      this.renderCardBackQuickActions(card),
      this.renderCardBackLabelsHost(card),
      ...this.renderCardBackEntityLinksSection(card),
      this.renderCardBackDescriptionSection(card, titleInput, description),
      this.renderCardBackChecklistsSection(card),
      this.renderCardBackAttachmentsSection()
    );

    const aside = this.renderCardBackAside(board, column);
    layout.append(main, aside);
    return layout;
  }

  private renderCardBackTitleSection(
    card: Card,
    titleInput: HTMLTextAreaElement
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = `${boardsModalClassNames.section} ${boardsModalClassNames.titleSection}`;
    section.setAttribute('data-testid', 'card-back-header');

    const iconWrap = document.createElement('div');
    iconWrap.className = boardsModalClassNames.sectionIcon;
    const doneButton = this.createCardCompletionToggle(card, {
      className: isCardCompleted(card)
        ? boardsModalClassNames.doneButtonCompleted
        : boardsModalClassNames.doneButton,
      testId: 'card-back-completion-toggle',
    });
    iconWrap.append(doneButton);

    const main = document.createElement('div');
    main.className = boardsModalClassNames.sectionMain;
    const hgroup = document.createElement('hgroup');
    const title = document.createElement('h2');
    title.id = 'card-back-name';
    title.className = boardsModalClassNames.hiddenShellPart;
    title.textContent = card.title;
    hgroup.append(title, titleInput);
    main.append(hgroup);

    section.append(iconWrap, main);
    return section;
  }

  private renderCardBackQuickActions(card: Card): HTMLElement {
    const section = document.createElement('section');
    section.className = `${boardsModalClassNames.section} ${boardsModalClassNames.quickActions}`;
    const spacer = document.createElement('div');
    spacer.className = boardsModalClassNames.sectionIcon;
    const main = document.createElement('div');
    main.className = boardsModalClassNames.sectionMain;

    const list = document.createElement('ul');
    list.className = boardsModalClassNames.quickActionList;
    this.cardModalQuickActionList = list;
    this.populateCardBackQuickActions(list, card);
    main.append(list);
    section.append(spacer, main);
    return section;
  }

  private populateCardBackQuickActions(
    list: HTMLUListElement,
    card: Card
  ): void {
    list.replaceChildren();
    const isPendingCard = this.isPendingCard(card);
    const actionItems: Array<
      | { labelKey: string; icon: IconName; disabled: true }
      | {
          labelKey: string;
          icon: IconName;
          disabled?: false;
          onClick: (button: HTMLButtonElement) => void;
        }
    > = [{ labelKey: 'boards.cardBack.add', icon: 'plus', disabled: true }];
    if (this.getCardModalDraftTagItems(card).length === 0) {
      actionItems.push({
        labelKey: 'boards.cardBack.labels',
        icon: 'tag',
        onClick: (button) => this.openCardLabelsPopover(button, card),
      });
    }
    if (isPendingCard) {
      actionItems.push(
        { labelKey: 'boards.cardLinks.link', icon: 'link', disabled: true },
        {
          labelKey: 'boards.cardLinks.createTask',
          icon: 'check-box',
          disabled: true,
        },
        {
          labelKey: 'boards.cardLinks.createStory',
          icon: 'document',
          disabled: true,
        },
        {
          labelKey: 'boards.cardLinks.createGoal',
          icon: 'goal-circle',
          disabled: true,
        },
        { labelKey: 'boards.cardBack.dates', icon: 'calendar', disabled: true },
        {
          labelKey: 'boards.cardBack.checklist',
          icon: 'check-box',
          disabled: true,
        }
      );
    } else {
      actionItems.push(
        {
          labelKey: 'boards.cardLinks.link',
          icon: 'link',
          onClick: () => this.openCardEntityLinkModal(card),
        },
        {
          labelKey: 'boards.cardLinks.createTask',
          icon: 'check-box',
          onClick: () => void this.createEntityFromCard(card, 'task'),
        },
        {
          labelKey: 'boards.cardLinks.createStory',
          icon: 'document',
          onClick: () => void this.createEntityFromCard(card, 'story'),
        },
        {
          labelKey: 'boards.cardLinks.createGoal',
          icon: 'goal-circle',
          onClick: () => void this.createEntityFromCard(card, 'goal'),
        },
        { labelKey: 'boards.cardBack.dates', icon: 'calendar', disabled: true },
        {
          labelKey: 'boards.cardBack.checklist',
          icon: 'check-box',
          onClick: (button) => this.openCardChecklistPopover(button, card),
        }
      );
    }

    actionItems.forEach((action) => {
      const item = document.createElement('li');
      const button =
        action.disabled === true
          ? this.createUnavailableCardBackButton(action.labelKey, action.icon)
          : this.createAvailableCardBackButton({
              labelKey: action.labelKey,
              icon: action.icon,
              onClick: action.onClick,
            });
      item.append(button);
      list.append(item);
    });
  }

  private renderCardBackLabelsHost(card: Card): HTMLDivElement {
    const host = document.createElement('div');
    host.className = boardsModalClassNames.labelsHost;
    host.setAttribute('data-testid', 'card-back-labels-host');
    this.cardModalLabelsHost = host;
    this.populateCardBackLabelsHost(host, card);
    return host;
  }

  private populateCardBackLabelsHost(host: HTMLElement, card: Card): void {
    host.replaceChildren();
    const tags = this.getCardModalDraftTagItems(card);
    if (tags.length === 0) return;

    const section = document.createElement('section');
    section.className = boardsModalClassNames.labelsSection;
    section.setAttribute('aria-labelledby', 'card-back-labels-title');

    const title = document.createElement('h3');
    title.id = 'card-back-labels-title';
    title.className = boardsModalClassNames.labelsTitle;
    title.textContent = this.runtime.i18n.t('boards.cardBack.labels');

    const group = document.createElement('div');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', title.id);

    const labels = document.createElement('div');
    labels.className = boardsModalClassNames.labelsList;
    labels.setAttribute('data-testid', 'card-back-labels-container');
    tags.forEach((tag) => {
      labels.append(this.createCardBackLabelSwatch(tag));
    });
    labels.append(this.createCardBackAddLabelButton(card));

    group.append(labels);
    section.append(title, group);
    host.append(section);
  }

  private createCardBackLabelSwatch(tag: TagPickerItem): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsModalClassNames.labelSwatch;
    button.style.backgroundColor = tag.color;
    button.style.color = getCardLabelTextColor(tag.color);
    button.textContent = tag.title;
    button.title = tag.title;
    button.setAttribute('aria-label', tag.title);
    button.setAttribute('data-testid', 'card-label');
    button.dataset.tagId = String(tag.id);
    return button;
  }

  private createCardBackAddLabelButton(card: Card): HTMLButtonElement {
    const button = createIconButton({
      icon: 'plus',
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.labelAddButton,
      ariaLabel: this.runtime.i18n.t('boards.cardBack.addLabel'),
      title: this.runtime.i18n.t('boards.cardBack.addLabel'),
      onClick: () => this.openCardLabelsPopover(button, card),
    });
    button.setAttribute('data-testid', 'card-back-add-label-button');
    button.dataset.role = 'goal-tag-picker-trigger';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    return button;
  }

  private createAvailableCardBackButton(options: {
    labelKey: string;
    icon: IconName;
    onClick: (button: HTMLButtonElement) => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      text: this.runtime.i18n.t(options.labelKey),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.quickActionButton,
      onClick: () => options.onClick(button),
    });
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    prependButtonIcon(button, options.icon);
    return button;
  }

  private getCardModalDraftTagIds(card: Card): number[] {
    return (
      this.cardDetailsSession.snapshot?.draft.tagIds ?? getBoardCardTagIds(card)
    );
  }

  private getCardModalDraftTagItems(card: Card): TagPickerItem[] {
    const draftIds = this.getCardModalDraftTagIds(card);
    const draftIdSet = new Set(draftIds);
    const knownTags = new Map<number, TagPickerItem>();
    card.tags?.forEach((tag) => knownTags.set(tag.id, mapTagToPickerItem(tag)));
    this.tagItems.forEach((tag) => knownTags.set(tag.id, tag));
    return draftIds
      .map((id) => knownTags.get(id))
      .filter(
        (tag): tag is TagPickerItem => Boolean(tag) && draftIdSet.has(tag.id)
      );
  }

  private refreshCardModalLabelControls(card: Card): void {
    if (this.cardModalLabelsHost) {
      this.populateCardBackLabelsHost(this.cardModalLabelsHost, card);
    }
    if (this.cardModalQuickActionList) {
      this.populateCardBackQuickActions(this.cardModalQuickActionList, card);
    }
  }

  private patchCardModalTagIds(card: Card, selectedIds: number[]): void {
    const nextTagIds = normalizeBoardCardTagIds(selectedIds);
    const session = this.cardDetailsSession.snapshot;
    if (session && !session.identity.isResolved) return;
    if (session && hasRequestedCardDetailsTagIds(session, nextTagIds)) return;
    this.cardDetailsSession.updateRequestedTagIds(nextTagIds);
    this.handlers.onPatchCard(card.id, { tag_ids: nextTagIds });
  }

  private openCardLabelsPopover(trigger: HTMLButtonElement, card: Card): void {
    this.closeCardLabelsPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.labelPickerPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.labels')
    );
    panel.setAttribute('data-testid', 'card-back-label-picker-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const picker = new TagPickerField({
      variant: 'labels',
      items: this.tagItems,
      selectedIds: this.getCardModalDraftTagIds(card),
      loading: this.tagCatalogStatus === 'loading',
      errorMessage: this.getTagPickerErrorMessage(),
      placeholder: this.runtime.i18n.t('boards.cardBack.tagsPlaceholder'),
      searchPlaceholder: this.runtime.i18n.t(
        'boards.cardBack.tagsSearchPlaceholder'
      ),
      copy: {
        title: this.runtime.i18n.t('boards.cardBack.labels'),
        editTitle: this.runtime.i18n.t('boards.cardBack.editLabel'),
        createTitle: this.runtime.i18n.t('boards.cardBack.createLabel'),
        searchPlaceholder: this.runtime.i18n.t(
          'boards.cardBack.tagsSearchPlaceholder'
        ),
        labelsLegend: this.runtime.i18n.t('boards.cardBack.labels'),
        createButton: this.runtime.i18n.t('boards.cardBack.createNewLabel'),
        colorblindButton: this.runtime.i18n.t(
          'boards.cardBack.enableColorblindMode'
        ),
        titleLabel: this.runtime.i18n.t('boards.cardBack.labelTitle'),
        colorLegend: this.runtime.i18n.t('boards.cardBack.selectColor'),
        removeColor: this.runtime.i18n.t('boards.cardBack.removeColor'),
        save: this.runtime.i18n.t('common.save'),
        delete: this.runtime.i18n.t('common.delete'),
        close: this.runtime.i18n.t('boards.cardBack.closeLabelsPopover'),
        back: this.runtime.i18n.t('boards.cardBack.returnToLabels'),
      },
      onRequestClose: () => this.closeCardLabelsPopover(),
      onCreate: (title, color) => this.createTagFromCardBack(title, color),
      onUpdate: (id, patch) => this.updateTagFromCardBack(id, patch),
      onDelete: (id) => this.deleteTagFromCardBack(id),
      onChange: (selectedIds) => {
        this.cardDetailsSession.updateDraft({ tagIds: selectedIds });
        this.refreshCardModalLabelControls(card);
        this.patchCardModalTagIds(card, selectedIds);
      },
    });
    picker.element.setAttribute('data-testid', 'card-back-tag-picker');
    panel.append(picker.element);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 310,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.cardLabelsPopover?.menu === menu) {
          this.closeCardLabelsPopover();
        }
      },
    });
    menu.mount();
    this.cardLabelsPopover = { menu, panel, picker, trigger };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-start',
      fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
    window.requestAnimationFrame(() => picker.focusSearch());
  }

  private openCardChecklistPopover(
    trigger: HTMLButtonElement,
    card: Card
  ): void {
    this.closeCardChecklistPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.checklistPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.addChecklist')
    );
    panel.setAttribute('data-testid', 'card-back-checklist-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const header = document.createElement('header');
    header.className = boardsModalClassNames.checklistPopoverHeader;
    const title = document.createElement('h3');
    title.className = boardsModalClassNames.checklistPopoverTitle;
    title.textContent = this.runtime.i18n.t('boards.cardBack.addChecklist');
    const closeButton = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      className: boardsModalClassNames.checklistPopoverClose,
      ariaLabel: this.runtime.i18n.t('common.close'),
      title: this.runtime.i18n.t('common.close'),
      onClick: () => this.closeCardChecklistPopover(),
    });
    header.append(title, closeButton);

    const form = document.createElement('form');
    form.className = boardsModalClassNames.checklistPopoverForm;
    const label = document.createElement('label');
    label.className = boardsModalClassNames.checklistPopoverLabel;
    label.textContent = this.runtime.i18n.t('boards.cardBack.checklistTitle');
    const input = createInputBase({
      variant: 'default',
      value: this.runtime.i18n.t('boards.cardBack.defaultChecklistTitle'),
      className: boardsModalClassNames.checklistPopoverInput,
    });
    label.append(input);
    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.checklistPopoverActions;
    const submit = createTextButton({
      text: this.runtime.i18n.t('boards.cardBack.add'),
      tone: 'primary',
      size: 'md',
      className: boardsModalClassNames.checklistPopoverSubmit,
    });
    submit.type = 'submit';
    actions.append(submit);
    form.append(label, actions);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.createCardModalChecklist(card, input.value);
    });
    panel.append(header, form);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 310,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.cardChecklistPopover?.menu === menu) {
          this.closeCardChecklistPopover();
        }
      },
    });
    menu.mount();
    this.cardChecklistPopover = { menu, panel, trigger };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-start',
      fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
      gap: 8,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  private async createTagFromCardBack(
    title: string,
    color?: string
  ): Promise<TagPickerItem | null> {
    if (!this.tagCatalog) return null;
    try {
      const tag = await this.tagCatalog.createTag(title, color);
      const item = mapTagToPickerItem(tag);
      this.upsertTagItem(item);
      return item;
    } catch {
      throw new Error(this.runtime.i18n.t('boards.cardBack.tagsCreateFailed'));
    }
  }

  private async updateTagFromCardBack(
    id: number,
    patch: { title?: string; color?: string }
  ): Promise<TagPickerItem | null> {
    if (!this.tagCatalog) return null;
    try {
      const tag = await this.tagCatalog.updateTag(id, patch);
      const item = mapTagToPickerItem(tag);
      this.upsertTagItem(item);
      return item;
    } catch {
      throw new Error(this.runtime.i18n.t('boards.cardBack.tagsUpdateFailed'));
    }
  }

  private async deleteTagFromCardBack(id: number): Promise<void> {
    if (!this.tagCatalog) return;
    try {
      await this.tagCatalog.deleteTag(id);
      this.tagItems = this.tagItems.filter((tag) => tag.id !== id);
      const { card } = this.findActiveCardLocation();
      this.cardDetailsSession.updateDraft({
        tagIds: this.getCardModalDraftTagIds(card).filter(
          (tagId) => tagId !== id
        ),
      });
    } catch {
      throw new Error(this.runtime.i18n.t('boards.cardBack.tagsDeleteFailed'));
    }
  }

  private upsertTagItem(item: TagPickerItem): void {
    const index = this.tagItems.findIndex((tag) => tag.id === item.id);
    if (index >= 0) {
      this.tagItems = this.tagItems.map((tag) =>
        tag.id === item.id ? item : tag
      );
      return;
    }
    this.tagItems = [...this.tagItems, item];
  }

  private renderCardBackEntityLinksSection(card: Card): HTMLElement[] {
    const links = getCardEntityLinks(card);
    if (links.length === 0) return [];

    const section = this.createCardBackSection(
      'link',
      this.runtime.i18n.t('boards.cardLinks.title')
    );
    const main = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionMain}`
    );
    const header = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionHeader}`
    );
    if (!main || !header) return [section];

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.sectionActions;
    actions.append(
      createTextButton({
        text: this.runtime.i18n.t('boards.cardLinks.link'),
        tone: 'text',
        size: 'md',
        className: boardsViewClassNames.quietButton,
        onClick: () => this.openCardEntityLinkModal(card),
      })
    );
    header.append(actions);

    const host = document.createElement('div');
    host.className = boardsModalClassNames.entityLinksHost;
    host.setAttribute('data-testid', 'card-entity-links');

    const list = document.createElement('ul');
    list.className = boardsModalClassNames.entityLinksList;
    links.forEach((link) => {
      list.append(this.renderCardEntityLinkItem(card, link));
    });
    host.append(list);

    main.append(host);
    return [section];
  }

  private renderCardEntityLinkItem(
    card: Card,
    link: CardEntityLink
  ): HTMLLIElement {
    const item = document.createElement('li');
    item.className = boardsModalClassNames.entityLinkItem;

    const icon = document.createElement('span');
    icon.className = boardsModalClassNames.entityLinkIcon;
    icon.append(createIcon(getCardEntityIcon(link.entity_type), { size: 16 }));

    const content = document.createElement('span');
    content.className = boardsModalClassNames.entityLinkContent;
    const title = document.createElement('span');
    title.className = boardsModalClassNames.entityLinkTitle;
    title.textContent = getCardEntityLinkTitle(link);
    const meta = document.createElement('span');
    meta.className = boardsModalClassNames.entityLinkMeta;
    const typeLabel = this.runtime.i18n.t(
      getCardEntityTypeLabelKey(link.entity_type)
    );
    meta.textContent = link.entity?.status
      ? `${typeLabel} - ${link.entity.status}`
      : typeLabel;
    content.append(title, meta);

    const menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      className: boardsModalClassNames.entityLinkMenuTriggerButton,
      ariaLabel: this.runtime.i18n.t('boards.cardLinks.actions', {
        title: getCardEntityLinkTitle(link),
      }),
      title: this.runtime.i18n.t('boards.cardBack.actions'),
    });
    menuButton.setAttribute('aria-haspopup', 'dialog');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('data-testid', 'card-entity-link-menu-button');
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.cardEntityLinkMenuPopover?.trigger === menuButton) {
        this.closeCardEntityLinkMenuPopover();
        return;
      }
      this.openCardEntityLinkMenuPopover(menuButton, card, link);
    });

    item.append(icon, content, menuButton);
    return item;
  }

  private openCardEntityLinkMenuPopover(
    trigger: HTMLButtonElement,
    card: Card,
    link: CardEntityLink
  ): void {
    this.closeCardEntityLinkMenuPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.entityLinkMenuPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardLinks.actions', {
        title: getCardEntityLinkTitle(link),
      })
    );
    panel.setAttribute('data-testid', 'card-entity-link-menu-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const list = document.createElement('ul');
    list.className = boardsModalClassNames.entityLinkMenuList;
    list.append(
      this.renderCardEntityLinkMenuItem({
        labelKey: 'boards.cardLinks.openAction',
        ariaLabel: this.runtime.i18n.t('boards.cardLinks.open', {
          title: getCardEntityLinkTitle(link),
        }),
        icon: 'arrow-right',
        onClick: () => {
          this.closeCardEntityLinkMenuPopover();
          this.openLinkedEntity(link);
        },
      }),
      this.renderCardEntityLinkMenuItem({
        labelKey: 'boards.cardLinks.unlinkAction',
        ariaLabel: this.runtime.i18n.t('boards.cardLinks.unlink', {
          title: getCardEntityLinkTitle(link),
        }),
        icon: 'link-slash',
        onClick: () => {
          this.closeCardEntityLinkMenuPopover();
          void this.unlinkCardEntity(card, link);
        },
      }),
      this.renderCardEntityLinkMenuItem({
        labelKey: 'boards.cardLinks.deleteEntity',
        ariaLabel: this.runtime.i18n.t('boards.cardLinks.deleteEntityLabel', {
          title: getCardEntityLinkTitle(link),
        }),
        icon: 'trash',
        danger: true,
        onClick: () => {
          this.closeCardEntityLinkMenuPopover();
          void this.deleteLinkedEntity(card, link);
        },
      })
    );
    panel.append(list);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 320,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.cardEntityLinkMenuPopover?.menu === menu) {
          this.closeCardEntityLinkMenuPopover();
        }
      },
    });
    menu.mount();
    this.cardEntityLinkMenuPopover = {
      menu,
      panel,
      trigger,
    };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      gap: 4,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderCardEntityLinkMenuItem(options: {
    labelKey: string;
    ariaLabel: string;
    icon: IconName;
    danger?: boolean;
    onClick: () => void;
  }): HTMLLIElement {
    const item = document.createElement('li');
    item.className = boardsModalClassNames.entityLinkMenuItem;
    const button = createTextButton({
      text: this.runtime.i18n.t(options.labelKey),
      tone: 'text',
      size: 'md',
      className: options.danger
        ? boardsModalClassNames.entityLinkMenuDangerButton
        : boardsModalClassNames.entityLinkMenuButton,
      onClick: options.onClick,
    });
    button.setAttribute('aria-label', options.ariaLabel);
    prependButtonIcon(button, options.icon);
    item.append(button);
    return item;
  }

  private async unlinkCardEntity(
    card: Card,
    link: CardEntityLink
  ): Promise<void> {
    await Promise.resolve(this.handlers.onDeleteCardEntityLink(link.id));
    await this.refreshOpenCardEntityLinks(card.id);
  }

  private async deleteLinkedEntity(
    card: Card,
    link: CardEntityLink
  ): Promise<void> {
    await Promise.resolve(this.handlers.onDeleteLinkedEntity(card, link));
    await this.refreshOpenCardEntityLinks(card.id);
  }

  private async createEntityFromCard(
    card: Card,
    entityType: CardEntityLinkType
  ): Promise<void> {
    await Promise.resolve(
      this.handlers.onCreateCardEntityFromCard(card, entityType)
    );
    await this.refreshOpenCardEntityLinks(card.id);
  }

  private async refreshOpenCardEntityLinks(cardId: Card['id']): Promise<void> {
    const location =
      this.activeCardPlacementId && this.state
        ? this.findCardLocation(this.activeCardPlacementId, this.state)
        : null;
    if (!location || location.card.id !== cardId) return;
    this.renderCardModal(location);
  }

  private openLinkedEntity(link: CardEntityLink): void {
    window.dispatchEvent(
      new CustomEvent('boardLinkedEntityOpenRequested', {
        detail: {
          entityType: link.entity_type,
          entityId: link.entity_id,
        },
      })
    );
  }

  private openCardEntityLinkModal(card: Card): void {
    let modalOverlay: HTMLDivElement | null = null;
    const { overlay, container, body } = createModalShell(
      this.runtime.i18n.t('boards.cardLinks.linkToEntity'),
      {
        zIndex: 360,
        onClose: () => modalOverlay?.remove(),
      }
    );
    modalOverlay = overlay;
    container.setAttribute('data-testid', 'card-entity-link-modal');

    const form = document.createElement('div');
    form.className = boardsModalClassNames.entityLinkPicker;

    const typeField = document.createElement('label');
    typeField.className = boardsModalClassNames.entityLinkPickerField;
    const typeLabel = document.createElement('span');
    typeLabel.className = boardsModalClassNames.moveLabel;
    typeLabel.textContent = this.runtime.i18n.t('boards.cardLinks.selectType');
    const typeSelect = document.createElement('select');
    typeSelect.className = boardsModalClassNames.moveSelect;
    const entityTypes: CardEntityLinkType[] = ['task', 'story', 'goal'];
    entityTypes.forEach((entityType) => {
      const option = document.createElement('option');
      option.value = entityType;
      option.textContent = this.runtime.i18n.t(
        getCardEntityTypeLabelKey(entityType)
      );
      typeSelect.append(option);
    });
    typeField.append(typeLabel, typeSelect);

    const searchField = document.createElement('label');
    searchField.className = boardsModalClassNames.entityLinkPickerField;
    const searchLabel = document.createElement('span');
    searchLabel.className = boardsModalClassNames.moveLabel;
    searchLabel.textContent = this.runtime.i18n.t('boards.cardLinks.search');
    const searchInput = createInputBase({
      variant: 'default',
      className: boardsModalClassNames.entityLinkPickerInput,
      placeholder: this.runtime.i18n.t('boards.cardLinks.searchPlaceholder'),
      disabled: !this.entityCatalog,
    });
    searchField.append(searchLabel, searchInput);

    const resultsHost = document.createElement('div');
    resultsHost.className = boardsModalClassNames.entityLinkPickerResults;
    resultsHost.setAttribute('data-testid', 'card-entity-link-results');

    form.append(typeField, searchField, resultsHost);
    body.append(form);
    document.body.append(overlay);

    let status: CardEntityLinkPickerStatus = this.entityCatalog
      ? 'idle'
      : 'error';
    let results: BoardEntityLinkSearchItem[] = [];
    let searchVersion = 0;
    let searchTimer: number | null = null;

    const renderResults = (): void => {
      resultsHost.replaceChildren();
      if (status === 'loading') {
        resultsHost.append(
          this.createEntityLinkPickerMessage(
            this.runtime.i18n.t('boards.cardLinks.loading')
          )
        );
        return;
      }
      if (status === 'error') {
        resultsHost.append(
          this.createEntityLinkPickerMessage(
            this.runtime.i18n.t('boards.cardLinks.loadFailed')
          )
        );
        return;
      }
      if (results.length === 0) {
        resultsHost.append(
          this.createEntityLinkPickerMessage(
            this.runtime.i18n.t('boards.cardLinks.noResults')
          )
        );
        return;
      }

      const linkedIds = new Set(
        getCardEntityLinks(card).map(
          (link) => `${link.entity_type}:${link.entity_id}`
        )
      );
      const list = document.createElement('ul');
      list.className = boardsModalClassNames.entityLinkPickerList;
      const entityType = typeSelect.value as CardEntityLinkType;
      results.forEach((result) => {
        list.append(
          this.renderEntityLinkPickerResult({
            card,
            entityType,
            item: result,
            disabled: linkedIds.has(`${entityType}:${result.id}`),
            close: () => overlay.remove(),
          })
        );
      });
      resultsHost.append(list);
    };

    const runSearch = async (): Promise<void> => {
      const version = ++searchVersion;
      status = 'loading';
      renderResults();
      try {
        results = await this.searchCardEntityCatalog(
          typeSelect.value as CardEntityLinkType,
          searchInput.value
        );
        if (version !== searchVersion) return;
        status = 'ready';
        renderResults();
      } catch {
        if (version !== searchVersion) return;
        results = [];
        status = 'error';
        renderResults();
      }
    };

    const scheduleSearch = (): void => {
      if (searchTimer !== null) window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        searchTimer = null;
        void runSearch();
      }, 180);
    };

    typeSelect.addEventListener('change', () => {
      results = [];
      void runSearch();
    });
    searchInput.addEventListener('input', scheduleSearch);
    renderResults();
    if (this.entityCatalog) {
      void runSearch();
      searchInput.focus();
    }
  }

  private createEntityLinkPickerMessage(message: string): HTMLElement {
    const element = document.createElement('p');
    element.className = boardsModalClassNames.entityLinksMessage;
    element.textContent = message;
    return element;
  }

  private renderEntityLinkPickerResult(options: {
    card: Card;
    entityType: CardEntityLinkType;
    item: BoardEntityLinkSearchItem;
    disabled: boolean;
    close: () => void;
  }): HTMLLIElement {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = boardsModalClassNames.entityLinkPickerButton;
    button.disabled = options.disabled;
    button.setAttribute('data-testid', 'card-entity-link-result');
    button.addEventListener('click', async () => {
      button.disabled = true;
      await Promise.resolve(
        this.handlers.onCreateCardEntityLink(
          options.card.id,
          options.entityType,
          options.item.id
        )
      );
      options.close();
      await this.refreshOpenCardEntityLinks(options.card.id);
    });

    const icon = createIcon(getCardEntityIcon(options.entityType), {
      size: 16,
    });
    icon.setAttribute('aria-hidden', 'true');
    const content = document.createElement('span');
    content.className = boardsModalClassNames.entityLinkContent;
    const title = document.createElement('span');
    title.className = boardsModalClassNames.entityLinkTitle;
    title.textContent = options.item.title;
    const meta = document.createElement('span');
    meta.className = boardsModalClassNames.entityLinkMeta;
    meta.textContent = options.item.status
      ? `${this.runtime.i18n.t(getCardEntityTypeLabelKey(options.entityType))} - ${options.item.status}`
      : this.runtime.i18n.t(getCardEntityTypeLabelKey(options.entityType));
    content.append(title, meta);
    button.append(icon, content);
    row.append(button);
    return row;
  }

  private searchCardEntityCatalog(
    entityType: CardEntityLinkType,
    query: string
  ): Promise<BoardEntityLinkSearchItem[]> {
    if (!this.entityCatalog) return Promise.resolve([]);
    if (entityType === 'task') return this.entityCatalog.searchTasks(query);
    if (entityType === 'story') return this.entityCatalog.searchStories(query);
    return this.entityCatalog.searchGoals(query);
  }

  private renderCardBackChecklistsSection(card: Card): HTMLElement {
    const host = document.createElement('div');
    host.className = boardsModalClassNames.checklistsHost;
    host.setAttribute('data-testid', 'card-back-checklists-host');
    this.cardModalChecklistHost = host;
    this.populateCardBackChecklistsHost(card);
    return host;
  }

  private populateCardBackChecklistsHost(card: Card): void {
    const host = this.cardModalChecklistHost;
    if (!host) return;
    host.replaceChildren();

    const state =
      this.cardChecklistPanelState?.cardId === card.id
        ? this.cardChecklistPanelState
        : null;

    const shouldHideSection =
      !state ||
      (state.status === 'idle' && state.checklists.length === 0) ||
      (state.status === 'ready' &&
        state.checklists.length === 0 &&
        !state.error);
    host.hidden = shouldHideSection;
    if (shouldHideSection) return;

    if (state?.status === 'loading') {
      const loadingSection = this.createCardBackSection(
        'check-box',
        this.runtime.i18n.t('boards.cardBack.checklist')
      );
      const main = loadingSection.querySelector<HTMLElement>(
        `.${boardsModalClassNames.sectionMain}`
      );
      const loading = document.createElement('div');
      loading.className = boardsModalClassNames.checklistsMessage;
      loading.textContent = this.runtime.i18n.t(
        'boards.cardBack.checklistsLoading'
      );
      main?.append(loading);
      host.append(loadingSection);
      return;
    }

    if (state?.error) {
      const errorSection = this.createCardBackSection(
        'check-box',
        this.runtime.i18n.t('boards.cardBack.checklist')
      );
      const main = errorSection.querySelector<HTMLElement>(
        `.${boardsModalClassNames.sectionMain}`
      );
      const message = createFormMessage({ tone: 'error' });
      message.show(this.runtime.i18n.t(state.error));
      main?.append(message.element);
      host.append(errorSection);
    }

    const checklists = state?.checklists ?? [];
    if (checklists.length > 0) {
      const list = document.createElement('div');
      list.className = boardsModalClassNames.checklistsList;
      checklists.forEach((checklist) => {
        list.append(this.renderCardChecklist(card, checklist));
      });
      host.append(list);
    }
  }

  private renderCardChecklist(
    card: Card,
    checklist: CardChecklist
  ): HTMLElement {
    const completed = checklist.items.filter(
      (item) => item.state === 'complete'
    ).length;
    const total = checklist.items.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const hideChecked = this.hiddenCheckedChecklistIds.has(checklist.id);
    const visibleItems = hideChecked
      ? checklist.items.filter((item) => item.state !== 'complete')
      : checklist.items;

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.checklistActions;
    if (completed > 0) {
      actions.append(
        createTextButton({
          text: hideChecked
            ? this.runtime.i18n.t('boards.cardBack.showCheckedItems', {
                count: completed,
              })
            : this.runtime.i18n.t('boards.cardBack.hideCheckedItems'),
          tone: 'text',
          size: 'md',
          className: boardsModalClassNames.checklistActionButton,
          onClick: () => this.toggleChecklistCheckedItems(card, checklist.id),
        })
      );
    }
    const deleteButton = createTextButton({
      text: this.runtime.i18n.t('common.delete'),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.checklistActionButton,
      onClick: () => this.deleteCardModalChecklist(card.id, checklist.id),
    });
    deleteButton.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.deleteChecklist', {
        title: checklist.title,
      })
    );
    actions.append(deleteButton);

    const section = this.createCardBackSection(
      'check-box',
      checklist.title,
      actions
    );
    section.classList.add(boardsModalClassNames.checklist);
    section.setAttribute('data-testid', 'card-checklist');
    const main = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionMain}`
    );
    if (!main) return section;

    const progressRow = document.createElement('div');
    progressRow.className = boardsModalClassNames.checklistProgressRow;
    const progressLabel = document.createElement('span');
    progressLabel.className = boardsModalClassNames.checklistProgress;
    progressLabel.textContent = `${percent}%`;
    const progressTrack = document.createElement('div');
    progressTrack.className = boardsModalClassNames.checklistProgressTrack;
    const progressBar = document.createElement('span');
    progressBar.className = boardsModalClassNames.checklistProgressBar;
    progressBar.style.width = `${percent}%`;
    progressTrack.append(progressBar);
    progressRow.append(progressLabel, progressTrack);

    const itemList = document.createElement('ul');
    itemList.className = boardsModalClassNames.checkItemList;
    visibleItems.forEach((item) => {
      itemList.append(this.renderCardChecklistItem(card, item));
    });

    section.append(progressRow);
    section.append(itemList, this.renderCheckItemComposer(card, checklist));
    return section;
  }

  private renderCardChecklistItem(
    card: Card,
    item: CardCheckItem
  ): HTMLLIElement {
    const row = document.createElement('li');
    row.className = boardsModalClassNames.checkItem;
    row.setAttribute('data-testid', 'card-check-item');

    const checkbox = new Checkbox({
      checked: item.state === 'complete',
      ariaLabel: item.title,
      className: boardsModalClassNames.checkItemCheckbox,
      onChange: (checked) => {
        void this.patchCardModalCheckItem(card.id, item.id, {
          state: checked ? 'complete' : 'incomplete',
        });
      },
    });

    const title = this.renderCardChecklistItemTitle(card, item);

    const menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      className: boardsModalClassNames.checkItemMenuTriggerButton,
      ariaLabel: this.runtime.i18n.t('boards.cardBack.checkItemActions', {
        title: item.title,
      }),
      title: this.runtime.i18n.t('boards.cardBack.actions'),
    });
    menuButton.setAttribute('aria-haspopup', 'dialog');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('data-testid', 'card-check-item-menu-button');
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.cardCheckItemMenuPopover?.trigger === menuButton) {
        this.closeCardCheckItemMenuPopover();
        return;
      }
      this.openCardCheckItemMenuPopover(menuButton, card, item);
    });

    row.append(checkbox.getElement(), title, menuButton);
    return row;
  }

  private openCardCheckItemMenuPopover(
    trigger: HTMLButtonElement,
    card: Card,
    item: CardCheckItem
  ): void {
    this.closeCardCheckItemMenuPopover();

    const panel = createSurface({
      elevated: true,
      className: `${boardsModalClassNames.checkItemMenuPopover} hidden`,
    });
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.checkItemActions', {
        title: item.title,
      })
    );
    panel.setAttribute('data-testid', 'card-check-item-menu-popover');
    panel.addEventListener('mousedown', (event) => event.stopPropagation());

    const list = document.createElement('ul');
    list.className = boardsModalClassNames.checkItemMenuList;
    const deleteItem = document.createElement('li');
    deleteItem.className = boardsModalClassNames.checkItemMenuItem;
    const deleteButton = createTextButton({
      text: this.runtime.i18n.t('common.delete'),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.checkItemMenuButton,
      onClick: () => {
        this.closeCardCheckItemMenuPopover();
        void this.deleteCardModalCheckItem(card.id, item.id);
      },
    });
    deleteButton.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.deleteCheckItem', {
        title: item.title,
      })
    );
    prependButtonIcon(deleteButton, 'trash');
    deleteItem.append(deleteButton);
    list.append(deleteItem);
    panel.append(list);

    let menu!: AnchoredMenu;
    menu = new AnchoredMenu({
      container: trigger,
      panel,
      positioning: 'viewport',
      panelZIndex: 320,
      onOpenChange: (open) => {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open && this.cardCheckItemMenuPopover?.menu === menu) {
          this.closeCardCheckItemMenuPopover();
        }
      },
    });
    menu.mount();
    this.cardCheckItemMenuPopover = {
      itemId: item.id,
      menu,
      panel,
      trigger,
    };
    menu.openAt({
      anchor: trigger,
      placement: 'bottom-end',
      fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
      gap: 4,
      margin: 12,
      lockPlacementAfterOpen: true,
    });
  }

  private renderCardChecklistItemTitle(
    card: Card,
    item: CardCheckItem
  ): HTMLButtonElement {
    const title = document.createElement('button');
    title.type = 'button';
    title.className =
      item.state === 'complete'
        ? boardsModalClassNames.checkItemTitleComplete
        : boardsModalClassNames.checkItemTitle;
    title.textContent = item.title;
    title.addEventListener('click', () => {
      this.startCardChecklistItemTitleEdit(card, item, title);
    });
    return title;
  }

  private startCardChecklistItemTitleEdit(
    card: Card,
    item: CardCheckItem,
    titleButton: HTMLButtonElement
  ): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = boardsModalClassNames.checkItemTitleInput;
    input.value = item.title;
    input.setAttribute('aria-label', item.title);

    let settled = false;
    const restore = (): void => {
      if (titleButton.isConnected) return;
      input.replaceWith(titleButton);
    };
    const commit = (): void => {
      if (settled) return;
      settled = true;
      const nextTitle = input.value.trim();
      if (!nextTitle || nextTitle === item.title) {
        restore();
        return;
      }
      void this.patchCardModalCheckItem(card.id, item.id, {
        title: nextTitle,
      });
    };
    const cancel = (): void => {
      if (settled) return;
      settled = true;
      restore();
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    });
    input.addEventListener('blur', commit);

    titleButton.replaceWith(input);
    window.requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  private renderCheckItemComposer(
    card: Card,
    checklist: CardChecklist
  ): HTMLElement {
    if (!this.expandedCheckItemComposerIds.has(checklist.id)) {
      return createTextButton({
        text: this.runtime.i18n.t('boards.cardBack.checkItemPlaceholder'),
        tone: 'text',
        size: 'md',
        className: boardsModalClassNames.checkItemCollapsedComposer,
        onClick: () => this.expandCheckItemComposer(card, checklist.id),
      });
    }

    const form = document.createElement('form');
    form.className = boardsModalClassNames.checkItemComposer;
    const input = createInputBase({
      variant: 'default',
      className: boardsModalClassNames.checkItemComposerInput,
      placeholder: this.runtime.i18n.t('boards.cardBack.checkItemPlaceholder'),
    });
    input.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.checkItemPlaceholder')
    );
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        form.requestSubmit();
      }
      if (event.key === 'Escape') {
        this.collapseCheckItemComposer(card, checklist.id);
      }
    });
    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.checkItemComposerActions;
    const primaryActions = document.createElement('div');
    primaryActions.className =
      boardsModalClassNames.checkItemComposerPrimaryActions;
    const submit = createTextButton({
      text: this.runtime.i18n.t('boards.cardBack.addItem'),
      tone: 'primary',
      size: 'md',
      className: boardsViewClassNames.primaryButton,
    });
    submit.type = 'submit';
    const cancel = createTextButton({
      text: this.runtime.i18n.t('common.cancel'),
      tone: 'text',
      size: 'md',
      className: boardsViewClassNames.quietButton,
      onClick: () => this.collapseCheckItemComposer(card, checklist.id),
    });
    cancel.type = 'button';
    primaryActions.append(submit, cancel);

    const metaActions = document.createElement('div');
    metaActions.className = boardsModalClassNames.checkItemComposerMetaActions;
    metaActions.append(
      this.createCheckItemMetaButton('plus', 'boards.cardBack.assign'),
      this.createCheckItemMetaButton('calendar', 'boards.cardBack.dueDate')
    );
    actions.append(primaryActions, metaActions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.createCardModalCheckItem(card.id, checklist.id, input.value);
    });
    form.append(input, actions);
    window.requestAnimationFrame(() => input.focus());
    return form;
  }

  private createCheckItemMetaButton(
    icon: IconName,
    labelKey: string
  ): HTMLButtonElement {
    const button = createTextButton({
      text: this.runtime.i18n.t(labelKey),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.checkItemMetaButton,
      disabled: true,
    });
    prependButtonIcon(button, icon);
    return button;
  }

  private setCardChecklistPanelState(state: CardChecklistPanelState): void {
    this.cardChecklistPanelState = state;
    const location =
      this.activeCardPlacementId && this.state
        ? this.findCardLocation(this.activeCardPlacementId, this.state)
        : null;
    if (location?.card.id === state.cardId) {
      this.populateCardBackChecklistsHost(location.card);
    }
  }

  private async loadCardModalChecklists(cardId: Card['id']): Promise<void> {
    const version = ++this.cardChecklistLoadVersion;
    this.setCardChecklistPanelState({
      cardId,
      status: 'loading',
      checklists:
        this.cardChecklistPanelState?.cardId === cardId
          ? this.cardChecklistPanelState.checklists
          : [],
      error: null,
    });
    try {
      const checklists = await Promise.resolve(
        this.handlers.onLoadCardChecklists(cardId)
      );
      if (
        version !== this.cardChecklistLoadVersion ||
        this.activeCardPlacementId === null
      ) {
        return;
      }
      this.setCardChecklistPanelState({
        cardId,
        status: 'ready',
        checklists,
        error: null,
      });
    } catch {
      if (version !== this.cardChecklistLoadVersion) return;
      this.setCardChecklistPanelState({
        cardId,
        status: 'error',
        checklists: [],
        error: 'boards.cardBack.checklistsLoadFailed',
      });
    }
  }

  private focusCardChecklistComposer(): void {
    const input =
      this.cardChecklistPopover?.panel.querySelector<HTMLInputElement>('input');
    input?.focus();
  }

  private toggleChecklistCheckedItems(
    card: Card,
    checklistId: CardChecklist['id']
  ): void {
    if (this.hiddenCheckedChecklistIds.has(checklistId)) {
      this.hiddenCheckedChecklistIds.delete(checklistId);
    } else {
      this.hiddenCheckedChecklistIds.add(checklistId);
    }
    this.populateCardBackChecklistsHost(card);
  }

  private expandCheckItemComposer(
    card: Card,
    checklistId: CardChecklist['id']
  ): void {
    this.expandedCheckItemComposerIds.add(checklistId);
    this.populateCardBackChecklistsHost(card);
  }

  private collapseCheckItemComposer(
    card: Card,
    checklistId: CardChecklist['id']
  ): void {
    this.expandedCheckItemComposerIds.delete(checklistId);
    this.populateCardBackChecklistsHost(card);
  }

  private async createCardModalChecklist(
    card: Card,
    title?: string
  ): Promise<void> {
    const normalizedTitle = title?.trim() ?? '';
    if (!normalizedTitle) {
      this.focusCardChecklistComposer();
      return;
    }
    await this.runCardChecklistMutation(card.id, async () => {
      await Promise.resolve(
        this.handlers.onCreateCardChecklist(card.id, normalizedTitle)
      );
    });
    this.closeCardChecklistPopover();
  }

  private async deleteCardModalChecklist(
    cardId: Card['id'],
    checklistId: CardChecklist['id']
  ): Promise<void> {
    await this.runCardChecklistMutation(cardId, async () => {
      await Promise.resolve(this.handlers.onDeleteCardChecklist(checklistId));
    });
  }

  private async createCardModalCheckItem(
    cardId: Card['id'],
    checklistId: CardChecklist['id'],
    title: string
  ): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    await this.runCardChecklistMutation(cardId, async () => {
      await Promise.resolve(
        this.handlers.onCreateCardCheckItem(checklistId, normalizedTitle)
      );
    });
    this.expandedCheckItemComposerIds.delete(checklistId);
  }

  private async patchCardModalCheckItem(
    cardId: Card['id'],
    itemId: CardCheckItem['id'],
    patch: { title?: string; state?: CardCheckItem['state'] }
  ): Promise<void> {
    await this.runCardChecklistMutation(cardId, async () => {
      await Promise.resolve(this.handlers.onPatchCardCheckItem(itemId, patch));
    });
  }

  private async deleteCardModalCheckItem(
    cardId: Card['id'],
    itemId: CardCheckItem['id']
  ): Promise<void> {
    await this.runCardChecklistMutation(cardId, async () => {
      await Promise.resolve(this.handlers.onDeleteCardCheckItem(itemId));
    });
  }

  private async runCardChecklistMutation(
    cardId: Card['id'],
    action: () => Promise<void>
  ): Promise<void> {
    const current = this.cardChecklistPanelState;
    this.setCardChecklistPanelState({
      cardId,
      status: 'saving',
      checklists: current?.cardId === cardId ? current.checklists : [],
      error: null,
    });
    try {
      await action();
      await this.loadCardModalChecklists(cardId);
    } catch {
      this.setCardChecklistPanelState({
        cardId,
        status: 'error',
        checklists: current?.cardId === cardId ? current.checklists : [],
        error: 'boards.cardBack.checklistsSaveFailed',
      });
    }
  }

  private renderCardBackDescriptionSection(
    card: Card,
    titleInput: HTMLTextAreaElement,
    description: HTMLTextAreaElement
  ): HTMLElement {
    const section = this.createCardBackSection(
      'document',
      this.runtime.i18n.t('boards.cardDescriptionLabel')
    );
    const main = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionMain}`
    );
    if (!main) return section;

    main.append(description);

    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.editorActions;
    const saveButton = createTextButton({
      text: this.runtime.i18n.t('common.save'),
      tone: 'primary',
      size: 'md',
      className: boardsViewClassNames.primaryButton,
      onClick: () => this.saveCardModal(card, titleInput, description),
    });
    const validate = (): void => {
      saveButton.disabled = titleInput.value.trim().length === 0;
    };
    titleInput.addEventListener('input', validate);
    validate();
    actions.append(
      createTextButton({
        text: this.runtime.i18n.t('common.cancel'),
        tone: 'text',
        size: 'md',
        className: boardsViewClassNames.quietButton,
        onClick: () => this.closeCardModal(),
      }),
      saveButton
    );
    main.append(actions);
    return section;
  }

  private async deleteSharedCardFromQuickEditor(card: Card): Promise<void> {
    await this.deleteSharedCard(card, () => this.closeQuickCardEditor());
  }

  private async deleteSharedCardFromDetails(card: Card): Promise<void> {
    await this.deleteSharedCard(card, () => {
      this.closeCardActionsPopover();
      this.closeCardModal();
    });
  }

  private async deleteSharedCard(
    card: Card,
    onConfirmed: () => void
  ): Promise<void> {
    if (!(await this.confirmSharedCardDeletion())) return;
    onConfirmed();
    this.handlers.onDeleteCard(card.id);
  }

  private confirmSharedCardDeletion(): Promise<boolean> {
    return this.openDeleteCardConfirmationDialog();
  }

  private openDeleteCardConfirmationDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (confirmed: boolean): void => {
        if (settled) return;
        settled = true;
        resolve(confirmed);
      };
      const close = (): void => overlay.remove();

      const { overlay, container, body, footer } = createModalShell(
        this.runtime.i18n.t('boards.actions.deleteCard'),
        {
          intent: 'confirm',
          zIndex: 360,
          onClose: () => {
            settle(false);
            close();
          },
        }
      );

      const message = document.createElement('p');
      message.className = 'text-sm leading-relaxed text-slate-600';
      message.id = `delete-card-confirm-message-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      message.textContent = this.runtime.i18n.t(
        'boards.cardMirror.deleteSharedConfirm'
      );
      container.setAttribute('aria-describedby', message.id);
      body.append(message);

      const row = createModalActionRow({ variant: 'confirm' });
      const cancelButton = createTextButton({
        text: this.runtime.i18n.t('common.cancel'),
        tone: 'text',
        size: 'md',
        className: getModalActionButtonClass('default'),
        onClick: () => {
          settle(false);
          close();
        },
      });
      cancelButton.setAttribute('data-testid', 'delete-card-cancel-button');
      row.append(cancelButton);

      const deleteButton = createTextButton({
        text: this.runtime.i18n.t('boards.actions.deleteCard'),
        tone: 'destructive',
        size: 'md',
        className: getModalActionButtonClass('wide'),
        onClick: () => {
          settle(true);
          close();
        },
      });
      deleteButton.setAttribute('data-testid', 'delete-card-confirm-button');
      row.append(deleteButton);

      footer.append(row);
      container.addEventListener('keydown', (event: KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          settle(false);
          close();
        }
      });
    });
  }

  private renderCardBackAttachmentsSection(): HTMLElement {
    const section = this.createCardBackSection(
      'link',
      this.runtime.i18n.t('boards.cardBack.attachments'),
      createTextButton({
        text: this.runtime.i18n.t('boards.cardBack.add'),
        tone: 'text',
        size: 'sm',
        className: boardsViewClassNames.quietButton,
        disabled: true,
      })
    );
    const main = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionMain}`
    );
    if (!main) return section;
    const panel = document.createElement('div');
    panel.className = boardsModalClassNames.placeholderPanel;
    panel.textContent = this.runtime.i18n.t('boards.cardBack.noAttachments');
    main.append(panel);
    return section;
  }

  private renderCardBackAside(board: Board, column: BoardColumn): HTMLElement {
    const aside = document.createElement('aside');
    aside.className = boardsModalClassNames.aside;
    aside.setAttribute(
      'aria-label',
      this.runtime.i18n.t('boards.cardBack.comments')
    );

    const section = this.createCardBackSection(
      'chat-bubble-left',
      this.runtime.i18n.t('boards.cardBack.comments'),
      createTextButton({
        text: this.runtime.i18n.t('boards.cardBack.showDetails'),
        tone: 'text',
        size: 'sm',
        className: boardsViewClassNames.quietButton,
        disabled: true,
      })
    );
    const main = section.querySelector<HTMLElement>(
      `.${boardsModalClassNames.sectionMain}`
    );
    if (!main) return aside;

    main.append(
      createTextButton({
        text: this.runtime.i18n.t('boards.cardBack.writeComment'),
        tone: 'text',
        size: 'md',
        className: boardsModalClassNames.activityInput,
        disabled: true,
      })
    );

    const activityList = document.createElement('ul');
    activityList.className = boardsModalClassNames.activityList;
    const item = document.createElement('li');
    item.className = boardsModalClassNames.activityItem;
    const avatar = document.createElement('span');
    avatar.className = boardsModalClassNames.avatar;
    avatar.textContent = 'M';
    avatar.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('span');
    copy.textContent = this.runtime.i18n.t('boards.cardBack.activityCreated', {
      board: board.title,
      column: column.title,
    });
    item.append(avatar, copy);
    activityList.append(item);
    main.append(activityList);
    aside.append(section);
    return aside;
  }

  private createCardBackSection(
    icon: IconName,
    titleText: string,
    action?: HTMLElement
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = boardsModalClassNames.section;

    const iconWrap = document.createElement('div');
    iconWrap.className = boardsModalClassNames.sectionIcon;
    const iconElement = createIcon(icon, { size: 20, strokeWidth: 2 });
    iconElement.setAttribute('aria-hidden', 'true');
    iconWrap.append(iconElement);

    const main = document.createElement('div');
    main.className = boardsModalClassNames.sectionMain;
    const header = document.createElement('div');
    header.className = boardsModalClassNames.sectionHeader;
    const title = document.createElement('h3');
    title.className = boardsModalClassNames.sectionTitle;
    title.textContent = titleText;
    const actions = document.createElement('div');
    actions.className = boardsModalClassNames.sectionActions;
    if (action) actions.append(action);
    header.append(title, actions);
    main.append(header);
    section.append(iconWrap, main);
    return section;
  }

  private createUnavailableCardBackButton(
    labelKey: string,
    icon: IconName
  ): HTMLButtonElement {
    const button = createTextButton({
      text: this.runtime.i18n.t(labelKey),
      tone: 'text',
      size: 'md',
      className: boardsModalClassNames.quickActionButton,
      disabled: true,
    });
    prependButtonIcon(button, icon);
    return button;
  }

  private saveCardModal(
    card: Card,
    titleInput: HTMLTextAreaElement,
    descriptionInput: HTMLTextAreaElement
  ): void {
    const nextTitle = titleInput.value.trim();
    if (!nextTitle) return;
    const session = this.cardDetailsSession.updateDraft({
      title: titleInput.value,
      description: descriptionInput.value,
    });
    if (!session) return;
    if (!session.identity.isResolved) {
      this.cardDetailsSession.queueSubmit({ closeAfterSubmit: true });
      return;
    }

    const patch = createCardDetailsPatch(session);
    if (hasCardDetailsPatch(patch)) {
      this.handlers.onPatchCard(session.identity.cardId, patch);
      this.cardDetailsSession.markSubmitted();
    }
    this.closeCardModal();
  }

  private closeCardModal(): void {
    this.closeCardActionsPopover();
    this.closeCardLabelsPopover();
    this.closeCardChecklistPopover();
    this.closeCardCheckItemMenuPopover();
    this.closeMoveCardPopover();
    this.cardDetailsSession.close();
    this.cardModalLabelsHost = null;
    this.cardModalQuickActionList = null;
    this.cardModalChecklistHost = null;
    this.cardChecklistPanelState = null;
    this.cardChecklistLoadVersion += 1;
    this.activeCardPlacementId = null;
    this.cardModalOverlay?.remove();
    this.cardModalOverlay = null;
  }

  private closeCardLabelsPopover(): void {
    const popover = this.cardLabelsPopover;
    if (!popover) return;
    this.cardLabelsPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.picker.destroy();
    popover.panel.remove();
  }

  private closeCardChecklistPopover(): void {
    const popover = this.cardChecklistPopover;
    if (!popover) return;
    this.cardChecklistPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeCardCheckItemMenuPopover(): void {
    const popover = this.cardCheckItemMenuPopover;
    if (!popover) return;
    this.cardCheckItemMenuPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeCardEntityLinkMenuPopover(): void {
    const popover = this.cardEntityLinkMenuPopover;
    if (!popover) return;
    this.cardEntityLinkMenuPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeMoveCardPopover(): void {
    const popover = this.moveCardPopover;
    if (!popover) return;
    this.moveCardPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeCardActionsPopover(): void {
    const popover = this.cardActionsPopover;
    if (!popover) return;
    this.cardActionsPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeListActionsPopover(): void {
    const popover = this.listActionsPopover;
    if (!popover) return;
    this.listActionsPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeBoardPickerPopover(): void {
    const popover = this.boardPickerPopover;
    if (!popover) return;
    this.closeBoardPickerActionsMenu();
    this.boardPickerPopover = null;
    popover.trigger.setAttribute('aria-expanded', 'false');
    popover.menu.close();
    popover.menu.unmount();
    popover.panel.remove();
  }

  private closeBoardPickerActionsMenu(): void {
    const actionsMenu = this.boardPickerPopover?.actionsMenu;
    if (!actionsMenu) return;
    this.boardPickerPopover.actionsMenu = null;
    actionsMenu.menu.close();
    actionsMenu.menu.unmount();
    actionsMenu.panel.remove();
  }

  private closeQuickCardEditor(): void {
    this.quickEditorOverlay?.remove();
    this.quickEditorOverlay = null;
  }

  private getSelectedBoard(state: BoardsState): Board | null {
    return (
      state.boards.find((board) => board.id === state.selectedBoardId) ??
      state.boards[0] ??
      null
    );
  }

  private findCardLocation(
    placementId: CardPlacement['id'],
    state: BoardsState
  ): CardLocation | null {
    for (const board of state.boards) {
      for (const column of board.columns) {
        const card = column.cards.find(
          (candidate) => getCardPlacementId(candidate) === placementId
        );
        if (card) return { board, column, card, placementId };
      }
    }
    return null;
  }

  private submitColumnTitle(boardId: Board['id']): void {
    const title = this.columnTitleTextarea?.value.trim() ?? '';
    if (!title) return;
    this.handlers.onCreateColumn(boardId, title);
    if (this.columnTitleTextarea) this.columnTitleTextarea.value = '';
    this.isColumnComposerExpanded = false;
  }

  private startBoardTitleEdit(boardId: Board['id']): void {
    this.editingBoardTitleId = boardId;
    this.rerenderCurrentState();
  }

  private finishBoardTitleEdit(board: Board, apply: boolean): void {
    if (this.editingBoardTitleId !== board.id) return;
    const nextTitle = this.boardTitleEditInput?.value.trim() ?? '';
    this.editingBoardTitleId = null;
    this.boardTitleEditInput = null;
    if (apply && nextTitle.length > 0 && nextTitle !== board.title) {
      this.handlers.onPatchBoard(board.id, { title: nextTitle });
      return;
    }
    this.rerenderCurrentState();
  }

  private startColumnTitleEdit(columnId: BoardColumn['id']): void {
    this.editingColumnTitleId = columnId;
    this.rerenderCurrentState();
  }

  private finishColumnTitleEdit(column: BoardColumn, apply: boolean): void {
    if (this.editingColumnTitleId !== column.id) return;
    const nextTitle = this.columnTitleEditInput?.value.trim() ?? '';
    this.editingColumnTitleId = null;
    this.columnTitleEditInput = null;
    if (apply && nextTitle.length > 0 && nextTitle !== column.title) {
      this.handlers.onPatchColumn(column.id, { title: nextTitle });
      return;
    }
    this.rerenderCurrentState();
  }

  private expandCardComposer(columnId: BoardColumn['id']): void {
    this.expandedCardComposerColumnId = columnId;
    this.rerenderCurrentState();
  }

  private collapseCardComposer(): void {
    this.expandedCardComposerColumnId = null;
    this.rerenderCurrentState();
  }

  private expandColumnComposer(): void {
    this.isColumnComposerExpanded = true;
    this.rerenderCurrentState();
  }

  private collapseColumnComposer(): void {
    this.isColumnComposerExpanded = false;
    this.rerenderCurrentState();
  }

  private submitCard(columnId: BoardColumn['id']): void {
    const draft = this.cardDrafts.get(columnId);
    if (!draft) return;
    const title = draft.title.value.trim();
    if (!title) return;
    this.handlers.onCreateCard(columnId, title, '');
    draft.title.value = '';
    this.expandedCardComposerColumnId = null;
    this.rerenderCurrentState();
  }

  private rerenderCurrentState(): void {
    if (!this.state) return;
    this.render(this.state);
  }

  private unmountHeaderMenu(): void {
    this.headerMenu?.unmount();
    this.headerMenu = null;
  }
}
