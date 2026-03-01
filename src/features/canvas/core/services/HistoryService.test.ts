import { describe, expect, it } from 'vitest';
import { Command } from '../commands/Command.ts';
import { HistoryService } from './HistoryService.ts';

class TestCommand extends Command {
  constructor(private readonly tracked: boolean) {
    super();
  }

  public execute(): void {}

  public undo(): void {}

  public override affectsUnsavedChanges(): boolean {
    return this.tracked;
  }
}

describe('HistoryService save-state tracking', () => {
  it('keeps clean state after untracked command', () => {
    const service = new HistoryService();
    service.markSaved();

    service.execute(new TestCommand(false));

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('marks unsaved after tracked command', () => {
    const service = new HistoryService();
    service.markSaved();

    service.execute(new TestCommand(true));

    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('does not dirty state when branching from tracked redo with untracked command', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    service.markSaved();

    service.execute(new TestCommand(true));
    service.undo();
    expect(service.hasUnsavedChanges()).toBe(false);

    service.execute(new TestCommand(false));
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('changes branch when replacing tracked redo with tracked command', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    service.execute(new TestCommand(true));
    service.markSaved();

    service.undo();
    expect(service.hasUnsavedChanges()).toBe(true);

    service.execute(new TestCommand(true));
    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('stays clean through undo/redo cycle of untracked command', () => {
    const service = new HistoryService();
    service.markSaved();
    service.execute(new TestCommand(false));

    expect(service.hasUnsavedChanges()).toBe(false);
    service.undo();
    expect(service.hasUnsavedChanges()).toBe(false);
    service.redo();
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('ignores untracked commands in state token index', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(false));
    service.execute(new TestCommand(true));
    service.execute(new TestCommand(false));

    expect(service.getStateToken()).toEqual({ branchId: 0, index: 1 });
  });

  it('can mark saved using token captured before untracked command', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    const token = service.getStateToken();
    service.execute(new TestCommand(false));

    service.markSaved(token);

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('clears undo/redo stacks and saved state on reset', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    service.undo();

    expect(service.canRedo()).toBe(true);
    expect(service.hasUnsavedChanges()).toBe(false);

    service.reset();

    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);
    expect(service.hasUnsavedChanges()).toBe(false);
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 0 });
  });
});
