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
import {
  getOverlayDeviceContext,
  isMobileOverlayContext,
} from '../../../ui-lib/src/services/overlayPolicy.ts';
import { ShellNotesService } from '../services/ShellNotesService.ts';
import { confirmDeleteNoteModal } from './ConfirmDeleteNoteModal.ts';
import { NotesMobileFullscreenView } from './NotesMobileFullscreenView.ts';

const NOTES_PAGE_SIZE = 100;
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

type UpsertNoteOptions = {
  refreshSummary?: boolean;
  preserveListPosition?: boolean;
};

type EditorSaveState = 'idle' | 'saving' | 'queued' | 'error';

type EditorSession = {
  noteId: string;
  serverSnapshot: Note | null;
  draftTitle: string;
  draftBody: string;
  saveState: EditorSaveState;
  queuedSave: boolean;
  saveLoopPromise: Promise<void> | null;
  serverStateSyncPromise: Promise<void> | null;
  pendingDeleteAfterSync: boolean;
};

type ManagedMenu = {
  menu: AnchoredMenu;
  cleanup?: () => void;
};

type MenuScope = 'sidebar' | 'editor';

type SidebarRowRefs = {
  root: HTMLDivElement;
  selectButton: HTMLButtonElement;
  titleEl: HTMLParagraphElement;
  snippetEl: HTMLParagraphElement | null;
  pinButton: HTMLButtonElement;
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

function cloneNoteSnapshot(note: Note): Note {
  return {
    ...note,
    meta: note.meta ? { ...note.meta } : {},
  };
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
  private headerTitleWrap: HTMLDivElement | null = null;
  private headerActions: HTMLDivElement | null = null;
  private headerCloseButton: HTMLButtonElement | null = null;
  private sidebarPane: HTMLElement | null = null;
  private editorPane: HTMLElement | null = null;
  private mobilePane: HTMLElement | null = null;
  private mobileViewComponent: NotesMobileFullscreenView | null = null;

  private titleInput: HTMLInputElement | null = null;
  private bodyInput: HTMLTextAreaElement | null = null;
  private updatedAtLabel: HTMLSpanElement | null = null;
  private sidebarRowsByNoteId = new Map<string, SidebarRowRefs>();

  private activeNotes: Note[] = [];
  private archivedNotes: Note[] = [];
  private summary: NoteSummary = buildEmptySummary();
  private selectedNoteId: string | null = null;
  private editorSessionsByNoteId = new Map<string, EditorSession>();
  private loading = false;
  private mutationPendingNoteIds = new Set<string>();
  private savingNoteIds = new Set<string>();
  private errorKey: AppTranslationKey | null = null;
  private refreshVersion = 0;
  private focusTitleOnRender = false;
  private mobilePresentation = false;
  private mobileView: 'list' | 'editor' = 'list';
  private sidebarMenus: ManagedMenu[] = [];
  private editorMenus: ManagedMenu[] = [];

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
    this.mobilePresentation = isMobileOverlayContext(getOverlayDeviceContext());
    this.mobileView = 'list';
    const {
      overlay,
      container,
      body,
      titleWrap,
      titleElement,
      actions,
      headerInner,
    } = createPaneModalShell(this.i18n.t('notes.modal.title'), {
      onClose: () => this.close(),
      intent: 'form',
      presentation: this.mobilePresentation ? 'fullscreen' : undefined,
      zIndex: 260,
    });

    const closeButton = actions.querySelector<HTMLButtonElement>(
      'button[aria-label="Close dialog"]'
    );

    if (this.mobilePresentation) {
      overlay.style.padding = '0';
      overlay.style.justifyContent = 'stretch';
      container.style.width = '100%';
      container.style.maxWidth = '100%';
      container.style.height = '100dvh';
      container.style.maxHeight = '100dvh';
      container.style.minHeight = '100dvh';
      container.style.border = '0';
      container.style.borderRadius = '0';
      container.style.boxShadow = 'none';
      headerInner.className =
        'px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]';
      body.style.paddingBottom = 'env(safe-area-inset-bottom)';
    } else {
      container.style.width = 'min(76rem, calc(100vw - 2rem))';
      container.style.maxWidth = '76rem';
      container.style.height = 'min(46rem, calc(100dvh - 2rem))';
      container.style.maxHeight = 'min(46rem, calc(100dvh - 2rem))';
      container.style.transition = 'width 180ms ease, max-width 180ms ease';
      this.decorateHeaderTitle(titleWrap, titleElement);
    }

    const createButton = this.createHeaderCreateButton();
    if (!this.mobilePresentation) {
      if (closeButton) {
        actions.insertBefore(createButton, closeButton);
      } else {
        actions.appendChild(createButton);
      }
    }

    this.overlay = overlay;
    this.body = body;
    this.headerTitleElement = titleElement;
    this.headerCreateButton = createButton;
    this.headerTitleWrap = titleWrap;
    this.headerActions = actions;
    this.headerCloseButton = closeButton;

    this.mountLayout();
    this.syncHeaderState();
    this.renderContent();
    this.onOpenChange?.(true);
    void this.refresh();
  }

  public close(): void {
    void this.saveSelectedNoteNow();
    this.destroyMenus();
    this.overlay?.remove();
    this.overlay = null;
    this.body = null;
    this.headerTitleElement = null;
    this.headerCreateButton = null;
    this.headerTitleWrap = null;
    this.headerActions = null;
    this.headerCloseButton = null;
    this.sidebarPane = null;
    this.editorPane = null;
    this.mobilePane = null;
    this.mobileViewComponent = null;
    this.titleInput = null;
    this.bodyInput = null;
    this.updatedAtLabel = null;
    this.sidebarRowsByNoteId.clear();
    this.loading = false;
    this.mutationPendingNoteIds.clear();
    this.savingNoteIds.clear();
    this.editorSessionsByNoteId.clear();
    this.errorKey = null;
    this.focusTitleOnRender = false;
    this.mobilePresentation = false;
    this.mobileView = 'list';
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

  private get currentEditorSession(): EditorSession | null {
    if (!this.selectedNoteId) return null;
    return this.editorSessionsByNoteId.get(this.selectedNoteId) ?? null;
  }

  private isNoteServerBacked(noteId: string): boolean {
    const session = this.editorSessionsByNoteId.get(noteId);
    return session ? session.serverSnapshot !== null : true;
  }

  private hasServerStateSyncInFlight(noteId: string): boolean {
    return (
      this.editorSessionsByNoteId.get(noteId)?.serverStateSyncPromise !== null
    );
  }

  private isNoteActionDisabled(noteId: string): boolean {
    return this.mutationPendingNoteIds.has(noteId);
  }

  private createEditorSession(note: Note | null): EditorSession | null {
    if (!note) {
      return null;
    }
    return {
      noteId: note.id,
      serverSnapshot: cloneNoteSnapshot(note),
      draftTitle: note.title,
      draftBody: note.body,
      saveState: 'idle',
      queuedSave: false,
      saveLoopPromise: null,
      serverStateSyncPromise: null,
      pendingDeleteAfterSync: false,
    };
  }

  private ensureEditorSession(note: Note): EditorSession {
    const existing = this.editorSessionsByNoteId.get(note.id);
    if (existing) {
      if (existing.serverSnapshot && !this.isDraftDirty(existing)) {
        existing.draftTitle = note.title;
        existing.draftBody = note.body;
      }
      return existing;
    }
    const session = this.createEditorSession(note);
    if (!session) {
      throw new Error('Expected editor session for note.');
    }
    this.editorSessionsByNoteId.set(note.id, session);
    return session;
  }

  private createOptimisticEditorSession(note: Note): EditorSession {
    const session: EditorSession = {
      noteId: note.id,
      serverSnapshot: null,
      draftTitle: '',
      draftBody: '',
      saveState: 'idle',
      queuedSave: false,
      saveLoopPromise: null,
      serverStateSyncPromise: null,
      pendingDeleteAfterSync: false,
    };
    this.editorSessionsByNoteId.set(note.id, session);
    return session;
  }

  private renameEditorSession(oldNoteId: string, note: Note): EditorSession {
    const existing = this.editorSessionsByNoteId.get(oldNoteId);
    if (!existing) {
      return this.ensureEditorSession(note);
    }
    this.editorSessionsByNoteId.delete(oldNoteId);
    existing.noteId = note.id;
    existing.serverSnapshot = cloneNoteSnapshot(note);
    this.editorSessionsByNoteId.set(note.id, existing);
    return existing;
  }

  private syncEditorSessionServerSnapshot(note: Note): void {
    const session = this.editorSessionsByNoteId.get(note.id);
    if (!session) return;
    session.serverSnapshot = cloneNoteSnapshot(note);
  }

  private syncEditorSessionsFromServerNotes(notes: Note[]): void {
    notes.forEach((note) => {
      const session = this.editorSessionsByNoteId.get(note.id);
      if (!session || !session.serverSnapshot) {
        return;
      }
      session.serverSnapshot = cloneNoteSnapshot(note);
      if (!this.isDraftDirty(session)) {
        session.draftTitle = note.title;
        session.draftBody = note.body;
      }
    });
  }

  private dropEditorSession(noteId: string): void {
    this.editorSessionsByNoteId.delete(noteId);
  }

  private findNoteById(noteId: string): Note | null {
    return (
      this.activeNotes.find((note) => note.id === noteId) ??
      this.archivedNotes.find((note) => note.id === noteId) ??
      null
    );
  }

  private moveNoteBetweenCollections(
    note: Note,
    previousStatus: Note['status']
  ): void {
    if (previousStatus === note.status) {
      if (note.status === 'active') {
        this.activeNotes = sortNotes([...this.activeNotes]);
      } else {
        this.archivedNotes = sortNotes([...this.archivedNotes]);
      }
      return;
    }

    if (previousStatus === 'active') {
      this.activeNotes = this.activeNotes.filter((item) => item.id !== note.id);
      this.archivedNotes = sortNotes([...this.archivedNotes, note]);
      return;
    }

    this.archivedNotes = this.archivedNotes.filter(
      (item) => item.id !== note.id
    );
    this.activeNotes = sortNotes([...this.activeNotes, note]);
  }

  private applySummaryForPinnedChange(
    note: Note,
    previousPinned: boolean
  ): void {
    if (previousPinned === note.is_pinned) return;
    this.applySummaryDelta({
      pinned: note.is_pinned ? 1 : -1,
      pinned_active: note.status === 'active' ? (note.is_pinned ? 1 : -1) : 0,
    });
  }

  private applySummaryForStatusChange(
    note: Note,
    previousStatus: Note['status']
  ): void {
    if (previousStatus === note.status) return;
    const activeDelta = note.status === 'active' ? 1 : -1;
    const archivedDelta = note.status === 'archived' ? 1 : -1;
    this.applySummaryDelta({
      active: activeDelta,
      archived: archivedDelta,
      pinned_active: note.is_pinned ? (note.status === 'active' ? 1 : -1) : 0,
    });
  }

  private applySummaryForRemovedNote(note: Note): void {
    this.applySummaryDelta({
      total: -1,
      active: note.status === 'active' ? -1 : 0,
      archived: note.status === 'archived' ? -1 : 0,
      pinned: note.is_pinned ? -1 : 0,
      pinned_active: note.is_pinned && note.status === 'active' ? -1 : 0,
    });
  }

  private patchVisibleNoteState(noteId: string): void {
    const note = this.findNoteById(noteId);
    this.renderSidebar();
    if (this.selectedNoteId === noteId || !this.selectedNote) {
      this.renderEditor();
      return;
    }
    if (note) {
      this.patchSidebarRow(note, { useDraft: true });
    }
  }

  private applyLocalPinToggle(noteId: string): Note | null {
    const note = this.findNoteById(noteId);
    if (!note) return null;
    const previousPinned = note.is_pinned;
    note.is_pinned = !note.is_pinned;
    this.moveNoteBetweenCollections(note, note.status);
    this.applySummaryForPinnedChange(note, previousPinned);
    this.patchVisibleNoteState(note.id);
    return note;
  }

  private applyLocalArchiveToggle(noteId: string): Note | null {
    const note = this.findNoteById(noteId);
    if (!note) return null;
    const previousStatus = note.status;
    note.status = note.status === 'archived' ? 'active' : 'archived';
    this.moveNoteBetweenCollections(note, previousStatus);
    this.applySummaryForStatusChange(note, previousStatus);
    this.patchVisibleNoteState(note.id);
    return note;
  }

  private refreshTranslations(): void {
    if (!this.overlay) return;
    if (this.headerTitleElement && !this.mobilePresentation) {
      const title = this.i18n.t('notes.modal.title');
      this.headerTitleElement.textContent = title;
      this.headerTitleElement.title = title;
    }
    if (this.headerCreateButton) {
      const label = this.i18n.t('notes.newNote');
      this.headerCreateButton.textContent = label;
      this.headerCreateButton.title = label;
      this.headerCreateButton.setAttribute('aria-label', label);
    }
    this.renderContent();
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
      createIcon('document', {
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
    return createTextButton({
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
  }

  private mountLayout(): void {
    if (!this.body) return;
    this.body.replaceChildren();

    if (this.mobilePresentation) {
      const mobilePane = document.createElement('section');
      mobilePane.className =
        'flex h-full min-h-0 flex-col overflow-hidden bg-white';
      this.body.appendChild(mobilePane);
      this.mobilePane = mobilePane;
      this.mobileViewComponent = new NotesMobileFullscreenView({
        i18n: this.i18n,
        headerTitleWrap: this.headerTitleWrap as HTMLDivElement,
        headerActions: this.headerActions as HTMLDivElement,
        contentHost: mobilePane,
        isNoteActionDisabled: (noteId) => this.isNoteActionDisabled(noteId),
        createActionMenu: (note, scope, options) =>
          this.createActionMenu(note, scope, options),
        onBack: () => {
          void this.showMobileListView();
        },
        onCreateNote: () => {
          void this.createNote();
        },
        onSelectNote: (noteId) => {
          void this.selectNote(noteId);
        },
        onTogglePin: (note) => {
          void this.togglePin(note);
        },
        onTitleInput: (value) => {
          const session = this.currentEditorSession;
          if (!session) return;
          session.draftTitle = value;
          session.saveState = 'queued';
          this.requestImmediateSave();
        },
        onBodyInput: (value) => {
          const session = this.currentEditorSession;
          if (!session) return;
          session.draftBody = value;
          session.saveState = 'queued';
          this.requestImmediateSave();
        },
        onTitleInputMount: (input) => {
          this.titleInput = input;
        },
        onBodyInputMount: (input) => {
          this.bodyInput = input;
        },
        onUpdatedLabelMount: (element) => {
          this.updatedAtLabel = element;
        },
        onTitleFocusConsumed: () => {
          this.focusTitleOnRender = false;
        },
      });
      this.sidebarPane = null;
      this.editorPane = null;
      return;
    }

    const shell = document.createElement('div');
    shell.className =
      'grid h-full min-h-0 grid-cols-1 bg-white md:grid-cols-[20.5rem_1px_minmax(0,1fr)]';

    const sidebarPane = document.createElement('section');
    sidebarPane.className = 'flex min-h-0 flex-col overflow-hidden bg-white';

    const divider = document.createElement('div');
    divider.className = 'hidden bg-slate-200 md:block';
    divider.setAttribute('aria-hidden', 'true');

    const editorPane = document.createElement('section');
    editorPane.className =
      'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white';

    shell.append(sidebarPane, divider, editorPane);
    this.body.appendChild(shell);

    this.sidebarPane = sidebarPane;
    this.editorPane = editorPane;
    this.mobilePane = null;
    this.mobileViewComponent = null;
  }

  private syncHeaderState(): void {
    if (this.mobilePresentation) {
      this.renderMobileComponent();
      return;
    }
    if (this.headerCreateButton) {
      this.headerCreateButton.disabled = false;
    }
  }

  private renderContent(): void {
    if (this.mobilePresentation) {
      this.renderMobileComponent();
      return;
    }
    this.renderSidebar();
    this.renderEditor();
  }

  private async showMobileListView(): Promise<void> {
    await this.saveSelectedNoteNow();
    this.mobileView = 'list';
    this.renderMobileComponent();
  }

  private renderMobileComponent(): void {
    if (!this.mobilePane || !this.mobileViewComponent) return;
    this.destroyMenus();

    if (this.mobileView === 'editor' && !this.selectedNote) {
      this.mobileView = 'list';
    }

    const session = this.selectedNote
      ? this.ensureEditorSession(this.selectedNote)
      : null;

    this.mobileViewComponent.render({
      view: this.mobileView,
      selectedNote: this.selectedNote,
      activeNotes: this.activeNotes,
      archivedNotes: this.archivedNotes,
      summary: this.summary,
      loading: this.loading,
      hasAnyNotes: this.hasAnyNotes,
      errorText: this.errorKey ? this.i18n.t(this.errorKey) : null,
      titleValue: session?.draftTitle ?? '',
      bodyValue: session?.draftBody ?? '',
      updatedText: session?.serverSnapshot
        ? this.formatUpdatedAt(session.serverSnapshot)
        : '',
      focusTitleOnRender: this.focusTitleOnRender,
      closeButton: this.headerCloseButton,
    });
  }

  private destroyManagedMenus(collection: ManagedMenu[]): void {
    collection.forEach(({ menu, cleanup }) => {
      menu.unmount();
      cleanup?.();
    });
    collection.length = 0;
  }

  private destroyMenus(scope?: MenuScope): void {
    if (!scope || scope === 'sidebar') {
      this.destroyManagedMenus(this.sidebarMenus);
    }
    if (!scope || scope === 'editor') {
      this.destroyManagedMenus(this.editorMenus);
    }
  }

  private registerMenu(scope: MenuScope, entry: ManagedMenu): ManagedMenu {
    if (scope === 'sidebar') {
      this.sidebarMenus.push(entry);
    } else {
      this.editorMenus.push(entry);
    }
    return entry;
  }

  private renderSidebar(): void {
    if (this.mobilePresentation) {
      this.renderMobileComponent();
      return;
    }
    if (!this.sidebarPane) return;
    this.destroyMenus('sidebar');
    this.syncHeaderState();
    this.sidebarPane.replaceChildren();
    this.sidebarRowsByNoteId.clear();

    const content = document.createElement('div');
    content.className = 'min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-4 md:px-3';

    if (this.loading && !this.hasAnyNotes) {
      const loading = document.createElement('p');
      loading.className = 'px-3 py-8 text-sm text-slate-500';
      loading.textContent = this.i18n.t('notes.loading');
      content.appendChild(loading);
      this.sidebarPane.appendChild(content);
      return;
    }

    if (this.errorKey && !this.hasAnyNotes) {
      const error = document.createElement('p');
      error.className = 'px-3 py-8 text-sm text-rose-600';
      error.textContent = this.i18n.t(this.errorKey);
      content.appendChild(error);
      this.sidebarPane.appendChild(content);
      return;
    }

    if (!this.hasAnyNotes) {
      const empty = document.createElement('div');
      empty.className = 'px-3 py-10 text-sm leading-6 text-slate-500';
      empty.textContent = this.i18n.t('notes.empty');
      content.appendChild(empty);
      this.sidebarPane.appendChild(content);
      return;
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

    this.sidebarPane.appendChild(content);
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
    let snippetEl: HTMLParagraphElement | null = null;
    if (snippet) {
      const body = document.createElement('p');
      body.className = 'line-clamp-2 text-sm leading-5 text-slate-500';
      body.textContent = snippet;
      button.appendChild(body);
      snippetEl = body;
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
    pinButton.disabled = this.isNoteActionDisabled(note.id);
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
      className: 'hidden min-w-[12rem] overflow-hidden !rounded-2xl',
    });
    contextPanel.setAttribute('role', 'menu');
    wrap.appendChild(contextPanel);

    const trackedMenu = this.registerMenu('sidebar', {
      menu: null as unknown as AnchoredMenu,
    });

    const contextMenuController = new AnchoredMenu({
      container: wrap,
      panel: contextPanel,
      positioning: 'viewport',
      onOpenChange: (open) => {
        if (!open && trackedMenu.cleanup) {
          trackedMenu.cleanup();
          trackedMenu.cleanup = undefined;
        }
      },
    });
    trackedMenu.menu = contextMenuController;
    contextMenuController.mount();

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

      trackedMenu.cleanup?.();
      trackedMenu.cleanup = () => {
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

    this.sidebarRowsByNoteId.set(note.id, {
      root: wrap,
      selectButton: button,
      titleEl: title,
      snippetEl,
      pinButton,
    });

    wrap.append(button, pinButton);
    return wrap;
  }

  private patchSidebarSelection(): void {
    this.sidebarRowsByNoteId.forEach((row, noteId) => {
      const selected = noteId === this.selectedNoteId;
      row.selectButton.className = selected
        ? 'flex w-full flex-col gap-2 rounded-2xl bg-slate-100 px-3 py-3 pr-11 text-left text-slate-900'
        : 'flex w-full flex-col gap-2 rounded-2xl px-3 py-3 pr-11 text-left text-slate-700 transition hover:bg-slate-50';
    });
  }

  private patchSidebarRow(note: Note, options?: { useDraft?: boolean }): void {
    const row = this.sidebarRowsByNoteId.get(note.id);
    if (!row) return;

    const session = this.editorSessionsByNoteId.get(note.id) ?? null;
    const useDraft = options?.useDraft ?? false;
    const titleText =
      useDraft && session && session.noteId === note.id
        ? session.draftTitle.trim() || this.i18n.t('notes.untitled')
        : note.title.trim() || this.i18n.t('notes.untitled');
    const bodyText =
      useDraft && session && session.noteId === note.id
        ? session.draftBody.trim()
        : note.body.trim();

    row.titleEl.textContent = titleText;

    const snippet = bodyText
      ? bodyText.length > 120
        ? `${bodyText.slice(0, 117)}...`
        : bodyText
      : '';

    if (snippet) {
      if (!row.snippetEl) {
        const body = document.createElement('p');
        body.className = 'line-clamp-2 text-sm leading-5 text-slate-500';
        row.selectButton.appendChild(body);
        row.snippetEl = body;
      }
      row.snippetEl.textContent = snippet;
    } else if (row.snippetEl) {
      row.snippetEl.remove();
      row.snippetEl = null;
    }

    row.pinButton.disabled = this.isNoteActionDisabled(note.id);
    row.pinButton.title = note.is_pinned
      ? this.i18n.t('notes.unpin')
      : this.i18n.t('notes.pin');
    row.pinButton.setAttribute(
      'aria-label',
      note.is_pinned ? this.i18n.t('notes.unpin') : this.i18n.t('notes.pin')
    );
    row.pinButton.className = note.is_pinned
      ? 'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-800'
      : 'absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 opacity-0 pointer-events-none transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto';
    row.pinButton.replaceChildren(
      createIcon(note.is_pinned ? 'bookmark-solid' : 'bookmark', {
        size: 14,
        strokeWidth: 1.8,
      })
    );
  }

  private renderEditor(): void {
    if (this.mobilePresentation) {
      this.renderMobileComponent();
      return;
    }
    if (!this.editorPane) return;
    this.destroyMenus('editor');
    this.editorPane.replaceChildren();
    this.titleInput = null;
    this.bodyInput = null;
    this.updatedAtLabel = null;

    const note = this.selectedNote;
    if (!note) {
      const empty = document.createElement('div');
      empty.className =
        'flex min-h-[20rem] flex-1 flex-col items-center justify-center gap-4 px-6 text-center';

      const iconWrap = document.createElement('div');
      iconWrap.className =
        'inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-100 text-slate-500';
      iconWrap.appendChild(
        createIcon('document', { size: 20, strokeWidth: 1.8 })
      );
      empty.appendChild(iconWrap);

      const title = document.createElement('p');
      title.className = 'text-sm font-semibold text-slate-900';
      title.textContent = this.i18n.t('notes.noSelectionTitle');
      empty.appendChild(title);

      const body = document.createElement('p');
      body.className = 'max-w-md text-sm leading-6 text-slate-500';
      body.textContent = this.i18n.t('notes.noSelectionBody');
      empty.appendChild(body);

      this.editorPane.appendChild(empty);
      return;
    }

    const session = this.ensureEditorSession(note);

    const header = document.createElement('div');
    header.className = 'px-5 pb-4 pt-5 md:px-6';

    const headerTop = document.createElement('div');
    headerTop.className = 'flex flex-wrap items-start justify-between gap-3';

    const meta = document.createElement('div');
    meta.className = 'min-w-0 flex-1';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = session.draftTitle;
    titleInput.placeholder = this.i18n.t('notes.titlePlaceholder');
    titleInput.className =
      'w-full border-none bg-transparent px-0 text-[1.35rem] font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300';
    titleInput.addEventListener('input', () => {
      session.draftTitle = titleInput.value;
      session.saveState = 'queued';
      this.patchSidebarRow(note, { useDraft: true });
      this.requestImmediateSave();
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
      disabled: this.isNoteActionDisabled(note.id),
      onClick: () => {
        void this.togglePin(note);
      },
    });
    actions.appendChild(pinButton);
    actions.appendChild(this.createActionsMenu(note));

    headerTop.appendChild(actions);
    header.appendChild(headerTop);
    this.editorPane.appendChild(header);

    const bodyWrap = document.createElement('div');
    bodyWrap.className =
      'flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 md:px-6 md:pb-6';

    const bodyInput = document.createElement('textarea');
    bodyInput.value = session.draftBody;
    bodyInput.placeholder = this.i18n.t('notes.bodyPlaceholder');
    bodyInput.className =
      'min-h-[20rem] flex-1 resize-none bg-transparent p-0 text-[0.95rem] leading-7 text-slate-700 outline-none placeholder:text-slate-350';
    bodyInput.style.border = 'none';
    bodyInput.addEventListener('input', () => {
      session.draftBody = bodyInput.value;
      session.saveState = 'queued';
      this.patchSidebarRow(note, { useDraft: true });
      this.requestImmediateSave();
    });
    bodyWrap.appendChild(bodyInput);
    this.bodyInput = bodyInput;

    const metaRow = document.createElement('div');
    metaRow.className =
      'flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400';

    const updated = document.createElement('span');
    updated.textContent = session.serverSnapshot
      ? this.formatUpdatedAt(session.serverSnapshot)
      : '';
    metaRow.appendChild(updated);
    bodyWrap.appendChild(metaRow);
    this.updatedAtLabel = updated;

    this.editorPane.appendChild(bodyWrap);

    if (this.focusTitleOnRender) {
      this.focusTitleOnRender = false;
      queueMicrotask(() => {
        this.titleInput?.focus();
        this.titleInput?.select();
      });
    }
  }

  private createActionMenu(
    note: Note,
    scope: MenuScope,
    options?: {
      buttonClassName?: string;
      placement?: 'bottom-end' | 'bottom-start';
      fallbackPlacements?: Array<
        'bottom-start' | 'top-end' | 'top-start' | 'bottom-end'
      >;
    }
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'relative inline-flex';

    const menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      title: this.i18n.t('common.actions'),
      ariaLabel: this.i18n.t('common.actions'),
      disabled: this.isNoteActionDisabled(note.id),
    });
    if (options?.buttonClassName) {
      menuButton.classList.add(...options.buttonClassName.split(' '));
    } else {
      menuButton.classList.add('text-slate-600');
    }
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', 'false');

    const menuPanel = createSurface({
      elevated: true,
      className:
        'absolute left-0 top-0 z-50 hidden min-w-[12rem] overflow-hidden !rounded-2xl',
    });
    menuPanel.setAttribute('role', 'menu');

    const trackedMenu = this.registerMenu(scope, {
      menu: null as unknown as AnchoredMenu,
    });

    const menuController = new AnchoredMenu({
      container: wrap,
      panel: menuPanel,
      onOpenChange: (open) => {
        menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuButton.classList.toggle('bg-slate-100', open);
        menuButton.classList.toggle('text-slate-900', open);
      },
    });
    trackedMenu.menu = menuController;
    menuController.mount();

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
        placement: options?.placement ?? 'bottom-end',
        fallbackPlacements: options?.fallbackPlacements ?? [
          'bottom-start',
          'top-end',
          'top-start',
        ],
        gap: 6,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    wrap.append(menuButton, menuPanel);
    return wrap;
  }

  private createActionsMenu(note: Note): HTMLElement {
    return this.createActionMenu(note, 'editor', {
      buttonClassName: 'text-slate-600',
    });
  }

  private formatUpdatedAt(note: Note): string {
    return this.i18n.t('notes.updatedAt', {
      date: this.i18n.formatDate(note.updated_at, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  private syncUpdatedLabel(note: Note): void {
    if (!this.updatedAtLabel) return;
    this.updatedAtLabel.textContent = this.formatUpdatedAt(note);
  }

  private async refresh(): Promise<void> {
    const currentVersion = ++this.refreshVersion;
    this.loading = true;
    this.errorKey = null;
    this.renderSidebar();

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
      this.syncEditorSessionsFromServerNotes([
        ...this.activeNotes,
        ...this.archivedNotes,
      ]);
      this.syncSelectionWithLists();
      this.emitStatusSnapshot();
    } catch (error) {
      console.error('Failed to load notes.', error);
      if (currentVersion !== this.refreshVersion) return;
      this.errorKey = 'notes.error.load';
    } finally {
      if (currentVersion !== this.refreshVersion) return;
      this.loading = false;
      this.renderSidebar();
      this.renderEditor();
    }
  }

  private async refreshSummary(): Promise<void> {
    try {
      this.summary = await this.service.loadSummary();
      this.emitStatusSnapshot();
      this.renderSidebar();
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
        this.ensureEditorSession(current);
      }
      return;
    }

    const fallback = this.firstAvailableNote;
    this.selectedNoteId = fallback?.id ?? null;
    if (fallback) {
      this.ensureEditorSession(fallback);
    } else {
      this.editorSessionsByNoteId.clear();
    }
  }

  private loadDraftFromNote(note: Note): void {
    this.ensureEditorSession(note);
  }

  private requestImmediateSave(): void {
    const session = this.currentEditorSession;
    if (!session) return;
    session.queuedSave = true;
    if (session.saveState !== 'saving') {
      session.saveState = 'queued';
    }
    void this.ensureNoteSaveLoop(session.noteId);
  }

  private ensureNoteSaveLoop(noteId: string): Promise<void> {
    const session = this.editorSessionsByNoteId.get(noteId);
    if (!session) return Promise.resolve();
    if (session.saveLoopPromise) {
      return session.saveLoopPromise;
    }
    const loopPromise = this.runNoteSaveLoop(session).finally(() => {
      if (session.saveLoopPromise === loopPromise) {
        session.saveLoopPromise = null;
      }
    });
    session.saveLoopPromise = loopPromise;
    return loopPromise;
  }

  private ensureServerStateSync(noteId: string): Promise<void> {
    const session = this.editorSessionsByNoteId.get(noteId);
    if (!session) return Promise.resolve();
    if (session.serverStateSyncPromise) {
      return session.serverStateSyncPromise;
    }
    const syncPromise = this.runServerStateSyncLoop(noteId).finally(() => {
      const latestSession = this.editorSessionsByNoteId.get(noteId);
      if (latestSession?.serverStateSyncPromise === syncPromise) {
        latestSession.serverStateSyncPromise = null;
      }
    });
    session.serverStateSyncPromise = syncPromise;
    return syncPromise;
  }

  private async runServerStateSyncLoop(noteId: string): Promise<void> {
    while (true) {
      const session = this.editorSessionsByNoteId.get(noteId);
      if (!session || !session.serverSnapshot) {
        return;
      }

      if (session.pendingDeleteAfterSync) {
        try {
          await this.service.deleteNote(noteId);
          this.dropEditorSession(noteId);
        } catch (error) {
          console.error('Failed to delete note after sync.', error);
          notify(this.i18n.t('notes.error.delete'), 'error');
          void this.refresh();
        }
        return;
      }

      const note = this.findNoteById(noteId);
      if (!note) {
        return;
      }

      try {
        if (note.status !== session.serverSnapshot.status) {
          session.serverSnapshot =
            note.status === 'archived'
              ? cloneNoteSnapshot(await this.service.archiveNote(noteId))
              : cloneNoteSnapshot(await this.service.unarchiveNote(noteId));
          continue;
        }

        if (note.is_pinned !== session.serverSnapshot.is_pinned) {
          session.serverSnapshot = note.is_pinned
            ? cloneNoteSnapshot(await this.service.pinNote(noteId))
            : cloneNoteSnapshot(await this.service.unpinNote(noteId));
          continue;
        }
      } catch (error) {
        console.error('Failed to sync note server state.', error);
        notify(
          note.status !== session.serverSnapshot.status
            ? this.i18n.t('notes.error.archive')
            : this.i18n.t('notes.error.pin'),
          'error'
        );
        void this.refresh();
        return;
      }

      return;
    }
  }

  private async runNoteSaveLoop(initialSession: EditorSession): Promise<void> {
    let session = initialSession;

    while (true) {
      const note = this.findNoteById(session.noteId);
      if (!note) {
        return;
      }
      if (!session.queuedSave) {
        if (session.saveState !== 'error') {
          session.saveState = 'idle';
        }
        return;
      }

      const payload = this.normalizeDraftPayload(session);
      if (
        session.serverSnapshot &&
        payload.title === session.serverSnapshot.title.trim() &&
        payload.body === session.serverSnapshot.body.trim()
      ) {
        session.queuedSave = false;
        session.saveState = 'idle';
        return;
      }

      session.queuedSave = false;
      session.saveState = 'saving';
      this.savingNoteIds.add(note.id);
      this.patchSidebarRow(note, { useDraft: true });

      try {
        let updated: Note;
        if (!session.serverSnapshot) {
          const optimisticNoteId = session.noteId;
          updated = await this.service.createNote({
            ...payload,
            status: note.status,
            is_pinned: note.is_pinned,
            meta: note.meta,
          });
          if (session.pendingDeleteAfterSync) {
            try {
              await this.service.deleteNote(updated.id);
              this.dropEditorSession(optimisticNoteId);
            } catch (deleteError) {
              console.error('Failed to delete note after create.', deleteError);
              notify(this.i18n.t('notes.error.delete'), 'error');
              void this.refresh();
            }
            return;
          }
          const desiredNote = this.findNoteById(optimisticNoteId);
          const desiredStatus = desiredNote?.status ?? note.status;
          const desiredPinned = desiredNote?.is_pinned ?? note.is_pinned;
          session = this.reconcileOptimisticNote(optimisticNoteId, updated, {
            status: desiredStatus,
            is_pinned: desiredPinned,
          });
          if (
            session.serverSnapshot?.status !== desiredStatus ||
            session.serverSnapshot?.is_pinned !== desiredPinned
          ) {
            void this.ensureServerStateSync(session.noteId);
          }
        } else {
          updated = await this.service.patchNote(session.noteId, payload);
          this.upsertNote(updated, {
            refreshSummary: false,
            preserveListPosition: this.selectedNoteId === updated.id,
          });
          session.serverSnapshot = updated;
          this.syncEditorSessionServerSnapshot(updated);
        }
        if (
          this.selectedNoteId === updated.id &&
          this.titleInput &&
          this.bodyInput &&
          this.titleInput.value === payload.title &&
          this.bodyInput.value === payload.body
        ) {
          this.syncUpdatedLabel(updated);
        }
        this.patchSidebarRow(updated, {
          useDraft: this.isDraftDirty(session),
        });
        session.saveState = 'idle';
      } catch (error) {
        console.error('Failed to save note.', error);
        notify(
          this.i18n.t(
            session.serverSnapshot ? 'notes.error.save' : 'notes.error.create'
          ),
          'error'
        );
        session.saveState = 'error';
        session.queuedSave = false;
      } finally {
        this.savingNoteIds.delete(note.id);
        const currentNote = this.findNoteById(session.noteId) ?? note;
        this.patchSidebarRow(currentNote, { useDraft: true });
      }

      const latestPayload = this.normalizeDraftPayload(session);
      if (
        !session.serverSnapshot ||
        latestPayload.title !== session.serverSnapshot.title.trim() ||
        latestPayload.body !== session.serverSnapshot.body.trim()
      ) {
        session.queuedSave = true;
        session.saveState = 'queued';
        continue;
      }
      session.saveState = 'idle';
    }
  }

  private hasUnsavedSelectedDraft(): boolean {
    const session = this.currentEditorSession;
    if (!session) return false;
    return this.isDraftDirty(session);
  }

  private isDraftDirty(session: EditorSession): boolean {
    if (!session.serverSnapshot) {
      return true;
    }
    const normalized = this.normalizeDraftPayload(session);
    return (
      normalized.title !== session.serverSnapshot.title.trim() ||
      normalized.body !== session.serverSnapshot.body.trim()
    );
  }

  private normalizeDraftPayload(
    session: EditorSession | null
  ): Pick<Note, 'title' | 'body'> {
    let title = session?.draftTitle.trim() ?? '';
    const body = session?.draftBody.trim() ?? '';
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
    if (!note || this.mutationPendingNoteIds.has(note.id)) return;
    const session = this.currentEditorSession;
    if (!session) return;
    session.queuedSave = true;
    await this.ensureNoteSaveLoop(session.noteId);
  }

  private replaceNote(
    previousNoteId: string,
    note: Note,
    options: UpsertNoteOptions = {}
  ): void {
    const existingActiveIndex = this.activeNotes.findIndex(
      (item) => item.id === previousNoteId
    );
    const existingArchivedIndex = this.archivedNotes.findIndex(
      (item) => item.id === previousNoteId
    );

    this.removeNote(previousNoteId);

    const preserveListPosition =
      options.preserveListPosition ??
      (existingActiveIndex >= 0 || existingArchivedIndex >= 0);

    if (preserveListPosition) {
      if (note.status === 'active' && existingActiveIndex >= 0) {
        const next = [...this.activeNotes];
        next.splice(existingActiveIndex, 0, note);
        this.activeNotes = next;
      } else if (note.status === 'archived' && existingArchivedIndex >= 0) {
        const next = [...this.archivedNotes];
        next.splice(existingArchivedIndex, 0, note);
        this.archivedNotes = next;
      } else {
        this.upsertNote(note, { ...options, refreshSummary: false });
      }
    } else {
      this.upsertNote(note, { ...options, refreshSummary: false });
    }

    if (options.refreshSummary ?? true) {
      void this.refreshSummary();
    }
  }

  private reconcileOptimisticNote(
    optimisticNoteId: string,
    created: Note,
    localState: Pick<Note, 'status' | 'is_pinned'>
  ): EditorSession {
    const reconciledNote: Note = {
      ...created,
      status: localState.status,
      is_pinned: localState.is_pinned,
    };

    this.replaceNote(optimisticNoteId, reconciledNote, {
      refreshSummary: false,
      preserveListPosition: true,
    });
    const session = this.renameEditorSession(optimisticNoteId, created);
    if (this.selectedNoteId === optimisticNoteId) {
      this.selectedNoteId = created.id;
    }
    this.renderSidebar();
    return session;
  }

  private applySummaryDelta(delta: Partial<NoteSummary>): void {
    this.summary = {
      total: Math.max(0, this.summary.total + (delta.total ?? 0)),
      active: Math.max(0, this.summary.active + (delta.active ?? 0)),
      archived: Math.max(0, this.summary.archived + (delta.archived ?? 0)),
      pinned: Math.max(0, this.summary.pinned + (delta.pinned ?? 0)),
      pinned_active: Math.max(
        0,
        this.summary.pinned_active + (delta.pinned_active ?? 0)
      ),
    };
    this.emitStatusSnapshot();
  }

  private createOptimisticNoteRecord(): Note {
    const timestamp = new Date().toISOString();
    return {
      id: `temp-note-${Math.random().toString(36).slice(2, 11)}`,
      title: this.i18n.t('notes.untitled'),
      body: '',
      status: 'active',
      is_pinned: false,
      meta: {},
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  private upsertNote(note: Note, options: UpsertNoteOptions = {}): void {
    const existingActiveIndex = this.activeNotes.findIndex(
      (item) => item.id === note.id
    );
    const existingArchivedIndex = this.archivedNotes.findIndex(
      (item) => item.id === note.id
    );
    const preserveListPosition = options.preserveListPosition ?? false;

    this.activeNotes = this.activeNotes.filter((item) => item.id !== note.id);
    this.archivedNotes = this.archivedNotes.filter(
      (item) => item.id !== note.id
    );
    if (note.status === 'active') {
      if (preserveListPosition && existingActiveIndex >= 0) {
        const next = [...this.activeNotes];
        next.splice(existingActiveIndex, 0, note);
        this.activeNotes = next;
      } else {
        this.activeNotes = sortNotes([...this.activeNotes, note]);
      }
    } else {
      if (preserveListPosition && existingArchivedIndex >= 0) {
        const next = [...this.archivedNotes];
        next.splice(existingArchivedIndex, 0, note);
        this.archivedNotes = next;
      } else {
        this.archivedNotes = sortNotes([...this.archivedNotes, note]);
      }
    }
    if (options.refreshSummary ?? true) {
      void this.refreshSummary();
    }
  }

  private removeNote(noteId: string): void {
    this.activeNotes = this.activeNotes.filter((note) => note.id !== noteId);
    this.archivedNotes = this.archivedNotes.filter(
      (note) => note.id !== noteId
    );
  }

  private async selectNote(noteId: string): Promise<void> {
    if (this.selectedNoteId === noteId) {
      if (this.mobilePresentation && this.mobileView === 'list') {
        this.mobileView = 'editor';
        this.renderContent();
      }
      return;
    }
    await this.saveSelectedNoteNow();
    const note = this.findNoteById(noteId);
    this.selectedNoteId = noteId;
    if (note) {
      this.loadDraftFromNote(note);
      if (this.mobilePresentation) {
        this.mobileView = 'editor';
      }
    }
    this.renderContent();
  }

  private async createNote(): Promise<void> {
    this.requestImmediateSave();

    const optimisticNote = this.createOptimisticNoteRecord();
    const session = this.createOptimisticEditorSession(optimisticNote);
    this.upsertNote(optimisticNote, { refreshSummary: false });
    this.applySummaryDelta({ total: 1, active: 1 });
    this.selectedNoteId = optimisticNote.id;
    this.focusTitleOnRender = true;
    if (this.mobilePresentation) {
      this.mobileView = 'editor';
    }
    this.renderContent();

    session.queuedSave = true;
    session.saveState = 'queued';
    void this.ensureNoteSaveLoop(session.noteId);
  }

  private async togglePin(note: Note): Promise<void> {
    if (this.isNoteActionDisabled(note.id)) return;
    const updated = this.applyLocalPinToggle(note.id);
    if (!updated) {
      return;
    }
    if (this.isNoteServerBacked(note.id)) {
      void this.ensureServerStateSync(note.id);
    }
  }

  private async toggleArchive(note: Note): Promise<void> {
    if (this.isNoteActionDisabled(note.id)) return;
    const updated = this.applyLocalArchiveToggle(note.id);
    if (!updated) {
      return;
    }
    if (this.isNoteServerBacked(note.id)) {
      void this.ensureServerStateSync(note.id);
    }
  }

  private async deleteSelectedNote(note: Note): Promise<void> {
    const currentNote = this.findNoteById(note.id) ?? note;
    const session = this.editorSessionsByNoteId.get(currentNote.id) ?? null;
    const shouldHandleLocally =
      !session?.serverSnapshot ||
      this.hasServerStateSyncInFlight(currentNote.id);
    if (!shouldHandleLocally && this.isNoteActionDisabled(currentNote.id))
      return;
    const confirmed = await confirmDeleteNoteModal({
      noteTitle: currentNote.title || this.i18n.t('notes.untitled'),
      i18n: this.i18n,
    });
    if (!confirmed) return;

    if (shouldHandleLocally) {
      if (session) {
        session.pendingDeleteAfterSync = true;
      }
      this.removeNote(currentNote.id);
      this.applySummaryForRemovedNote(currentNote);
      if (this.selectedNoteId === currentNote.id) {
        const next = this.firstAvailableNote;
        this.selectedNoteId = next?.id ?? null;
        if (this.mobilePresentation) {
          this.mobileView = 'list';
        }
        if (next) {
          this.loadDraftFromNote(next);
        }
      }
      this.renderContent();
      if (session && session.serverSnapshot) {
        void this.ensureServerStateSync(currentNote.id);
      } else if (session && !session.saveLoopPromise) {
        this.dropEditorSession(currentNote.id);
      }
      return;
    }

    this.mutationPendingNoteIds.add(currentNote.id);
    this.renderSidebar();
    if (this.selectedNoteId === currentNote.id) {
      this.renderEditor();
    }

    try {
      await this.service.deleteNote(currentNote.id);
      this.removeNote(currentNote.id);
      this.dropEditorSession(currentNote.id);
      if (this.selectedNoteId === currentNote.id) {
        const next = this.firstAvailableNote;
        this.selectedNoteId = next?.id ?? null;
        if (this.mobilePresentation) {
          this.mobileView = 'list';
        }
        if (next) {
          this.loadDraftFromNote(next);
        }
      }
      void this.refreshSummary();
    } catch (error) {
      console.error('Failed to delete note.', error);
      notify(this.i18n.t('notes.error.delete'), 'error');
    } finally {
      this.mutationPendingNoteIds.delete(currentNote.id);
      this.renderContent();
    }
  }
}
