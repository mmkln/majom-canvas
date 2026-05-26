// @vitest-environment jsdom
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardsApiService } from '../../../majom-wrapper/data-access/boards-api-service.ts';
import type { Board } from '../../../majom-wrapper/interfaces/index.ts';
import { BoardsStore } from './BoardsStore.ts';
import { BoardsCommandService } from './BoardsCommandService.ts';

const BOARD_ID = '00000000-0000-4000-8000-000000000001';
const BOARD_CREATED = '00000000-0000-4000-8000-000000000002';
const COLUMN_TODO = '00000000-0000-4000-8000-000000000010';
const COLUMN_DONE = '00000000-0000-4000-8000-000000000011';
const CARD_EXISTING = '00000000-0000-4000-8000-000000000020';
const CARD_CREATED = '00000000-0000-4000-8000-000000000021';
const PLACEMENT_EXISTING = '00000000-0000-4000-8000-000000000200';
const PLACEMENT_CREATED = '00000000-0000-4000-8000-000000000201';

function createBoard(cardTitle = 'Original title'): Board {
  return {
    id: BOARD_ID,
    title: 'Board',
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
            title: cardTitle,
            description: '',
            order: 0,
          },
        ],
      },
    ],
  };
}

function createTwoColumnBoard(cardColumn = COLUMN_TODO): Board {
  const board = createBoard();
  const card = board.columns[0]!.cards[0]!;
  return {
    ...board,
    columns: [
      {
        ...board.columns[0]!,
        cards: cardColumn === COLUMN_TODO ? [card] : [],
      },
      {
        id: COLUMN_DONE,
        board: BOARD_ID,
        title: 'Done',
        order: 1,
        cards:
          cardColumn === COLUMN_DONE ? [{ ...card, column: COLUMN_DONE }] : [],
      },
    ],
  };
}

