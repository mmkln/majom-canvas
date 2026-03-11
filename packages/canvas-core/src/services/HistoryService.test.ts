import { describe, expect, it } from 'vitest';
import { Command } from '../commands/Command.ts';
import { HistoryService } from './HistoryService.ts';

class TestCommand extends Command {
  public executed = 0;
  public undone = 0;

  constructor(private readonly tracked: boolean) {
    super();
  }

  public execute(): void {
    this.executed += 1;
  }

  public undo(): void {
    this.undone += 1;
  }

  public override affectsUnsavedChanges(): boolean {
    return this.tracked;
  }
}

describe('canvas-core HistoryService', () => {
  it('tracks unsaved state only for tracked commands', () => {
    const history = new HistoryService();
    history.markSaved();

    history.execute(new TestCommand(false));
    expect(history.hasUnsavedChanges()).toBe(false);

    history.execute(new TestCommand(true));
    expect(history.hasUnsavedChanges()).toBe(true);
  });

  it('supports undo/redo lifecycle', () => {
    const history = new HistoryService();
    const command = new TestCommand(true);

    history.execute(command);
    expect(command.executed).toBe(1);
    expect(history.canUndo()).toBe(true);

    history.undo();
    expect(command.undone).toBe(1);
    expect(history.canRedo()).toBe(true);

    history.redo();
    expect(command.executed).toBe(2);
  });

  it('invalidates token after reset', () => {
    const history = new HistoryService();
    history.execute(new TestCommand(true));
    const token = history.getStateToken();

    history.reset();

    expect(history.isTokenCurrent(token)).toBe(false);
    expect(history.getStateToken()).toEqual({ branchId: 0, index: 0 });
  });
});

