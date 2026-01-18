import { forkJoin, Observable, of } from 'rxjs';
import { map, retry, shareReplay, switchMap } from 'rxjs/operators';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import {
  CanvasApiService,
  CanvasSummary,
} from '../data-access/canvas-api-service.ts';
import { mapTask } from '../mappers/task-mapper.ts';
import { mapStory } from '../mappers/story-mapper.ts';
import { mapGoal } from '../mappers/goal-mapper.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

/**
 * Service to load and persist canvas elements and layout.
 */
export class CanvasDataService {
  private canvasId: string | null = null;
  private canvasName: string | null = null;

  constructor(
    private tasksApi: TasksApiService,
    private storiesApi: StoriesApiService,
    private goalsApi: GoalsApiService,
    private canvasApi: CanvasApiService
  ) {}

  /**
   * Load tasks, stories, goals along with their canvas positions.
   */
  public loadElements(): Observable<
    Array<TaskElement | StoryElement | GoalElement>
  > {
    return forkJoin({
      tasks: this.tasksApi.getTasks(),
      stories: this.storiesApi.getStories(),
      goals: this.goalsApi.getGoals(),
      layout: this.canvasApi.loadLayout(),
    }).pipe(
      retry(2),
      map(({ tasks, stories, goals, layout }) => {
        const targetCanvas = this.canvasId;
        const effectiveLayout = targetCanvas
          ? layout.filter((pos) => pos.canvas === targetCanvas)
          : layout;
        const layoutIds = {
          task: new Set<number>(),
          story: new Set<number>(),
          goal: new Set<number>(),
        };
        effectiveLayout.forEach((pos) => {
          const type = pos.element_type;
          const id = pos.element_id ?? pos.object_id;
          if (!type || !id) return;
          if (type in layoutIds) {
            layoutIds[type as keyof typeof layoutIds].add(id);
          }
        });
        const firstCanvas = effectiveLayout[0]?.canvas;
        if (firstCanvas) {
          this.canvasId = firstCanvas;
        }
        const elems: Array<TaskElement | StoryElement | GoalElement> = [];
        elems.push(
          ...tasks
            .filter((t) => layoutIds.task.has(t.id))
            .map((t) => mapTask(t, effectiveLayout))
        );
        elems.push(
          ...stories
            .filter((s) => layoutIds.story.has(s.id))
            .map((s) => mapStory(s, effectiveLayout))
        );
        elems.push(
          ...goals
            .filter((g) => layoutIds.goal.has(g.id))
            .map((g) => mapGoal(g, effectiveLayout))
        );
        return elems;
      }),
      shareReplay(1)
    );
  }

  public loadCanvases(): Observable<CanvasSummary[]> {
    return this.canvasApi.loadCanvases();
  }

  public setActiveCanvas(canvas: Pick<CanvasSummary, 'id' | 'name'>): void {
    this.canvasId = canvas.id;
    this.canvasName = canvas.name;
  }

  public getActiveCanvasId(): string | null {
    return this.canvasId;
  }

  public createCanvas(
    name: string = 'New canvas'
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.canvasApi.createCanvas(name).pipe(
      map((canvas) => {
        this.canvasId = canvas.id;
        this.canvasName = canvas.name;
        return canvas;
      })
    );
  }

  public ensureCanvas(): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.canvasApi.loadCanvases().pipe(
      switchMap((canvases) => {
        if (canvases.length > 0) {
          const canvas = canvases[0];
          return of({ id: canvas.id, name: canvas.name });
        }
        return this.canvasApi.createCanvas('New canvas');
      }),
      map((canvas) => {
        this.canvasId = canvas.id;
        this.canvasName = canvas.name;
        return canvas;
      })
    );
  }

  public updateCanvasName(
    name: string
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    const safeName = name.trim() || 'New canvas';
    if (this.canvasId) {
      return this.canvasApi.updateCanvas(this.canvasId, safeName).pipe(
        map((updated) => {
          this.canvasId = updated.id;
          this.canvasName = updated.name;
          return updated;
        })
      );
    }
    return this.ensureCanvas().pipe(
      switchMap((canvas) => this.canvasApi.updateCanvas(canvas.id, safeName)),
      map((updated) => {
        this.canvasId = updated.id;
        this.canvasName = updated.name;
        return updated;
      })
    );
  }

  /**
   * Batch update canvas layout positions.
   */
  public updateLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    return this.ensureCanvasId(changes).pipe(
      switchMap((finalChanges) => this.canvasApi.saveLayoutBatch(finalChanges))
    );
  }

  private ensureCanvasId(
    changes: CanvasPositionDTO[]
  ): Observable<CanvasPositionDTO[]> {
    if (changes.length === 0) return of(changes);
    const hasCanvas = changes.every((c) => Boolean(c.canvas));
    if (hasCanvas) return of(changes);
    if (this.canvasId) {
      return of(
        changes.map((c) => ({
          ...c,
          canvas: this.canvasId as string,
        }))
      );
    }
    return this.canvasApi.createCanvas().pipe(
      map(({ id }) => {
        this.canvasId = id;
        return changes.map((c) => ({
          ...c,
          canvas: id,
        }));
      })
    );
  }
}
