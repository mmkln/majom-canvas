// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { CanvasDataService } from './CanvasDataService.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';

describe('CanvasDataService element update tracking', () => {
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
});
