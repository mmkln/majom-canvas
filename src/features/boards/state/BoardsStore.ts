import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type {
  BoardUpdatePayload,
  BoardPlacementTargetPayload,
  BoardCardPlacementUpdatePayload,
  BoardCardUpdatePayload,
  BoardColumnUpdatePayload,
  BoardsApiService,
} from '../../../majom-wrapper/data-access/boards-api-service.ts';
import type {
  Board,
  BoardColumn,
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { BoardsState } from '../domain/types.ts';
import {
  compareCardsByPlacementPos,
  getCardPlacementId,
} from '../domain/cardIdentity.ts';
import {
  persistBoardsSessionSelectedBoardId,
  resolveSelectedBoardId,
} from './boardsSessionState.ts';

const INITIAL_STATE: BoardsState = {
  boards: [],
  selectedBoardId: null,
  status: 'idle',
  error: null,
};

function toSortablePosition(value: string | number | null | undefined): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function compareColumnsByPosition(left: BoardColumn, right: BoardColumn): number {
  const leftPos = left.pos ?? left.order ?? 0;
  const rightPos = right.pos ?? right.order ?? 0;
  const positionDelta =
    toSortablePosition(leftPos) - toSortablePosition(rightPos);
  return positionDelta || left.id.localeCompare(right.id);
}

function normalizeBoards(boards: Board[]): Board[] {
  return boards
    .map((board) => ({
      ...board,
      columns: [...(board.columns ?? [])]
        .sort(compareColumnsByPosition)
        .map((column) => ({
          ...column,
          cards: [...(column.cards ?? [])].sort(compareCardsByPlacementPos),
        })),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export class BoardsStore {
  private readonly stateSubject = new BehaviorSubject<BoardsState>(
    INITIAL_STATE
  );
  public readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly api: BoardsApiService) {}

  public get snapshot(): BoardsState {
    return this.stateSubject.value;
  }

  public destroy(): void {
    this.stateSubject.complete();
  }

  public selectBoard(boardId: Board['id']): void {
    if (!this.snapshot.boards.some((board) => board.id === boardId)) return;
    persistBoardsSessionSelectedBoardId(boardId);
    this.patchState({ selectedBoardId: boardId, error: null });
  }

  public async load(): Promise<void> {
    this.patchState({ status: 'loading', error: null });
    try {
      await this.reloadPreservingSelection();
      this.patchState({ status: 'idle', error: null });
    } catch {
      this.patchState({
        status: 'error',
        error: 'boards.errors.load',
      });
    }
  }

  public async createBoard(title: string): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    await this.runMutation(async () => {
      const board = await firstValueFrom(
        this.api.createBoard({ title: normalizedTitle })
      );
      await this.reload(board.id);
    });
  }

  public async deleteBoard(boardId: Board['id']): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteBoard(boardId));
      await this.reload(null);
    });
  }

  public async patchBoard(
    boardId: Board['id'],
    patch: BoardUpdatePayload
  ): Promise<void> {
    if (!this.findBoard(boardId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(this.api.updateBoard(boardId, patch));
      await this.reload(boardId);
    });
  }

  public async createColumn(boardId: Board['id'], title: string): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    const board = this.findBoard(boardId);
    if (!board) return;
    await this.runMutation(async () => {
      await firstValueFrom(
        this.api.createColumn({
          board: boardId,
          title: normalizedTitle,
          position: 'end',
        })
      );
      await this.reload(boardId);
    });
  }

  public async deleteColumn(columnId: BoardColumn['id']): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteColumn(columnId));
      await this.reloadPreservingSelection();
    });
  }

  public async patchColumn(
    columnId: BoardColumn['id'],
    patch: BoardColumnUpdatePayload
  ): Promise<void> {
    if (!this.findColumn(columnId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(this.api.updateColumn(columnId, patch));
      await this.reloadPreservingSelection();
    });
  }

  public async createCard(
    columnId: BoardColumn['id'],
    title: string,
    description: string
  ): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    const column = this.findColumn(columnId);
    if (!column) return;
    await this.runMutation(async () => {
      await firstValueFrom(
        this.api.createCard({
          column: columnId,
          title: normalizedTitle,
          description: description.trim(),
          position: 'bottom',
        })
      );
      await this.reloadPreservingSelection();
    });
  }

  public async patchCard(
    cardId: Card['id'],
    patch: BoardCardUpdatePayload
  ): Promise<void> {
    if (!this.findCard(cardId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(this.api.updateCard(cardId, patch));
      await this.reloadPreservingSelection();
    });
  }

  public async createCardMirror(
    cardId: Card['id'],
    columnId: BoardColumn['id'],
    target: BoardPlacementTargetPayload
  ): Promise<void> {
    if (!this.findCard(cardId) || !this.findColumn(columnId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(
        this.api.createCardPlacement({
          card: cardId,
          column: columnId,
          ...target,
        })
      );
      await this.reloadPreservingSelection();
    });
  }

  public async patchCardPlacement(
    placementId: CardPlacement['id'],
    patch: BoardCardPlacementUpdatePayload
  ): Promise<void> {
    if (!this.findCardPlacement(placementId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(this.api.updateCardPlacement(placementId, patch));
      await this.reloadPreservingSelection();
    });
  }

  public async deleteCardPlacement(
    placementId: CardPlacement['id']
  ): Promise<void> {
    if (!this.findCardPlacement(placementId)) return;
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteCardPlacement(placementId));
      await this.reloadPreservingSelection();
    });
  }

  public async deleteCard(cardId: Card['id']): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteCard(cardId));
      await this.reloadPreservingSelection();
    });
  }

  private async runMutation(action: () => Promise<void>): Promise<void> {
    this.patchState({ status: 'saving', error: null });
    try {
      await action();
      this.patchState({ status: 'idle', error: null });
    } catch {
      this.patchState({
        status: 'error',
        error: 'boards.errors.save',
      });
    }
  }

  private async reloadPreservingSelection(): Promise<void> {
    await this.reload(this.snapshot.selectedBoardId);
  }

  private async reload(preferredBoardId: Board['id'] | null): Promise<void> {
    const boards = normalizeBoards(await firstValueFrom(this.api.getBoards()));
    const selectedBoardId = resolveSelectedBoardId(boards, preferredBoardId);
    persistBoardsSessionSelectedBoardId(selectedBoardId);
    this.patchState({
      boards,
      selectedBoardId,
    });
  }

  private findBoard(boardId: Board['id']): Board | null {
    return this.snapshot.boards.find((board) => board.id === boardId) ?? null;
  }

  private findColumn(columnId: BoardColumn['id']): BoardColumn | null {
    for (const board of this.snapshot.boards) {
      const column = board.columns.find(
        (candidate) => candidate.id === columnId
      );
      if (column) return column;
    }
    return null;
  }

  private findCardPlacement(placementId: CardPlacement['id']): Card | null {
    for (const board of this.snapshot.boards) {
      for (const column of board.columns) {
        const card = column.cards.find(
          (candidate) => getCardPlacementId(candidate) === placementId
        );
        if (card) return card;
      }
    }
    return null;
  }

  private findCard(cardId: Card['id']): Card | null {
    for (const board of this.snapshot.boards) {
      for (const column of board.columns) {
        const card = column.cards.find((candidate) => candidate.id === cardId);
        if (card) return card;
      }
    }
    return null;
  }

  private patchState(patch: Partial<BoardsState>): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...patch,
    });
  }
}
