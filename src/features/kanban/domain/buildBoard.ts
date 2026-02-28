import type {
  KanbanBuildOptions,
  KanbanColumnId,
  KanbanColumnState,
  KanbanDataSnapshot,
  KanbanEventCard,
  KanbanHabitCard,
  KanbanStoryGroup,
  KanbanTaskCard,
} from '../types.ts';
import { KANBAN_COLUMN_ORDER, KANBAN_COLUMN_TITLES } from './constants.ts';
import {
  parseToDate,
  toDateInputValue,
  toShortDateLabel,
} from './dateUtils.ts';
import {
  isActiveHabit,
  isCompletedStatus,
  resolveEventColumn,
  resolveTaskColumn,
  shouldIncludeChallengeTask,
} from './rules.ts';

type MutableStoryGroup = {
  key: string;
  storyKey: string;
  title: string;
  tasks: KanbanTaskCard[];
};

type MutableColumn = {
  id: KanbanColumnId;
  title: string;
  events: KanbanEventCard[];
  tasks: KanbanTaskCard[];
  challengeTasks: KanbanTaskCard[];
  habits: KanbanHabitCard[];
  completedTasks: KanbanTaskCard[];
  storyGroupsByKey: Map<string, MutableStoryGroup>;
};

export function buildStoryGroupCollapseKey(
  columnId: KanbanColumnId,
  storyKey: string
): string {
  return `${columnId}:${storyKey}`;
}

export function createEmptyKanbanColumns(): KanbanColumnState[] {
  return KANBAN_COLUMN_ORDER.map((id) => ({
    id,
    title: KANBAN_COLUMN_TITLES[id],
    progress: { completed: 0, total: 0 },
    sections: {
      events: [],
      storyGroups: [],
      tasks: [],
      challengeTasks: [],
      habits: [],
      completedTasks: [],
    },
  }));
}

function createMutableColumns(): Map<KanbanColumnId, MutableColumn> {
  return new Map(
    KANBAN_COLUMN_ORDER.map((id) => [
      id,
      {
        id,
        title: KANBAN_COLUMN_TITLES[id],
        events: [],
        tasks: [],
        challengeTasks: [],
        habits: [],
        completedTasks: [],
        storyGroupsByKey: new Map(),
      },
    ])
  );
}

function toTaskCard(task: KanbanDataSnapshot['tasks'][number]): KanbanTaskCard {
  const dueDate = parseToDate(task.due_date);
  const storyId = task.story?.id ?? task.story_id ?? null;
  const storyKey = storyId ? String(storyId) : null;
  const storyTitle =
    task.story?.title ?? (storyKey ? `Story #${storyKey}` : null);
  return {
    key: task.uuid ?? String(task.id),
    taskId: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate,
    dueDateInput: toDateInputValue(dueDate),
    dueDateLabel: toShortDateLabel(dueDate),
    isCompleted: isCompletedStatus(task.status),
    isChallenge: task.challenge !== null,
    storyKey,
    storyTitle,
    source: task,
  };
}

function toEventCard(
  event: KanbanDataSnapshot['events'][number]
): KanbanEventCard {
  return {
    key: String(event.id),
    eventId: event.id,
    title: event.title,
    startTime: parseToDate(event.start_time),
    endTime: parseToDate(event.end_time),
    source: event,
  };
}

function toHabitCard(
  habit: KanbanDataSnapshot['habits'][number]
): KanbanHabitCard {
  const isDueToday = habit.is_due_today === true;
  return {
    key: String(habit.id),
    habitId: habit.id,
    title: habit.title,
    isDueToday,
    isCompletedToday: !isDueToday,
    source: habit,
  };
}

function addStoryTask(
  column: MutableColumn,
  taskCard: KanbanTaskCard,
  storyKey: string
): void {
  const groupKey = storyKey;
  const title = taskCard.storyTitle ?? `Story #${storyKey}`;
  let group = column.storyGroupsByKey.get(groupKey);
  if (!group) {
    group = {
      key: groupKey,
      storyKey: groupKey,
      title,
      tasks: [],
    };
    column.storyGroupsByKey.set(groupKey, group);
  }
  group.tasks.unshift(taskCard);
}

