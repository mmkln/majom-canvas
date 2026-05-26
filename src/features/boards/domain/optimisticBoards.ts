import type {
  Board,
  BoardColumn,
  Card,
} from '../../../majom-wrapper/interfaces/index.ts';
import { getCardPlacementId } from './cardIdentity.ts';
import type {
  BoardCardPatch,
  BoardCardPlacementPatch,
  BoardColumnPatch,
  BoardsOptimisticState,
} from './types.ts';

export type BoardsOptimisticTempIdKind = 'column' | 'card' | 'placement';

export type BoardsOptimisticMutation =
  | {
      id: string;
      type: 'create-column';
      boardId: Board['id'];
      column: BoardColumn;
    }
  | {
      id: string;
      type: 'patch-column';
      columnId: BoardColumn['id'];
      patch: BoardColumnPatch;
    }
  | {
      id: string;
      type: 'delete-column';
      columnId: BoardColumn['id'];
    }
  | {
      id: string;
      type: 'create-card';
      columnId: BoardColumn['id'];
      card: Card;
    }
  | {
      id: string;
      type: 'patch-card';
      cardId: Card['id'];
      patch: BoardCardPatch;
    }
  | {
      id: string;
      type: 'patch-card-placement';
      placementId: string;
      patch: BoardCardPlacementPatch;
    }
  | {
      id: string;
      type: 'delete-card-placement';
      placementId: string;
    }
  | {
      id: string;
      type: 'delete-card';
      cardId: Card['id'];
    };

export function createEmptyBoardsOptimisticState(): BoardsOptimisticState {
  return {
    cards: {},
    placements: {},
    columns: {},
    resolved: {
      cards: {},
      placements: {},
      columns: {},
    },
  };
}

function applyColumnPatch(
  column: BoardColumn,
  patch: BoardColumnPatch
): BoardColumn {
  return {
    ...column,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.order !== undefined ? { order: patch.order } : {}),
  };
}

function applyCardPatch(card: Card, patch: BoardCardPatch): Card {
  return {
    ...card,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description }
      : {}),
    ...(patch.completedAt !== undefined
      ? { completedAt: patch.completedAt }
      : {}),
    ...(patch.tag_ids !== undefined ? { tag_ids: patch.tag_ids } : {}),
  };
}

function hasColumnPlacementPatch(patch: BoardColumnPatch): boolean {
  return (
    patch.before_column !== undefined ||
    patch.after_column !== undefined ||
    patch.position !== undefined
  );
}

function insertColumn(
  columns: BoardColumn[],
  column: BoardColumn,
  patch: BoardColumnPatch
): BoardColumn[] {
  if (patch.position === 'start') return [column, ...columns];
  if (patch.position === 'end') return [...columns, column];

  const previousIndex = patch.before_column
    ? columns.findIndex((candidate) => candidate.id === patch.before_column)
    : -1;
  if (previousIndex >= 0) {
    return [
      ...columns.slice(0, previousIndex + 1),
      column,
      ...columns.slice(previousIndex + 1),
    ];
  }

  const nextIndex = patch.after_column
    ? columns.findIndex((candidate) => candidate.id === patch.after_column)
    : -1;
  if (nextIndex >= 0) {
    return [
      ...columns.slice(0, nextIndex),
      column,
      ...columns.slice(nextIndex),
    ];
  }

  return [...columns, column];
}

function applyColumnMutation(
  board: Board,
  mutation: Extract<BoardsOptimisticMutation, { type: 'patch-column' }>
): Board {
  const column = board.columns.find(
    (candidate) => candidate.id === mutation.columnId
  );
  if (!column) return board;

  const patchedColumn = applyColumnPatch(column, mutation.patch);
  if (!hasColumnPlacementPatch(mutation.patch)) {
    return {
      ...board,
      columns: board.columns.map((candidate) =>
        candidate.id === mutation.columnId ? patchedColumn : candidate
      ),
    };
  }

  const stableColumns = board.columns.filter(
    (candidate) => candidate.id !== mutation.columnId
  );
  return {
    ...board,
    columns: insertColumn(stableColumns, patchedColumn, mutation.patch),
  };
}

function insertCard(
  cards: Card[],
  card: Card,
  patch: BoardCardPlacementPatch
): Card[] {
  if (patch.position === 'top') return [card, ...cards];
  if (patch.position === 'bottom') return [...cards, card];

  const previousIndex = patch.before_placement
    ? cards.findIndex(
        (candidate) => getCardPlacementId(candidate) === patch.before_placement
      )
    : -1;
  if (previousIndex >= 0) {
    return [
      ...cards.slice(0, previousIndex + 1),
      card,
      ...cards.slice(previousIndex + 1),
    ];
  }

  const nextIndex = patch.after_placement
    ? cards.findIndex(
        (candidate) => getCardPlacementId(candidate) === patch.after_placement
      )
    : -1;
  if (nextIndex >= 0) {
    return [...cards.slice(0, nextIndex), card, ...cards.slice(nextIndex)];
  }

  return [...cards, card];
}

