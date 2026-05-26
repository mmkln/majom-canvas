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
import type { BoardsOptimisticState, BoardsState } from '../domain/types.ts';
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
import {
  createEmptyBoardsOptimisticState,
  projectBoards,
  projectBoardsOptimisticState,
  type BoardsOptimisticMutation,
  type BoardsOptimisticTempIdKind,
} from '../domain/optimisticBoards.ts';

import type {
  BoardsExportRequest,
  BoardsExportResult,
  BoardsImportApplyResult,
  BoardsImportPlan,
  BoardsImportRequest,
  ExchangeBoardPayload,
  ExchangeCardPayload,
  ExchangeColumnPayload,
} from '../exchange/schema.ts';
import { previewBoardsImport } from '../exchange/importPlanner.ts';
import { parseBoardsImport } from '../exchange/importParser.ts';
import {
  exportBoard,
  exportCard,
  exportColumn,
} from '../exchange/exportSerializer.ts';

type BoardsStoreOptions = {
  now?: () => Date;
  createTempId?: (kind: BoardsOptimisticTempIdKind) => string;
};

type ImportedCardCreateResult = {
  card: Card;
  checklistIds: CardChecklist['id'][];
  checkItemIds: CardCheckItem['id'][];
};

type ImportedCardsCreateResult = {
  cardIds: Card['id'][];
  checklistIds: CardChecklist['id'][];
  checkItemIds: CardCheckItem['id'][];
};

type CardWithLoadedChecklists = Card & {
  checklists: CardChecklist[];
};

type ChecklistExportCache = Map<Card['id'], Promise<CardChecklist[]>>;

const INITIAL_STATE: BoardsState = {
  boards: [],
  selectedBoardId: null,
  status: 'idle',
  error: null,
  optimistic: createEmptyBoardsOptimisticState(),
};

