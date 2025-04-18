import { IDataProvider } from '../interfaces/dataProvider.ts';
import { ITask, TaskDependency, IStory } from '../interfaces/interfaces.ts';

const TASKS_KEY = 'canvas-tasks';
const DEPS_KEY = 'canvas-dependencies';
const STORIES_KEY = 'canvas-stories';

/**
 * DataProvider that reads/writes tasks and dependencies to localStorage.
 */
export class LocalStorageDataProvider implements IDataProvider {
  async loadTasks(): Promise<ITask[]> {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) as ITask[] : [];
  }

  async loadDependencies(): Promise<TaskDependency[]> {
    const raw = localStorage.getItem(DEPS_KEY);
    return raw ? JSON.parse(raw) as TaskDependency[] : [];
  }

  async loadStories(): Promise<IStory[]> {
    const raw = localStorage.getItem(STORIES_KEY);
    return raw ? JSON.parse(raw) as IStory[] : [];
  }

  async saveTasks(tasks: ITask[]): Promise<void> {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  async saveDependencies(deps: TaskDependency[]): Promise<void> {
    localStorage.setItem(DEPS_KEY, JSON.stringify(deps));
  }

  async saveStories(stories: IStory[]): Promise<void> {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  }
}
