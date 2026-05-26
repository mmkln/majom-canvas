// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest';
import { AppRuntime } from '../../../app-runtime/index.ts';
import type {
  Board,
  Card,
  CardEntityLink,
  CardChecklist,
  Tag,
} from '../../../majom-wrapper/interfaces/index.ts';
import type {
  BoardEntityCatalogPort,
  BoardTagCatalogPort,
  BoardsIntentHandlers,
  BoardsState,
} from '../domain/types.ts';
import type {
  BoardsExportResult,
  BoardsImportApplyResult,
  BoardsImportPlan,
} from '../exchange/schema.ts';
import { BoardsView } from './BoardsView.ts';
import { notify } from '../../../ui-lib/src/services/NotificationService.ts';

vi.mock('../../../ui-lib/src/services/NotificationService.ts', () => ({
  notify: vi.fn(),
}));

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const SOURCE_BOARD_ID = '00000000-0000-4000-8000-000000000003';
const COLUMN_TODO = '00000000-0000-4000-8000-000000000010';
const COLUMN_READING = '00000000-0000-4000-8000-000000000011';
const SOURCE_COLUMN_ID = '00000000-0000-4000-8000-000000000031';
const CARD_BOOK = '00000000-0000-4000-8000-000000000020';
const CARD_MIRROR = '00000000-0000-4000-8000-000000000021';
const PLACEMENT_BOOK = '00000000-0000-4000-8000-000000000200';
const PLACEMENT_MIRROR = '00000000-0000-4000-8000-000000000201';
const SOURCE_PLACEMENT_ID = '00000000-0000-4000-8000-000000000301';
const CHECKLIST_SETUP = '00000000-0000-4000-8000-000000000401';
const CHECKITEM_DONE = '00000000-0000-4000-8000-000000000501';
const CHECKITEM_OPEN = '00000000-0000-4000-8000-000000000502';
const TASK_LINK = '00000000-0000-4000-8000-000000000601';
const LINKED_TASK = '00000000-0000-4000-8000-000000000701';

function createRuntime(): AppRuntime {
  return new AppRuntime({
    initialLocale: 'en',
    energyService: null,
  });
}

function createHandlers(): BoardsIntentHandlers {
  const importPlan: BoardsImportPlan = {
    scope: 'board',
    canApply: true,
    counts: { create: 3, update: 0, skip: 0, conflict: 0 },
    items: [
      {
        action: 'create',
        entity: 'board',
        title: 'Imported board',
        path: 'payload',
        reason: 'new-board',
      },
    ],
    diagnostics: [],
    warnings: [],
    errors: [],
  };
  const exportResult: BoardsExportResult = {
    format: 'markdown',
    scope: 'board',
    fileName: 'board-books.md',
    content: [
      '---',
      'schema: majom.boards.exchange',
      'scope: board',
      'title: "Books"',
      '---',
    ].join('\n'),
  };
  const applyResult: BoardsImportApplyResult = {
    scope: 'board',
    created: {
      boardId: BOARD_ID,
      columnIds: [],
      cardIds: [],
      checklistIds: [],
      checkItemIds: [],
    },
  };
  return {
    onRefresh: vi.fn(),
    onSelectBoard: vi.fn(),
    onCreateBoard: vi.fn(),
    onPatchBoard: vi.fn(),
    onToggleBoardStar: vi.fn(),
    onUpdateBoardGroup: vi.fn(),
    onDeleteBoard: vi.fn(),
    onCreateColumn: vi.fn(),
    onPatchColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
    onCreateCard: vi.fn(),
    onPatchCard: vi.fn(),
    onLoadCardChecklists: vi.fn(async () => []),
    onCreateCardChecklist: vi.fn(async () => null),
    onDeleteCardChecklist: vi.fn(),
    onCreateCardCheckItem: vi.fn(async () => null),
    onPatchCardCheckItem: vi.fn(async () => null),
    onDeleteCardCheckItem: vi.fn(),
    onCreateCardEntityLink: vi.fn(async () => null),
    onCreateCardEntityFromCard: vi.fn(async () => null),
    onDeleteCardEntityLink: vi.fn(),
    onDeleteLinkedEntity: vi.fn(),
    onCreateCardMirror: vi.fn(),
    onPatchCardPlacement: vi.fn(),
    onDeleteCardPlacement: vi.fn(),
    onDeleteCard: vi.fn(),
    onPreviewImport: vi.fn(async () => importPlan),
    onExportData: vi.fn(async () => exportResult),
    onApplyImport: vi.fn(async () => applyResult),
  };
}

function openBoardImportModal(root: HTMLElement): HTMLElement {
  root
    .querySelector<HTMLButtonElement>('button[aria-label="Board menu"]')
    ?.click();
  Array.from(root.querySelectorAll('button'))
    .find((button) => button.textContent === 'Import board')
    ?.click();
  const modal = document.querySelector<HTMLElement>(
    '[data-testid="boards-import-preview-modal"]'
  );
  expect(modal).not.toBeNull();
  return modal!;
}

function createTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 1,
    title: 'Research',
    slug: 'research',
    color: '#2563eb',
    description: null,
    ...overrides,
  };
}

function createTagCatalog(tags: Tag[]): BoardTagCatalogPort {
  let currentTags = [...tags];
  return {
    loadTags: vi.fn(async () => currentTags),
    createTag: vi.fn(async (title, color) => {
      const tag = createTag({
        id: 100 + title.length,
        title,
        slug: title.trim().toLowerCase().replace(/\s+/g, '-'),
        color: color ?? '#0f766e',
      });
      currentTags = [...currentTags, tag];
      return tag;
    }),
    updateTag: vi.fn(async (id, patch) => {
      const previous =
        currentTags.find((tag) => tag.id === id) ?? createTag({ id });
      const updated = {
        ...previous,
        ...patch,
      };
      currentTags = currentTags.map((tag) => (tag.id === id ? updated : tag));
      return updated;
    }),
    deleteTag: vi.fn(async (id) => {
      currentTags = currentTags.filter((tag) => tag.id !== id);
    }),
  };
}

function createEntityCatalog(): BoardEntityCatalogPort {
  return {
    searchTasks: vi.fn(async () => [
      {
        id: LINKED_TASK,
        title: 'Write implementation plan',
        status: 'open',
      },
    ]),
    searchStories: vi.fn(async () => []),
    searchGoals: vi.fn(async () => []),
  };
}

function createCardEntityLink(): CardEntityLink {
  return {
    id: TASK_LINK,
    card: CARD_BOOK,
    entity_type: 'task',
    entity_id: LINKED_TASK,
    entity: {
      id: LINKED_TASK,
      title: 'Write implementation plan',
      status: 'open',
    },
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function dispatchPointerEvent(
  target: EventTarget,
  type: string,
  options: {
    clientX: number;
    clientY: number;
    pointerId?: number;
    button?: number;
    isPrimary?: boolean;
  }
): void {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: options.clientX,
    clientY: options.clientY,
    button: options.button ?? 0,
  });
  Object.defineProperty(event, 'pointerId', {
    value: options.pointerId ?? 1,
  });
  Object.defineProperty(event, 'isPrimary', {
    value: options.isPrimary ?? true,
  });
  target.dispatchEvent(event);
}

function setRect(
  element: Element,
  rect: { left: number; top: number; width: number; height: number }
): void {
  const value = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  } as DOMRect;
  element.getBoundingClientRect = () => value;
}

function createBoard(): Board {
  return {
    id: BOARD_ID,
    title: 'Books',
    columns: [
      {
        id: COLUMN_TODO,
        board: BOARD_ID,
        title: 'To Read',
        order: 0,
        cards: [
          {
            id: CARD_BOOK,
            placement_id: PLACEMENT_BOOK,
            column: COLUMN_TODO,
            title: 'Design of Everyday Things',
            description: 'Interaction design notes',
            order: 0,
          },
        ],
      },
    ],
  };
}

function createState(board = createBoard()): BoardsState {
  return {
    boards: [board],
    selectedBoardId: board.id,
    status: 'idle',
    error: null,
    optimistic: {
      cards: {},
      placements: {},
      columns: {},
      resolved: {
        cards: {},
        placements: {},
        columns: {},
      },
    },
  };
}

