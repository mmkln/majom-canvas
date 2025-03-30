// src/core/data/DummyDataProvider.ts
import { IDataProvider } from '../interfaces/dataProvider';
import { Task, TaskDependency } from '../interfaces/interfaces';
import { tasks, dependencies } from './dummyData';

export class DataProvider implements IDataProvider {
  async loadTasks(): Promise<Task[]> {
    return tasks;
  }
  async loadDependencies(): Promise<TaskDependency[]> {
    return dependencies;
  }
}
