import { describe, expect, it } from 'vitest';
import {
  type Habit,
  Priority,
  Status,
  type PlatformTask,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { KanbanColumnId, KanbanColumnState } from '../types.ts';
import { buildKanbanColumns } from './buildBoard.ts';
import { KANBAN_COLUMN_ORDER } from './constants.ts';

const NOW = new Date(2026, 1, 25, 10, 0, 0);

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function makeTask(
  overrides: Partial<PlatformTask> & Pick<PlatformTask, 'id' | 'status'>
): PlatformTask {
  const status = overrides.status;
  return {
    id: overrides.id,
    uuid: overrides.uuid,
    title: overrides.title ?? `Task ${overrides.id}`,
    description: overrides.description ?? '',
    created_at: overrides.created_at ?? NOW,
    start_date: overrides.start_date ?? null,
    due_date: overrides.due_date ?? null,
    resolved_date: overrides.resolved_date ?? null,
    estimate: overrides.estimate ?? 0,
    subtasks: overrides.subtasks ?? [],
    priority: overrides.priority ?? Priority.Medium,
    status,
    tags: overrides.tags ?? [],
    tag_ids: overrides.tag_ids,
    challenge: overrides.challenge ?? null,
    goal: overrides.goal ?? null,
    goal_id: overrides.goal_id,
    strategy: overrides.strategy ?? null,
    is_completed:
      overrides.is_completed ??
      (status === Status.Completed || status === Status.Archived),
    is_standalone: overrides.is_standalone ?? true,
    relations: overrides.relations ?? [],
    project: overrides.project ?? null,
    project_id: overrides.project_id,
    stage: overrides.stage ?? null,
    module: overrides.module ?? null,
    element: overrides.element ?? null,
    flows: overrides.flows ?? [],
    flow_ids: overrides.flow_ids,
    story: overrides.story ?? null,
    story_id: overrides.story_id ?? null,
  };
}

function makeHabit(
  id: number,
  status: Status,
  isDueToday: boolean
): Habit {
  return {
    id,
    title: `Habit ${id}`,
    description: '',
    created_at: NOW,
    status,
    last_checked: NOW,
    is_due_today: isDueToday,
    weekly_completions: [],
    completions: [],
  };
}

function buildFromTasks(tasks: PlatformTask[]): KanbanColumnState[] {
  return buildKanbanColumns({
    tasks,
    habits: [],
    events: [],
    now: NOW,
  });
}

function byId(columns: KanbanColumnState[], id: KanbanColumnId): KanbanColumnState {
  const found = columns.find((column) => column.id === id);
  if (!found) {
    throw new Error(`Missing column "${id}" in test.`);
  }
  return found;
}

function collectAllTaskIds(columns: KanbanColumnState[]): number[] {
  return columns.flatMap((column) => [
    ...column.sections.tasks.map((task) => task.taskId),
    ...column.sections.challengeTasks.map((task) => task.taskId),
    ...column.sections.completedTasks.map((task) => task.taskId),
    ...column.sections.storyGroups.flatMap((group) =>
      group.tasks.map((task) => task.taskId)
    ),
  ]);
}

describe('buildKanbanColumns task assignment rules', () => {
  it('1) due today + active => today', () => {
    const columns = buildFromTasks([
      makeTask({ id: 1, status: Status.Active, due_date: addDays(NOW, 0) }),
    ]);

    expect(byId(columns, 'today').sections.tasks.map((item) => item.taskId)).toEqual([
      1,
    ]);
  });

  it('2) due today + completed => today and placement uses push order', () => {
    const columns = buildFromTasks([
      makeTask({ id: 10, status: Status.Completed, due_date: addDays(NOW, 0) }),
      makeTask({ id: 11, status: Status.Completed, due_date: addDays(NOW, 0) }),
    ]);

    expect(
      byId(columns, 'today').sections.completedTasks.map((item) => item.taskId)
    ).toEqual([10, 11]);
  });

  it('3) cancelled => cancelled', () => {
    const columns = buildFromTasks([makeTask({ id: 2, status: Status.Cancelled })]);

    expect(
      byId(columns, 'cancelled').sections.tasks.map((item) => item.taskId)
    ).toEqual([2]);
  });

  it('4) completed without today-rule => done', () => {
    const columns = buildFromTasks([
      makeTask({ id: 3, status: Status.Completed, due_date: addDays(NOW, 5) }),
    ]);

    expect(byId(columns, 'done').sections.completedTasks.map((item) => item.taskId)).toEqual([
      3,
    ]);
  });

  it('5) due in past => overdue', () => {
    const columns = buildFromTasks([
      makeTask({ id: 4, status: Status.Active, due_date: addDays(NOW, -1) }),
    ]);

    expect(byId(columns, 'overdue').sections.tasks.map((item) => item.taskId)).toEqual([
      4,
    ]);
  });

  it('6) due tomorrow => tomorrow', () => {
    const columns = buildFromTasks([
      makeTask({ id: 5, status: Status.Active, due_date: addDays(NOW, 1) }),
    ]);

    expect(byId(columns, 'tomorrow').sections.tasks.map((item) => item.taskId)).toEqual([
      5,
    ]);
  });

  it('7) due +3 days => soon', () => {
    const columns = buildFromTasks([
      makeTask({ id: 6, status: Status.Active, due_date: addDays(NOW, 3) }),
    ]);

    expect(byId(columns, 'soon').sections.tasks.map((item) => item.taskId)).toEqual([
      6,
    ]);
  });

  it('8) due +10 days => planned', () => {
    const columns = buildFromTasks([
      makeTask({ id: 7, status: Status.Active, due_date: addDays(NOW, 10) }),
    ]);

    expect(byId(columns, 'planned').sections.tasks.map((item) => item.taskId)).toEqual([
      7,
    ]);
  });

  it('9) active without due_date => todo', () => {
    const columns = buildFromTasks([makeTask({ id: 8, status: Status.Active })]);

    expect(byId(columns, 'todo').sections.tasks.map((item) => item.taskId)).toEqual([
      8,
    ]);
  });

  it('10) challenge tasks outside today/tomorrow are filtered out', () => {
    const columns = buildFromTasks([
      makeTask({
        id: 20,
        status: Status.Active,
        due_date: addDays(NOW, 10),
        challenge: 1,
      }),
      makeTask({ id: 21, status: Status.Active, challenge: 1 }),
      makeTask({ id: 22, status: Status.Completed, challenge: 1 }),
    ]);

    expect(collectAllTaskIds(columns)).not.toContain(20);
    expect(collectAllTaskIds(columns)).not.toContain(21);
    expect(collectAllTaskIds(columns)).not.toContain(22);
  });

  it('11) challenge tasks in today/tomorrow are allowed', () => {
    const columns = buildFromTasks([
      makeTask({
        id: 30,
        status: Status.Active,
        due_date: addDays(NOW, 0),
        challenge: 10,
      }),
      makeTask({
        id: 31,
        status: Status.Active,
        due_date: addDays(NOW, 1),
        challenge: 10,
      }),
    ]);

    expect(
      byId(columns, 'today').sections.challengeTasks.map((item) => item.taskId)
    ).toEqual([30]);
    expect(
      byId(columns, 'tomorrow').sections.challengeTasks.map((item) => item.taskId)
    ).toEqual([31]);
  });

  it('12) returns all predefined columns even when empty', () => {
    const columns = buildFromTasks([]);
    expect(columns.map((column) => column.id)).toEqual(KANBAN_COLUMN_ORDER);
  });

  it('assignHabitsToColumns adds only active habits and only in today', () => {
    const columns = buildKanbanColumns({
      tasks: [],
      events: [],
      habits: [
        makeHabit(101, Status.Active, true),
        makeHabit(102, Status.Cancelled, true),
        makeHabit(103, Status.Active, false),
      ],
      now: NOW,
    });

    expect(byId(columns, 'today').sections.habits.map((item) => item.habitId)).toEqual([
      101,
      103,
    ]);
    columns
      .filter((column) => column.id !== 'today')
      .forEach((column) => {
        expect(column.sections.habits).toHaveLength(0);
      });
  });
});
