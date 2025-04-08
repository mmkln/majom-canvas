// src/core/data/DummyDataProvider.ts
import { IDataProvider } from '../interfaces/dataProvider.ts';
import { Task, TaskDependency } from '../interfaces/interfaces.ts';
import { tasks, dependencies } from './dummyData.ts';

export class DataProvider implements IDataProvider {
  async loadTasks(): Promise<Task[]> {
    return tasks;
  }
  async loadDependencies(): Promise<TaskDependency[]> {
    return dependencies;
  }
}
