import type {
  TaskEditModel,
  TaskEditPatch,
  TaskEditRelationOption,
} from '../domain/index.ts';

export type TaskRelationSearchParams = {
  query: string;
  page: number;
  pageSize: number;
};

export type TaskStoryRelationSearchParams = TaskRelationSearchParams & {
  goalId: number | null;
};

export type TaskRelationSearchResult = {
  items: TaskEditRelationOption[];
  nextPage: number | null;
};

export type TaskEditRepositoryPort = {
  loadTask?: () => Promise<TaskEditModel>;
  saveTaskPatch: (
    patch: TaskEditPatch
  ) => Promise<TaskEditModel | void>;
  deleteTask?: () => Promise<void>;
};

export type TaskRelationCatalogPort = {
  searchGoals?: (
    params: TaskRelationSearchParams
  ) => Promise<TaskRelationSearchResult>;
  searchStories?: (
    params: TaskStoryRelationSearchParams
  ) => Promise<TaskRelationSearchResult>;
};

export type TaskEditPort = TaskEditRepositoryPort & TaskRelationCatalogPort;
