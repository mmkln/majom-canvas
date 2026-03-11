import { Subject } from 'rxjs';
import type { Command } from '../commands/Command.ts';

export type HistoryStateToken = {
  branchId: number;
  index: number;
};

/**
 * Undo/redo command history with branch-aware saved-state tracking.
 */
export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private branchId = 0;
  private savedBranchId = 0;
  private savedIndex = 0;

  public readonly changes = new Subject<void>();

  /**
   * Executes command and pushes it to undo stack.
   */
  public execute(command: Command): void {
    const hadTrackedRedo = this.redoStack.some((cmd) =>
      cmd.affectsUnsavedChanges()
    );
    command.execute();
    this.undoStack.push(command);
    if (hadTrackedRedo && command.affectsUnsavedChanges()) {
      this.branchId += 1;
    }
    this.redoStack = [];
    this.changes.next();
  }

  /**
   * Reverts last command, moving it to redo stack.
   */
  public undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.changes.next();
  }

  /**
   * Re-applies last undone command.
   */
  public redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
    this.changes.next();
  }

  /**
   * Returns whether undo operation is currently possible.
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Returns whether redo operation is currently possible.
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Returns branch/index token representing current tracked history position.
   */
  public getStateToken(): HistoryStateToken {
    return {
      branchId: this.branchId,
      index: this.getTrackedUndoCount(),
    };
  }

  /**
   * Compares external token with current history token.
   */
  public isTokenCurrent(token: HistoryStateToken): boolean {
    const current = this.getStateToken();
    return (
      token.branchId === current.branchId && token.index === current.index
    );
  }

  /**
   * Marks provided token (or current state) as "saved".
   */
  public markSaved(token?: HistoryStateToken): void {
    const nextToken = token ?? this.getStateToken();
    this.savedBranchId = nextToken.branchId;
    this.savedIndex = nextToken.index;
    this.changes.next();
  }

  /**
   * Returns `true` when current history diverges from saved token.
   */
  public hasUnsavedChanges(): boolean {
    const current = this.getStateToken();
    return (
      this.savedBranchId !== current.branchId ||
      this.savedIndex !== current.index
    );
  }

  /**
   * Clears history and saved-state markers.
   */
  public reset(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.branchId = 0;
    this.savedBranchId = 0;
    this.savedIndex = 0;
    this.changes.next();
  }

  private getTrackedUndoCount(): number {
    let count = 0;
    for (const command of this.undoStack) {
      if (command.affectsUnsavedChanges()) {
        count += 1;
      }
    }
    return count;
  }
}
