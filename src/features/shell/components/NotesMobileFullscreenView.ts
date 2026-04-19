import { createIcon } from '../../canvas/ui/icons.ts';
import {
  type InkstoneEditorHandle,
} from '@majom/inkstone';
import { createIconButton } from '../../../ui-lib/src/hud/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import type { Note, NoteSummary } from '../../../majom-wrapper/interfaces/index.ts';
import { createNotesBodyEditor } from '../notes/createNotesBodyEditor.ts';

type MobileMenuScope = 'sidebar' | 'editor';

export type NotesMobileFullscreenViewState = {
  view: 'list' | 'editor';
  selectedNote: Note | null;
  activeNotes: Note[];
  archivedNotes: Note[];
  summary: NoteSummary;
  loading: boolean;
  hasAnyNotes: boolean;
  errorText: string | null;
  titleValue: string;
  bodyValue: string;
  updatedText: string;
  focusTitleOnRender: boolean;
  closeButton: HTMLButtonElement | null;
};

export type NotesMobileFullscreenViewOptions = {
  i18n: Pick<I18nService, 't'>;
  headerTitleWrap: HTMLDivElement;
  headerActions: HTMLDivElement;
  contentHost: HTMLElement;
  isNoteActionDisabled: (noteId: string) => boolean;
  createActionMenu: (
    note: Note,
    scope: MobileMenuScope,
    options?: { buttonClassName?: string }
  ) => HTMLElement;
  onBack: () => void;
  onCreateNote: () => void;
  onSelectNote: (noteId: string) => void;
  onTogglePin: (note: Note) => void;
  onTitleInput: (value: string) => void;
  onBodyInput: (value: string) => void;
  onTitleInputMount: (input: HTMLInputElement | null) => void;
  onBodyInputMount: (input: HTMLTextAreaElement | null) => void;
  onUpdatedLabelMount: (element: HTMLSpanElement | null) => void;
  onTitleFocusConsumed: () => void;
};

export class NotesMobileFullscreenView {
  private bodyEditor: InkstoneEditorHandle | null = null;

  constructor(private readonly options: NotesMobileFullscreenViewOptions) {}

  public render(state: NotesMobileFullscreenViewState): void {
    this.renderHeader(state);
    this.renderBody(state);
  }

  private renderHeader(state: NotesMobileFullscreenViewState): void {
    const { headerTitleWrap, headerActions, i18n } = this.options;
    headerTitleWrap.replaceChildren();
    headerActions.replaceChildren();

    const titleRow = document.createElement('div');
    titleRow.className = 'flex min-w-0 items-center gap-3';

    if (state.view === 'editor' && state.selectedNote) {
      const backButton = createIconButton({
        icon: 'chevron-left',
        tone: 'text',
        size: 'sm',
        title: i18n.t('existingPicker.backToList'),
        ariaLabel: i18n.t('existingPicker.backToList'),
        onClick: () => {
          this.options.onBack();
        },
      });
      backButton.classList.add('shrink-0');
      titleRow.appendChild(backButton);
    } else {
      const iconWrap = document.createElement('div');
      iconWrap.className =
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600';
      iconWrap.appendChild(
        createIcon('document', {
          size: 18,
          strokeWidth: 1.8,
        })
      );
      titleRow.appendChild(iconWrap);
    }

    const titleStack = document.createElement('div');
    titleStack.className = 'min-w-0 flex-1';

    const title = document.createElement('h2');
    title.className =
      'min-w-0 truncate text-base font-semibold leading-6 tracking-tight text-slate-900';
    title.textContent = i18n.t('notes.modal.title');
    titleStack.appendChild(title);
    titleRow.appendChild(titleStack);
    headerTitleWrap.appendChild(titleRow);

    if (state.view === 'list') {
      if (state.closeButton) {
        headerActions.appendChild(state.closeButton);
      }
      return;
    }

    if (state.selectedNote) {
      const note = state.selectedNote;
      const pinButton = createIconButton({
        icon: note.is_pinned ? 'bookmark-solid' : 'bookmark',
        tone: 'text',
        size: 'sm',
        title: note.is_pinned ? i18n.t('notes.unpin') : i18n.t('notes.pin'),
        ariaLabel: note.is_pinned ? i18n.t('notes.unpin') : i18n.t('notes.pin'),
        disabled: this.options.isNoteActionDisabled(note.id),
        onClick: () => {
          this.options.onTogglePin(note);
        },
      });
      headerActions.appendChild(pinButton);
      headerActions.appendChild(
        this.options.createActionMenu(note, 'editor', {
          buttonClassName: 'text-slate-600',
        })
      );
    }

    if (state.closeButton) {
      headerActions.appendChild(state.closeButton);
    }
  }