function findCardByPlacement(
  boards: Board[],
  placementId: string
): Card | null {
  for (const board of boards) {
    for (const column of board.columns) {
      const card = column.cards.find(
        (candidate) => getCardPlacementId(candidate) === placementId
      );
      if (card) return card;
    }
  }
  return null;
}

function applyCardPlacementDelete(
  boards: Board[],
  placementId: string
): Board[] {
  return boards.map((board) => ({
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.filter(
        (card) => getCardPlacementId(card) !== placementId
      ),
    })),
  }));
}

function applyCardPlacementPatch(
  boards: Board[],
  placementId: string,
  patch: BoardCardPlacementPatch
): Board[] {
  if (patch.archived === true) {
    return applyCardPlacementDelete(boards, placementId);
  }

  const movingCard = findCardByPlacement(boards, placementId);
  if (!movingCard) return boards;
  const targetColumnId = patch.column ?? movingCard.column;

  return boards.map((board) => ({
    ...board,
    columns: board.columns.map((column) => {
      const cardsWithoutMovingCard = column.cards.filter(
        (card) => getCardPlacementId(card) !== placementId
      );
      if (column.id !== targetColumnId) {
        return { ...column, cards: cardsWithoutMovingCard };
      }
      return {
        ...column,
        cards: insertCard(cardsWithoutMovingCard, movingCard, patch).map(
          (card) =>
            getCardPlacementId(card) === placementId
              ? { ...card, column: targetColumnId }
              : card
        ),
      };
    }),
  }));
}

function applyCardDelete(boards: Board[], cardId: Card['id']): Board[] {
  return boards.map((board) => ({
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    })),
  }));
}

function applyColumnDelete(
  boards: Board[],
  columnId: BoardColumn['id']
): Board[] {
  return boards.map((board) => ({
    ...board,
    columns: board.columns.filter((column) => column.id !== columnId),
  }));
}

function applyMutation(
  boards: Board[],
  mutation: BoardsOptimisticMutation
): Board[] {
  if (mutation.type === 'create-column') {
    return boards.map((board) =>
      board.id === mutation.boardId
        ? { ...board, columns: [...board.columns, mutation.column] }
        : board
    );
  }

  if (mutation.type === 'patch-column') {
    return boards.map((board) => applyColumnMutation(board, mutation));
  }

  if (mutation.type === 'delete-column') {
    return applyColumnDelete(boards, mutation.columnId);
  }

  if (mutation.type === 'create-card') {
    return boards.map((board) => ({
      ...board,
      columns: board.columns.map((column) =>
        column.id === mutation.columnId
          ? { ...column, cards: [...column.cards, mutation.card] }
          : column
      ),
    }));
  }

  if (mutation.type === 'patch-card-placement') {
    return applyCardPlacementPatch(
      boards,
      mutation.placementId,
      mutation.patch
    );
  }

  if (mutation.type === 'delete-card-placement') {
    return applyCardPlacementDelete(boards, mutation.placementId);
  }

  if (mutation.type === 'delete-card') {
    return applyCardDelete(boards, mutation.cardId);
  }

  return boards.map((board) => ({
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) =>
        card.id === mutation.cardId
          ? applyCardPatch(card, mutation.patch)
          : card
      ),
    })),
  }));
}

export function projectBoards(
  confirmedBoards: Board[],
  pendingMutations: readonly BoardsOptimisticMutation[]
): Board[] {
  if (pendingMutations.length === 0) return confirmedBoards;
  return pendingMutations.reduce<Board[]>(
    (boards, mutation) => applyMutation(boards, mutation),
    confirmedBoards
  );
}

export function projectBoardsOptimisticState(
  pendingMutations: readonly BoardsOptimisticMutation[],
  resolved: BoardsOptimisticState['resolved'] = {
    cards: {},
    placements: {},
    columns: {},
  }
): BoardsOptimisticState {
  const optimistic = createEmptyBoardsOptimisticState();
  optimistic.resolved = {
    cards: { ...resolved.cards },
    placements: { ...resolved.placements },
    columns: { ...resolved.columns },
  };

  pendingMutations.forEach((mutation) => {
    if (mutation.type === 'create-column') {
      optimistic.columns[mutation.column.id] = 'creating';
      return;
    }
    if (mutation.type === 'delete-column') {
      optimistic.columns[mutation.columnId] = 'deleting';
      return;
    }
    if (mutation.type === 'patch-column') {
      optimistic.columns[mutation.columnId] = 'saving';
      return;
    }
    if (mutation.type === 'create-card') {
      optimistic.cards[mutation.card.id] = 'creating';
      optimistic.placements[getCardPlacementId(mutation.card)] = 'creating';
      return;
    }
    if (mutation.type === 'delete-card') {
      optimistic.cards[mutation.cardId] = 'deleting';
      return;
    }
    if (mutation.type === 'patch-card') {
      optimistic.cards[mutation.cardId] = 'saving';
      return;
    }
    if (mutation.type === 'delete-card-placement') {
      optimistic.placements[mutation.placementId] = 'deleting';
      return;
    }
    if (mutation.type === 'patch-card-placement') {
      optimistic.placements[mutation.placementId] = mutation.patch.archived
        ? 'deleting'
        : 'saving';
    }
  });

  return optimistic;
}
