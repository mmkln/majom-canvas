import { createPaneModalShell } from '../../../ui-lib/src/components/PaneModal.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createSurface,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { notify } from '../../../ui-lib/src/services/NotificationService.ts';
import type { AppTranslationKey, I18nService } from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { createIcon } from '../../canvas/ui/icons.ts';
import type {
  Note,
  NoteSummary,
} from '../../../majom-wrapper/interfaces/index.ts';
import { ShellNotesService } from '../services/ShellNotesService.ts';
import { confirmDeleteNoteModal } from './ConfirmDeleteNoteModal.ts';

const NOTES_PAGE_SIZE = 100;
const SAVE_DEBOUNCE_MS = 450;

export type NotesQuickStatusSnapshot = {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  pinnedCount: number;
  pinnedActiveCount: number;
};

type NotesQuickModalOptions = {
  onOpenChange?: (open: boolean) => void;
  onStatusChange?: (snapshot: NotesQuickStatusSnapshot) => void;
};

export type NotesQuickModalService = Pick<
  ShellNotesService,
  | 'loadNotes'
  | 'loadSummary'
  | 'createNote'
  | 'patchNote'
  | 'archiveNote'
  | 'unarchiveNote'
  | 'pinNote'
  | 'unpinNote'
  | 'deleteNote'
>;

function buildEmptySummary(): NoteSummary {
  return {
    total: 0,
    active: 0,
    archived: 0,
    pinned: 0,
    pinned_active: 0,
  };
}

function toStatusSnapshot(summary: NoteSummary): NotesQuickStatusSnapshot {
  return {
    totalCount: summary.total,
    activeCount: summary.active,
    archivedCount: summary.archived,
    pinnedCount: summary.pinned,
    pinnedActiveCount: summary.pinned_active,
  };
}

function extractSnippet(note: Note): string {
  const body = note.body.trim();
  if (body) {
    return body.length > 120 ? `${body.slice(0, 117)}...` : body;
  }
  return '';
}

function normalizeNoteDate(value: string): number {
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((left, right) => {
    if (left.is_pinned !== right.is_pinned) {
      return left.is_pinned ? -1 : 1;
    }
    return (
      normalizeNoteDate(right.updated_at) - normalizeNoteDate(left.updated_at)
    );
  });
}

export class NotesQuickModal {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly service: NotesQuickModalService;
  private readonly onOpenChange?: (open: boolean) => void;
  private readonly onStatusChange?: (
    snapshot: NotesQuickStatusSnapshot
  ) => void;
  private readonly disposeRuntimeSubscription: () => void;

  private overlay: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private headerTitleElement: HTMLHeadingElement | null = null;
  private headerCreateButton: HTMLButtonElement | null = null;

  private titleInput: HTMLInputElement | null = null;
  private bodyInput: HTMLTextAreaElement | null = null;

  private activeNotes: Note[] = [];
  private archivedNotes: Note[] = [];
  private summary: NoteSummary = buildEmptySummary();
  private selectedNoteId: string | null = null;
  private draftTitle = '';
  private draftBody = '';
  private loading = false;
  private creating = false;
  private pendingNoteIds = new Set<string>();
  private errorKey: AppTranslationKey | null = null;
  private refreshVersion = 0;
  private saveTimerId: number | null = null;
  private focusTitleOnRender = false;
  private transientMenus: Array<{
    menu: AnchoredMenu;
    cleanup?: () => void;
  }> = [];