  private renderBody(state: NotesMobileFullscreenViewState): void {
    this.bodyEditor?.destroy();
    this.bodyEditor = null;
    this.options.contentHost.replaceChildren();
    this.options.onTitleInputMount(null);
    this.options.onBodyInputMount(null);
    this.options.onUpdatedLabelMount(null);

    if (state.view === 'editor') {
      this.options.contentHost.appendChild(this.renderEditor(state));
      return;
    }

    this.options.contentHost.appendChild(this.renderList(state));
  }

  private renderList(state: NotesMobileFullscreenViewState): HTMLElement {
    const { i18n } = this.options;
    const content = document.createElement('div');
    content.className = 'flex min-h-0 flex-1 flex-col bg-white';

    const scroll = document.createElement('div');
    scroll.className = 'min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3';
    content.appendChild(scroll);

    if (state.loading && !state.hasAnyNotes) {
      const loading = document.createElement('p');
      loading.className = 'px-1 py-8 text-sm text-slate-500';
      loading.textContent = i18n.t('notes.loading');
      scroll.appendChild(loading);
      return content;
    }

    if (state.errorText && !state.hasAnyNotes) {
      const error = document.createElement('p');
      error.className = 'px-1 py-8 text-sm text-rose-600';
      error.textContent = state.errorText;
      scroll.appendChild(error);
      return content;
    }

    if (!state.hasAnyNotes) {
      const empty = document.createElement('div');
      empty.className =
        'flex min-h-[18rem] flex-col items-center justify-center gap-4 px-4 text-center';

      const iconWrap = document.createElement('div');
      iconWrap.className =
        'inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-100 text-slate-500';
      iconWrap.appendChild(
        createIcon('document', {
          size: 20,
          strokeWidth: 1.8,
        })
      );
      empty.appendChild(iconWrap);

      const title = document.createElement('p');
      title.className = 'text-sm font-semibold text-slate-900';
      title.textContent = i18n.t('notes.empty');
      empty.appendChild(title);

      scroll.appendChild(empty);
      return content;
    }

    const activeSection = document.createElement('section');
    activeSection.className = 'space-y-2';
    state.activeNotes.forEach((note) => {
      activeSection.appendChild(this.renderListItem(note, state.selectedNote?.id ?? null));
    });
    scroll.appendChild(activeSection);

    if (state.archivedNotes.length > 0) {
      const archivedSection = document.createElement('section');
      archivedSection.className = 'mt-6 space-y-2';

      const heading = document.createElement('p');
      heading.className =
        'px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400';
      heading.textContent = i18n.t('notes.tab.archived', {
        count: state.summary.archived,
      });
      archivedSection.appendChild(heading);

      state.archivedNotes.forEach((note) => {
        archivedSection.appendChild(
          this.renderListItem(note, state.selectedNote?.id ?? null)
        );
      });
      scroll.appendChild(archivedSection);
    }

    const footer = document.createElement('div');
    footer.className =
      'shrink-0 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur';

    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.className =
      'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition active:scale-[0.99] active:bg-slate-800';
    const createIconEl = createIcon('pencil-square', {
      size: 18,
      strokeWidth: 1.8,
    });
    createIconEl.setAttribute('aria-hidden', 'true');
    const createLabel = document.createElement('span');
    createLabel.textContent = i18n.t('notes.newNote');
    createButton.append(createIconEl, createLabel);
    createButton.addEventListener('click', () => {
      this.options.onCreateNote();
    });
    footer.appendChild(createButton);
    content.appendChild(footer);

    return content;
  }

