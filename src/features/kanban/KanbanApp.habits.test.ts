import { describe, expect, it, vi } from 'vitest';
import { refreshKanbanData } from './KanbanApp.ts';

describe('KanbanApp habit update flow', () => {
  it('parent onHabitUpdate callback triggers data refresh', () => {
    const requestRefresh = vi.fn();
    const store = { requestRefresh };

    refreshKanbanData(store as any);

    expect(requestRefresh).toHaveBeenCalledWith('manual', true);
  });
});
