// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { CanvasDataService } from './CanvasDataService.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';
import { CanvasClientStorage } from '../../features/canvas/core/services/CanvasClientStorage.ts';
import {
  getLastOpenedCanvasIdPreference,
  resetUserPreferencesForTests,
  setLastOpenedCanvasIdPreference,
} from '../../features/shell/services/UserPreferencesService.ts';

function createCanvasDataService(overrides: { canvases?: any[] } = {}) {
  const canvasApi = {
    loadCanvases: vi.fn(() => of(overrides.canvases ?? [])),
    createCanvas: vi.fn(() =>
      of({
        id: 'created-canvas',
        name: 'New canvas',
        meta: null,
      })
    ),
  };
  const service = new CanvasDataService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    canvasApi as any,
    {} as any
  );
  return { service, canvasApi };
}

describe('CanvasDataService element update tracking', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
  });

  it('treats queued element updates as unpersisted before debounce flush', async () => {
    const tasksApi = {
      patchTask: vi.fn(() =>
        of({
          id: 42,
          uuid: 'task-uuid-42',
          title: 'Updated task',
          description: '',
          status: 'defined',
          priority: 'low',
          due_date: null,
        })
      ),
    };
    const service = new CanvasDataService(
      tasksApi as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    service.setActiveCanvas({
      id: 'canvas-1',
      name: 'Canvas',
      meta: null,
    });
    const task = new TaskElement({
      id: 'task-1',
      backendId: 42,
      uuid: 'task-uuid-42',
      title: 'Original task',
    });

    service.queueElementUpdate(task, { title: 'Updated task' });

    expect(service.hasUnpersistedElementUpdates()).toBe(true);

    await firstValueFrom(
      (service as any).persistElementUpdate({
        canvasId: 'canvas-1',
        key: 'task:task-1',
        element: task,
        patch: { title: 'Updated task' },
      })
    );

    expect(tasksApi.patchTask).toHaveBeenCalledWith('task-uuid-42', {
      title: 'Updated task',
    });
    expect(service.hasUnpersistedElementUpdates()).toBe(false);
  });

  it('bootstraps the tab active canvas before the profile fallback', async () => {
    setLastOpenedCanvasIdPreference('canvas-profile');
    CanvasClientStorage.persistCanvasSessionActiveCanvasId('canvas-tab');
    const { service } = createCanvasDataService({
      canvases: [
        { id: 'canvas-profile', name: 'Profile Canvas', meta: null },
        { id: 'canvas-tab', name: 'Tab Canvas', meta: null },
      ],
    });

    const result = await firstValueFrom(service.bootstrapCanvas());

    expect(result.activeCanvas.id).toBe('canvas-tab');
    expect(service.getActiveCanvasId()).toBe('canvas-tab');
  });

  it('does not write routine active canvas changes into the profile fallback', () => {
    setLastOpenedCanvasIdPreference('canvas-profile');
    const { service } = createCanvasDataService();

    service.setActiveCanvas({
      id: 'canvas-tab',
      name: 'Tab Canvas',
      meta: null,
    });

    expect(getLastOpenedCanvasIdPreference()).toBe('canvas-profile');
  });
});