  private renderListItem(note: Note, selectedNoteId: string | null): HTMLElement {
    const { i18n } = this.options;
    const row = document.createElement('div');
    row.className =
      note.id === selectedNoteId
        ? 'flex min-h-16 items-start gap-2 rounded-2xl bg-slate-100 px-3 py-3'
        : 'flex min-h-16 items-start gap-2 rounded-2xl px-3 py-3 transition active:scale-[0.995] active:bg-slate-100';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'min-h-10 min-w-0 flex-1 self-stretch text-left';
    selectButton.addEventListener('click', () => {
      this.options.onSelectNote(note.id);
    });

    const title = document.createElement('p');
    title.className = 'truncate text-[0.95rem] font-semibold text-slate-900';
    title.textContent = note.title.trim() || i18n.t('notes.untitled');
    selectButton.appendChild(title);

    const bodyText = note.body.trim();
    if (bodyText) {
      const snippet = bodyText.length > 120 ? `${bodyText.slice(0, 117)}...` : bodyText;
      const body = document.createElement('p');
      body.className = 'mt-1 line-clamp-2 text-sm leading-5 text-slate-500';
      body.textContent = snippet;
      selectButton.appendChild(body);
    }

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 items-center gap-1 self-center';

    const pinButton = createIconButton({
      icon: note.is_pinned ? 'bookmark-solid' : 'bookmark',
      tone: 'text',
      size: 'sm',
      title: note.is_pinned ? i18n.t('notes.unpin') : i18n.t('notes.pin'),
      ariaLabel: note.is_pinned ? i18n.t('notes.unpin') : i18n.t('notes.pin'),
      disabled: this.options.isNoteActionDisabled(note.id),
      onClick: () => {
        this.options.onTogglePin(note);
      },
    });
    actions.appendChild(pinButton);
    actions.appendChild(
      this.options.createActionMenu(note, 'sidebar', {
        buttonClassName: 'text-slate-500',
      })
    );

    row.append(selectButton, actions);
    return row;
  }

  private renderEditor(state: NotesMobileFullscreenViewState): HTMLElement {
    const { i18n } = this.options;
    const note = state.selectedNote;
    const wrap = document.createElement('div');
    wrap.className = 'flex min-h-0 flex-1 flex-col bg-white';

    if (!note) {
      return wrap;
    }

    const scroll = document.createElement('div');
    scroll.className =
      'flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4';
    wrap.appendChild(scroll);

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = state.titleValue;
    titleInput.placeholder = i18n.t('notes.titlePlaceholder');
    titleInput.className =
      'w-full border-none bg-transparent px-0 text-[1.7rem] font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300';
    titleInput.addEventListener('input', () => {
      this.options.onTitleInput(titleInput.value);
    });
    scroll.appendChild(titleInput);
    this.options.onTitleInputMount(titleInput);

    const editorHost = document.createElement('div');
    editorHost.className = 'mt-5 flex min-h-[20rem] flex-1';
    scroll.appendChild(editorHost);

    this.bodyEditor = createNotesBodyEditor({
      value: state.bodyValue,
      placeholder: i18n.t('notes.bodyPlaceholder'),
      mobile: true,
      onChange: (value) => {
        this.options.onBodyInput(value);
      },
    });
    this.bodyEditor.mount(editorHost);
    this.options.onBodyInputMount(this.bodyEditor.getInputElement());

    const metaRow = document.createElement('div');
    metaRow.className = 'mt-4 px-1 text-xs text-slate-400';
    const updated = document.createElement('span');
    updated.textContent = state.updatedText;
    metaRow.appendChild(updated);
    scroll.appendChild(metaRow);
    this.options.onUpdatedLabelMount(updated);

    if (state.focusTitleOnRender) {
      queueMicrotask(() => {
        titleInput.focus();
        titleInput.select();
      });
      this.options.onTitleFocusConsumed();
    }

    return wrap;
  }
}
