import { beforeEach, describe, expect, it } from 'vitest';
import { Command } from '../commands/Command.ts';
import { CopyCommand } from '../commands/CopyCommand.ts';
import { PasteCommand } from '../commands/PasteCommand.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { Scene } from '../scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { clipboardService } from './ClipboardService.ts';
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

  it('treats token as current when only untracked command is executed after it', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    const token = service.getStateToken();

    service.execute(new TestCommand(false));

    expect(service.getStateToken()).toEqual(token);
    expect(service.isTokenCurrent(token)).toBe(true);
  });

  it('marks saved from in-flight token when only untracked changes happened meanwhile', () => {
    const service = new HistoryService();
    service.markSaved();
    service.execute(new TestCommand(true));
    const tokenAtStart = service.getStateToken();
    service.execute(new TestCommand(false));

    if (service.isTokenCurrent(tokenAtStart)) {
      service.markSaved(tokenAtStart);
    }

    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('updates token index only for tracked commands through undo/redo sequence', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    service.execute(new TestCommand(false));
    service.execute(new TestCommand(true));
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 2 });

    service.undo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 1 });

    service.undo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 1 });

    service.undo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 0 });

    service.redo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 1 });

    service.redo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 1 });

    service.redo();
    expect(service.getStateToken()).toEqual({ branchId: 0, index: 2 });
  });

  it('increments branch only when replacing tracked redo with tracked command', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(false));
    service.undo();
    service.execute(new TestCommand(true));
    expect(service.getStateToken().branchId).toBe(0);

    service.execute(new TestCommand(true));
    service.undo();
    service.execute(new TestCommand(true));
    expect(service.getStateToken().branchId).toBe(1);
  });

  it('emits changes only on state-changing operations', () => {
    const service = new HistoryService();
    let emissions = 0;
    const subscription = service.changes.subscribe(() => {
      emissions += 1;
    });

    service.undo();
    service.redo();
    expect(emissions).toBe(0);

    service.execute(new TestCommand(false));
    service.undo();
    service.redo();
    service.markSaved();
    service.reset();
    expect(emissions).toBe(5);

    subscription.unsubscribe();
  });

  it('invalidates previously captured token after reset', () => {
    const service = new HistoryService();
    service.execute(new TestCommand(true));
    const tokenBeforeReset = service.getStateToken();

    service.reset();

    expect(service.isTokenCurrent(tokenBeforeReset)).toBe(false);
    const tokenAfterReset = service.getStateToken();
    expect(tokenAfterReset).toEqual({ branchId: 0, index: 0 });
    expect(service.isTokenCurrent(tokenAfterReset)).toBe(true);
  });
});

function createCanvasManagerStub(
  lastMouseCoords: { x: number; y: number } | null = { x: 600, y: 400 }
): CanvasManager {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;
  return {
    getLastMouseCoords: () => lastMouseCoords,
    getCanvas: () => ({ width: 1200, height: 800 } as HTMLCanvasElement),
    getPanZoomManager: () =>
      ({ scrollX: 0, scrollY: 0, scale: 1 }) as unknown as PanZoomLike,
  } as CanvasManager;
}

describe('HistoryService copy/paste integration', () => {
  beforeEach(() => {
    clipboardService.clear();
  });

  it('keeps clean state through copy undo/redo cycle', () => {
    const service = new HistoryService();
    const scene = new Scene();
    const task = new TaskElement({ x: 100, y: 120 });
    scene.addElement(task);
    scene.setSelected([task]);
    service.markSaved();

    service.execute(new CopyCommand(scene));
    expect(clipboardService.getItems()).toHaveLength(1);
    expect(service.hasUnsavedChanges()).toBe(false);

    service.undo();
    expect(clipboardService.getItems()).toHaveLength(0);
    expect(service.hasUnsavedChanges()).toBe(false);

    service.redo();
    expect(clipboardService.getItems()).toHaveLength(1);
    expect(service.hasUnsavedChanges()).toBe(false);
  });

  it('marks unsaved on paste and restores clean state on undo', () => {
    const service = new HistoryService();
    const scene = new Scene();
    const task = new TaskElement({ x: 200, y: 240 });
    scene.addElement(task);
    scene.setSelected([task]);
    service.markSaved();

    service.execute(new CopyCommand(scene));
    expect(service.hasUnsavedChanges()).toBe(false);

    const baseCount = scene.getElements().length;
    service.execute(new PasteCommand(scene, createCanvasManagerStub()));
    expect(scene.getElements()).toHaveLength(baseCount + 1);
    expect(service.hasUnsavedChanges()).toBe(true);

    service.undo();
    expect(scene.getElements()).toHaveLength(baseCount);
    expect(service.hasUnsavedChanges()).toBe(false);

    service.redo();
    expect(scene.getElements()).toHaveLength(baseCount + 1);
    expect(service.hasUnsavedChanges()).toBe(true);
  });

  it('clears paste redo on subsequent copy without dirtying saved state', () => {
    const service = new HistoryService();
    const scene = new Scene();
    const task = new TaskElement({ x: 300, y: 320 });
    scene.addElement(task);
    scene.setSelected([task]);

    service.markSaved();
    const savedToken = service.getStateToken();

    service.execute(new CopyCommand(scene));
    service.execute(new PasteCommand(scene, createCanvasManagerStub()));
    service.undo();
    expect(service.canRedo()).toBe(true);
    expect(service.hasUnsavedChanges()).toBe(false);

    service.execute(new CopyCommand(scene));
    expect(service.canRedo()).toBe(false);
    expect(service.hasUnsavedChanges()).toBe(false);
    expect(service.getStateToken()).toEqual(savedToken);
  });
});
