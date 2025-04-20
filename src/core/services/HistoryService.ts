import { Command } from '../commands/Command.ts';
import { Subject } from 'rxjs';

export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  // Notify subscribers on undo/redo availability changes
  public changes = new Subject<void>();

  // Execute a command and add it to the undo stack
  public execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
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
}

export const historyService = new HistoryService();
