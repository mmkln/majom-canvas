// src/core/data/DummyDataProvider.ts
import { IDataProvider } from '../interfaces/dataProvider.ts';
import { IStory, ITask, TaskDependency } from '../interfaces/interfaces.ts';
import { tasks, dependencies } from './dummyData.ts';

export class DataProvider implements IDataProvider {
  async loadTasks(): Promise<ITask[]> {
    return tasks;
  }
  async loadDependencies(): Promise<TaskDependency[]> {
    return dependencies;
  }
  // no-op save for dummy provider
  async saveTasks(tasks: ITask[]): Promise<void> {
    // stub
  }
  async saveDependencies(deps: TaskDependency[]): Promise<void> {
    // stub
  }

  loadStories(): Promise<IStory[]> {
    return Promise.resolve([]);
  }

  saveStories(stories: IStory[]): Promise<void> {
    return Promise.resolve(undefined);
  }
}