function createChecklist(): CardChecklist {
  return {
    id: CHECKLIST_SETUP,
    card: CARD_BOOK,
    title: 'Setup',
    pos: '1024.000000000000000',
    items: [
      {
        id: CHECKITEM_DONE,
        checklist: CHECKLIST_SETUP,
        title: 'Create funnel',
        state: 'complete',
        pos: '1024.000000000000000',
      },
      {
        id: CHECKITEM_OPEN,
        checklist: CHECKLIST_SETUP,
        title: 'Connect calendar',
        state: 'incomplete',
        pos: '2048.000000000000000',
      },
    ],
  };
}

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('BoardsView', () => {
  it('reports page-level errors through the global toaster instead of an inline board banner', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const runtime = createRuntime();
    const view = new BoardsView(root, {
      runtime,
      handlers,
    });
    const state = {
      ...createState(),
      status: 'error' as const,
      error: 'boards.errors.save',
    };

    view.render(state);
    view.render(state);

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      runtime.i18n.t('boards.errors.save'),
      'error'
    );
    expect(root.textContent).not.toContain(
      runtime.i18n.t('boards.errors.save')
    );
    view.destroy();
  });

  it('preserves board and column scroll across rerenders of the same board', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const canvas = root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    )!;
    const cardsContainer = root.querySelector<HTMLElement>(
      '[data-board-cards-container="true"]'
    )!;
    canvas.scrollLeft = 320;
    cardsContainer.scrollTop = 140;

    view.render(
      createState({
        ...board,
        columns: [
          {
            ...board.columns[0]!,
            title: 'Reading soon',
          },
        ],
      })
    );

    expect(
      root.querySelector<HTMLElement>('[data-board-canvas="true"]')?.scrollLeft
    ).toBe(320);
    expect(
      root.querySelector<HTMLElement>('[data-board-cards-container="true"]')
        ?.scrollTop
    ).toBe(140);
    view.destroy();
  });

  it('renders backend card tags on the card front', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      tags: [createTag()],
      tag_ids: [1],
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });

    view.render(createState(board));

    const tags = root.querySelector<HTMLElement>(
      '[data-testid="board-card-tags"]'
    );
    const compactLabel = tags?.querySelector<HTMLElement>(
      '[data-testid="compact-card-label"]'
    );
    expect(tags?.textContent).toBe('');
    expect(compactLabel?.getAttribute('aria-label')).toBe('Research');
    expect(compactLabel?.style.backgroundColor).toBe('rgb(37, 99, 235)');
    view.destroy();
  });

  it('renders card front badges without exposing a delete action on the card', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    (
      board.columns[0].cards[0] as Card & { commentsCount: number }
    ).commentsCount = 2;
    board.columns[0].cards[0]!.checklist_summary = {
      total: 3,
      completed: 1,
    };
    board.columns[0].cards[0]!.entity_links = [createCardEntityLink()];
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });

    view.render(createState(board));

    expect(root.querySelector('[aria-label="Delete card"]')).toBeNull();
    expect(root.textContent).not.toContain('Interaction design notes');
    expect(
      root.querySelector('[aria-label="Card description"]')
    ).not.toBeNull();
    expect(
      root.querySelector('[data-icon-name="bars-3-bottom-left"]')
    ).not.toBeNull();
    expect(
      root.querySelector('[aria-label="Comments and activity: 2"]')
    ).not.toBeNull();
    expect(
      root.querySelector('[data-icon-name="chat-bubble-bottom-center-text"]')
    ).not.toBeNull();
    expect(root.querySelector('[aria-label="Checklist: 1/3"]')).not.toBeNull();
    expect(root.querySelector('[data-icon-name="check-box"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Linked tasks: 1"]')).not.toBeNull();
    expect(
      root.querySelector('[data-testid="card-mirror-source-label"]')
    ).toBeNull();
    view.destroy();
  });

  it('renders mirror cards with source context without marking originals', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards.push({
      id: CARD_MIRROR,
      placement_id: PLACEMENT_MIRROR,
      column: COLUMN_TODO,
      title: 'Mirrored strategy',
      description: '',
      order: 1,
      mirror_source: {
        board_id: SOURCE_BOARD_ID,
        board_title: 'Strategy',
        column_id: SOURCE_COLUMN_ID,
        column_title: 'Source list',
        placement_id: SOURCE_PLACEMENT_ID,
        archived: false,
      },
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });

    view.render(createState(board));

    const labels = root.querySelectorAll(
      '[data-testid="card-mirror-source-label"]'
    );
    expect(labels).toHaveLength(1);
    expect(labels[0]?.textContent).toBe('Strategy / Source list');
    expect(
      root.querySelector(`[data-board-card-open="${PLACEMENT_BOOK}"]`)
        ?.textContent
    ).not.toContain('Strategy / Source list');
    view.destroy();
  });

  it('uses mirror_source as the public mirror placement contract', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      mirror_source: null,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });

    view.render(createState(board));

    expect(
      root.querySelector('[data-testid="card-mirror-source-label"]')
    ).toBeNull();
    expect(root.textContent).not.toContain('Strategy / Source list');
    view.destroy();
  });

  it('toggles card completion from the card front without opening details', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const toggle = root.querySelector<HTMLButtonElement>(
      '[data-testid="board-card-completion-toggle"]'
    );
    expect(toggle?.title).toBe('Mark complete');
    toggle?.click();

    const patch = vi.mocked(handlers.onPatchCard).mock.calls[0]?.[1];
    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      completedAt: expect.any(Date),
    });
    expect(patch?.completedAt).toBeInstanceOf(Date);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    view.destroy();
  });

  it('keeps the completion toggle active for completed cards and can clear it', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      completedAt: new Date('2026-05-10T10:00:00.000Z'),
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const toggle = root.querySelector<HTMLButtonElement>(
      '[data-testid="board-card-completion-toggle"]'
    );
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(toggle?.title).toBe('Mark incomplete');
    toggle?.click();

    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      completedAt: null,
    });
    view.destroy();
  });

  it('opens a quick card editor next to the card on right click', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLElement>(`[data-board-card-id="${CARD_BOOK}"]`)
      ?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        })
      );

    const editor = document.querySelector<HTMLElement>(
      '[data-testid="quick-card-editor-menu"]'
    );
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute('aria-label')).toBe('Edit card options');
    expect(
      editor?.querySelector('[data-testid="quick-card-editor-buttons"]')
    ).not.toBeNull();
    expect(editor?.textContent).toContain('Mirror');
    expect(editor?.textContent).toContain('Delete card');
    expect(editor?.textContent).not.toContain('Change members');
    expect(editor?.textContent).not.toContain('Change cover');
    expect(editor?.textContent).not.toContain('Edit dates');
    expect(editor?.textContent).not.toContain('Create Jira work item');
    expect(editor?.textContent).not.toContain('Copy card');
    expect(editor?.textContent).not.toContain('Copy link');
    expect(
      editor?.querySelector(
        '[data-testid="quick-card-editor-buttons"] button:disabled'
      )
    ).toBeNull();

    const title = editor?.querySelector<HTMLTextAreaElement>(
      '[data-testid="quick-card-editor-card-title"]'
    );
    expect(title?.value).toBe('Design of Everyday Things');
    title!.value = 'The Design of Everyday Things';
    editor?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      title: 'The Design of Everyday Things',
    });
    expect(
      document.querySelector('[data-testid="quick-card-editor-menu"]')
    ).toBeNull();
    view.destroy();
  });

  it('deletes a card from the quick editor after confirmation', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLElement>(`[data-board-card-id="${CARD_BOOK}"]`)
      ?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        })
      );
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="quick-card-editor-delete-card"]'
      )
      ?.click();

    expect(
      document.querySelector('[data-testid="quick-card-editor-menu"]')
    ).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="delete-card-confirm-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(handlers.onDeleteCard).toHaveBeenCalledWith(CARD_BOOK);
    expect(
      document.querySelector('[data-testid="quick-card-editor-menu"]')
    ).toBeNull();
    view.destroy();
  });

  it('labels mirror placement removal in quick editor and card details actions', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      mirror_source: {
        board_id: BOARD_ID,
        board_title: 'Books',
        column_id: COLUMN_TODO,
        column_title: 'To Read',
        placement_id: PLACEMENT_BOOK,
        archived: false,
      },
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLElement>(`[data-board-card-id="${CARD_BOOK}"]`)
      ?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        })
      );

    expect(
      document.querySelector('[data-testid="quick-card-editor-menu"]')
        ?.textContent
    ).toContain('Remove from this board');
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="quick-card-editor-archive"]'
      )
      ?.click();
    expect(handlers.onDeleteCardPlacement).toHaveBeenCalledWith(PLACEMENT_BOOK);
    vi.mocked(handlers.onDeleteCardPlacement).mockClear();

    view.render(createState(board));
    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-actions-button"]'
      )
      ?.click();

    const actions = document.querySelector<HTMLElement>(
      '[data-testid="card-back-actions-popover"]'
    );
    expect(actions?.textContent).toContain('Remove from this board');
    expect(
      document.querySelector('[data-testid="card-mirror-source-label"]')
        ?.textContent
    ).toBe('Books / To Read');
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-archive-button"]'
      )
      ?.click();
    expect(handlers.onDeleteCardPlacement).toHaveBeenCalledWith(PLACEMENT_BOOK);
    expect(handlers.onDeleteCard).not.toHaveBeenCalled();
    view.destroy();
  });

  it('archives primary source cards from quick editor and card details actions', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      mirror_source: null,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLElement>(`[data-board-card-id="${CARD_BOOK}"]`)
      ?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        })
      );
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="quick-card-editor-archive"]'
      )
      ?.click();
    expect(handlers.onDeleteCard).toHaveBeenCalledWith(CARD_BOOK);
    expect(handlers.onDeleteCardPlacement).not.toHaveBeenCalled();
    vi.mocked(handlers.onDeleteCard).mockClear();

    view.render(createState(board));
    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-actions-button"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-archive-button"]'
      )
      ?.click();

    expect(handlers.onDeleteCard).toHaveBeenCalledWith(CARD_BOOK);
    expect(handlers.onDeleteCardPlacement).not.toHaveBeenCalled();
    view.destroy();
  });

  it('opens card details in a modal and saves changed card fields', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog).not.toBeNull();
    const title = dialog?.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-title="true"]'
    );
    const description = dialog?.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-description="true"]'
    );
    expect(title?.value).toBe('Design of Everyday Things');
    expect(title?.rows).toBe(1);
    expect(dialog?.textContent).toContain('Comments and activity');
    expect(dialog?.textContent).toContain('Attachments');
    expect(dialog?.textContent).toContain('Link entity');
    expect(dialog?.textContent).toContain('Create Task');
    expect(dialog?.textContent).toContain('Create Story');
    expect(dialog?.textContent).toContain('Create Goal');
    expect(dialog?.textContent).not.toContain('Mirroring');
    expect(dialog?.querySelector('[aria-label="Cover"]')).toBeNull();
    title!.value = 'The Design of Everyday Things';
    description!.value = 'Updated notes';

    const saveButton = Array.from(dialog!.querySelectorAll('button')).find(
      (button) => button.textContent === 'Save'
    );
    saveButton?.click();

    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      title: 'The Design of Everyday Things',
      description: 'Updated notes',
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    view.destroy();
  });

  it('toggles card completion from the card details title control', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-completion-toggle"]'
      )
      ?.click();

    const patch = vi.mocked(handlers.onPatchCard).mock.calls[0]?.[1];
    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      completedAt: expect.any(Date),
    });
    expect(patch?.completedAt).toBeInstanceOf(Date);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    view.destroy();
  });

  it('creates a new linked task from card details', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    await flushPromises();

    const createTaskButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
    ).find((button) => button.textContent === 'Create Task');
    createTaskButton?.click();
    await flushPromises();

    expect(handlers.onCreateCardEntityFromCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: CARD_BOOK,
        title: 'Design of Everyday Things',
        description: 'Interaction design notes',
      }),
      'task'
    );
    view.destroy();
  });

  it('loads card checklists in card details and routes item toggles', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    vi.mocked(handlers.onLoadCardChecklists).mockResolvedValue([
      createChecklist(),
    ]);
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    await flushPromises();

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(handlers.onLoadCardChecklists).toHaveBeenCalledWith(CARD_BOOK);
    expect(dialog?.textContent).toContain('Setup');
    expect(dialog?.textContent).toContain('50%');
    expect(dialog?.textContent).toContain('Create funnel');
    expect(dialog?.textContent).toContain('Connect calendar');

    const openItemRow = Array.from(
      dialog!.querySelectorAll<HTMLElement>('[data-testid="card-check-item"]')
    ).find((row) => row.textContent?.includes('Connect calendar'));
    const itemMenuButton = openItemRow?.querySelector<HTMLButtonElement>(
      '[data-testid="card-check-item-menu-button"]'
    );
    expect(itemMenuButton?.getAttribute('aria-expanded')).toBe('false');
    itemMenuButton?.click();
    expect(itemMenuButton?.getAttribute('aria-expanded')).toBe('true');
    const itemMenu = document.querySelector<HTMLElement>(
      '[data-testid="card-check-item-menu-popover"]'
    );
    expect(itemMenu?.textContent).toContain('Delete');
    itemMenu
      ?.querySelector<HTMLButtonElement>(
        '[aria-label="Delete checklist item Connect calendar"]'
      )
      ?.click();
    await flushPromises();

    expect(handlers.onDeleteCardCheckItem).toHaveBeenCalledWith(CHECKITEM_OPEN);

    const hideCheckedButton = Array.from(
      dialog!.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Hide checked items');
    hideCheckedButton?.click();

    expect(dialog?.textContent).not.toContain('Create funnel');
    expect(dialog?.textContent).toContain('Show checked items (1)');

    const showCheckedButton = Array.from(
      dialog!.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Show checked items (1)');
    showCheckedButton?.click();

    expect(dialog?.textContent).toContain('Create funnel');

    const openItemTitle = Array.from(
      dialog!.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Connect calendar');
    openItemTitle?.click();
    const titleInput = dialog!.querySelector<HTMLInputElement>(
      'input[aria-label="Connect calendar"]:not([type="checkbox"])'
    );
    expect(titleInput?.value).toBe('Connect calendar');
    titleInput!.value = 'Connect booking calendar';
    titleInput!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    await flushPromises();

    expect(handlers.onPatchCardCheckItem).toHaveBeenCalledWith(CHECKITEM_OPEN, {
      title: 'Connect booking calendar',
    });
    vi.mocked(handlers.onPatchCardCheckItem).mockClear();

    dialog
      ?.querySelector<HTMLInputElement>('input[aria-label="Connect calendar"]')
      ?.click();
    await flushPromises();

    expect(handlers.onPatchCardCheckItem).toHaveBeenCalledWith(CHECKITEM_OPEN, {
      state: 'complete',
    });
    view.destroy();
  });

  it('opens pending card details without loading backend-only card data', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      id: 'temp:card',
      placement_id: 'temp:placement',
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render({
      ...createState(board),
      optimistic: {
        cards: { 'temp:card': 'creating' },
        placements: { 'temp:placement': 'creating' },
        columns: {},
        resolved: {
          cards: {},
          placements: {},
          columns: {},
        },
      },
    });

    root
      .querySelector<HTMLButtonElement>(
        '[data-board-card-open="temp:placement"]'
      )
      ?.click();
    await flushPromises();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(handlers.onLoadCardChecklists).not.toHaveBeenCalled();
    expect(
      Array.from(
        document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
      ).find((button) => button.textContent === 'Checklist')?.disabled
    ).toBe(true);
    expect(notify).not.toHaveBeenCalledWith(expect.any(String), 'error');
    view.destroy();
  });

  it('keeps pending card details open after the backend resolves real card ids', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const pendingBoard = createBoard();
    pendingBoard.columns[0]!.cards[0] = {
      id: 'temp:card',
      placement_id: 'temp:placement',
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const confirmedBoard = createBoard();
    confirmedBoard.columns[0]!.cards[0] = {
      id: CARD_BOOK,
      placement_id: PLACEMENT_BOOK,
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render({
      ...createState(pendingBoard),
      optimistic: {
        cards: { 'temp:card': 'creating' },
        placements: { 'temp:placement': 'creating' },
        columns: {},
        resolved: {
          cards: {},
          placements: {},
          columns: {},
        },
      },
    });

    root
      .querySelector<HTMLButtonElement>(
        '[data-board-card-open="temp:placement"]'
      )
      ?.click();
    await flushPromises();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(handlers.onLoadCardChecklists).not.toHaveBeenCalled();

    view.render({
      ...createState(confirmedBoard),
      optimistic: {
        cards: {},
        placements: {},
        columns: {},
        resolved: {
          cards: { 'temp:card': CARD_BOOK },
          placements: { 'temp:placement': PLACEMENT_BOOK },
          columns: {},
        },
      },
    });
    await flushPromises();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(handlers.onLoadCardChecklists).toHaveBeenCalledTimes(1);
    expect(handlers.onLoadCardChecklists).toHaveBeenCalledWith(CARD_BOOK);
    expect(handlers.onLoadCardChecklists).not.toHaveBeenCalledWith('temp:card');
    view.destroy();
  });

  it('preserves dirty pending card details fields when backend data resolves', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const pendingBoard = createBoard();
    pendingBoard.columns[0]!.cards[0] = {
      id: 'temp:card',
      placement_id: 'temp:placement',
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const confirmedBoard = createBoard();
    confirmedBoard.columns[0]!.cards[0] = {
      id: CARD_BOOK,
      placement_id: PLACEMENT_BOOK,
      column: COLUMN_TODO,
      title: 'Backend card title',
      description: 'Backend description',
      order: 0,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render({
      ...createState(pendingBoard),
      optimistic: {
        cards: { 'temp:card': 'creating' },
        placements: { 'temp:placement': 'creating' },
        columns: {},
        resolved: {
          cards: {},
          placements: {},
          columns: {},
        },
      },
    });

    root
      .querySelector<HTMLButtonElement>(
        '[data-board-card-open="temp:placement"]'
      )
      ?.click();
    const title = document.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-title="true"]'
    )!;
    const description = document.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-description="true"]'
    )!;
    title.value = 'User typed title';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    description.value = 'User typed description';
    description.dispatchEvent(new Event('input', { bubbles: true }));

    view.render({
      ...createState(confirmedBoard),
      optimistic: {
        cards: {},
        placements: {},
        columns: {},
        resolved: {
          cards: { 'temp:card': CARD_BOOK },
          placements: { 'temp:placement': PLACEMENT_BOOK },
          columns: {},
        },
      },
    });

    expect(
      document.querySelector<HTMLTextAreaElement>(
        '[data-board-card-modal-title="true"]'
      )?.value
    ).toBe('User typed title');
    expect(
      document.querySelector<HTMLTextAreaElement>(
        '[data-board-card-modal-description="true"]'
      )?.value
    ).toBe('User typed description');
    expect(handlers.onPatchCard).not.toHaveBeenCalled();
    view.destroy();
  });

  it('queues pending card details save until the backend resolves real card ids', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const pendingBoard = createBoard();
    pendingBoard.columns[0]!.cards[0] = {
      id: 'temp:card',
      placement_id: 'temp:placement',
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const confirmedBoard = createBoard();
    confirmedBoard.columns[0]!.cards[0] = {
      id: CARD_BOOK,
      placement_id: PLACEMENT_BOOK,
      column: COLUMN_TODO,
      title: 'New card',
      description: '',
      order: 0,
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render({
      ...createState(pendingBoard),
      optimistic: {
        cards: { 'temp:card': 'creating' },
        placements: { 'temp:placement': 'creating' },
        columns: {},
        resolved: {
          cards: {},
          placements: {},
          columns: {},
        },
      },
    });

    root
      .querySelector<HTMLButtonElement>(
        '[data-board-card-open="temp:placement"]'
      )
      ?.click();
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    dialog.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-title="true"]'
    )!.value = 'Queued title';
    dialog.querySelector<HTMLTextAreaElement>(
      '[data-board-card-modal-description="true"]'
    )!.value = 'Queued description';
    Array.from(dialog.querySelectorAll('button'))
      .find((button) => button.textContent === 'Save')
      ?.click();

    expect(handlers.onPatchCard).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    view.render({
      ...createState(confirmedBoard),
      optimistic: {
        cards: {},
        placements: {},
        columns: {},
        resolved: {
          cards: { 'temp:card': CARD_BOOK },
          placements: { 'temp:placement': PLACEMENT_BOOK },
          columns: {},
        },
      },
    });

    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      title: 'Queued title',
      description: 'Queued description',
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    view.destroy();
  });

  it('opens the checklist popover from card details and creates a checklist', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    await flushPromises();

    const checklistButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
    ).find((button) => button.textContent === 'Checklist');
    checklistButton?.click();

    const popover = document.querySelector<HTMLElement>(
      '[data-testid="card-back-checklist-popover"]'
    );
    const input = popover?.querySelector<HTMLInputElement>('input');
    const addButton = popover?.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    expect(popover?.textContent).toContain('Add checklist');
    expect(addButton?.textContent).toBe('Add');
    expect(input?.value).toBe('Checklist');

    input!.value = 'My Checklist';
    addButton?.click();
    await flushPromises();
    await flushPromises();

    expect(handlers.onCreateCardChecklist).toHaveBeenCalledWith(
      CARD_BOOK,
      'My Checklist'
    );
    expect(
      document.querySelector('[data-testid="card-back-checklist-popover"]')
    ).toBeNull();
    view.destroy();
  });

  it('links a card to an existing task from card details', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const entityCatalog = createEntityCatalog();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      entityCatalog,
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    await flushPromises();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-actions-button"]'
      )
      ?.click();
    const linkButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="card-back-link-entity-button"]'
    );
    linkButton?.click();
    await flushPromises();

    expect(entityCatalog.searchTasks).toHaveBeenCalledWith('');
    const result = document.querySelector<HTMLButtonElement>(
      '[data-testid="card-entity-link-result"]'
    );
    expect(result?.textContent).toContain('Write implementation plan');
    result?.click();
    await flushPromises();

    expect(handlers.onCreateCardEntityLink).toHaveBeenCalledWith(
      CARD_BOOK,
      'task',
      LINKED_TASK
    );
    expect(
      document.querySelector('[data-testid="card-entity-link-modal"]')
    ).toBeNull();
    view.destroy();
  });

  it('routes linked card entity actions through the entity menu', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0]!.entity_links = [createCardEntityLink()];
    const openListener = vi.fn();
    window.addEventListener('boardLinkedEntityOpenRequested', openListener);
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    await flushPromises();

    const links = document.querySelector<HTMLElement>(
      '[data-testid="card-entity-links"]'
    );
    expect(links?.textContent).toContain('Write implementation plan');
    const getMenuButton = () =>
      document.querySelector<HTMLButtonElement>(
        '[data-testid="card-entity-link-menu-button"]'
      );
    let menuButton = getMenuButton();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false');
    menuButton?.click();
    expect(menuButton?.getAttribute('aria-expanded')).toBe('true');

    let popover = document.querySelector<HTMLElement>(
      '[data-testid="card-entity-link-menu-popover"]'
    );
    expect(popover?.textContent).toContain('Open entity');
    expect(popover?.textContent).toContain('Unlink');
    expect(popover?.textContent).toContain('Delete entity');
    popover
      ?.querySelector<HTMLButtonElement>(
        '[aria-label="Open linked entity Write implementation plan"]'
      )
      ?.click();
    expect(openListener).toHaveBeenCalled();

    menuButton = getMenuButton();
    menuButton?.click();
    popover = document.querySelector<HTMLElement>(
      '[data-testid="card-entity-link-menu-popover"]'
    );
    popover
      ?.querySelector<HTMLButtonElement>(
        '[aria-label="Unlink Write implementation plan"]'
      )
      ?.click();
    await flushPromises();

    expect(handlers.onDeleteCardEntityLink).toHaveBeenCalledWith(TASK_LINK);

    menuButton = getMenuButton();
    menuButton?.click();
    popover = document.querySelector<HTMLElement>(
      '[data-testid="card-entity-link-menu-popover"]'
    );
    popover
      ?.querySelector<HTMLButtonElement>(
        '[aria-label="Delete linked entity Write implementation plan"]'
      )
      ?.click();
    await flushPromises();

    expect(handlers.onDeleteLinkedEntity).toHaveBeenCalledWith(
      expect.objectContaining({ id: CARD_BOOK }),
      expect.objectContaining({ id: TASK_LINK, entity_type: 'task' })
    );
    window.removeEventListener('boardLinkedEntityOpenRequested', openListener);
    view.destroy();
  });

  it('saves selected card labels immediately through the card patch payload', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards[0] = {
      ...board.columns[0]!.cards[0]!,
      tags: [createTag()],
      tag_ids: [1],
    };
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      tagCatalog: createTagCatalog([
        createTag(),
        createTag({
          id: 2,
          title: 'Strategy',
          slug: 'strategy',
          color: '#7c3aed',
        }),
      ]),
      handlers,
    });
    view.render(createState(board));
    await flushPromises();

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-add-label-button"]'
      )
      ?.click();
    const strategyRow = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-role="goal-tag-picker-list"] [data-testid="clickable-checkbox"]'
      )
    ).find((row) => row.textContent?.includes('Strategy'));
    strategyRow?.click();

    expect(
      document.querySelectorAll(
        '[data-testid="card-back-labels-container"] [data-testid="card-label"]'
      )
    ).toHaveLength(2);

    expect(handlers.onPatchCard).toHaveBeenCalledWith(CARD_BOOK, {
      tag_ids: [1, 2],
    });
    expect(handlers.onPatchCard).toHaveBeenCalledTimes(1);

    const saveButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
    ).find((button) => button.textContent === 'Save');
    saveButton?.click();

    expect(handlers.onPatchCard).toHaveBeenCalledTimes(1);
    view.destroy();
  });

  it('opens the label selector from quick actions when a card has no labels', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      tagCatalog: createTagCatalog([
        createTag({
          id: 2,
          title: 'Strategy',
          slug: 'strategy',
          color: '#7c3aed',
        }),
      ]),
      handlers,
    });
    view.render(createState());
    await flushPromises();

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    expect(
      document.querySelector('[data-testid="card-back-labels-container"]')
    ).toBeNull();

    const labelButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
    ).find((button) => button.textContent === 'Labels');
    labelButton?.click();

    expect(
      document.querySelector('[data-testid="card-back-label-picker-popover"]')
    ).not.toBeNull();
    const strategyRow = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-role="goal-tag-picker-list"] [data-testid="clickable-checkbox"]'
      )
    ).find((row) => row.textContent?.includes('Strategy'));
    strategyRow?.click();

    expect(
      document.querySelector('[data-testid="card-back-labels-container"]')
    ).not.toBeNull();
    expect(
      document.querySelectorAll(
        '[data-testid="card-back-labels-container"] [data-testid="card-label"]'
      )
    ).toHaveLength(1);
    view.destroy();
  });

  it('opens the move card popover from the card details list button', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>('[data-testid="card-back-list-button"]')
      ?.click();

    const popover = document.querySelector<HTMLElement>(
      '[data-testid="move-card-popover"]'
    );
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('Move card');
    expect(popover?.textContent).toContain('Select destination');

    const listSelect = popover?.querySelector<HTMLSelectElement>(
      '[data-testid="move-card-list-select-select"]'
    );
    expect(listSelect?.value).toBe(COLUMN_TODO);
    listSelect!.value = COLUMN_READING;
    listSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    popover
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="move-card-popover-move-button"]'
      )
      ?.click();

    expect(handlers.onPatchCardPlacement).toHaveBeenCalledWith(PLACEMENT_BOOK, {
      column: COLUMN_READING,
      position: 'bottom',
    });
    expect(
      document.querySelector('[data-testid="move-card-popover"]')
    ).toBeNull();
    view.destroy();
  });

  it('opens card details actions menu and starts mirroring from it', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="card-back-actions-button"]'
      )
      ?.click();

    const actions = document.querySelector<HTMLElement>(
      '[data-testid="card-back-actions-popover"]'
    );
    expect(actions).not.toBeNull();
    expect(actions?.textContent).toContain('Mirror');
    expect(actions?.textContent).not.toContain('Cover');

    actions
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="card-back-mirror-card-button"]'
      )
      ?.click();
    const mirrorPopover = document.querySelector<HTMLElement>(
      '[data-testid="move-card-popover"]'
    );
    expect(mirrorPopover).not.toBeNull();
    expect(mirrorPopover?.textContent).toContain('Mirror card');
    view.destroy();
  });

  it('creates a mirrored card placement from the quick editor mirror action', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLElement>(`[data-board-card-id="${CARD_BOOK}"]`)
      ?.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 80,
        })
      );

    document
      .querySelector<HTMLButtonElement>('[data-testid="mirror-new-button"]')
      ?.click();
    const popover = document.querySelector<HTMLElement>(
      '[data-testid="move-card-popover"]'
    );
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('Mirror card');
    expect(popover?.textContent).toContain(
      'This list already has this mirrored card.'
    );
    expect(
      popover?.querySelector<HTMLButtonElement>(
        '[data-testid="move-card-popover-move-button"]'
      )?.disabled
    ).toBe(false);
    popover
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="move-card-popover-move-button"]'
      )
      ?.click();

    expect(handlers.onCreateCardMirror).toHaveBeenCalledWith(
      CARD_BOOK,
      COLUMN_TODO,
      {
        after_placement: PLACEMENT_BOOK,
      }
    );
    expect(
      document.querySelector('[data-testid="quick-card-editor-menu"]')
    ).toBeNull();
    view.destroy();
  });

  it('drags a card to another column and emits a semantic placement target', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [
        {
          id: CARD_MIRROR,
          placement_id: PLACEMENT_MIRROR,
          column: COLUMN_READING,
          title: 'Refactoring UI',
          description: '',
          pos: '1024',
        },
      ],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const canvas = root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    )!;
    const columns = root.querySelectorAll<HTMLElement>(
      '[data-board-column-id]'
    );
    const sourceCard = root.querySelector<HTMLElement>(
      `[data-board-card-placement-id="${PLACEMENT_BOOK}"]`
    )!;
    const targetCard = root.querySelector<HTMLElement>(
      `[data-board-card-placement-id="${PLACEMENT_MIRROR}"]`
    )!;
    setRect(canvas, { left: 0, top: 0, width: 620, height: 500 });
    setRect(columns[0]!, { left: 0, top: 0, width: 272, height: 500 });
    setRect(columns[1]!, { left: 300, top: 0, width: 272, height: 500 });
    setRect(sourceCard, { left: 8, top: 50, width: 256, height: 64 });
    setRect(targetCard, { left: 308, top: 50, width: 256, height: 64 });

    dispatchPointerEvent(sourceCard, 'pointerdown', {
      clientX: 40,
      clientY: 70,
    });
    dispatchPointerEvent(window, 'pointermove', {
      clientX: 336,
      clientY: 52,
    });
    dispatchPointerEvent(window, 'pointerup', {
      clientX: 336,
      clientY: 52,
    });

    expect(handlers.onPatchCardPlacement).toHaveBeenCalledWith(PLACEMENT_BOOK, {
      column: COLUMN_READING,
      after_placement: PLACEMENT_MIRROR,
    });
    view.destroy();
  });

  it('does not show a card placeholder when dragging over the original slot', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns[0]!.cards.push({
      id: CARD_MIRROR,
      placement_id: PLACEMENT_MIRROR,
      column: COLUMN_TODO,
      title: 'Second card',
      description: '',
      order: 1,
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const canvas = root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    )!;
    const column = root.querySelector<HTMLElement>('[data-board-column-id]')!;
    const sourceCard = root.querySelector<HTMLElement>(
      `[data-board-card-placement-id="${PLACEMENT_BOOK}"]`
    )!;
    const secondCard = root.querySelector<HTMLElement>(
      `[data-board-card-placement-id="${PLACEMENT_MIRROR}"]`
    )!;
    setRect(canvas, { left: 0, top: 0, width: 620, height: 500 });
    setRect(column, { left: 0, top: 0, width: 272, height: 500 });
    setRect(sourceCard, { left: 8, top: 50, width: 256, height: 64 });
    setRect(secondCard, { left: 8, top: 122, width: 256, height: 64 });

    dispatchPointerEvent(sourceCard, 'pointerdown', {
      clientX: 40,
      clientY: 70,
    });
    dispatchPointerEvent(window, 'pointermove', {
      clientX: 48,
      clientY: 74,
    });

    expect(
      root.querySelector('.majom-boards__card-drag-placeholder')
    ).toBeNull();
    expect(handlers.onPatchCardPlacement).not.toHaveBeenCalled();

    dispatchPointerEvent(window, 'pointerup', {
      clientX: 48,
      clientY: 74,
    });
    view.destroy();
  });

  it('drags a list and emits a semantic column target', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const canvas = root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    )!;
    const columns = root.querySelectorAll<HTMLElement>(
      '[data-board-column-draggable="true"]'
    );
    setRect(canvas, { left: 0, top: 0, width: 620, height: 500 });
    setRect(columns[0]!, { left: 0, top: 0, width: 272, height: 500 });
    setRect(columns[1]!, { left: 300, top: 0, width: 272, height: 500 });

    dispatchPointerEvent(columns[0]!, 'pointerdown', {
      clientX: 40,
      clientY: 24,
    });
    dispatchPointerEvent(window, 'pointermove', {
      clientX: 500,
      clientY: 28,
    });
    dispatchPointerEvent(window, 'pointerup', {
      clientX: 500,
      clientY: 28,
    });

    expect(handlers.onPatchColumn).toHaveBeenCalledWith(COLUMN_TODO, {
      before_column: COLUMN_READING,
    });
    view.destroy();
  });

  it('does not show a list placeholder when dragging over the original slot', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    board.columns.push({
      id: COLUMN_READING,
      board: BOARD_ID,
      title: 'Reading',
      order: 1,
      cards: [],
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    const canvas = root.querySelector<HTMLElement>(
      '[data-board-canvas="true"]'
    )!;
    const columns = root.querySelectorAll<HTMLElement>(
      '[data-board-column-draggable="true"]'
    );
    setRect(canvas, { left: 0, top: 0, width: 620, height: 500 });
    setRect(columns[0]!, { left: 0, top: 0, width: 272, height: 500 });
    setRect(columns[1]!, { left: 300, top: 0, width: 272, height: 500 });

    dispatchPointerEvent(columns[0]!, 'pointerdown', {
      clientX: 40,
      clientY: 24,
    });
    dispatchPointerEvent(window, 'pointermove', {
      clientX: 48,
      clientY: 28,
    });

    expect(
      root.querySelector('.majom-boards__column-drag-placeholder')
    ).toBeNull();
    expect(handlers.onPatchColumn).not.toHaveBeenCalled();

    dispatchPointerEvent(window, 'pointerup', {
      clientX: 48,
      clientY: 28,
    });
    view.destroy();
  });

  it('uses the native confirmation dialog before deleting a card that has mirrored placements', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const board = createBoard();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState(board));

    root
      .querySelector<HTMLButtonElement>(
        `[data-board-card-open="${PLACEMENT_BOOK}"]`
      )
      ?.click();

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.textContent).not.toContain('Mirroring');
    expect(dialog?.textContent).not.toContain('Delete card');

    dialog
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="card-back-actions-button"]'
      )
      ?.click();
    const deleteButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="card-back-delete-card-button"]'
    );
    deleteButton?.click();

    const confirmation = document.querySelector<HTMLElement>(
      '[data-component="ModalContainer"]'
    );
    expect(confirmation?.textContent).toContain(
      'Delete this card from every board and list where it appears?'
    );
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="delete-card-cancel-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(handlers.onDeleteCard).not.toHaveBeenCalled();

    deleteButton?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="delete-card-confirm-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(handlers.onDeleteCard).toHaveBeenCalledWith(CARD_BOOK);
    view.destroy();
  });

  it('renames the selected board from the editable title', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root.querySelector<HTMLButtonElement>('h1 button')?.click();
    const titleInput = root.querySelector<HTMLInputElement>(
      'input[aria-label="Board title"]'
    );
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'Reading';
    titleInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(handlers.onPatchBoard).toHaveBeenCalledWith(BOARD_ID, {
      title: 'Reading',
    });
    view.destroy();
  });

  it('selects a board from the header board picker', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const primaryBoard = createBoard();
    const secondaryBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      columns: [],
    };
    view.render({
      boards: [primaryBoard, secondaryBoard],
      selectedBoardId: primaryBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="Search boards"]'
    );
    expect(searchInput).not.toBeNull();
    searchInput!.value = 'shared';
    searchInput!.dispatchEvent(new Event('input', { bubbles: true }));
    document
      .querySelector<HTMLButtonElement>(
        `[data-board-picker-board-id="${SOURCE_BOARD_ID}"]`
      )
      ?.click();

    expect(handlers.onSelectBoard).toHaveBeenCalledWith(SOURCE_BOARD_ID);
    view.destroy();
  });

  it('creates a board from the header board picker grid', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    const createButton = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '.majom-boards-board-picker__create-card'
      )
    ).find((button) => button.textContent === 'Create new board');
    expect(createButton).not.toBeNull();
    createButton!.click();

    expect(handlers.onCreateBoard).toHaveBeenCalledWith('New board');
    expect(
      document.querySelector('[data-testid="board-picker-popover"]')
    ).toBeNull();
    view.destroy();
  });

  it('filters the header board picker using board meta', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const activeBoard = {
      ...createBoard(),
      meta: { favorite: false, updated_at: '2026-01-02T00:00:00.000Z' },
    };
    const starredBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      meta: { favorite: true, updated_at: '2026-01-01T00:00:00.000Z' },
      columns: [],
    };
    const recentBoard: Board = {
      id: '00000000-0000-4000-8000-000000000004',
      title: 'Roadmap',
      meta: { lastActivityAt: '2026-01-03T00:00:00.000Z' },
      columns: [],
    };
    const undatedBoard: Board = {
      id: '00000000-0000-4000-8000-000000000005',
      title: 'Archive',
      meta: null,
      columns: [],
    };
    view.render({
      boards: [activeBoard, starredBoard, recentBoard, undatedBoard],
      selectedBoardId: activeBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    document
      .querySelectorAll<HTMLButtonElement>('.majom-boards-board-picker__chip')
      .forEach((button) => {
        if (button.textContent === 'Starred') button.click();
      });
    expect(
      document.querySelectorAll('[data-board-picker-board-id]')
    ).toHaveLength(1);
    expect(
      document.querySelector(
        `[data-board-picker-board-id="${SOURCE_BOARD_ID}"]`
      )
    ).not.toBeNull();

    document
      .querySelectorAll<HTMLButtonElement>('.majom-boards-board-picker__chip')
      .forEach((button) => {
        if (button.textContent === 'Recent') button.click();
      });
    const recentIds = Array.from(
      document.querySelectorAll<HTMLElement>('[data-board-picker-board-id]')
    ).map((button) => button.dataset.boardPickerBoardId);
    expect(recentIds).toEqual([
      recentBoard.id,
      activeBoard.id,
      starredBoard.id,
    ]);
    view.destroy();
  });

  it('collapses board picker sections from the section chevron', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const activeBoard = {
      ...createBoard(),
      meta: { favorite: true },
    };
    const secondaryBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      meta: null,
      columns: [],
    };
    view.render({
      boards: [activeBoard, secondaryBoard],
      selectedBoardId: activeBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    const yourBoardsSection = document.querySelector<HTMLElement>(
      '[data-board-picker-section="yourBoards"]'
    );
    const toggle =
      yourBoardsSection?.querySelector<HTMLButtonElement>('h2 button');
    const grid = yourBoardsSection?.querySelector<HTMLElement>(
      '.majom-boards-board-picker__grid'
    );

    expect(toggle).not.toBeNull();
    expect(grid?.hidden).toBe(false);
    toggle!.click();
    expect(
      document
        .querySelector<HTMLElement>('[data-board-picker-section="yourBoards"]')
        ?.querySelector<HTMLElement>('.majom-boards-board-picker__grid')?.hidden
    ).toBe(true);
    view.destroy();
  });

  it('toggles starred state from board picker cards', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const primaryBoard = createBoard();
    const secondaryBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      meta: { favorite: true },
      columns: [],
    };
    view.render({
      boards: [primaryBoard, secondaryBoard],
      selectedBoardId: primaryBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    const primaryCard = document
      .querySelector<HTMLElement>(`[data-board-picker-board-id="${BOARD_ID}"]`)
      ?.closest('.majom-boards-board-picker__card');
    primaryCard
      ?.querySelector<HTMLButtonElement>('button[aria-label="Star board"]')
      ?.click();

    expect(handlers.onToggleBoardStar).toHaveBeenCalledWith(BOARD_ID);
    expect(handlers.onSelectBoard).not.toHaveBeenCalled();
    expect(
      document.querySelector(
        `[data-board-picker-section="starred"] [data-board-picker-board-id="${SOURCE_BOARD_ID}"]`
      )
    ).not.toBeNull();
    view.destroy();
  });

  it('groups boards and creates board groups from card actions', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const primaryBoard = createBoard();
    const groupedBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      meta: { group: { id: 'work', name: 'Work' } },
      columns: [],
    };
    view.render({
      boards: [primaryBoard, groupedBoard],
      selectedBoardId: primaryBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    expect(
      document.querySelector(
        `[data-board-picker-section="group:work"] [data-board-picker-board-id="${SOURCE_BOARD_ID}"]`
      )
    ).not.toBeNull();

    const primaryCard = document
      .querySelector<HTMLElement>(`[data-board-picker-board-id="${BOARD_ID}"]`)
      ?.closest('.majom-boards-board-picker__card');
    primaryCard
      ?.querySelector<HTMLButtonElement>('button[aria-label="Board actions"]')
      ?.click();
    Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Create group')
      ?.click();
    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="New group name"]'
    );
    expect(input).not.toBeNull();
    input!.value = 'Focus';
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(handlers.onUpdateBoardGroup).toHaveBeenCalledWith(BOARD_ID, {
      id: 'focus',
      name: 'Focus',
    });
    view.destroy();
  });

  it('closes board picker card actions when clicking elsewhere in the picker', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const primaryBoard = createBoard();
    const groupedBoard: Board = {
      id: SOURCE_BOARD_ID,
      title: 'Shared Notes',
      meta: { group: { id: 'work', name: 'Work' } },
      columns: [],
    };
    view.render({
      boards: [primaryBoard, groupedBoard],
      selectedBoardId: primaryBoard.id,
      status: 'idle',
      error: null,
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="board-picker-button"]')
      ?.click();
    const primaryCard = document
      .querySelector<HTMLElement>(`[data-board-picker-board-id="${BOARD_ID}"]`)
      ?.closest('.majom-boards-board-picker__card');
    primaryCard
      ?.querySelector<HTMLButtonElement>('button[aria-label="Board actions"]')
      ?.click();
    expect(
      document.querySelector('.majom-boards-board-picker-actions')
    ).not.toBeNull();

    document
      .querySelector<HTMLInputElement>('input[aria-label="Search boards"]')
      ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(
      document.querySelector('.majom-boards-board-picker-actions')
    ).toBeNull();
    view.destroy();
  });

  it('renames a list title inline from the column header', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Rename list"]')
      ?.click();
    const titleInput = root.querySelector<HTMLInputElement>(
      'input[aria-label="Enter list name..."]'
    );
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'Must Read';
    titleInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(handlers.onPatchColumn).toHaveBeenCalledWith(COLUMN_TODO, {
      title: 'Must Read',
    });
    expect(root.querySelector('.majom-boards__column-count')).toBeNull();
    expect(root.querySelector('[aria-label="Delete column"]')).toBeNull();
    view.destroy();
  });

  it('opens list actions from the column header menu', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-menu-button"]'
      )
      ?.click();

    const popover = document.querySelector<HTMLElement>(
      '[data-testid="list-actions-popover"]'
    );
    expect(popover).not.toBeNull();
    expect(popover?.textContent).toContain('List actions');
    expect(popover?.textContent).toContain('Add card');
    expect(popover?.textContent).toContain('Archive this list');
    expect(popover?.textContent).toContain('Delete this list');
    expect(popover?.textContent).not.toContain('Automation');

    popover
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-add-card-button"]'
      )
      ?.click();
    expect(
      document.querySelector('[data-testid="list-actions-popover"]')
    ).toBeNull();
    expect(
      root.querySelector('[data-testid="list-card-composer-textarea"]')
    ).not.toBeNull();

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-menu-button"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-archive-list-button"]'
      )
      ?.click();
    expect(handlers.onDeleteColumn).toHaveBeenCalledWith(COLUMN_TODO);

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-menu-button"]'
      )
      ?.click();
    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="list-actions-delete-list-button"]'
      )
      ?.click();
    expect(handlers.onDeleteColumn).toHaveBeenCalledTimes(2);
    expect(handlers.onDeleteColumn).toHaveBeenLastCalledWith(COLUMN_TODO);
    view.destroy();
  });

  it('routes board create and delete actions through the header menu', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const menuButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Board menu"]'
    );
    expect(menuButton).not.toBeNull();
    menuButton?.click();

    expect(root.textContent).not.toContain('Refresh boards');
    const createBoardItem = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'New board'
    );
    createBoardItem?.click();
    expect(handlers.onCreateBoard).toHaveBeenCalledWith('New board');

    menuButton?.click();
    const deleteBoardItem = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Delete board'
    );
    deleteBoardItem?.click();
    expect(handlers.onDeleteBoard).toHaveBeenCalledWith(BOARD_ID);
    view.destroy();
  });

  it('previews a board import from the header menu without applying mutations', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const raw = ['---', 'title: Imported board', '---'].join('\n');
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Board menu"]')
      ?.click();
    const importBoardItem = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Import board'
    );
    importBoardItem?.click();

    const modal = document.querySelector<HTMLElement>(
      '[data-testid="boards-import-preview-modal"]'
    );
    expect(modal).not.toBeNull();
    const source = modal?.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    expect(source).not.toBeNull();
    source!.value = raw;
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    modal
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-preview-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(handlers.onPreviewImport).toHaveBeenCalledWith({
      raw,
      format: 'markdown',
      scope: 'board',
      target: undefined,
      policies: {
        mode: 'create',
        missingFieldPolicy: 'keep_existing',
        matchStrategy: 'title',
        unknownFieldPolicy: 'warn_and_ignore',
      },
    });
    expect(
      modal?.querySelector('[data-testid="boards-import-preview-panel"]')
        ?.textContent
    ).toContain('Imported board');
    expect(
      modal?.querySelector('[data-testid="boards-import-review-mode"]')
    ).not.toBeNull();
    expect(
      modal?.querySelector('[data-testid="boards-import-edit-mode"]')
    ).toBeNull();
    expect(
      modal?.querySelector('[data-testid="boards-import-preview-panel"]')
        ?.textContent
    ).toContain('Ready to apply');
    expect(
      modal?.querySelector('[data-testid="boards-import-preview-panel"]')
        ?.textContent
    ).not.toContain('3 changes ready');
    expect(
      modal?.querySelector('[data-testid="boards-import-preview-panel"]')
        ?.textContent
    ).toContain('Will create');
    expect(modal?.textContent).not.toContain('payload ·');
    expect(modal?.textContent).not.toContain(
      'Preview is ready. Applying will create new board data.'
    );
    expect(
      modal?.querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-apply-button"]'
      )?.disabled
    ).toBe(false);
    view.destroy();
  });

  it('guides users through import prerequisites before preview can run', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    const source = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    const modeSelect = modal.querySelector<HTMLSelectElement>(
      '#boards-import-mode'
    );
    const previewButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-preview-button"]'
    );
    const applyButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );
    const backButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-back-button"]'
    );

    expect(modeSelect?.value).toBe('create');
    expect(
      modal.querySelector('[data-testid="boards-import-action-row"]')
    ).not.toBeNull();
    expect(
      modal.querySelector('[data-testid="boards-import-edit-mode"]')
    ).not.toBeNull();
    expect(
      modal.querySelector('[data-testid="boards-import-review-mode"]')
    ).toBeNull();
    expect(
      modal.querySelector('[data-testid="boards-import-preview-panel"]')
    ).toBeNull();
    const formatHelp = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-format-help"]'
    );
    expect(formatHelp).not.toBeNull();
    expect(formatHelp?.title).toContain('Format guide');
    expect(formatHelp?.title).toContain(
      'Use Markdown when generating or editing data with AI.'
    );
    expect(formatHelp?.title).toContain(
      'Markdown requires headings: ## Column and ### Card.'
    );
    expect(modal.textContent).not.toContain(
      'Use Markdown when generating or editing data with AI.'
    );
    expect(modal.textContent).not.toContain(
      'Markdown requires headings: ## Column and ### Card.'
    );
    expect(
      source?.previousElementSibling?.querySelector(
        '[data-testid="boards-import-format-guide"]'
      )
    ).not.toBeNull();
    expect(source?.spellcheck).toBe(false);
    expect(source?.wrap).toBe('off');
    expect(previewButton?.className).toContain(
      'majom-boards-import__action-button--primary'
    );
    expect(applyButton?.className).toContain(
      'majom-boards-import__action-button--secondary'
    );
    expect(previewButton?.disabled).toBe(true);
    expect(previewButton?.hidden).toBe(false);
    expect(applyButton?.disabled).toBe(true);
    expect(applyButton?.hidden).toBe(true);
    expect(backButton?.hidden).toBe(true);
    expect(modal.textContent).toContain(
      'Paste Markdown or JSON source to preview.'
    );
    expect(applyButton?.title).toBe(
      'Paste Markdown or JSON source to preview.'
    );

    source!.value = ['---', 'title: Imported board', '---'].join('\n');
    source!.dispatchEvent(new Event('input', { bubbles: true }));

    expect(previewButton?.disabled).toBe(false);
    expect(previewButton?.hidden).toBe(false);
    expect(applyButton?.disabled).toBe(true);
    expect(applyButton?.hidden).toBe(true);
    expect(modal.textContent).toContain(
      'Run preview after source or configuration changes before applying.'
    );
    expect(applyButton?.title).toBe(
      'Run preview after source or configuration changes before applying.'
    );
    expect(handlers.onPreviewImport).not.toHaveBeenCalled();
    view.destroy();
  });

  it('inserts and clears a scope-aware Markdown import template', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    const source = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    const previewButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-preview-button"]'
    );
    const applyButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );

    modal
      .querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-insert-template-button"]'
      )
      ?.click();

    expect(source?.value).toContain('title: "Project board"');
    expect(source?.value).toContain('## Column: Backlog');
    expect(source?.value).toContain('Checklist: Setup');
    expect(source?.value).toContain('- [x] Confirm format');
    expect(previewButton?.disabled).toBe(false);
    expect(applyButton?.disabled).toBe(true);
    expect(modal.textContent).toContain(
      'Run preview after source or configuration changes before applying.'
    );

    modal
      .querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-clear-source-button"]'
      )
      ?.click();

    expect(source?.value).toBe('');
    expect(previewButton?.disabled).toBe(true);
    expect(applyButton?.disabled).toBe(true);
    expect(modal.textContent).toContain(
      'Paste Markdown or JSON source to preview.'
    );
    view.destroy();
  });

  it('updates the format guide and template for JSON imports', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    const source = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    Array.from(modal.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'JSON')
      ?.click();

    const formatHelp = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-format-help"]'
    );
    expect(formatHelp?.title).toContain(
      'Use JSON for exact structured imports and backups.'
    );
    expect(modal.textContent).not.toContain(
      'Use JSON for exact structured imports and backups.'
    );

    modal
      .querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-insert-template-button"]'
      )
      ?.click();
    const parsed = JSON.parse(source?.value ?? '{}');

    expect(parsed).toMatchObject({
      schema: 'majom.boards.exchange',
      version: '1.0',
      scope: 'board',
      payload: {
        title: 'Project board',
        columns: [
          {
            title: 'Backlog',
            cards: [
              {
                title: 'First task',
                checklists: [
                  {
                    title: 'Steps',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    view.destroy();
  });

  it('copies an AI prompt that includes the selected import format', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    modal
      .querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-copy-ai-prompt-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain(
      'Generate a Majom Boards Markdown import'
    );
    expect(writeText.mock.calls[0]?.[0]).toContain('Return only Markdown.');
    expect(modal.textContent).not.toContain('AI prompt copied.');
    expect(notify).toHaveBeenCalledWith('AI prompt copied.', 'success');
    view.destroy();
  });

  it('applies a create-mode board import after preview succeeds', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const raw = ['---', 'title: Imported board', '---'].join('\n');
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Board menu"]')
      ?.click();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Import board')
      ?.click();

    const modal = document.querySelector<HTMLElement>(
      '[data-testid="boards-import-preview-modal"]'
    );
    const source = modal?.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    source!.value = raw;
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    modal
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-preview-button"]'
      )
      ?.click();
    await Promise.resolve();

    const applyButton = modal?.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );
    expect(applyButton?.disabled).toBe(false);
    applyButton?.click();
    await Promise.resolve();

    expect(handlers.onApplyImport).toHaveBeenCalledWith({
      raw,
      format: 'markdown',
      scope: 'board',
      target: undefined,
      policies: {
        mode: 'create',
        missingFieldPolicy: 'keep_existing',
        matchStrategy: 'title',
        unknownFieldPolicy: 'warn_and_ignore',
      },
    });
    expect(
      document.querySelector('[data-testid="boards-import-preview-modal"]')
    ).toBeNull();
    expect(notify).toHaveBeenCalledWith('Import applied.', 'success');
    view.destroy();
  });

  it('marks a successful import preview stale after source changes', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    const source = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    const previewButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-preview-button"]'
    );
    const applyButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );

    source!.value = ['---', 'title: Imported board', '---'].join('\n');
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    previewButton?.click();
    await Promise.resolve();

    expect(previewButton?.textContent).toBe('Update preview');
    expect(applyButton?.disabled).toBe(false);
    expect(applyButton?.hidden).toBe(false);
    expect(
      modal.querySelector('[data-testid="boards-import-review-mode"]')
    ).not.toBeNull();
    expect(modal.textContent).toContain('Ready to apply');
    expect(modal.textContent).not.toContain(
      'Preview is ready. Applying will create new board data.'
    );

    modal
      .querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-back-button"]'
      )
      ?.click();
    const reopenedSource = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    expect(reopenedSource).not.toBeNull();
    expect(
      modal.querySelector('[data-testid="boards-import-edit-mode"]')
    ).not.toBeNull();
    expect(
      modal.querySelector('[data-testid="boards-import-review-mode"]')
    ).toBeNull();

    reopenedSource!.value = ['---', 'title: Changed board', '---'].join('\n');
    reopenedSource!.dispatchEvent(new Event('input', { bubbles: true }));

    expect(previewButton?.textContent).toBe('Update preview');
    expect(previewButton?.hidden).toBe(false);
    expect(applyButton?.disabled).toBe(true);
    expect(applyButton?.hidden).toBe(true);
    expect(modal.textContent).toContain(
      'Run preview after source or configuration changes before applying.'
    );
    expect(applyButton?.title).toBe(
      'Run preview after source or configuration changes before applying.'
    );
    expect(
      modal.querySelector('[data-testid="boards-import-preview-panel"]')
    ).toBeNull();
    view.destroy();
  });

  it('keeps apply disabled when the import preview has conflicts', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const blockedPlan: BoardsImportPlan = {
      scope: 'board',
      canApply: false,
      counts: { create: 0, update: 0, skip: 0, conflict: 1 },
      items: [
        {
          action: 'conflict',
          entity: 'board',
          title: 'Imported board',
          path: 'payload',
          reason: 'ambiguous-title-match',
        },
      ],
      diagnostics: [
        {
          level: 'error',
          code: 'ambiguous_title',
          message: 'Multiple boards matched this title.',
          path: 'payload.title',
        },
      ],
      warnings: [],
      errors: ['Multiple boards matched this title.'],
    };
    handlers.onPreviewImport = vi.fn(async () => blockedPlan);
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const modal = openBoardImportModal(root);
    const source = modal.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    const previewButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-preview-button"]'
    );
    const applyButton = modal.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );

    source!.value = ['---', 'title: Imported board', '---'].join('\n');
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    previewButton?.click();
    await Promise.resolve();

    expect(applyButton?.disabled).toBe(true);
    expect(applyButton?.title).toBe(
      'Resolve preview conflicts or errors before applying.'
    );
    expect(modal.textContent).toContain('Blocked by conflicts or errors');
    expect(modal.textContent).not.toContain('Review required');
    expect(modal.textContent).toContain('Needs attention');
    expect(modal.textContent).toContain('Ambiguous title match');
    expect(modal.textContent).toContain('Multiple boards matched this title.');
    expect(handlers.onApplyImport).not.toHaveBeenCalled();
    view.destroy();
  });

  it('keeps unsupported import modes preview-only with an explicit reason', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    const raw = ['---', 'title: Imported board', '---'].join('\n');
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Board menu"]')
      ?.click();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Import board')
      ?.click();

    const modal = document.querySelector<HTMLElement>(
      '[data-testid="boards-import-preview-modal"]'
    );
    const modeSelect = modal?.querySelector<HTMLSelectElement>(
      '#boards-import-mode'
    );
    modeSelect!.value = 'merge';
    modeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    const source = modal?.querySelector<HTMLTextAreaElement>(
      '#boards-import-source'
    );
    source!.value = raw;
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    modal
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="boards-import-preview-button"]'
      )
      ?.click();
    await Promise.resolve();

    const applyButton = modal?.querySelector<HTMLButtonElement>(
      '[data-testid="boards-import-apply-button"]'
    );
    expect(applyButton?.disabled).toBe(true);
    expect(modal?.textContent).toContain(
      'Valid preview; this mode cannot apply yet'
    );
    expect(modal?.textContent).toContain(
      'This mode is preview-only for now. Choose Create to apply.'
    );
    view.destroy();
  });

  it('exports a board from the header menu into a readonly output modal', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    root
      .querySelector<HTMLButtonElement>('button[aria-label="Board menu"]')
      ?.click();
    const exportBoardItem = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Export board as Markdown'
    );
    exportBoardItem?.click();
    await Promise.resolve();

    expect(handlers.onExportData).toHaveBeenCalledWith({
      scope: 'board',
      format: 'markdown',
      boardId: BOARD_ID,
    });
    const modal = document.querySelector<HTMLElement>(
      '[data-testid="boards-export-output-modal"]'
    );
    expect(modal).not.toBeNull();
    const output = modal?.querySelector<HTMLTextAreaElement>(
      '[data-testid="boards-export-output"]'
    );
    expect(output?.readOnly).toBe(true);
    expect(output?.value).toContain('schema: majom.boards.exchange');
    expect(modal?.textContent).toContain('board-books.md');

    modal
      ?.querySelector<HTMLButtonElement>(
        '[data-testid="boards-export-copy-button"]'
      )
      ?.click();
    await Promise.resolve();

    expect(modal?.textContent).not.toContain('Export copied.');
    expect(notify).toHaveBeenCalledWith('Export copied.', 'success');
    view.destroy();
  });

  it('keeps the card composer collapsed until the user starts adding a card', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    expect(
      root.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Enter a title or paste a link"]'
      )
    ).toBeNull();

    const addCardButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add card'
    );
    addCardButton?.click();

    const titleInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Enter a title or paste a link"]'
    );
    expect(titleInput).not.toBeNull();
    const cancelButton = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Cancel new card"]'
    );
    expect(cancelButton).not.toBeNull();
    cancelButton?.click();
    expect(
      root.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder="Enter a title or paste a link"]'
      )
    ).toBeNull();

    addCardButton?.click();
    const reopenedTitleInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Enter a title or paste a link"]'
    );
    expect(reopenedTitleInput).not.toBeNull();
    reopenedTitleInput!.value = 'New book';

    const submitButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add card'
    );
    submitButton?.click();

    expect(handlers.onCreateCard).toHaveBeenCalledWith(
      COLUMN_TODO,
      'New book',
      ''
    );
    view.destroy();
  });

  it('creates a column from the inline add-column composer', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = createHandlers();
    const view = new BoardsView(root, {
      runtime: createRuntime(),
      handlers,
    });
    view.render(createState());

    const openComposerButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add another list'
    );
    openComposerButton?.click();

    const titleInput = root.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Enter list name..."]'
    );
    expect(titleInput).not.toBeNull();
    titleInput!.value = 'Done';

    const submitButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add list'
    );
    submitButton?.click();

    expect(handlers.onCreateColumn).toHaveBeenCalledWith(BOARD_ID, 'Done');
    view.destroy();
  });
});
