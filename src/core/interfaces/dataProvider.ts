// src/core/data/IDataProvider.ts
import { Task, TaskDependency } from './interfaces';

export interface IDataProvider {
  loadTasks(): Promise<Task[]>;
  loadDependencies(): Promise<TaskDependency[]>;
}
