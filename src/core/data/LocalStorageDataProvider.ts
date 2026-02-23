import { IDataProvider } from '../interfaces/dataProvider.ts';
import {
  ITask,
  TaskDependency,
  IStory,
  IViewState,
  IGoal,
} from '../interfaces/interfaces.ts';
import { buildUserScopedStorageKey } from '../services/UserScopedStorage.ts';

const TASKS_KEY = 'canvas-tasks';
const DEPS_KEY = 'canvas-dependencies';
const STORIES_KEY = 'canvas-stories';
const VIEW_KEY = 'canvas-view';
const GOALS_KEY = 'canvas-goals';

const DEFAULT_VIEW_STATE: IViewState = { scrollX: 20000, scrollY: 12000, scale: 1 };
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const VIEW_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type StorageEnvelope<T> = {
  data: T;
  updatedAt: number;
  expiresAt: number | null;
};

/**
 * DataProvider that reads/writes tasks and dependencies to localStorage.
 * Values are stored in a user-scoped namespace with TTL metadata.
 */
export class LocalStorageDataProvider implements IDataProvider {
  constructor() {
    this.clearLegacyKeys();
  }

  async loadTasks(): Promise<ITask[]> {
    return this.readCollection<ITask[]>(TASKS_KEY, []);
  }

  async loadDependencies(): Promise<TaskDependency[]> {
    return this.readCollection<TaskDependency[]>(DEPS_KEY, []);
  }

  async loadStories(): Promise<IStory[]> {
    return this.readCollection<IStory[]>(STORIES_KEY, []);
  }

  async loadGoals(): Promise<IGoal[]> {
    return this.readCollection<IGoal[]>(GOALS_KEY, []);
  }

  async saveTasks(tasks: ITask[]): Promise<void> {
    this.writeCollection(TASKS_KEY, tasks, CACHE_TTL_MS);
  }

  async saveDependencies(deps: TaskDependency[]): Promise<void> {
    this.writeCollection(DEPS_KEY, deps, CACHE_TTL_MS);
  }

  async saveStories(stories: IStory[]): Promise<void> {
    this.writeCollection(STORIES_KEY, stories, CACHE_TTL_MS);
  }

  async saveGoals(goals: IGoal[]): Promise<void> {
    this.writeCollection(GOALS_KEY, goals, CACHE_TTL_MS);
  }

  /** Load saved view (scroll & zoom) */
  async loadViewState(canvasId?: string | null): Promise<IViewState> {
    const viewKey = this.getViewKey(canvasId);
    const viewState = this.readCollection<IViewState>(viewKey, DEFAULT_VIEW_STATE);
    if (!this.isValidViewState(viewState)) {
      return DEFAULT_VIEW_STATE;
    }
    return viewState;
  }

  /** Save current view (scroll & zoom) */
  async saveViewState(
    state: IViewState,
    canvasId?: string | null
  ): Promise<void> {
    const nextState = this.isValidViewState(state) ? state : DEFAULT_VIEW_STATE;
    this.writeCollection(this.getViewKey(canvasId), nextState, VIEW_TTL_MS);
    if (canvasId) {
      // Keep a global fallback view as a safe default for app bootstrap.
      this.writeCollection(VIEW_KEY, nextState, VIEW_TTL_MS);
    }
  }

  private getViewKey(canvasId?: string | null): string {
    return canvasId ? `${VIEW_KEY}:${canvasId}` : VIEW_KEY;
  }

  private writeCollection<T>(baseKey: string, data: T, ttlMs: number): void {
    const now = Date.now();
    const envelope: StorageEnvelope<T> = {
      data,
      updatedAt: now,
      expiresAt: now + ttlMs,
    };
    localStorage.setItem(
      this.getScopedKey(baseKey),
      JSON.stringify(envelope)
    );
  }

  private readCollection<T>(baseKey: string, fallback: T): T {
    const scopedKey = this.getScopedKey(baseKey);
    const scopedRaw = localStorage.getItem(scopedKey);
    const scopedParsed = this.parseStorageValue<T>(scopedRaw, scopedKey);
    if (scopedParsed.kind === 'value') {
      return scopedParsed.value;
    }

    return fallback;
  }

  private clearLegacyKeys(): void {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(DEPS_KEY);
    localStorage.removeItem(STORIES_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(VIEW_KEY);
  }

  private getScopedKey(baseKey: string): string {
    return buildUserScopedStorageKey(baseKey);
  }

  private parseStorageValue<T>(
    raw: string | null,
    storageKey: string
  ): { kind: 'missing' | 'value'; value: T } {
    if (!raw) {
      return { kind: 'missing', value: undefined as unknown as T };
    }
    try {
      const parsed = JSON.parse(raw) as StorageEnvelope<T> | T;
      if (
        parsed &&
        typeof parsed === 'object' &&
        'data' in (parsed as object) &&
        'updatedAt' in (parsed as object)
      ) {
        const envelope = parsed as StorageEnvelope<T>;
        const expiresAt = envelope.expiresAt;
        if (
          typeof expiresAt === 'number' &&
          Number.isFinite(expiresAt) &&
          Date.now() > expiresAt
        ) {
          localStorage.removeItem(storageKey);
          return { kind: 'missing', value: undefined as unknown as T };
        }
        return { kind: 'value', value: envelope.data };
      }
      return { kind: 'value', value: parsed as T };
    } catch {
      return { kind: 'missing', value: undefined as unknown as T };
    }
  }

  private isValidViewState(value: unknown): value is IViewState {
    const state = value as IViewState;
    return (
      state !== null &&
      typeof state === 'object' &&
      Number.isFinite(state.scrollX) &&
      Number.isFinite(state.scrollY) &&
      Number.isFinite(state.scale) &&
      state.scale > 0
    );
  }
}
