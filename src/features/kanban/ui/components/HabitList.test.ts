import { describe, expect, it, vi } from 'vitest';
import {
  Status,
  type Habit,
} from '../../../../majom-wrapper/interfaces/index.ts';
import type { KanbanHabitCard } from '../../types.ts';
import { HabitListComponent } from './HabitList.ts';
import type { KanbanViewHandlers } from './types.ts';

function makeHabitCard(id: number, isDueToday: boolean): KanbanHabitCard {
  const source: Habit = {
    id,
    title: `Habit ${id}`,
    description: '',
    created_at: new Date(2026, 1, 25),
    status: Status.Active,
    last_checked: new Date(2026, 1, 25),
    is_due_today: isDueToday,
    weekly_completions: [],
    completions: [],
  };

  return {
    key: String(id),
    habitId: id,
    title: source.title,
    isDueToday,
    isCompletedToday: !isDueToday,
    source,
  };
}

function makeHandlers(
  overrides: Partial<KanbanViewHandlers> = {}
): KanbanViewHandlers {
  return {
    onTaskPatch: () => undefined,
    onStoryGroupToggle: () => undefined,
    onStoryGroupsToggleAll: () => undefined,
    onTaskAction: () => undefined,
    onHabitToggle: async () => true,
    onHabitTitlePatch: async () => true,
    onHabitUpdate: () => undefined,
    ...overrides,
  };
}

describe('HabitListComponent', () => {
  it('sortItems splits due/completed lists by isDueToday', () => {
    const due = makeHabitCard(1, true);
    const completed = makeHabitCard(2, false);
    const component = new HabitListComponent({
      columnId: 'today',
      habits: [due, completed],
      completedHabitsCollapsed: new Set(),
      handlers: makeHandlers(),
      onLocalStateChange: () => undefined,
    });

    component.sortItems();

    expect(component.dueItemList.map((item) => item.habitId)).toEqual([1]);
    expect(component.completedItemList.map((item) => item.habitId)).toEqual([
      2,
    ]);
  });

  it('toggleCompletedList toggles collapsed state set', () => {
    const collapsed = new Set<'today'>(['today']);
    const component = new HabitListComponent({
      columnId: 'today',
      habits: [makeHabitCard(1, true)],
      completedHabitsCollapsed: collapsed,
      handlers: makeHandlers(),
      onLocalStateChange: () => undefined,
    });

    component.toggleCompletedList();
    expect(collapsed.has('today')).toBe(false);
    component.toggleCompletedList();
    expect(collapsed.has('today')).toBe(true);
  });

  it('onHabitComplete calls toggle handler and emits onHabitUpdate on success', async () => {
    const onHabitToggle = vi.fn(async () => true);
    const onHabitUpdate = vi.fn();
    const component = new HabitListComponent({
      columnId: 'today',
      habits: [makeHabitCard(1, true)],
      completedHabitsCollapsed: new Set(),
      handlers: makeHandlers({ onHabitToggle, onHabitUpdate }),
      onLocalStateChange: () => undefined,
    });

    await component.onHabitComplete(makeHabitCard(1, true), true);

    expect(onHabitToggle).toHaveBeenCalledWith(1, true);
    expect(onHabitUpdate).toHaveBeenCalledTimes(1);
  });

  it('onHabitTitleChange calls title patch handler and emits onHabitUpdate on success', async () => {
    const onHabitTitlePatch = vi.fn(async () => true);
    const onHabitUpdate = vi.fn();
    const component = new HabitListComponent({
      columnId: 'today',
      habits: [makeHabitCard(1, true)],
      completedHabitsCollapsed: new Set(),
      handlers: makeHandlers({ onHabitTitlePatch, onHabitUpdate }),
      onLocalStateChange: () => undefined,
    });

    await component.onHabitTitleChange(makeHabitCard(1, true), 'Updated title');

    expect(onHabitTitlePatch).toHaveBeenCalledWith(1, 'Updated title');
    expect(onHabitUpdate).toHaveBeenCalledTimes(1);
  });

  it('keeps loading=false after failed update call', async () => {
    const onHabitToggle = vi.fn(async () => false);
    const component = new HabitListComponent({
      columnId: 'today',
      habits: [makeHabitCard(1, true)],
      completedHabitsCollapsed: new Set(),
      handlers: makeHandlers({ onHabitToggle }),
      onLocalStateChange: () => undefined,
    });

    await component.onHabitComplete(makeHabitCard(1, true), true);

    expect(component.isLoading()).toBe(false);
  });
});
