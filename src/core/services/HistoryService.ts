import { Command } from '../commands/Command.ts';

export class HistoryService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  // Execute a command and add it to the undo stack
  public execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  // Undo last command
  public undo(): void {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  // Redo last undone command
  public redo(): void {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
  }
}

export const historyService = new HistoryService();