function finalizeStoryGroups(
  column: MutableColumn,
  options: KanbanBuildOptions
): KanbanStoryGroup[] {
  const collapsedStoryGroups =
    options.collapsedStoryGroups ?? new Set<string>();
  const groups = Array.from(column.storyGroupsByKey.values());
  return groups.map((group) => {
    const collapseKey = buildStoryGroupCollapseKey(column.id, group.storyKey);
    return {
      key: group.key,
      storyKey: group.storyKey,
      title: group.title,
      collapsed: collapsedStoryGroups.has(collapseKey),
      tasks: group.tasks,
      completedCount: group.tasks.filter((item) => item.isCompleted).length,
      totalCount: group.tasks.length,
    };
  });
}

function calculateProgress(
  column: MutableColumn,
  storyGroups: KanbanStoryGroup[]
): KanbanColumnState['progress'] {
  const groupedCount = storyGroups.reduce(
    (acc, group) => acc + group.tasks.length,
    0
  );
  const habitCompleted = column.habits.filter(
    (habit) => habit.isCompletedToday
  ).length;
  const habitTotal = column.habits.length;
  const completed = column.completedTasks.length + habitCompleted;
  const total =
    groupedCount +
    column.tasks.length +
    column.challengeTasks.length +
    column.completedTasks.length +
    habitTotal;
  return {
    completed,
    total,
  };
}

function placeTaskCardInColumn(
  column: MutableColumn,
  columnId: KanbanColumnId,
  taskCard: KanbanTaskCard
): void {
  if (taskCard.isCompleted) {
    if (columnId === 'today') {
      column.completedTasks.push(taskCard);
    } else {
      column.completedTasks.unshift(taskCard);
    }
    return;
  }

  if (taskCard.storyKey) {
    addStoryTask(column, taskCard, taskCard.storyKey);
    return;
  }

  if (taskCard.isChallenge) {
    column.challengeTasks.unshift(taskCard);
    return;
  }

  column.tasks.unshift(taskCard);
}

export function assignTasksToColumns(
  tasks: KanbanDataSnapshot['tasks'],
  columns: Map<KanbanColumnId, MutableColumn>,
  now: Date
): void {
  tasks.forEach((task) => {
    const columnId = resolveTaskColumn(task, now);
    if (!columnId) return;
    if (!shouldIncludeChallengeTask(task, columnId)) return;

    const column = columns.get(columnId);
    if (!column) return;

    const taskCard = toTaskCard(task);
    placeTaskCardInColumn(column, columnId, taskCard);
  });
}

export function assignHabitsToColumns(
  habits: KanbanDataSnapshot['habits'],
  columns: Map<KanbanColumnId, MutableColumn>
): void {
  const todayColumn = columns.get('today');
  if (!todayColumn) return;

  habits.forEach((habit) => {
    if (!isActiveHabit(habit)) return;
    todayColumn.habits.push(toHabitCard(habit));
  });
}

export function assignEventsToColumns(
  events: KanbanDataSnapshot['events'],
  columns: Map<KanbanColumnId, MutableColumn>,
  now: Date
): void {
  events.forEach((event) => {
    const columnId = resolveEventColumn(event, now);
    if (!columnId) return;
    const column = columns.get(columnId);
    if (!column) return;
    column.events.push(toEventCard(event));
  });
}

export function buildKanbanColumns(
  snapshot: KanbanDataSnapshot,
  options: KanbanBuildOptions = {}
): KanbanColumnState[] {
  const columns = createMutableColumns();
  const now = snapshot.now;

  assignTasksToColumns(snapshot.tasks, columns, now);
  assignHabitsToColumns(snapshot.habits, columns);
  assignEventsToColumns(snapshot.events, columns, now);

  return KANBAN_COLUMN_ORDER.map((id) => {
    const column = columns.get(id);
    if (!column) {
      throw new Error(`Missing mutable column "${id}".`);
    }

    const storyGroups = finalizeStoryGroups(column, options);
    const progress = calculateProgress(column, storyGroups);

    return {
      id: column.id,
      title: column.title,
      progress,
      sections: {
        events: column.events,
        storyGroups,
        tasks: column.tasks,
        challengeTasks: column.challengeTasks,
        habits: column.habits,
        completedTasks: column.completedTasks,
      },
    };
  });
}
