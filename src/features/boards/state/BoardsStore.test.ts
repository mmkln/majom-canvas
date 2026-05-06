// @vitest-environment jsdom
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardsApiService } from '../../../majom-wrapper/data-access/boards-api-service.ts';
import type { Board } from '../../../majom-wrapper/interfaces/index.ts';
import { BoardsStore } from './BoardsStore.ts';
import {
  persistBoardsSessionSelectedBoardId,
  readBoardsSessionSelectedBoardId,
} from './boardsSessionState.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const SECOND_BOARD_ID = '00000000-0000-4000-8000-000000000002';
const COLUMN_TODO = '00000000-0000-4000-8000-000000000010';
const COLUMN_DONE = '00000000-0000-4000-8000-000000000011';
const CARD_EXISTING = '00000000-0000-4000-8000-000000000020';
const CARD_NEW = '00000000-0000-4000-8000-000000000021';
const PLACEMENT_EXISTING = '00000000-0000-4000-8000-000000000200';
const PLACEMENT_MIRROR = '00000000-0000-4000-8000-000000000201';
const PLACEMENT_LATE = '00000000-0000-4000-8000-000000000202';

function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: BOARD_ID,
    title: 'Board',
    columns: [],
    ...overrides,
  };
}

describe('BoardsStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('restores the selected board from the current tab session on first load', async () => {
    persistBoardsSessionSelectedBoardId(SECOND_BOARD_ID);
    const api = {
      getBoards: vi.fn(() =>
        of([
          createBoard(),
          createBoard({ id: SECOND_BOARD_ID, title: 'Second Board' }),
        ])
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);

    await store.load();

    expect(store.snapshot.selectedBoardId).toBe(SECOND_BOARD_ID);
    store.destroy();
  });

  it('falls back from a deleted tab session board and rewrites the session selection', async () => {
    persistBoardsSessionSelectedBoardId(SECOND_BOARD_ID);
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);

    await store.load();

    expect(store.snapshot.selectedBoardId).toBe(BOARD_ID);
    expect(readBoardsSessionSelectedBoardId()).toBe(BOARD_ID);
    store.destroy();
  });

  it('persists explicit board selection in the current tab session', async () => {
    const api = {
      getBoards: vi.fn(() =>
        of([
          createBoard(),
          createBoard({ id: SECOND_BOARD_ID, title: 'Second Board' }),
        ])
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    store.selectBoard(SECOND_BOARD_ID);

    expect(store.snapshot.selectedBoardId).toBe(SECOND_BOARD_ID);
    expect(readBoardsSessionSelectedBoardId()).toBe(SECOND_BOARD_ID);
    store.destroy();
  });

  it('persists a newly created board as the current tab selection', async () => {
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(
          of([
            createBoard(),
            createBoard({ id: SECOND_BOARD_ID, title: 'Second Board' }),
          ])
        ),
      createBoard: vi.fn(() =>
        of(createBoard({ id: SECOND_BOARD_ID, title: 'Second Board' }))
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.createBoard('Second Board');

    expect(store.snapshot.selectedBoardId).toBe(SECOND_BOARD_ID);
    expect(readBoardsSessionSelectedBoardId()).toBe(SECOND_BOARD_ID);
    store.destroy();
  });

  it('normalizes loaded board columns by position and cards by placement rank before publishing state', async () => {
    const api = {
      getBoards: vi.fn(() =>
        of([
          createBoard({
            columns: [
              {
                id: COLUMN_DONE,
                board: BOARD_ID,
                title: 'Done',
                order: 1,
                pos: '2048.000000000000000',
                cards: [],
              },
              {
                id: COLUMN_TODO,
                board: BOARD_ID,
                title: 'Todo',
                order: 2,
                pos: '1024.000000000000000',
                cards: [
                  {
                    id: CARD_NEW,
                    placement_id: PLACEMENT_LATE,
                    column: COLUMN_TODO,
                    title: 'Second',
                    description: '',
                    order: 2,
                  },
                  {
                    id: CARD_EXISTING,
                    placement_id: PLACEMENT_MIRROR,
                    column: COLUMN_TODO,
                    title: 'First',
                    description: '',
                    order: 1,
                  },
                ],
              },
            ],
          }),
        ])
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);

    await store.load();

    expect(store.snapshot.selectedBoardId).toBe(BOARD_ID);
    expect(
      store.snapshot.boards[0]?.columns.map((column) => column.id)
    ).toEqual([COLUMN_TODO, COLUMN_DONE]);
    expect(
      store.snapshot.boards[0]?.columns[0]?.cards.map((card) => card.id)
    ).toEqual([CARD_EXISTING, CARD_NEW]);
    store.destroy();
  });

  it('preserves backend mirror placement contract fields when publishing state', async () => {
    const api = {
      getBoards: vi.fn(() =>
        of([
          createBoard({
            columns: [
              {
                id: COLUMN_TODO,
                board: BOARD_ID,
                title: 'Todo',
                order: 0,
                cards: [
                  {
                    id: CARD_EXISTING,
                    placement_id: PLACEMENT_EXISTING,
                    column: COLUMN_TODO,
                    title: 'Source',
                    description: '',
                    order: 0,
                    mirror_source: null,
                  },
                  {
                    id: CARD_EXISTING,
                    placement_id: PLACEMENT_MIRROR,
                    column: COLUMN_TODO,
                    title: 'Source',
                    description: '',
                    order: 1,
                    mirror_source: {
                      board_id: BOARD_ID,
                      board_title: 'Board',
                      column_id: COLUMN_TODO,
                      column_title: 'Todo',
                      placement_id: PLACEMENT_EXISTING,
                      archived: false,
                    },
                  },
                ],
              },
            ],
          }),
        ])
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);

    await store.load();

    const [source, mirror] = store.snapshot.boards[0]!.columns[0]!.cards;
    expect(source).toMatchObject({
      placement_id: PLACEMENT_EXISTING,
      mirror_source: null,
    });
    expect(mirror).toMatchObject({
      placement_id: PLACEMENT_MIRROR,
      mirror_source: {
        board_id: BOARD_ID,
        board_title: 'Board',
        column_id: COLUMN_TODO,
        column_title: 'Todo',
        placement_id: PLACEMENT_EXISTING,
        archived: false,
      },
    });
    store.destroy();
  });

  it('creates cards at the bottom of the target column', async () => {
    const loadedBoard = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [
            {
              id: CARD_EXISTING,
              placement_id: PLACEMENT_EXISTING,
              column: COLUMN_TODO,
              title: 'Existing',
              description: '',
              order: 0,
            },
          ],
        },
      ],
    });
    const api = {
      getBoards: vi.fn(() => of([loadedBoard])),
      createCard: vi.fn(() =>
        of({
          id: CARD_NEW,
          placement_id: PLACEMENT_MIRROR,
          column: COLUMN_TODO,
          title: 'New',
          description: 'Details',
          pos: '2048.000000000000000',
        })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.createCard(COLUMN_TODO, ' New ', ' Details ');

    expect(api.createCard).toHaveBeenCalledWith({
      column: COLUMN_TODO,
      title: 'New',
      description: 'Details',
      position: 'bottom',
    });
    store.destroy();
  });

  it('patches a board title and keeps the board selected after reload', async () => {
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard({ title: 'Reading' })])),
      updateBoard: vi.fn(() => of(createBoard({ title: 'Reading' }))),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.patchBoard(BOARD_ID, { title: 'Reading' });

    expect(api.updateBoard).toHaveBeenCalledWith(BOARD_ID, {
      title: 'Reading',
    });
    expect(store.snapshot.selectedBoardId).toBe(BOARD_ID);
    expect(store.snapshot.boards[0]?.title).toBe('Reading');
    store.destroy();
  });

  it('patches a column title through the boards API', async () => {
    const board = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [],
        },
      ],
    });
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([board]))
        .mockReturnValueOnce(
          of([
            createBoard({
              columns: [{ ...board.columns[0]!, title: 'Must Read' }],
            }),
          ])
        ),
      updateColumn: vi.fn(() =>
        of({ ...board.columns[0]!, title: 'Must Read' })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.patchColumn(COLUMN_TODO, { title: 'Must Read' });

    expect(api.updateColumn).toHaveBeenCalledWith(COLUMN_TODO, {
      title: 'Must Read',
    });
    expect(store.snapshot.boards[0]?.columns[0]?.title).toBe('Must Read');
    store.destroy();
  });

  it('patches card tag ids through the boards API', async () => {
    const board = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [
            {
              id: CARD_EXISTING,
              placement_id: PLACEMENT_EXISTING,
              column: COLUMN_TODO,
              title: 'Existing',
              description: '',
              order: 0,
              tags: [],
              tag_ids: [],
            },
          ],
        },
      ],
    });
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([board]))
        .mockReturnValueOnce(
          of([
            createBoard({
              columns: [
                {
                  ...board.columns[0]!,
                  cards: [
                    {
                      ...board.columns[0]!.cards[0]!,
                      tag_ids: [1, 2],
                    },
                  ],
                },
              ],
            }),
          ])
        ),
      updateCard: vi.fn(() =>
        of({
          ...board.columns[0]!.cards[0]!,
          tag_ids: [1, 2],
        })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.patchCard(CARD_EXISTING, { tag_ids: [1, 2] });

    expect(api.updateCard).toHaveBeenCalledWith(CARD_EXISTING, {
      tag_ids: [1, 2],
    });
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.tag_ids).toEqual([
      1, 2,
    ]);
    store.destroy();
  });

  it('moves a concrete card placement through the placements API', async () => {
    const board = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [
            {
              id: CARD_EXISTING,
              placement_id: PLACEMENT_EXISTING,
              column: COLUMN_TODO,
              title: 'Existing',
              description: '',
              order: 0,
            },
          ],
        },
        {
          id: COLUMN_DONE,
          board: BOARD_ID,
          title: 'Done',
          order: 1,
          cards: [],
        },
      ],
    });
    const api = {
      getBoards: vi.fn(() => of([board])),
      updateCardPlacement: vi.fn(() =>
        of({
          id: PLACEMENT_EXISTING,
          card: CARD_EXISTING,
          column: COLUMN_DONE,
          order: 0,
          archived: false,
        })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.patchCardPlacement(PLACEMENT_EXISTING, {
      column: COLUMN_DONE,
      position: 'bottom',
    });

    expect(api.updateCardPlacement).toHaveBeenCalledWith(PLACEMENT_EXISTING, {
      column: COLUMN_DONE,
      position: 'bottom',
    });
    store.destroy();
  });

  it('creates a mirrored placement for an existing card', async () => {
    const board = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [
            {
              id: CARD_EXISTING,
              placement_id: PLACEMENT_EXISTING,
              column: COLUMN_TODO,
              title: 'Existing',
              description: '',
              order: 0,
            },
          ],
        },
        {
          id: COLUMN_DONE,
          board: BOARD_ID,
          title: 'Done',
          order: 1,
          cards: [],
        },
      ],
    });
    const api = {
      getBoards: vi.fn(() => of([board])),
      createCardPlacement: vi.fn(() =>
        of({
          id: PLACEMENT_MIRROR,
          card: CARD_EXISTING,
          column: COLUMN_DONE,
          order: 0,
          archived: false,
        })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.createCardMirror(CARD_EXISTING, COLUMN_DONE, {
      position: 'bottom',
    });

    expect(api.createCardPlacement).toHaveBeenCalledWith({
      card: CARD_EXISTING,
      column: COLUMN_DONE,
      position: 'bottom',
    });
    store.destroy();
  });

  it('creates a mirrored placement even when the list already contains the card', async () => {
    const board = createBoard({
      columns: [
        {
          id: COLUMN_TODO,
          board: BOARD_ID,
          title: 'Todo',
          order: 0,
          cards: [
            {
              id: CARD_EXISTING,
              placement_id: PLACEMENT_EXISTING,
              column: COLUMN_TODO,
              title: 'Existing',
              description: '',
              order: 0,
            },
          ],
        },
      ],
    });
    const api = {
      getBoards: vi.fn(() => of([board])),
      createCardPlacement: vi.fn(() =>
        of({
          id: PLACEMENT_MIRROR,
          card: CARD_EXISTING,
          column: COLUMN_TODO,
          order: 1,
          archived: false,
        })
      ),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    await store.load();

    await store.createCardMirror(CARD_EXISTING, COLUMN_TODO, {
      before_placement: PLACEMENT_EXISTING,
    });

    expect(api.createCardPlacement).toHaveBeenCalledWith({
      card: CARD_EXISTING,
      column: COLUMN_TODO,
      before_placement: PLACEMENT_EXISTING,
    });
    store.destroy();
  });
});
