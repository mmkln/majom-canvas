import { firstValueFrom } from 'rxjs';
import type {
  BoardCardCreatePayload,
  BoardCardPlacementUpdatePayload,
  BoardCardUpdatePayload,
  BoardColumnUpdatePayload,
  BoardPlacementTargetPayload,
  BoardUpdatePayload,
  BoardsApiService,
} from '../../../majom-wrapper/data-access/boards-api-service.ts';
import type {
  Board,
  BoardColumn,
  Card,
  CardPlacement,
} from '../../../majom-wrapper/interfaces/index.ts';
import type {
  BoardsCommandError,
  BoardsCommandKind,
  BoardsCommandRecord,
  BoardsCommandResult,
  BoardsOptimisticState,
} from '../domain/types.ts';
import type { BoardsOptimisticMutation } from '../domain/optimisticBoards.ts';
import { getCardPlacementId } from '../domain/cardIdentity.ts';
import {
  BOARDS_SAVE_COMMAND_ERROR,
  createBoardsCommandFailure,
  createBoardsCommandSuccess,
} from '../domain/boardsCommandResult.ts';
import { BoardsStore } from './BoardsStore.ts';

export class BoardsCommandService {
  private mutationSequence = 0;
  private commandSequence = 0;
  private commandRecordsById = new Map<string, BoardsCommandRecord>();

  constructor(
    private readonly api: BoardsApiService,
    private readonly store: BoardsStore
  ) {}

