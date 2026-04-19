import type {
  FocusBoardGoalFilterOption,
  FocusBoardSnapshot,
  FocusBoardStoryFilterOption,
  FocusBoardTask,
  FocusBoardTaskSearchItem,
} from '../domain/types.ts';
import type { Status } from '../../../majom-wrapper/interfaces/index.ts';

export type FocusBoardRepositoryResult<T> = T | Promise<T>;

export interface FocusBoardRepository {
  load(): FocusBoardRepositoryResult<FocusBoardSnapshot | null>;
  save(snapshot: FocusBoardSnapshot): FocusBoardRepositoryResult<void>;
  searchTasks(params: {
    query: string;
    page: number;
    pageSize: number;
    status: Status | null;
    goalId: number | null;
    storyId: number | null;
  }): FocusBoardRepositoryResult<{
    items: FocusBoardTaskSearchItem[];
    nextPage: number | null;
    total: number;
  }>;
  searchGoals(params: {
    query: string;
    page: number;
    pageSize: number;
  }): FocusBoardRepositoryResult<{
    items: FocusBoardGoalFilterOption[];
    nextPage: number | null;
  }>;
  searchStories(params: {
    query: string;
    page: number;
    pageSize: number;
    goalId: number | null;
  }): FocusBoardRepositoryResult<{
    items: FocusBoardStoryFilterOption[];
    nextPage: number | null;
  }>;
  createTask(title: string): FocusBoardRepositoryResult<FocusBoardTask>;
  setTaskCompleted(
    taskId: string,
    completed: boolean
  ): FocusBoardRepositoryResult<void>;
  toggleHabitCompletion(
    habitId: string,
    date: Date
  ): FocusBoardRepositoryResult<void>;
}
