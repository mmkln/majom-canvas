import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type {
  BoardUpdatePayload,
  BoardPlacementTargetPayload,
  BoardCardPlacementUpdatePayload,
  BoardCardUpdatePayload,
  BoardColumnUpdatePayload,
  CardCheckItemUpdatePayload,
  BoardCardEntityLinkCreatePayload,
  BoardsApiService,
} from '../../../majom-wrapper/data-access/boards-api-service.ts';
import type {
  Board,
  BoardColumn,
  Card,
  CardCheckItem,
  CardChecklist,
  CardEntityLink,
  CardEntityLinkType,
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
import {
  isBoardStarred,
  setBoardMetaLastOpenedAt,
  setBoardMetaGroup,
  setBoardMetaStarred,
  type BoardMetaRecord,
} from '../domain/boardMeta.ts';

type BoardsStoreOptions = {
  now?: () => Date;
};

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
  private readonly boardMetaMutationVersions = new Map<Board['id'], number>();
  private readonly now: () => Date;

  constructor(
    private readonly api: BoardsApiService,
    options: BoardsStoreOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
  }

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
    this.patchBoardMeta(boardId, (board) =>
      setBoardMetaLastOpenedAt(board, this.now().toISOString())
    );
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

  public toggleBoardStar(boardId: Board['id']): void {
    this.patchBoardMeta(boardId, (board) =>
      setBoardMetaStarred(board, !isBoardStarred(board))
    );
  }

  public updateBoardGroup(
    boardId: Board['id'],
    group: { id: string; name: string } | null
  ): void {
    this.patchBoardMeta(boardId, (board) => setBoardMetaGroup(board, group));
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

  public async loadCardChecklists(
    cardId: Card['id']
  ): Promise<CardChecklist[]> {
    if (!this.findCard(cardId)) return [];
    try {
      return await firstValueFrom(this.api.getCardChecklists(cardId));
    } catch {
      this.patchState({ error: 'boards.errors.load' });
      return [];
    }
  }

  public async createCardChecklist(
    cardId: Card['id'],
    title: string
  ): Promise<CardChecklist | null> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || !this.findCard(cardId)) return null;
    return this.runMutationResult(async () => {
      const checklist = await firstValueFrom(
        this.api.createCardChecklist(cardId, {
          title: normalizedTitle,
          position: 'bottom',
        })
      );
      await this.reloadPreservingSelection();
      return checklist;
    });
  }

  public async deleteCardChecklist(
    checklistId: CardChecklist['id']
  ): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteCardChecklist(checklistId));
      await this.reloadPreservingSelection();
    });
  }

  public async createCardCheckItem(
    checklistId: CardChecklist['id'],
    title: string
  ): Promise<CardCheckItem | null> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return null;
    return this.runMutationResult(async () => {
      const item = await firstValueFrom(
        this.api.createCardCheckItem(checklistId, {
          title: normalizedTitle,
          position: 'bottom',
        })
      );
      await this.reloadPreservingSelection();
      return item;
    });
  }

  public async patchCardCheckItem(
    itemId: CardCheckItem['id'],
    patch: CardCheckItemUpdatePayload
  ): Promise<CardCheckItem | null> {
    return this.runMutationResult(async () => {
      const item = await firstValueFrom(
        this.api.updateCardCheckItem(itemId, patch)
      );
      await this.reloadPreservingSelection();
      return item;
    });
  }

  public async deleteCardCheckItem(itemId: CardCheckItem['id']): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteCardCheckItem(itemId));
      await this.reloadPreservingSelection();
    });
  }

  public async createCardEntityLink(
    cardId: Card['id'],
    entityType: CardEntityLinkType,
    entityId: string
  ): Promise<CardEntityLink | null> {
    if (!this.findCard(cardId)) return null;
    const payload: BoardCardEntityLinkCreatePayload = {
      card: cardId,
      entity_type: entityType,
      entity_id: entityId,
    };
    return this.runMutationResult(async () => {
      const link = await firstValueFrom(this.api.createCardEntityLink(payload));
      await this.reloadPreservingSelection();
      return link;
    });
  }

  public async deleteCardEntityLink(
    linkId: CardEntityLink['id']
  ): Promise<void> {
    await this.runMutation(async () => {
      await firstValueFrom(this.api.deleteCardEntityLink(linkId));
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

  private async runMutationResult<T>(
    action: () => Promise<T>
  ): Promise<T | null> {
    this.patchState({ status: 'saving', error: null });
    try {
      const result = await action();
      this.patchState({ status: 'idle', error: null });
      return result;
    } catch {
      this.patchState({
        status: 'error',
        error: 'boards.errors.save',
      });
      return null;
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

  private patchBoardMeta(
    boardId: Board['id'],
    createMeta: (board: Board) => BoardMetaRecord
  ): void {
    const board = this.findBoard(boardId);
    if (!board) return;
    const version = (this.boardMetaMutationVersions.get(boardId) ?? 0) + 1;
    this.boardMetaMutationVersions.set(boardId, version);
    const previousMeta = board.meta ?? null;
    const nextMeta = createMeta(board);
    this.replaceBoardMeta(boardId, nextMeta);
    void firstValueFrom(this.api.updateBoard(boardId, { meta: nextMeta }))
      .then((updated) => {
        if (this.boardMetaMutationVersions.get(boardId) !== version) return;
        this.replaceBoardMeta(boardId, updated.meta ?? nextMeta);
      })
      .catch(() => {
        if (this.boardMetaMutationVersions.get(boardId) !== version) return;
        this.replaceBoardMeta(boardId, previousMeta);
        this.patchState({ error: 'boards.errors.save' });
      });
  }

  private replaceBoardMeta(
    boardId: Board['id'],
    meta: Board['meta'] | null | undefined
  ): void {
    this.patchState({
      boards: normalizeBoards(
        this.snapshot.boards.map((board) =>
          board.id === boardId ? { ...board, meta: meta ?? null } : board
        )
      ),
      error: null,
    });
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