describe('BoardsCommandService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('creates a card optimistically and records temp-to-real resolution on success', async () => {
    const createCard = new Subject<unknown>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard('Created title')])),
      createCard: vi.fn(() => createCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api, {
      createTempId: (kind) => `temp:${kind}`,
    });
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.createCard(
      COLUMN_TODO,
      ' Created title ',
      ' Note '
    );

    expect(api.createCard).toHaveBeenCalledWith({
      column: COLUMN_TODO,
      title: 'Created title',
      description: 'Note',
      position: 'bottom',
    });
    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns[0]?.cards.at(-1)).toMatchObject({
      id: 'temp:card',
      placement_id: 'temp:placement',
      title: 'Created title',
      description: 'Note',
    });
    expect(store.snapshot.optimistic.cards['temp:card']).toBe('creating');

    createCard.next({
      id: CARD_CREATED,
      placement_id: PLACEMENT_CREATED,
      column: COLUMN_TODO,
      title: 'Created title',
      description: 'Note',
      order: 1,
    });
    createCard.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.optimistic.resolved.cards['temp:card']).toBe(
      CARD_CREATED
    );
    expect(
      store.snapshot.optimistic.resolved.placements['temp:placement']
    ).toBe(PLACEMENT_CREATED);
    expect(store.snapshot.status).toBe('idle');
    store.destroy();
  });

  it('rolls back an optimistic created card when creation fails', async () => {
    const createCard = new Subject<unknown>();
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
      createCard: vi.fn(() => createCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api, {
      createTempId: (kind) => `temp:${kind}`,
    });
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.createCard(
      COLUMN_TODO,
      ' Created title ',
      ' Note '
    );
    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(2);
    createCard.error(new Error('failed'));

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(1);
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.id).toBe(
      CARD_EXISTING
    );
    store.destroy();
  });

  it('patches a card optimistically and confirms it through the store', async () => {
    const updateCard = new Subject<unknown>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard('Confirmed title')])),
      updateCard: vi.fn(() => updateCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.patchCard(CARD_EXISTING, {
      title: 'Optimistic title',
    });

    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Optimistic title'
    );

    updateCard.next({});
    updateCard.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Confirmed title'
    );
    store.destroy();
  });

  it('rolls back an optimistic card patch when the command fails', async () => {
    const updateCard = new Subject<unknown>();
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
      updateCard: vi.fn(() => updateCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.patchCard(CARD_EXISTING, {
      title: 'Rejected title',
    });
    updateCard.error(new Error('failed'));

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Original title'
    );
    store.destroy();
  });

  it('keeps saving while a parallel optimistic command is still running', async () => {
    const firstUpdateCard = new Subject<unknown>();
    const secondUpdateCard = new Subject<unknown>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard('First confirmed')]))
        .mockReturnValueOnce(of([createBoard('Second confirmed')])),
      updateCard: vi
        .fn()
        .mockReturnValueOnce(firstUpdateCard)
        .mockReturnValueOnce(secondUpdateCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const firstResult = commands.patchCard(CARD_EXISTING, {
      title: 'First optimistic',
    });
    const secondResult = commands.patchCard(CARD_EXISTING, {
      title: 'Second optimistic',
    });

    expect(commands.getCommandRecords()).toHaveLength(2);
    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Second optimistic'
    );

    firstUpdateCard.next({});
    firstUpdateCard.complete();

    await expect(firstResult).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.error).toBeNull();
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Second optimistic'
    );
    expect(commands.getCommandRecords()).toHaveLength(2);

    secondUpdateCard.next({});
    secondUpdateCard.complete();

    await expect(secondResult).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Second confirmed'
    );
    expect(commands.getCommandRecords()).toHaveLength(0);
    store.destroy();
  });

  it('keeps a parallel command failure visible after the last running command settles', async () => {
    const firstUpdateCard = new Subject<unknown>();
    const secondUpdateCard = new Subject<unknown>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard('Second confirmed')])),
      updateCard: vi
        .fn()
        .mockReturnValueOnce(firstUpdateCard)
        .mockReturnValueOnce(secondUpdateCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const firstResult = commands.patchCard(CARD_EXISTING, {
      title: 'Rejected optimistic',
    });
    const secondResult = commands.patchCard(CARD_EXISTING, {
      title: 'Second optimistic',
    });

    firstUpdateCard.error(new Error('failed'));

    await expect(firstResult).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.error).toBe('boards.errors.save');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Second optimistic'
    );

    secondUpdateCard.next({});
    secondUpdateCard.complete();

    await expect(secondResult).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.error).toBe('boards.errors.save');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.title).toBe(
      'Second confirmed'
    );
    expect(commands.getCommandRecords()).toHaveLength(0);
    store.destroy();
  });

  it('creates a board through the command service and selects the confirmed board', async () => {
    const createBoardCommand = new Subject<unknown>();
    const createdBoard: Board = {
      id: BOARD_CREATED,
      title: 'Created board',
      columns: [],
    };
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([createBoard(), createdBoard])),
      createBoard: vi.fn(() => createBoardCommand),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.createBoard(' Created board ');

    expect(api.createBoard).toHaveBeenCalledWith({ title: 'Created board' });
    expect(store.snapshot.status).toBe('saving');

    createBoardCommand.next(createdBoard);
    createBoardCommand.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.selectedBoardId).toBe(BOARD_CREATED);
    store.destroy();
  });

  it('returns a recoverable board patch failure without mutating the snapshot', async () => {
    const updateBoard = new Subject<unknown>();
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
      updateBoard: vi.fn(() => updateBoard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.patchBoard(BOARD_ID, {
      title: 'Rejected board',
    });

    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.title).toBe('Board');
    updateBoard.error(new Error('failed'));

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.boards[0]?.title).toBe('Board');
    store.destroy();
  });

  it('deletes a board through the command service and reloads without selection', async () => {
    const deleteBoard = new Subject<void>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([])),
      deleteBoard: vi.fn(() => deleteBoard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.deleteBoard(BOARD_ID);

    expect(store.snapshot.status).toBe('saving');

    deleteBoard.next();
    deleteBoard.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards).toHaveLength(0);
    expect(store.snapshot.selectedBoardId).toBeNull();
    store.destroy();
  });

  it('creates a column optimistically and records temp-to-real resolution on success', async () => {
    const createColumn = new Subject<unknown>();
    const confirmedBoard = createBoard();
    confirmedBoard.columns = [
      ...confirmedBoard.columns,
      {
        id: COLUMN_DONE,
        board: BOARD_ID,
        title: 'Done',
        order: 1,
        cards: [],
      },
    ];
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([confirmedBoard])),
      createColumn: vi.fn(() => createColumn),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api, {
      createTempId: (kind) => `temp:${kind}`,
    });
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.createColumn(BOARD_ID, ' Done ');

    expect(api.createColumn).toHaveBeenCalledWith({
      board: BOARD_ID,
      title: 'Done',
      position: 'end',
    });
    expect(store.snapshot.boards[0]?.columns.at(-1)).toMatchObject({
      id: 'temp:column',
      title: 'Done',
    });
    expect(store.snapshot.optimistic.columns['temp:column']).toBe('creating');

    createColumn.next({
      id: COLUMN_DONE,
      board: BOARD_ID,
      title: 'Done',
      order: 1,
      cards: [],
    });
    createColumn.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.optimistic.resolved.columns['temp:column']).toBe(
      COLUMN_DONE
    );
    expect(store.snapshot.status).toBe('idle');
    store.destroy();
  });

  it('rolls back an optimistic column patch when the command fails', async () => {
    const updateColumn = new Subject<unknown>();
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
      updateColumn: vi.fn(() => updateColumn),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.patchColumn(COLUMN_TODO, {
      title: 'Rejected column',
    });

    expect(store.snapshot.boards[0]?.columns[0]?.title).toBe(
      'Rejected column'
    );
    updateColumn.error(new Error('failed'));

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.boards[0]?.columns[0]?.title).toBe('Todo');
    store.destroy();
  });

  it('deletes a column optimistically and confirms it through the store', async () => {
    const deleteColumn = new Subject<void>();
    const confirmedBoard = createBoard();
    confirmedBoard.columns = [];
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(of([confirmedBoard])),
      deleteColumn: vi.fn(() => deleteColumn),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.deleteColumn(COLUMN_TODO);

    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns).toHaveLength(0);

    deleteColumn.next();
    deleteColumn.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns).toHaveLength(0);
    store.destroy();
  });

  it('moves a card placement optimistically and confirms it through the store', async () => {
    const updateCardPlacement = new Subject<unknown>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createTwoColumnBoard()]))
        .mockReturnValueOnce(of([createTwoColumnBoard(COLUMN_DONE)])),
      updateCardPlacement: vi.fn(() => updateCardPlacement),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.patchCardPlacement(PLACEMENT_EXISTING, {
      column: COLUMN_DONE,
      position: 'bottom',
    });

    expect(api.updateCardPlacement).toHaveBeenCalledWith(PLACEMENT_EXISTING, {
      column: COLUMN_DONE,
      position: 'bottom',
    });
    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(0);
    expect(store.snapshot.boards[0]?.columns[1]?.cards[0]?.id).toBe(
      CARD_EXISTING
    );

    updateCardPlacement.next({});
    updateCardPlacement.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns[1]?.cards[0]?.column).toBe(
      COLUMN_DONE
    );
    store.destroy();
  });

  it('rolls back an optimistic placement delete when the command fails', async () => {
    const deleteCardPlacement = new Subject<void>();
    const api = {
      getBoards: vi.fn(() => of([createBoard()])),
      deleteCardPlacement: vi.fn(() => deleteCardPlacement),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.deleteCardPlacement(PLACEMENT_EXISTING);

    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(0);
    deleteCardPlacement.error(new Error('failed'));

    await expect(result).resolves.toMatchObject({
      ok: false,
      error: {
        messageKey: 'boards.errors.save',
        recoverable: true,
      },
    });
    expect(store.snapshot.status).toBe('error');
    expect(store.snapshot.boards[0]?.columns[0]?.cards[0]?.id).toBe(
      CARD_EXISTING
    );
    store.destroy();
  });

  it('deletes a card optimistically and confirms it through the store', async () => {
    const deleteCard = new Subject<void>();
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createBoard()]))
        .mockReturnValueOnce(
          of([
            {
              ...createBoard(),
              columns: [{ ...createBoard().columns[0]!, cards: [] }],
            },
          ])
        ),
      deleteCard: vi.fn(() => deleteCard),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.deleteCard(CARD_EXISTING);

    expect(store.snapshot.status).toBe('saving');
    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(0);

    deleteCard.next();
    deleteCard.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns[0]?.cards).toHaveLength(0);
    store.destroy();
  });

  it('creates a card mirror through the command service and reloads the board snapshot', async () => {
    const createCardPlacement = new Subject<unknown>();
    const confirmedBoard = createTwoColumnBoard();
    confirmedBoard.columns[1]!.cards = [
      {
        ...confirmedBoard.columns[0]!.cards[0]!,
        placement_id: PLACEMENT_CREATED,
        column: COLUMN_DONE,
      },
    ];
    const api = {
      getBoards: vi
        .fn()
        .mockReturnValueOnce(of([createTwoColumnBoard()]))
        .mockReturnValueOnce(of([confirmedBoard])),
      createCardPlacement: vi.fn(() => createCardPlacement),
    } as unknown as BoardsApiService;
    const store = new BoardsStore(api);
    const commands = new BoardsCommandService(api, store);
    await store.load();

    const result = commands.createCardMirror(CARD_EXISTING, COLUMN_DONE, {
      position: 'bottom',
    });

    expect(api.createCardPlacement).toHaveBeenCalledWith({
      card: CARD_EXISTING,
      column: COLUMN_DONE,
      position: 'bottom',
    });
    expect(store.snapshot.status).toBe('saving');

    createCardPlacement.next({
      id: PLACEMENT_CREATED,
      card: CARD_EXISTING,
      column: COLUMN_DONE,
      order: 0,
      archived: false,
    });
    createCardPlacement.complete();

    await expect(result).resolves.toEqual({ ok: true, data: undefined });
    expect(store.snapshot.status).toBe('idle');
    expect(store.snapshot.boards[0]?.columns[1]?.cards[0]).toMatchObject({
      id: CARD_EXISTING,
      placement_id: PLACEMENT_CREATED,
      column: COLUMN_DONE,
    });
    store.destroy();
  });
});
