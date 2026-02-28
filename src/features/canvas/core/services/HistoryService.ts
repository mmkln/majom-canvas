import { Command } from '../commands/Command.ts';
import { Subject } from 'rxjs';

export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private branchId = 0;
  private savedBranchId = 0;
  private savedIndex = 0;
  // Notify subscribers on undo/redo availability changes
  public changes = new Subject<void>();

  // Execute a command and add it to the undo stack
  public execute(command: Command): void {
    const hadRedo = this.redoStack.length > 0;
    command.execute();
    this.undoStack.push(command);
    if (hadRedo) {
      this.branchId += 1;
    }
    this.redoStack = [];
    this.changes.next();
  }

  // Undo last command
  public undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this.changes.next();
  }

  // Redo last undone command
  public redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
    this.changes.next();
  }

  /**
   * Returns true if undo is available
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Returns true if redo is available
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getStateToken(): { branchId: number; index: number } {
    return { branchId: this.branchId, index: this.undoStack.length };
  }

  public isTokenCurrent(token: { branchId: number; index: number }): boolean {
    return (
      token.branchId === this.branchId && token.index === this.undoStack.length
    );
  }

  public markSaved(token?: { branchId: number; index: number }): void {
    const nextToken = token ?? this.getStateToken();
    this.savedBranchId = nextToken.branchId;
    this.savedIndex = nextToken.index;
    this.changes.next();
  }

  public hasUnsavedChanges(): boolean {
    return (
      this.savedBranchId !== this.branchId ||
      this.savedIndex !== this.undoStack.length
    );
  }
}

export const historyService = new HistoryService();
