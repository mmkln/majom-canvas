import { forkJoin, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { environment } from '../../../config/environment.ts';
import { EventsApiService } from '../../../majom-wrapper/data-access/events-api-service.ts';
import { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from '../../../majom-wrapper/data-access/tasks-api-service.ts';
import type {
  Habit,
  PlatformTask,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { KanbanDataSnapshot, KanbanTaskPatch } from '../types.ts';

export class KanbanDataService {
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly tasksApi = new TasksApiService(this.http);
  private readonly habitsApi = new HabitsApiService(this.http);
  private readonly eventsApi = new EventsApiService(this.http);

  public loadSnapshot(now: Date = new Date()): Observable<KanbanDataSnapshot> {
    return forkJoin({
      tasks: this.tasksApi.getTasks().pipe(first()),
      habits: this.habitsApi.getHabits().pipe(first()),
      events: this.eventsApi.getEvents().pipe(first()),
    }).pipe(
      map(({ tasks, habits, events }) => ({
        tasks,
        habits,
        events,
        now: new Date(now),
      }))
    );
  }

  public patchTask(
    taskId: number,
    patch: KanbanTaskPatch
  ): Observable<PlatformTask> {
    const payload: Partial<PlatformTask> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
    return this.tasksApi.patchTask(taskId, payload).pipe(first());
  }

  public toggleHabitCompletion(habitId: number, date: Date): Observable<Habit> {
    return this.habitsApi.toggleHabitCompletion(habitId, date).pipe(first());
  }

  public patchHabitTitle(habitId: number, title: string): Observable<Habit> {
    return this.habitsApi.patchHabit(habitId, { title }).pipe(first());
  }
}