  constructor(
    service: NotesQuickModalService = new ShellNotesService(),
    runtime: AppRuntime = createAppRuntime(),
    options: NotesQuickModalOptions = {}
  ) {
    this.service = service;
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.onOpenChange = options.onOpenChange;
    this.onStatusChange = options.onStatusChange;
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    });
  }

  public isOpen(): boolean {
    return this.overlay !== null;
  }

  public prime(): void {
    void this.refreshSummary();
  }

  public open(): void {
    if (this.overlay) return;
    const { overlay, container, body, titleWrap, titleElement, actions } =
      createPaneModalShell(this.i18n.t('notes.modal.title'), {
        onClose: () => this.close(),
        intent: 'form',
        zIndex: 260,
      });

    container.style.width = 'min(76rem, calc(100vw - 2rem))';
    container.style.maxWidth = '76rem';
    container.style.height = 'min(46rem, calc(100dvh - 2rem))';
    container.style.maxHeight = 'min(46rem, calc(100dvh - 2rem))';
    container.style.transition = 'width 180ms ease, max-width 180ms ease';

    this.decorateHeaderTitle(titleWrap, titleElement);

    const createButton = this.createHeaderCreateButton();
    const closeButton = actions.querySelector<HTMLButtonElement>(
      'button[aria-label="Close dialog"]'
    );
    if (closeButton) {
      actions.insertBefore(createButton, closeButton);
    } else {
      actions.appendChild(createButton);
    }

    this.overlay = overlay;
    this.body = body;
    this.headerTitleElement = titleElement;
    this.headerCreateButton = createButton;

    this.renderBody();
    this.onOpenChange?.(true);
    void this.refresh();
  }

  public close(): void {
    this.clearSaveTimer();
    void this.saveSelectedNoteNow();
    this.destroyTransientMenus();
    this.overlay?.remove();
    this.overlay = null;
    this.body = null;
    this.headerTitleElement = null;
    this.headerCreateButton = null;
    this.titleInput = null;
    this.bodyInput = null;
    this.loading = false;
    this.creating = false;
    this.pendingNoteIds.clear();
    this.errorKey = null;
    this.focusTitleOnRender = false;
    this.draftTitle = '';
    this.draftBody = '';
    this.selectedNoteId = null;
    this.onOpenChange?.(false);
  }

  public destroy(): void {
    this.close();
    this.disposeRuntimeSubscription();
  }

  private get selectedNote(): Note | null {
    if (!this.selectedNoteId) return null;
    return (
      this.activeNotes.find((note) => note.id === this.selectedNoteId) ??
      this.archivedNotes.find((note) => note.id === this.selectedNoteId) ??
      null
    );
  }

  private get hasAnyNotes(): boolean {
    return this.activeNotes.length > 0 || this.archivedNotes.length > 0;
  }

  private get firstAvailableNote(): Note | null {
    return this.activeNotes[0] ?? this.archivedNotes[0] ?? null;
  }

  private refreshTranslations(): void {
    if (!this.overlay) return;
    if (this.headerTitleElement) {
      this.headerTitleElement.textContent = this.i18n.t('notes.modal.title');
      this.headerTitleElement.title = this.i18n.t('notes.modal.title');
    }
    if (this.headerCreateButton) {
      const label = this.i18n.t('notes.newNote');
      this.headerCreateButton.textContent = label;
      this.headerCreateButton.title = label;
      this.headerCreateButton.setAttribute('aria-label', label);
    }
    this.renderBody();
  }

  private decorateHeaderTitle(
    titleWrap: HTMLDivElement,
    titleElement: HTMLHeadingElement
  ): void {
    titleElement.className =
      'min-w-0 truncate text-base font-semibold leading-6 tracking-tight text-slate-900';
    titleElement.title = titleElement.textContent ?? '';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex min-w-0 items-center gap-3';

    const iconWrap = document.createElement('div');
    iconWrap.className =
      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600';
    iconWrap.appendChild(
      createIcon('bookmark-square', {
        size: 18,
        strokeWidth: 1.8,
      })
    );

    titleElement.remove();
    titleRow.append(iconWrap, titleElement);
    titleWrap.prepend(titleRow);
  }

  private createHeaderCreateButton(): HTMLButtonElement {
    const label = this.i18n.t('notes.newNote');
    const button = createTextButton({
      text: label,
      tone: 'text',
      size: 'sm',
      className:
        '!h-9 !px-2.5 whitespace-nowrap !text-slate-600 hover:!bg-slate-100 hover:!text-slate-800',
      title: label,
      ariaLabel: label,
      onClick: () => {
        void this.createNote();
      },
    });
    button.disabled = this.creating;
    return button;
  }

  private destroyTransientMenus(): void {
    this.transientMenus.forEach(({ menu, cleanup }) => {
      menu.unmount();
      cleanup?.();
    });
    this.transientMenus = [];
  }

  private renderBody(): void {
    if (!this.body) return;
    this.destroyTransientMenus();
    this.body.replaceChildren();
    this.titleInput = null;
    this.bodyInput = null;
    if (this.headerCreateButton) {
      this.headerCreateButton.disabled = this.creating;
    }

    const shell = document.createElement('div');
    shell.className =
      'grid h-full min-h-0 grid-cols-1 bg-white md:grid-cols-[20.5rem_1px_minmax(0,1fr)]';

    const divider = document.createElement('div');
    divider.className = 'hidden bg-slate-200 md:block';
    divider.setAttribute('aria-hidden', 'true');

    shell.append(this.renderSidebar(), divider, this.renderEditor());
    this.body.appendChild(shell);

    if (this.focusTitleOnRender && this.titleInput) {
      this.focusTitleOnRender = false;
      queueMicrotask(() => {
        this.titleInput?.focus();
        this.titleInput?.select();
      });
    }
  }

  private renderSidebar(): HTMLElement {
    const sidebar = document.createElement('section');
    sidebar.className = 'flex min-h-0 flex-col overflow-hidden bg-white';

    const content = document.createElement('div');
    content.className = 'min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-4 md:px-3';

    if (this.loading && !this.hasAnyNotes) {
      const loading = document.createElement('p');
      loading.className = 'px-3 py-8 text-sm text-slate-500';
      loading.textContent = this.i18n.t('notes.loading');
      content.appendChild(loading);
      sidebar.appendChild(content);
      return sidebar;
    }

    if (this.errorKey && !this.hasAnyNotes) {
      const error = document.createElement('p');
      error.className = 'px-3 py-8 text-sm text-rose-600';
      error.textContent = this.i18n.t(this.errorKey);
      content.appendChild(error);
      sidebar.appendChild(content);
      return sidebar;
    }

    if (!this.hasAnyNotes) {
      const empty = document.createElement('div');
      empty.className = 'px-3 py-10 text-sm leading-6 text-slate-500';
      empty.textContent = this.i18n.t('notes.empty');
      content.appendChild(empty);
      sidebar.appendChild(content);
      return sidebar;
    }

    content.appendChild(
      this.renderSidebarSection(
        null,
        this.activeNotes,
        this.archivedNotes.length > 0 ? this.i18n.t('notes.empty') : null
      )
    );

    if (this.archivedNotes.length > 0) {
      content.appendChild(
        this.renderSidebarSection(
          this.i18n.t('notes.tab.archived', { count: this.summary.archived }),
          this.archivedNotes
        )
      );
    }

    sidebar.appendChild(content);
    return sidebar;
  }

  private renderSidebarSection(
    title: string | null,
    notes: Note[],
    emptyText: string | null = null
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = 'mb-5';

    if (title) {
      const heading = document.createElement('p');
      heading.className =
        'px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400';
      heading.textContent = title;
      section.appendChild(heading);
    }

    if (notes.length === 0) {
      if (emptyText) {
        const empty = document.createElement('p');
        empty.className = 'px-3 text-sm leading-6 text-slate-400';
        empty.textContent = emptyText;
        section.appendChild(empty);
      }
      return section;
    }

    notes.forEach((note) => {
      section.appendChild(this.renderNoteListItem(note));
    });
    return section;
  }

  private renderNoteListItem(note: Note): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'group relative mb-1.5';

    const button = document.createElement('button');
    button.type = 'button';
    const selected = note.id === this.selectedNoteId;
    button.className = selected
      ? 'flex w-full flex-col gap-2 rounded-2xl bg-slate-100 px-3 py-3 pr-11 text-left text-slate-900'
      : 'flex w-full flex-col gap-2 rounded-2xl px-3 py-3 pr-11 text-left text-slate-700 transition hover:bg-slate-50';
    button.addEventListener('click', () => {
      void this.selectNote(note.id);
    });

    const top = document.createElement('div');
    top.className = 'flex items-start gap-2';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'min-w-0 flex-1';

    const title = document.createElement('p');
    title.className = 'truncate text-sm font-semibold';
    title.textContent = note.title.trim() || this.i18n.t('notes.untitled');
    titleWrap.appendChild(title);
    top.appendChild(titleWrap);

    button.appendChild(top);

    const snippet = extractSnippet(note);
    if (snippet) {
      const body = document.createElement('p');
      body.className = 'line-clamp-2 text-sm leading-5 text-slate-500';
      body.textContent = snippet;
      button.appendChild(body);
    }

    const pinButton = document.createElement('button');
    pinButton.type = 'button';
    pinButton.className = note.is_pinned
      ? 'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-800'
      : 'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 opacity-0 pointer-events-none transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto';
    pinButton.title = note.is_pinned
      ? this.i18n.t('notes.unpin')
      : this.i18n.t('notes.pin');
    pinButton.setAttribute(
      'aria-label',
      note.is_pinned ? this.i18n.t('notes.unpin') : this.i18n.t('notes.pin')
    );
    pinButton.disabled = this.pendingNoteIds.has(note.id);
    pinButton.appendChild(
      createIcon(note.is_pinned ? 'bookmark-solid' : 'bookmark', {
        size: 14,
        strokeWidth: 1.8,
      })
    );
    pinButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.togglePin(note);
    });

    const contextPanel = createSurface({
      elevated: true,
      className:
        'hidden min-w-[12rem] overflow-hidden !rounded-2xl',
    });
    contextPanel.setAttribute('role', 'menu');
    wrap.appendChild(contextPanel);

    const trackedContextMenu: {
      menu: AnchoredMenu;
      cleanup?: () => void;
    } = {
      menu: null as unknown as AnchoredMenu,
    };

    const contextMenuController = new AnchoredMenu({
      container: wrap,
      panel: contextPanel,
      positioning: 'viewport',
      onOpenChange: (open) => {
        if (!open && trackedContextMenu.cleanup) {
          trackedContextMenu.cleanup();
          trackedContextMenu.cleanup = undefined;
        }
      },
    });
    trackedContextMenu.menu = contextMenuController;
    contextMenuController.mount();
    this.transientMenus.push(trackedContextMenu);

    const archiveItem = createDropdownItem({
      label:
        note.status === 'archived'
          ? this.i18n.t('common.restore')
          : this.i18n.t('common.archive'),
      leading: createIcon(
        note.status === 'archived' ? 'arrow-path' : 'archive-box',
        {
          size: 14,
          strokeWidth: 1.9,
        }
      ),
      onClick: () => {
        contextMenuController.close();
        void this.toggleArchive(note);
      },
    });
    archiveItem.setAttribute('role', 'menuitem');

    const deleteItem = createDropdownItem({
      label: this.i18n.t('common.delete'),
      variant: 'danger',
      leading: createIcon('trash', { size: 14, strokeWidth: 1.9 }),
      onClick: () => {
        contextMenuController.close();
        void this.deleteSelectedNote(note);
      },
    });
    deleteItem.setAttribute('role', 'menuitem');

    contextPanel.append(archiveItem, deleteItem);

    wrap.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (contextMenuController.isOpen()) {
        contextMenuController.close();
      }
      const anchor = document.createElement('span');
      anchor.setAttribute('aria-hidden', 'true');
      anchor.style.position = 'fixed';
      anchor.style.left = `${event.clientX}px`;
      anchor.style.top = `${event.clientY}px`;
      anchor.style.width = '1px';
      anchor.style.height = '1px';
      anchor.style.pointerEvents = 'none';
      anchor.style.opacity = '0';
      document.body.appendChild(anchor);

      trackedContextMenu.cleanup?.();
      trackedContextMenu.cleanup = (): void => {
        anchor.remove();
      };

      contextMenuController.openAt({
        anchor,
        placement: 'bottom-start',
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        gap: 6,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    wrap.append(button, pinButton);
    return wrap;
  }

  private renderEditor(): HTMLElement {
    const editor = document.createElement('section');
    editor.className = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white';

    const note = this.selectedNote;
    if (!note) {
      const empty = document.createElement('div');
      empty.className =
        'flex min-h-[20rem] flex-1 flex-col items-center justify-center gap-4 px-6 text-center';

      const iconWrap = document.createElement('div');
      iconWrap.className =
        'inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-100 text-slate-500';
      iconWrap.appendChild(createIcon('document', { size: 20, strokeWidth: 1.8 }));
      empty.appendChild(iconWrap);

      const title = document.createElement('p');
      title.className = 'text-sm font-semibold text-slate-900';
      title.textContent = this.i18n.t('notes.noSelectionTitle');
      empty.appendChild(title);

      const body = document.createElement('p');
      body.className = 'max-w-md text-sm leading-6 text-slate-500';
      body.textContent = this.i18n.t('notes.noSelectionBody');
      empty.appendChild(body);

      editor.appendChild(empty);
      return editor;
    }

    const header = document.createElement('div');
    header.className = 'px-5 pb-4 pt-5 md:px-6';

    const headerTop = document.createElement('div');
    headerTop.className = 'flex flex-wrap items-start justify-between gap-3';

    const meta = document.createElement('div');
    meta.className = 'min-w-0 flex-1';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = this.draftTitle;
    titleInput.placeholder = this.i18n.t('notes.titlePlaceholder');
    titleInput.className =
      'w-full border-none bg-transparent px-0 text-[1.35rem] font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300';
    titleInput.addEventListener('input', () => {
      this.draftTitle = titleInput.value;
      this.scheduleSave();
    });
    meta.appendChild(titleInput);
    this.titleInput = titleInput;

    headerTop.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';

    const pinButton = createIconButton({
      icon: note.is_pinned ? 'bookmark-solid' : 'bookmark',
      tone: 'text',
      size: 'sm',
      title: note.is_pinned
        ? this.i18n.t('notes.unpin')
        : this.i18n.t('notes.pin'),
      ariaLabel: note.is_pinned
        ? this.i18n.t('notes.unpin')
        : this.i18n.t('notes.pin'),
      disabled: this.pendingNoteIds.has(note.id),
      onClick: () => {
        void this.togglePin(note);
      },
    });
    actions.appendChild(pinButton);
    actions.appendChild(this.createActionsMenu(note));

    headerTop.appendChild(actions);
    header.appendChild(headerTop);
    editor.appendChild(header);

    const bodyWrap = document.createElement('div');
    bodyWrap.className =
      'flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 md:px-6 md:pb-6';

    const bodyInput = document.createElement('textarea');
    bodyInput.value = this.draftBody;
    bodyInput.placeholder = this.i18n.t('notes.bodyPlaceholder');
    bodyInput.className =
      'min-h-[20rem] flex-1 resize-none rounded-[1.5rem] bg-slate-50/80 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-350 focus:bg-slate-50';
    bodyInput.style.border = 'none';
    bodyInput.addEventListener('input', () => {
      this.draftBody = bodyInput.value;
      this.scheduleSave();
    });
    bodyWrap.appendChild(bodyInput);
    this.bodyInput = bodyInput;

    const metaRow = document.createElement('div');
    metaRow.className =
      'flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400';

    const updated = document.createElement('span');
    updated.textContent = this.i18n.t('notes.updatedAt', {
      date: this.i18n.formatDate(note.updated_at, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    metaRow.appendChild(updated);
    bodyWrap.appendChild(metaRow);

    editor.appendChild(bodyWrap);
    return editor;
  }

  private createActionsMenu(note: Note): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'relative inline-flex';

    const menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      title: this.i18n.t('common.actions'),
      ariaLabel: this.i18n.t('common.actions'),
      disabled: this.pendingNoteIds.has(note.id),
    });
    menuButton.classList.add('text-slate-600');
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', 'false');

    const menuPanel = createSurface({
      elevated: true,
      className:
        'absolute left-0 top-0 z-50 hidden min-w-[12rem] overflow-hidden !rounded-2xl',
    });
    menuPanel.setAttribute('role', 'menu');

    const menuController = new AnchoredMenu({
      container: wrap,
      panel: menuPanel,
      onOpenChange: (open) => {
        menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuButton.classList.toggle('bg-slate-100', open);
        menuButton.classList.toggle('text-slate-900', open);
      },
    });
    menuController.mount();
    this.transientMenus.push({ menu: menuController });

    const archiveItem = createDropdownItem({
      label:
        note.status === 'archived'
          ? this.i18n.t('common.restore')
          : this.i18n.t('common.archive'),
      leading: createIcon(
        note.status === 'archived' ? 'arrow-path' : 'archive-box',
        {
          size: 14,
          strokeWidth: 1.9,
        }
      ),
      onClick: () => {
        menuController.close();
        void this.toggleArchive(note);
      },
    });
    archiveItem.setAttribute('role', 'menuitem');

    const deleteItem = createDropdownItem({
      label: this.i18n.t('common.delete'),
      variant: 'danger',
      leading: createIcon('trash', { size: 14, strokeWidth: 1.9 }),
      onClick: () => {
        menuController.close();
        void this.deleteSelectedNote(note);
      },
    });
    deleteItem.setAttribute('role', 'menuitem');

    menuPanel.append(archiveItem, deleteItem);
    menuButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (menuButton.disabled) return;
      if (menuController.isOpen()) {
        menuController.close();
        return;
      }
      menuController.openAt({
        anchor: menuButton,
        placement: 'bottom-end',
        fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
        gap: 6,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    wrap.append(menuButton, menuPanel);
    return wrap;
  }

  private clearSaveTimer(): void {
    if (this.saveTimerId !== null) {
      window.clearTimeout(this.saveTimerId);
      this.saveTimerId = null;
    }
  }

  private scheduleSave(): void {
    this.clearSaveTimer();
    this.saveTimerId = window.setTimeout(() => {
      this.saveTimerId = null;
      void this.saveSelectedNoteNow();
    }, SAVE_DEBOUNCE_MS);
  }

  private async refresh(): Promise<void> {
    const currentVersion = ++this.refreshVersion;
    this.loading = true;
    this.errorKey = null;
    if (this.overlay) {
      this.renderBody();
    }

    try {
      const [activePage, archivedPage, summary] = await Promise.all([
        this.service.loadNotes({
          status: 'active',
          pageSize: NOTES_PAGE_SIZE,
        }),
        this.service.loadNotes({
          status: 'archived',
          pageSize: NOTES_PAGE_SIZE,
        }),
        this.service.loadSummary(),
      ]);

      if (currentVersion !== this.refreshVersion) return;

      this.activeNotes = sortNotes(activePage.results);
      this.archivedNotes = sortNotes(archivedPage.results);
      this.summary = summary;
      this.syncSelectionWithLists();
      this.emitStatusSnapshot();
    } catch (error) {
      console.error('Failed to load notes.', error);
      if (currentVersion !== this.refreshVersion) return;
      this.errorKey = 'notes.error.load';
    } finally {
      if (currentVersion !== this.refreshVersion) return;
      this.loading = false;
      if (this.overlay) {
        this.renderBody();
      }
    }
  }

  private async refreshSummary(): Promise<void> {
    try {
      this.summary = await this.service.loadSummary();
      this.emitStatusSnapshot();
      if (this.overlay) {
        this.renderBody();
      }
    } catch (error) {
      console.error('Failed to load note summary.', error);
    }
  }

  private emitStatusSnapshot(): void {
    this.onStatusChange?.(toStatusSnapshot(this.summary));
  }

  private syncSelectionWithLists(): void {
    const current = this.selectedNote;
    if (current) {
      if (!this.hasUnsavedSelectedDraft()) {
        this.loadDraftFromNote(current);
      }
      return;
    }

    const fallback = this.firstAvailableNote;
    this.selectedNoteId = fallback?.id ?? null;
    if (fallback) {
      this.loadDraftFromNote(fallback);
    } else {
      this.draftTitle = '';
      this.draftBody = '';
    }
  }

  private loadDraftFromNote(note: Note): void {
    this.draftTitle = note.title;
    this.draftBody = note.body;
  }

  private hasUnsavedSelectedDraft(): boolean {
    const note = this.selectedNote;
    if (!note) return false;
    const normalized = this.normalizeDraftPayload();
    return (
      normalized.title !== note.title.trim() ||
      normalized.body !== note.body.trim()
    );
  }

  private normalizeDraftPayload(): Pick<Note, 'title' | 'body'> {
    let title = this.draftTitle.trim();
    const body = this.draftBody.trim();
    if (!title && !body) {
      title = this.i18n.t('notes.untitled');
    }
    return {
      title,
      body,
    };
  }

  private async saveSelectedNoteNow(): Promise<void> {
    const note = this.selectedNote;
    if (!note || this.pendingNoteIds.has(note.id)) return;

    const payload = this.normalizeDraftPayload();
    if (
      payload.title === note.title.trim() &&
      payload.body === note.body.trim()
    ) {
      return;
    }

    this.pendingNoteIds.add(note.id);

    try {
      const updated = await this.service.patchNote(note.id, payload);
      this.upsertNote(updated);
      if (
        this.selectedNoteId === updated.id &&
        payload.title === this.normalizeDraftPayload().title &&
        payload.body === this.normalizeDraftPayload().body
      ) {
        this.loadDraftFromNote(updated);
      }
    } catch (error) {
      console.error('Failed to save note.', error);
      notify(this.i18n.t('notes.error.save'), 'error');
    } finally {
      this.pendingNoteIds.delete(note.id);
      if (this.overlay) {
        this.renderBody();
      }
    }
  }

  private upsertNote(note: Note): void {
    this.activeNotes = this.activeNotes.filter((item) => item.id !== note.id);
    this.archivedNotes = this.archivedNotes.filter(
      (item) => item.id !== note.id
    );
    if (note.status === 'active') {
      this.activeNotes = sortNotes([...this.activeNotes, note]);
    } else {
      this.archivedNotes = sortNotes([...this.archivedNotes, note]);
    }
    void this.refreshSummary();
  }

  private removeNote(noteId: string): void {
    this.activeNotes = this.activeNotes.filter((note) => note.id !== noteId);
    this.archivedNotes = this.archivedNotes.filter(
      (note) => note.id !== noteId
    );
  }

  private async selectNote(noteId: string): Promise<void> {
    if (this.selectedNoteId === noteId) return;
    await this.saveSelectedNoteNow();
    const note =
      this.activeNotes.find((item) => item.id === noteId) ??
      this.archivedNotes.find((item) => item.id === noteId) ??
      null;
    this.selectedNoteId = noteId;
    if (note) {
      this.loadDraftFromNote(note);
    } else {
      this.draftTitle = '';
      this.draftBody = '';
    }
    if (this.overlay) {
      this.renderBody();
    }
  }

  private async createNote(): Promise<void> {
    if (this.creating) return;
    await this.saveSelectedNoteNow();
    this.creating = true;
    if (this.overlay) {
      this.renderBody();
    }

    try {
      const created = await this.service.createNote({
        title: this.i18n.t('notes.untitled'),
        body: '',
        status: 'active',
        is_pinned: false,
      });
      this.upsertNote(created);
      this.selectedNoteId = created.id;
      this.loadDraftFromNote(created);
      this.focusTitleOnRender = true;
    } catch (error) {
      console.error('Failed to create note.', error);
      notify(this.i18n.t('notes.error.create'), 'error');
    } finally {
      this.creating = false;
      if (this.overlay) {
        this.renderBody();
      }
    }
  }

  private async togglePin(note: Note): Promise<void> {
    if (this.pendingNoteIds.has(note.id)) return;
    await this.saveSelectedNoteNow();
    this.pendingNoteIds.add(note.id);
    if (this.overlay) {
      this.renderBody();
    }

    try {
      const updated = note.is_pinned
        ? await this.service.unpinNote(note.id)
        : await this.service.pinNote(note.id);
      this.upsertNote(updated);
      if (this.selectedNoteId === updated.id) {
        this.loadDraftFromNote(updated);
      }
    } catch (error) {
      console.error('Failed to toggle note pin.', error);
      notify(this.i18n.t('notes.error.pin'), 'error');
    } finally {
      this.pendingNoteIds.delete(note.id);
      if (this.overlay) {
        this.renderBody();
      }
    }
  }

  private async toggleArchive(note: Note): Promise<void> {
    if (this.pendingNoteIds.has(note.id)) return;
    await this.saveSelectedNoteNow();
    this.pendingNoteIds.add(note.id);
    if (this.overlay) {
      this.renderBody();
    }

    try {
      const updated =
        note.status === 'archived'
          ? await this.service.unarchiveNote(note.id)
          : await this.service.archiveNote(note.id);
      this.upsertNote(updated);
      this.selectedNoteId = updated.id;
      this.loadDraftFromNote(updated);
    } catch (error) {
      console.error('Failed to toggle note archive.', error);
      notify(this.i18n.t('notes.error.archive'), 'error');
    } finally {
      this.pendingNoteIds.delete(note.id);
      if (this.overlay) {
        this.renderBody();
      }
    }
  }

  private async deleteSelectedNote(note: Note): Promise<void> {
    if (this.pendingNoteIds.has(note.id)) return;
    const confirmed = await confirmDeleteNoteModal({
      noteTitle: note.title || this.i18n.t('notes.untitled'),
      i18n: this.i18n,
    });
    if (!confirmed) return;

    this.pendingNoteIds.add(note.id);
    if (this.overlay) {
      this.renderBody();
    }

    try {
      await this.service.deleteNote(note.id);
      this.removeNote(note.id);
      if (this.selectedNoteId === note.id) {
        const next = this.firstAvailableNote;
        this.selectedNoteId = next?.id ?? null;
        if (next) {
          this.loadDraftFromNote(next);
        } else {
          this.draftTitle = '';
          this.draftBody = '';
        }
      }
      void this.refreshSummary();
    } catch (error) {
      console.error('Failed to delete note.', error);
      notify(this.i18n.t('notes.error.delete'), 'error');
    } finally {
      this.pendingNoteIds.delete(note.id);
      if (this.overlay) {
        this.renderBody();
      }
    }
  }
}
