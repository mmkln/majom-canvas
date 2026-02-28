import type {
  Habit,
  PlatformEvent,
  PlatformTask,
  Priority,
  Status,
} from '../../majom-wrapper/interfaces/index.ts';

export type KanbanColumnId =
  | 'today'
  | 'tomorrow'
  | 'soon'
  | 'overdue'
  | 'planned'
  | 'todo'
  | 'done'
  | 'cancelled';

export type KanbanRefreshReason =
  | 'initial'
  | 'manual'
  | 'task_patch'
  | 'midnight'
  | 'external';

export type KanbanTaskPatch = Partial<{
  title: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
}>;

export type KanbanTaskCard = {
  key: string;
  taskId: number;
  title: string;
  status: Status;
  priority: Priority;
  dueDate: Date | null;
  dueDateInput: string;
  dueDateLabel: string;
  isCompleted: boolean;
  isChallenge: boolean;
  storyKey: string | null;
  storyTitle: string | null;
  source: PlatformTask;
};

export type KanbanHabitCard = {
  key: string;
  habitId: number;
  title: string;
  isDueToday: boolean;
  isCompletedToday: boolean;
  source: Habit;
};

export type KanbanEventCard = {
  key: string;
  eventId: number;
  title: string;
  startTime: Date | null;
  endTime: Date | null;
  source: PlatformEvent;
};

export type KanbanStoryGroup = {
  key: string;
  storyKey: string;
  title: string;
  collapsed: boolean;
  tasks: KanbanTaskCard[];
  completedCount: number;
  totalCount: number;
};

export type KanbanColumnSections = {
  events: KanbanEventCard[];
  storyGroups: KanbanStoryGroup[];
  tasks: KanbanTaskCard[];
  challengeTasks: KanbanTaskCard[];
  habits: KanbanHabitCard[];
  completedTasks: KanbanTaskCard[];
};

export type KanbanColumnProgress = {
  completed: number;
  total: number;
};

export type KanbanColumnState = {
  id: KanbanColumnId;
  title: string;
  progress: KanbanColumnProgress;
  sections: KanbanColumnSections;
};

export type KanbanBoardState = {
  columns: KanbanColumnState[];
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
};

export type KanbanDataSnapshot = {
  tasks: PlatformTask[];
  habits: Habit[];
  events: PlatformEvent[];
  now: Date;
};

export type KanbanBuildOptions = {
  collapsedStoryGroups?: ReadonlySet<string>;
};

export type KanbanTaskAction = 'open' | 'clone' | 'add-subtask';