function toSortablePosition(value: string | number | null | undefined): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function compareColumnsByPosition(
  left: BoardColumn,
  right: BoardColumn
): number {
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
  private confirmedBoards: Board[] = INITIAL_STATE.boards;
  private pendingMutations: BoardsOptimisticMutation[] = [];
  private resolvedOptimisticIds: BoardsOptimisticState['resolved'] =
    createEmptyBoardsOptimisticState().resolved;
  private mutationSequence = 0;
  private tempIdSequence = 0;
  private readonly boardMetaMutationVersions = new Map<Board['id'], number>();
  private readonly now: () => Date;
  private readonly createTempIdValue: (
    kind: BoardsOptimisticTempIdKind
  ) => string;

  constructor(
    private readonly api: BoardsApiService,
    options: BoardsStoreOptions = {}
  ) {
    this.now = options.now ?? (() => new Date());
    this.createTempIdValue =
      options.createTempId ??
      ((kind) => {
        this.tempIdSequence += 1;
        return `temp:${kind}:${this.tempIdSequence}`;
      });
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

  public previewImport(request: BoardsImportRequest): BoardsImportPlan {
    return previewBoardsImport(this.snapshot.boards, request);
  }

  public async exportData(
    request: BoardsExportRequest
  ): Promise<BoardsExportResult | null> {
    const cache: ChecklistExportCache = new Map();
    this.patchState({ status: 'loading', error: null });
    try {
      const result = await this.createExportData(request, cache);
      this.patchState({ status: 'idle', error: null });
      return result;
    } catch {
      this.patchState({ status: 'error', error: 'boards.errors.load' });
      return null;
    }
  }

  private async createExportData(
    request: BoardsExportRequest,
    cache: ChecklistExportCache
  ): Promise<BoardsExportResult | null> {
    if (request.scope === 'board') {
      const board = request.boardId
        ? this.findBoard(request.boardId)
        : this.getSelectedBoard();
      if (!board) return null;
      return exportBoard(
        await this.hydrateBoardForExport(board, cache),
        request.format
      );
    }
    if (request.scope === 'column') {
      const column = request.columnId
        ? this.findColumn(request.columnId)
        : null;
      if (!column) return null;
      return exportColumn(
        await this.hydrateColumnForExport(column, cache),
        request.format
      );
    }
    const card = request.cardId ? this.findCard(request.cardId) : null;
    if (!card) return null;
    return exportCard(
      await this.hydrateCardForExport(card, cache),
      request.format
    );
  }

  public async applyImport(
    request: BoardsImportRequest
  ): Promise<BoardsImportApplyResult | null> {
    if (request.policies.mode !== 'create') return null;
    const plan = this.previewImport(request);
    if (!plan.canApply) return null;
    const parsed = parseBoardsImport(request);
    if (!parsed.envelope) return null;

    return this.runMutationResult(async () => {
      if (request.scope === 'board') {
        return this.applyBoardCreateImport(
          parsed.envelope.payload as ExchangeBoardPayload
        );
      }
      if (request.scope === 'column') {
        return this.applyColumnCreateImport(
          parsed.envelope.payload as ExchangeColumnPayload,
          request.target?.boardId
        );
      }
      return this.applyCardCreateImport(
        parsed.envelope.payload as ExchangeCardPayload,
        request.target?.columnId
      );
    });
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

  public async createColumn(
    boardId: Board['id'],
    title: string
  ): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;
    const board = this.findBoard(boardId);
    if (!board) return;
    const tempColumnId = this.createTempIdValue('column');
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'create-column',
        boardId,
        column: {
          id: tempColumnId,
          board: boardId,
          title: normalizedTitle,
          order: board.columns.length,
          cards: [],
        },
      },
      async () => {
        const createdColumn = await firstValueFrom(
          this.api.createColumn({
            board: boardId,
            title: normalizedTitle,
            position: 'end',
          })
        );
        this.rememberResolvedOptimisticIds({
          columns: { [tempColumnId]: createdColumn.id },
        });
      },
      () => this.reload(boardId)
    );
  }

  public async deleteColumn(columnId: BoardColumn['id']): Promise<void> {
    if (!this.findColumn(columnId)) return;
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'delete-column',
        columnId,
      },
      async () => {
        await firstValueFrom(this.api.deleteColumn(columnId));
      }
    );
  }

  public async patchColumn(
    columnId: BoardColumn['id'],
    patch: BoardColumnUpdatePayload
  ): Promise<void> {
    if (!this.findColumn(columnId)) return;
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'patch-column',
        columnId,
        patch,
      },
      async () => {
        await firstValueFrom(this.api.updateColumn(columnId, patch));
      }
    );
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
    const normalizedDescription = description.trim();
    const tempCardId = this.createTempIdValue('card');
    const tempPlacementId = this.createTempIdValue('placement');
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'create-card',
        columnId,
        card: {
          id: tempCardId,
          placement_id: tempPlacementId,
          column: columnId,
          title: normalizedTitle,
          description: normalizedDescription,
          order: column.cards.length,
        },
      },
      async () => {
        const createdCard = await firstValueFrom(
          this.api.createCard({
            column: columnId,
            title: normalizedTitle,
            description: normalizedDescription,
            position: 'bottom',
          })
        );
        this.rememberResolvedOptimisticIds({
          cards: { [tempCardId]: createdCard.id },
          placements: {
            [tempPlacementId]: getCardPlacementId(createdCard),
          },
        });
      }
    );
  }

  public async patchCard(
    cardId: Card['id'],
    patch: BoardCardUpdatePayload
  ): Promise<void> {
    if (!this.findCard(cardId)) return;
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'patch-card',
        cardId,
        patch,
      },
      async () => {
        await firstValueFrom(this.api.updateCard(cardId, patch));
      }
    );
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
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'patch-card-placement',
        placementId,
        patch,
      },
      async () => {
        await firstValueFrom(this.api.updateCardPlacement(placementId, patch));
      }
    );
  }

  public async deleteCardPlacement(
    placementId: CardPlacement['id']
  ): Promise<void> {
    if (!this.findCardPlacement(placementId)) return;
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'delete-card-placement',
        placementId,
      },
      async () => {
        await firstValueFrom(this.api.deleteCardPlacement(placementId));
      }
    );
  }

  public async deleteCard(cardId: Card['id']): Promise<void> {
    if (!this.findCard(cardId)) return;
    await this.runOptimisticMutation(
      {
        id: this.createMutationId(),
        type: 'delete-card',
        cardId,
      },
      async () => {
        await firstValueFrom(this.api.deleteCard(cardId));
      }
    );
  }

  private async applyBoardCreateImport(
    payload: ExchangeBoardPayload
  ): Promise<BoardsImportApplyResult> {
    const board = await firstValueFrom(
      this.api.createBoard({ title: payload.title })
    );
    const columnIds: BoardColumn['id'][] = [];
    const cardIds: Card['id'][] = [];
    const checklistIds: CardChecklist['id'][] = [];
    const checkItemIds: CardCheckItem['id'][] = [];

    for (const columnPayload of payload.columns ?? []) {
      const column = await firstValueFrom(
        this.api.createColumn({
          board: board.id,
          title: columnPayload.title,
          position: 'end',
        })
      );
      columnIds.push(column.id);
      const createdCards = await this.createImportedCards(
        column.id,
        columnPayload.cards ?? []
      );
      cardIds.push(...createdCards.cardIds);
      checklistIds.push(...createdCards.checklistIds);
      checkItemIds.push(...createdCards.checkItemIds);
    }

    await this.reload(board.id);
    return {
      scope: 'board',
      created: {
        boardId: board.id,
        columnIds,
        cardIds,
        checklistIds,
        checkItemIds,
      },
    };
  }

  private async applyColumnCreateImport(
    payload: ExchangeColumnPayload,
    targetBoardId: Board['id'] | undefined
  ): Promise<BoardsImportApplyResult> {
    const boardId = targetBoardId ?? this.snapshot.selectedBoardId ?? undefined;
    if (!boardId || !this.findBoard(boardId)) {
      throw new Error('Missing import target board');
    }

    const column = await firstValueFrom(
      this.api.createColumn({
        board: boardId,
        title: payload.title,
        position: 'end',
      })
    );
    const createdCards = await this.createImportedCards(
      column.id,
      payload.cards ?? []
    );
    await this.reload(boardId);
    return {
      scope: 'column',
      created: {
        columnIds: [column.id],
        cardIds: createdCards.cardIds,
        checklistIds: createdCards.checklistIds,
        checkItemIds: createdCards.checkItemIds,
      },
    };
  }

  private async applyCardCreateImport(
    payload: ExchangeCardPayload,
    targetColumnId: BoardColumn['id'] | undefined
  ): Promise<BoardsImportApplyResult> {
    if (!targetColumnId || !this.findColumn(targetColumnId)) {
      throw new Error('Missing import target column');
    }

    const createdCard = await this.createImportedCard(targetColumnId, payload);
    await this.reloadPreservingSelection();
    return {
      scope: 'card',
      created: {
        columnIds: [],
        cardIds: [createdCard.card.id],
        checklistIds: createdCard.checklistIds,
        checkItemIds: createdCard.checkItemIds,
      },
    };
  }

  private async createImportedCards(
    columnId: BoardColumn['id'],
    cards: ExchangeCardPayload[]
  ): Promise<ImportedCardsCreateResult> {
    const cardIds: Card['id'][] = [];
    const checklistIds: CardChecklist['id'][] = [];
    const checkItemIds: CardCheckItem['id'][] = [];
    for (const cardPayload of cards) {
      const createdCard = await this.createImportedCard(columnId, cardPayload);
      cardIds.push(createdCard.card.id);
      checklistIds.push(...createdCard.checklistIds);
      checkItemIds.push(...createdCard.checkItemIds);
    }
    return { cardIds, checklistIds, checkItemIds };
  }

  private async createImportedCard(
    columnId: BoardColumn['id'],
    payload: ExchangeCardPayload
  ): Promise<ImportedCardCreateResult> {
    const card = await firstValueFrom(
      this.api.createCard({
        column: columnId,
        title: payload.title,
        description: payload.description ?? '',
        position: 'bottom',
      })
    );
    const checklistIds: CardChecklist['id'][] = [];
    const checkItemIds: CardCheckItem['id'][] = [];

    for (const checklistPayload of payload.checklists ?? []) {
      const checklist = await firstValueFrom(
        this.api.createCardChecklist(card.id, {
          title: checklistPayload.title,
          position: 'bottom',
        })
      );
      checklistIds.push(checklist.id);

      for (const itemPayload of checklistPayload.items ?? []) {
        const item = await firstValueFrom(
          this.api.createCardCheckItem(checklist.id, {
            title: itemPayload.title,
            state: itemPayload.state ?? 'incomplete',
            position: 'bottom',
          })
        );
        checkItemIds.push(item.id);
      }
    }

    return { card, checklistIds, checkItemIds };
  }

  private async hydrateBoardForExport(
    board: Board,
    cache: ChecklistExportCache
  ): Promise<Board> {
    return {
      ...board,
      columns: await Promise.all(
        (board.columns ?? []).map((column) =>
          this.hydrateColumnForExport(column, cache)
        )
      ),
    };
  }

  private async hydrateColumnForExport(
    column: BoardColumn,
    cache: ChecklistExportCache
  ): Promise<BoardColumn> {
    return {
      ...column,
      cards: await Promise.all(
        (column.cards ?? []).map((card) =>
          this.hydrateCardForExport(card, cache)
        )
      ),
    };
  }

  private async hydrateCardForExport(
    card: Card,
    cache: ChecklistExportCache
  ): Promise<CardWithLoadedChecklists> {
    return {
      ...card,
      checklists: await this.loadCardChecklistsForExport(card.id, cache),
    };
  }

  private loadCardChecklistsForExport(
    cardId: Card['id'],
    cache: ChecklistExportCache
  ): Promise<CardChecklist[]> {
    const cached = cache.get(cardId);
    if (cached) return cached;
    const request = firstValueFrom(this.api.getCardChecklists(cardId));
    cache.set(cardId, request);
    return request;
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

  private async runOptimisticMutation(
    mutation: BoardsOptimisticMutation,
    action: () => Promise<void>,
    reloadAfterConfirm: () => Promise<void> = () =>
      this.reloadPreservingSelection()
  ): Promise<void> {
    this.pendingMutations = [...this.pendingMutations, mutation];
    this.publishProjectedState({ status: 'saving', error: null });
    try {
      await action();
      this.pendingMutations = this.pendingMutations.filter(
        (candidate) => candidate.id !== mutation.id
      );
      await reloadAfterConfirm();
      this.publishProjectedState({ status: 'idle', error: null });
    } catch {
      this.pendingMutations = this.pendingMutations.filter(
        (candidate) => candidate.id !== mutation.id
      );
      this.publishProjectedState({
        status: 'error',
        error: 'boards.errors.save',
      });
    }
  }

  private createMutationId(): string {
    this.mutationSequence += 1;
    return `boards-mutation-${this.mutationSequence}`;
  }

  private rememberResolvedOptimisticIds(
    resolved: Partial<BoardsOptimisticState['resolved']>
  ): void {
    this.resolvedOptimisticIds = {
      cards: {
        ...this.resolvedOptimisticIds.cards,
        ...(resolved.cards ?? {}),
      },
      placements: {
        ...this.resolvedOptimisticIds.placements,
        ...(resolved.placements ?? {}),
      },
      columns: {
        ...this.resolvedOptimisticIds.columns,
        ...(resolved.columns ?? {}),
      },
    };
  }

  private async reloadPreservingSelection(): Promise<void> {
    await this.reload(this.snapshot.selectedBoardId);
  }

  private async reload(preferredBoardId: Board['id'] | null): Promise<void> {
    const boards = normalizeBoards(await firstValueFrom(this.api.getBoards()));
    this.confirmedBoards = boards;
    const selectedBoardId = resolveSelectedBoardId(boards, preferredBoardId);
    persistBoardsSessionSelectedBoardId(selectedBoardId);
    this.publishProjectedState({
      selectedBoardId,
    });
  }

  private findBoard(boardId: Board['id']): Board | null {
    return this.snapshot.boards.find((board) => board.id === boardId) ?? null;
  }

  private getSelectedBoard(): Board | null {
    return this.snapshot.selectedBoardId
      ? this.findBoard(this.snapshot.selectedBoardId)
      : null;
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
    this.confirmedBoards = normalizeBoards(
      this.confirmedBoards.map((board) =>
        board.id === boardId ? { ...board, meta: meta ?? null } : board
      )
    );
    this.publishProjectedState({
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

  private publishProjectedState(
    patch: Partial<Omit<BoardsState, 'boards'>> = {}
  ): void {
    this.stateSubject.next({
      ...this.snapshot,
      ...patch,
      boards: projectBoards(this.confirmedBoards, this.pendingMutations),
      optimistic: projectBoardsOptimisticState(
        this.pendingMutations,
        this.resolvedOptimisticIds
      ),
    });
  }
}
