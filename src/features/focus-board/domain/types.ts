import type { Status } from '../../../majom-wrapper/interfaces/index.ts';

export const FOCUS_BOARD_CYCLE_LENGTH_OPTIONS = [3, 4, 5, 6, 7] as const;

export type FocusBoardCycleLength =
  (typeof FOCUS_BOARD_CYCLE_LENGTH_OPTIONS)[number];

export type FocusBoardTaskContainerId = 'backlog' | number;

export type FocusBoardApiDaySnapshot = {
  dayNumber: number;
  goal: string;
  focusTaskUuid: string | null;
  supportTaskUuids: string[];
};

export type FocusBoardApiSnapshot = {
  cycleStartDateKey: string | null;
  cycleLength: FocusBoardCycleLength | null;
  goal: string;
  days: FocusBoardApiDaySnapshot[];
};

export type BacklogApiSnapshot = {
  taskUuids: string[];
};

export type FocusBoardTask = {
  id: string;
  text: string;
  completed: boolean;
  isFocus: boolean;
};

export type FocusBoardTaskSearchItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type FocusBoardGoalFilterOption = {
  id: number;
  title: string;
};

export type FocusBoardStoryFilterOption = {
  id: number;
  title: string;
  goalId: number | null;
};

export type FocusBoardTaskPickerState = {
  open: boolean;
  query: string;
  items: FocusBoardTaskSearchItem[];
  loading: boolean;
  error: string | null;
  nextPage: number | null;
  total: number;
  status: Status | null;
  goal: FocusBoardGoalFilterOption | null;
  story: FocusBoardStoryFilterOption | null;
};

export type FocusBoardTaskComposerState = {
  open: boolean;
  target: FocusBoardTaskContainerId | null;
  title: string;
  saving: boolean;
  error: string | null;
};

export type FocusBoardHabit = {
  id: string;
  text: string;
  accent: string;
  badge: string;
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest';
};

export type FocusBoardSnapshot = {
  title: string;
  hasActiveCycle: boolean;
  cycleStartDateKey: string;
  goal: string;
  tempGoal: string;
  cycleLength: FocusBoardCycleLength;
  tempCycleLength: FocusBoardCycleLength;
  cycleLengthOptions: readonly FocusBoardCycleLength[];
  habits: FocusBoardHabit[];
  habitChecks: Record<number, Record<string, boolean>>;
  dailyGoals: Record<number, string>;
  days: Record<number, FocusBoardTask[]>;
  backlog: FocusBoardTask[];
  backlogSearchQuery: string;
  backlogOpen: boolean;
  goalModalOpen: boolean;
  habitManagerOpen: boolean;
  activeHabitDay: number | null;
  taskPicker: FocusBoardTaskPickerState;
  taskComposer: FocusBoardTaskComposerState;
};
