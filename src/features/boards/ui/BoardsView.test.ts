// @vitest-environment jsdom

import { describe, expect, it, vi, afterEach } from 'vitest';
import { AppRuntime } from '../../../app-runtime/index.ts';
import type { Board, Card, Tag } from '../../../majom-wrapper/interfaces/index.ts';
import type {
  BoardTagCatalogPort,
  BoardsIntentHandlers,
  BoardsState,
} from '../domain/types.ts';
import { BoardsView } from './BoardsView.ts';

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

function createRuntime(): AppRuntime {
  return new AppRuntime({
    initialLocale: 'en',
    energyService: null,
  });
}

function createHandlers(): BoardsIntentHandlers {
  return {
    onRefresh: vi.fn(),
    onSelectBoard: vi.fn(),
    onCreateBoard: vi.fn(),
    onPatchBoard: vi.fn(),
    onDeleteBoard: vi.fn(),
    onCreateColumn: vi.fn(),
    onPatchColumn: vi.fn(),
    onDeleteColumn: vi.fn(),
    onCreateCard: vi.fn(),
    onPatchCard: vi.fn(),
    onCreateCardMirror: vi.fn(),
    onPatchCardPlacement: vi.fn(),
    onDeleteCardPlacement: vi.fn(),
    onDeleteCard: vi.fn(),
  };
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
      const previous = currentTags.find((tag) => tag.id === id) ?? createTag({ id });
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
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('BoardsView', () => {
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
    expect(editor?.textContent).toContain('Create Jira work item');
    expect(editor?.textContent).toContain('NEW');
    expect(editor?.textContent).toContain('Mirror');
    expect(editor?.textContent).toContain('Delete card');

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
    expect(handlers.onDeleteCardPlacement).toHaveBeenCalledWith(
      PLACEMENT_BOOK
    );
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
      .querySelector<HTMLButtonElement>('[data-testid="card-back-archive-button"]')
      ?.click();
    expect(handlers.onDeleteCardPlacement).toHaveBeenCalledWith(
      PLACEMENT_BOOK
    );
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
      .querySelector<HTMLButtonElement>('[data-testid="card-back-archive-button"]')
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
      .querySelector<HTMLButtonElement>('[data-testid="card-back-add-label-button"]')
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

    const canvas = root.querySelector<HTMLElement>('[data-board-canvas="true"]')!;
    const columns = root.querySelectorAll<HTMLElement>('[data-board-column-id]');
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

    expect(handlers.onPatchCardPlacement).toHaveBeenCalledWith(
      PLACEMENT_BOOK,
      {
        column: COLUMN_READING,
        after_placement: PLACEMENT_MIRROR,
      }
    );
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
      ?.querySelector<HTMLButtonElement>('[data-testid="card-back-actions-button"]')
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
      .querySelector<HTMLButtonElement>('[data-testid="delete-card-cancel-button"]')
      ?.click();
    await Promise.resolve();

    expect(handlers.onDeleteCard).not.toHaveBeenCalled();

    deleteButton?.click();
    document
      .querySelector<HTMLButtonElement>('[data-testid="delete-card-confirm-button"]')
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
