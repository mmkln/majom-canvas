// src/core/data/IDataProvider.ts
import { ITask, TaskDependency, IStory } from './interfaces.ts';

export interface IDataProvider {
  loadTasks(): Promise<ITask[]>;
  loadDependencies(): Promise<TaskDependency[]>;
  /** Save tasks collection */
  saveTasks(tasks: ITask[]): Promise<void>;
  /** Save dependencies collection */
  saveDependencies(deps: TaskDependency[]): Promise<void>;
  loadStories(): Promise<IStory[]>;
  saveStories(stories: IStory[]): Promise<void>;
}
