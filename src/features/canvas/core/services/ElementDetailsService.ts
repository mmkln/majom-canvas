import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import type { Goal, PlatformTask, Story } from '../../../../majom-wrapper/interfaces/index.ts';
import {
  collectStoriesFromGoalTasks,
  mergeStoriesDedup,
  normalizeBackendRef,
  type BackendRef,
} from './relationshipResolvers.ts';
import { Scene } from '../scene/Scene.ts';

type CanvasElement = TaskElement | StoryElement | GoalElement;

export type StoryListItemVM = {
  id: number;
  uuid?: string;
  title: string;
  status?: string;
  tasksCount: number;
  isOnCanvas: boolean;
};

export type TaskListItemVM = {
  id: number;
  uuid?: string;
  title: string;
  status?: string;
  isOnCanvas: boolean;
};

export class ElementDetailsService {
  constructor(
    private readonly scene: Scene,
    private readonly goalsApi: GoalsApiService,
    private readonly storiesApi: StoriesApiService
  ) {}

  public loadStoriesForElement(element: CanvasElement): Observable<StoryListItemVM[]> {
    if (element instanceof StoryElement) {
      const id = Number.isFinite(element.backendId) ? (element.backendId as number) : null;
      if (id === null) return of([]);
      return this.storiesApi.getStory(id).pipe(
        map((story) => [this.mapStory(story)]),
        catchError(() => of([]))
      );
    }

    if (element instanceof TaskElement) {
      return this.getTaskStoryList(element);
    }

    return this.getGoalStories(element);
  }

  public loadTasksForStory(ref: BackendRef): Observable<TaskListItemVM[]> {
    const normalizedRef = normalizeBackendRef(ref);
    if (normalizedRef.id === null) return of([]);
    return this.storiesApi.getStory(normalizedRef.id).pipe(
      map((story) => (Array.isArray(story.tasks) ? story.tasks : []).map((task) => this.mapTask(task))),
      catchError(() => of([]))
    );
  }

  private getTaskStoryList(element: TaskElement): Observable<StoryListItemVM[]> {
    if (!Number.isFinite(element.backendId)) return of([]);
    return this.storiesApi
      .fetchStories({ page: 1, pageSize: 20 })
      .pipe(
        map((response) => response.results || []),
        map((stories) =>
          stories.filter((story) =>
            (story.tasks || []).some((task) => task.id === element.backendId)
          )
        ),
        map((stories) => stories.map((story) => this.mapStory(story))),
        catchError(() => of([]))
      );
  }

  private getGoalStories(element: GoalElement): Observable<StoryListItemVM[]> {
    if (!Number.isFinite(element.backendId)) return of([]);
    return this.goalsApi.getGoal(element.backendId as number).pipe(
      map((goal) => this.extractGoalStories(goal)),
      map((stories) => stories.map((story) => this.mapStory(story))),
      catchError(() => of([]))
    );
  }

  private extractGoalStories(goal: Goal): Story[] {
    const directStories = Array.isArray(goal.stories) ? goal.stories : [];
    const fromTasks = collectStoriesFromGoalTasks(goal);
    return mergeStoriesDedup(directStories, fromTasks);
  }

  private mapStory(story: Story): StoryListItemVM {
    return {
      id: story.id,
      uuid: story.uuid,
      title: story.title,
      status: String(story.status ?? ''),
      tasksCount: Array.isArray(story.tasks) ? story.tasks.length : 0,
      isOnCanvas: this.hasStoryOnCanvas(story),
    };
  }

  private mapTask(task: PlatformTask): TaskListItemVM {
    return {
      id: task.id,
      uuid: task.uuid,
      title: task.title,
      status: String(task.status ?? ''),
      isOnCanvas: this.hasTaskOnCanvas(task),
    };
  }

  private hasStoryOnCanvas(story: Story): boolean {
    return this.scene.getElements().some((el) => {
      if (!(el instanceof StoryElement)) return false;
      if (story.uuid && el.uuid && story.uuid === el.uuid) return true;
      return Number.isFinite(el.backendId) && el.backendId === story.id;
    });
  }

  private hasTaskOnCanvas(task: PlatformTask): boolean {
    return this.scene.getElements().some((el) => {
      if (!(el instanceof TaskElement)) return false;
      if (task.uuid && el.uuid && task.uuid === el.uuid) return true;
      return Number.isFinite(el.backendId) && el.backendId === task.id;
    });
  }
}
