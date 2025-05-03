// src/core/data/IDataProvider.ts
import {
  ITask,
  TaskDependency,
  IStory,
  IViewState,
  IGoal,
} from './interfaces.ts';

export interface IDataProvider {
  loadTasks(): Promise<ITask[]>;
  loadDependencies(): Promise<TaskDependency[]>;
  /** Save tasks collection */
  saveTasks(tasks: ITask[]): Promise<void>;
  /** Save dependencies collection */
  saveDependencies(deps: TaskDependency[]): Promise<void>;
  loadStories(): Promise<IStory[]>;
  saveStories(stories: IStory[]): Promise<void>;
  /** Load saved goals */
  loadGoals(): Promise<IGoal[]>;
  /** Save goals collection */
  saveGoals(goals: IGoal[]): Promise<void>;
  /** Load saved view (scroll & zoom) */
  loadViewState(): Promise<IViewState>;
  /** Save current view (scroll & zoom) */
  saveViewState(state: IViewState): Promise<void>;
}