  public async createBoard(title: string): Promise<BoardsCommandResult> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return createBoardsCommandSuccess();
    return this.runBackendCommand('create-board', async () => {
      const board = await firstValueFrom(
        this.api.createBoard({ title: normalizedTitle })
      );
      await this.store.reloadBoardSnapshot(board.id);
    });
  }

  public async patchBoard(
    boardId: Board['id'],
    patch: BoardUpdatePayload
  ): Promise<BoardsCommandResult> {
    if (!this.store.findBoardSnapshot(boardId))
      return createBoardsCommandSuccess();
    return this.runBackendCommand('patch-board', async () => {
      await firstValueFrom(this.api.updateBoard(boardId, patch));
      await this.store.reloadBoardSnapshot(boardId);
    });
  }

  public async deleteBoard(boardId: Board['id']): Promise<BoardsCommandResult> {
    return this.runBackendCommand('delete-board', async () => {
      await firstValueFrom(this.api.deleteBoard(boardId));
      await this.store.reloadBoardSnapshot(null);
    });
  }

  public async createColumn(
    boardId: Board['id'],
    title: string
  ): Promise<BoardsCommandResult> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return createBoardsCommandSuccess();
    const board = this.store.findBoardSnapshot(boardId);
    if (!board) return createBoardsCommandSuccess();
    const tempColumnId = this.store.createOptimisticTempId('column');
    const mutation: BoardsOptimisticMutation = {
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
    };
    return this.runOptimisticCommand(
      'create-column',
      mutation,
      async () => {
        const createdColumn = await firstValueFrom(
          this.api.createColumn({
            board: boardId,
            title: normalizedTitle,
            position: 'end',
          })
        );
        return {
          columns: { [tempColumnId]: createdColumn.id },
        };
      }
    );
  }

  public async patchColumn(
    columnId: BoardColumn['id'],
    patch: BoardColumnUpdatePayload
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasColumn(columnId)) return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'patch-column',
      columnId,
      patch,
    };
    return this.runOptimisticCommand('patch-column', mutation, async () => {
      await firstValueFrom(this.api.updateColumn(columnId, patch));
    });
  }

  public async deleteColumn(
    columnId: BoardColumn['id']
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasColumn(columnId)) return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'delete-column',
      columnId,
    };
    return this.runOptimisticCommand('delete-column', mutation, async () => {
      await firstValueFrom(this.api.deleteColumn(columnId));
    });
  }

  public async createCard(
    columnId: BoardColumn['id'],
    title: string,
    description: string
  ): Promise<BoardsCommandResult> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return createBoardsCommandSuccess();
    const column = this.store.findColumnSnapshot(columnId);
    if (!column) return createBoardsCommandSuccess();
    const normalizedDescription = description.trim();
    const tempCardId = this.store.createOptimisticTempId('card');
    const tempPlacementId = this.store.createOptimisticTempId('placement');
    const mutation: BoardsOptimisticMutation = {
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
    };
    return this.runOptimisticCommand('create-card', mutation, async () => {
      const createdCard = await firstValueFrom(
        this.api.createCard({
          column: columnId,
          title: normalizedTitle,
          description: normalizedDescription,
          position: 'bottom',
        } satisfies BoardCardCreatePayload)
      );
      return {
        cards: { [tempCardId]: createdCard.id },
        placements: {
          [tempPlacementId]: getCardPlacementId(createdCard),
        },
      };
    });
  }

  public async patchCard(
    cardId: Card['id'],
    patch: BoardCardUpdatePayload
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasCard(cardId)) return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'patch-card',
      cardId,
      patch,
    };
    return this.runOptimisticCommand('patch-card', mutation, async () => {
      await firstValueFrom(this.api.updateCard(cardId, patch));
    });
  }

  public async patchCardPlacement(
    placementId: CardPlacement['id'],
    patch: BoardCardPlacementUpdatePayload
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasCardPlacement(placementId))
      return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'patch-card-placement',
      placementId,
      patch,
    };
    return this.runOptimisticCommand(
      'patch-card-placement',
      mutation,
      async () => {
        await firstValueFrom(this.api.updateCardPlacement(placementId, patch));
      }
    );
  }

  public async deleteCardPlacement(
    placementId: CardPlacement['id']
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasCardPlacement(placementId))
      return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'delete-card-placement',
      placementId,
    };
    return this.runOptimisticCommand(
      'delete-card-placement',
      mutation,
      async () => {
        await firstValueFrom(this.api.deleteCardPlacement(placementId));
      }
    );
  }

  public async deleteCard(cardId: Card['id']): Promise<BoardsCommandResult> {
    if (!this.store.hasCard(cardId)) return createBoardsCommandSuccess();
    const mutation: BoardsOptimisticMutation = {
      id: this.createMutationId(),
      type: 'delete-card',
      cardId,
    };
    return this.runOptimisticCommand('delete-card', mutation, async () => {
      await firstValueFrom(this.api.deleteCard(cardId));
    });
  }

  public async createCardMirror(
    cardId: Card['id'],
    columnId: BoardColumn['id'],
    target: BoardPlacementTargetPayload
  ): Promise<BoardsCommandResult> {
    if (!this.store.hasCard(cardId) || !this.store.hasColumn(columnId))
      return createBoardsCommandSuccess();
    return this.runBackendCommand('create-card-mirror', async () => {
      await firstValueFrom(
        this.api.createCardPlacement({
          card: cardId,
          column: columnId,
          ...target,
        })
      );
      await this.store.reloadBoardSnapshot();
    });
  }

  public getCommandRecords(): BoardsCommandRecord[] {
    return Array.from(this.commandRecordsById.values());
  }

  private async runOptimisticCommand(
    kind: BoardsCommandKind,
    mutation: BoardsOptimisticMutation,
    action: () => Promise<Partial<BoardsOptimisticState['resolved']> | void>
  ): Promise<BoardsCommandResult> {
    const command = this.startCommand(kind, mutation.id);
    this.store.applyOptimisticMutation(mutation);
    try {
      const resolved = await action();
      const commandState = this.settleCommand(command.id, 'confirmed');
      await this.store.confirmOptimisticMutation(
        mutation.id,
        resolved,
        commandState
      );
      return createBoardsCommandSuccess();
    } catch {
      const commandState = this.settleCommand(
        command.id,
        'rejected',
        BOARDS_SAVE_COMMAND_ERROR
      );
      this.store.rejectOptimisticMutation(mutation.id, commandState);
      return createBoardsCommandFailure();
    }
  }

  private async runBackendCommand(
    kind: BoardsCommandKind,
    action: () => Promise<void>
  ): Promise<BoardsCommandResult> {
    const command = this.startCommand(kind);
    this.store.publishCommandState(this.createStoreCommandState());
    try {
      await action();
      this.store.publishCommandState(
        this.settleCommand(command.id, 'confirmed')
      );
      return createBoardsCommandSuccess();
    } catch {
      this.store.publishCommandState(
        this.settleCommand(command.id, 'rejected', BOARDS_SAVE_COMMAND_ERROR)
      );
      return createBoardsCommandFailure();
    }
  }

  private startCommand(
    kind: BoardsCommandKind,
    optimisticMutationId?: string
  ): BoardsCommandRecord {
    if (!this.hasRunningCommands()) {
      this.commandRecordsById.clear();
    }
    const command: BoardsCommandRecord = {
      id: this.createCommandId(),
      kind,
      status: 'running',
      ...(optimisticMutationId ? { optimisticMutationId } : {}),
    };
    this.commandRecordsById.set(command.id, command);
    return command;
  }

  private settleCommand(
    commandId: string,
    status: 'confirmed' | 'rejected',
    error?: BoardsCommandError
  ): {
    hasRunningCommands: boolean;
    errorKey: string | null;
  } {
    const command = this.commandRecordsById.get(commandId);
    if (command) {
      this.commandRecordsById.set(commandId, {
        ...command,
        status,
        ...(error ? { error } : {}),
      });
    }
    const commandState = this.createStoreCommandState();
    if (!commandState.hasRunningCommands) {
      this.commandRecordsById.clear();
    }
    return commandState;
  }

  private createStoreCommandState(): {
    hasRunningCommands: boolean;
    errorKey: string | null;
  } {
    const records = Array.from(this.commandRecordsById.values());
    const rejected = records.find((record) => record.status === 'rejected');
    return {
      hasRunningCommands: records.some((record) => record.status === 'running'),
      errorKey: rejected?.error?.messageKey ?? null,
    };
  }

  private hasRunningCommands(): boolean {
    return Array.from(this.commandRecordsById.values()).some(
      (record) => record.status === 'running'
    );
  }

  private createCommandId(): string {
    this.commandSequence += 1;
    return `boards-command-${this.commandSequence}`;
  }

  private createMutationId(): string {
    this.mutationSequence += 1;
    return `boards-command-mutation-${this.mutationSequence}`;
  }
}
