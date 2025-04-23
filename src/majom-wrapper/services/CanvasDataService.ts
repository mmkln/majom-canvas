import { forkJoin, Observable } from 'rxjs';
import { map, retry, shareReplay } from 'rxjs/operators';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import { CanvasApiService } from '../data-access/canvas-api-service.ts';
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
  constructor(
    private tasksApi: TasksApiService,
    private storiesApi: StoriesApiService,
    private goalsApi: GoalsApiService,
    private canvasApi: CanvasApiService
  ) {}

  /**
   * Load tasks, stories, goals along with their canvas positions.
   */
  public loadElements(): Observable<Array<TaskElement | StoryElement | GoalElement>> {
    return forkJoin({
      tasks: this.tasksApi.getTasks(),
      stories: this.storiesApi.getStories(),
      goals: this.goalsApi.getGoals(),
      layout: this.canvasApi.loadLayout()
    }).pipe(
      retry(2),
      map(({ tasks, stories, goals, layout }) => {
        const elems: Array<TaskElement | StoryElement | GoalElement> = [];
        elems.push(...tasks.map(t => mapTask(t, layout)));
        elems.push(...stories.map(s => mapStory(s, layout)));
        elems.push(...goals.map(g => mapGoal(g, layout)));
        return elems;
      }),
      shareReplay(1)
    );
  }

  /**
   * Batch update canvas layout positions.
   */
  public updateLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    return this.canvasApi.saveLayoutBatch(changes);
  }
}
