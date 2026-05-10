import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { KanbanStore } from './KanbanStore.ts';
import { notify } from '../../../ui-lib/src/services/NotificationService.ts';

vi.mock('../../../ui-lib/src/services/NotificationService.ts', () => ({
  notify: vi.fn(),
}));

describe('KanbanStore habit updates', () => {
  it('shows error notification and returns false when habit API fails', async () => {
    const dataService = {
      loadSnapshot: vi.fn(() =>
        of({ tasks: [], habits: [], events: [], now: new Date() })
      ),
      patchTask: vi.fn(),
      toggleHabitCompletion: vi.fn(() =>
        throwError(() => new Error('toggle failed'))
      ),
      patchHabitTitle: vi.fn(() => throwError(() => new Error('title failed'))),
    } as any;

    const store = new KanbanStore(dataService);
    const result = await store.toggleHabitCompleted('habit-uuid-101', true);

    expect(result).toBe(false);
    expect(notify).toHaveBeenCalledWith('Failed to update routine', 'error');
    expect(store.getState().loading).toBe(false);
    store.destroy();
  });
});
