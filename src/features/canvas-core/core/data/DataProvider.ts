// src/core/data/DummyDataProvider.ts
import { IDataProvider } from '../interfaces/dataProvider.ts';
import {
  IGoal,
  IStory,
  ITask,
  IViewState,
  TaskDependency,
} from '../interfaces/interfaces.ts';
import { tasks, dependencies } from './dummyData.ts';

export class DataProvider implements IDataProvider {
  async loadTasks(): Promise<ITask[]> {
    return tasks;
  }
  async loadDependencies(): Promise<TaskDependency[]> {
    return dependencies;
  }
  // no-op save for dummy provider
  async saveTasks(_tasks: ITask[]): Promise<void> {
    // stub
  }
  async saveDependencies(_deps: TaskDependency[]): Promise<void> {
    // stub
  }

  async loadStories(): Promise<IStory[]> {
    return [];
  }

  async saveStories(_stories: IStory[]): Promise<void> {
    // stub
  }

  async loadGoals(): Promise<IGoal[]> {
    return [];
  }

  async saveGoals(_goals: IGoal[]): Promise<void> {
    // stub
  }

  async loadViewState(_canvasId?: string | null): Promise<IViewState> {
    return { scrollX: 0, scrollY: 0, scale: 1.4 };
  }

  async saveViewState(
    _state: IViewState,
    _canvasId?: string | null
  ): Promise<void> {
    // stub
  }
}
