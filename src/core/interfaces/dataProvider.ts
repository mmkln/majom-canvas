// src/core/data/IDataProvider.ts
import { Task, TaskDependency } from './interfaces.ts';

export interface IDataProvider {
  loadTasks(): Promise<Task[]>;
  loadDependencies(): Promise<TaskDependency[]>;
}
