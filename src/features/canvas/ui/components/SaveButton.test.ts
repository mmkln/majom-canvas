// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { emitCanvasAutosaveToggled } from '../../core/canvasAutosaveLifecycle.ts';
import { CanvasPersistenceState } from '../../core/services/CanvasPersistenceState.ts';
import { emitCanvasElementAutosaveStatus } from '../../core/canvasElementAutosaveLifecycle.ts';
import {
  emitCanvasSaveFinished,
  emitCanvasSaveStarted,
} from '../../core/canvasSaveLifecycle.ts';
import { SaveButton } from './SaveButton.ts';

describe('SaveButton element autosave status', () => {
  let isLoggedInSpy: ReturnType<typeof vi.spyOn>;
  let saveButton: SaveButton | null = null;
  let persistenceState: CanvasPersistenceState;
  let activeCanvasId: string | null;

  beforeEach(() => {
    localStorage.clear();
    historyService.reset();
    persistenceState = new CanvasPersistenceState();
    activeCanvasId = 'canvas-1';
    isLoggedInSpy = vi
      .spyOn(AuthService.prototype, 'isLoggedIn')
      .mockReturnValue(true);
  });

  afterEach(() => {
    saveButton?.unmount();
    saveButton = null;
    isLoggedInSpy.mockRestore();
    document.body.innerHTML = '';
    localStorage.clear();
    historyService.reset();
  });

  function mountSaveButton(canvasId = 'canvas-1'): HTMLButtonElement {
    activeCanvasId = canvasId;
    saveButton = new SaveButton(
      persistenceState,
      {
        getActiveCanvasId: () => activeCanvasId,
        canTriggerManualSave: () => true,
      },
      createAppRuntime({ initialLocale: 'en' })
    );
    saveButton.mount(document.body);
    const button = document.body.querySelector<HTMLButtonElement>('button');
    if (!button) {
      throw new Error('Save button was not rendered');
    }
    return button;
  }

  it('shows unsaved changes for queued element autosaves on the active canvas', () => {
    const button = mountSaveButton();

    emitCanvasElementAutosaveStatus({
      canvasId: 'canvas-1',
      status: 'queued',
    });

    expect(button.textContent).toContain('Save');
    expect(button.disabled).toBe(true);
    expect(button.title).toContain('Unsaved changes');
  });

  it('returns to saved state after the active canvas element autosave succeeds', () => {
    const button = mountSaveButton();

    emitCanvasElementAutosaveStatus({
      canvasId: 'canvas-1',
      status: 'queued',
    });
    emitCanvasElementAutosaveStatus({
      canvasId: 'canvas-1',
      status: 'saved',
    });

    expect(button.textContent).toContain('Saved');
    expect(button.title).toContain('All changes saved');
  });

  it('ignores element autosave events for a different canvas', () => {
    const button = mountSaveButton('canvas-2');

    emitCanvasElementAutosaveStatus({
      canvasId: 'canvas-1',
      status: 'failed',
    });

    expect(button.textContent).toContain('Saved');
    expect(button.title).toContain('All changes saved');
  });

  it('enables manual save when restored layout changes are pending', () => {
    const button = mountSaveButton();

    persistenceState.markRestoredLayoutDirty();

    expect(button.textContent).toContain('Save');
    expect(button.disabled).toBe(false);
    expect(button.title).toContain('Unsaved changes');
  });

  it('shows saving state while restored replay is pending', () => {
    const button = mountSaveButton();

    persistenceState.startRestoredReplay();

    expect(button.disabled).toBe(true);
    expect(button.title).toContain('Autosave in progress');
  });

  it('enables retry when restored replay failed', () => {
    const button = mountSaveButton();

    persistenceState.startRestoredReplay();
    persistenceState.markRestoredReplayFailed();

    expect(button.textContent).toContain('Save');
    expect(button.disabled).toBe(false);
    expect(button.title).toContain('Autosave failed');
  });

  it('disables manual save and explains why when canvas loading blocks persistence', () => {
    activeCanvasId = 'canvas-1';
    saveButton = new SaveButton(
      persistenceState,
      {
        getActiveCanvasId: () => activeCanvasId,
        canTriggerManualSave: () => false,
        getManualSaveBlockedReason: () => 'Wait for canvas to finish loading',
      },
      createAppRuntime({ initialLocale: 'en' })
    );
    saveButton.mount(document.body);
    const button = document.body.querySelector<HTMLButtonElement>('button');
    if (!button) {
      throw new Error('Save button was not rendered');
    }

    persistenceState.markRestoredLayoutDirty();

    expect(button.disabled).toBe(true);
    expect(button.title).toContain('Wait for canvas to finish loading');
  });

  it('clears autosave-in-progress UI after autosave is turned off', () => {
    const button = mountSaveButton();

    emitCanvasSaveStarted('autosave');
    expect(button.title).toContain('Autosave in progress');
    expect(button.disabled).toBe(true);

    emitCanvasAutosaveToggled(false);

    expect(button.title).not.toContain('Autosave in progress');
    expect(button.textContent).toContain('Saved');
    expect(button.disabled).toBe(true);
  });

  it('returns from autosave mode to manual save mode when autosave is turned off with pending layout changes', () => {
    const button = mountSaveButton();

    persistenceState.markRestoredLayoutDirty();
    emitCanvasSaveStarted('autosave');
    emitCanvasSaveFinished('autosave');
    expect(button.title).toContain('Autosave failed');

    emitCanvasAutosaveToggled(false);

    expect(button.textContent).toContain('Save');
    expect(button.disabled).toBe(false);
    expect(button.title).toContain('Unsaved changes');
  });
});
