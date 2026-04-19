import { firstValueFrom } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../../../config/environment.ts';
import { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import {
  Status,
  type HabitDaySnapshot,
  type Habit,
  type HabitTrackerSnapshot,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  mapPriorityToBackend,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';

export class ShellHabitsService {
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly habitsApi = new HabitsApiService(this.http);

  public async loadHabits(): Promise<Habit[]> {
    return firstValueFrom(this.habitsApi.getHabits().pipe(first()));
  }

  public async loadTracker(
    start: Date | string,
    days = 10
  ): Promise<HabitTrackerSnapshot> {
    return firstValueFrom(this.habitsApi.getHabitTracker(start, days).pipe(first()));
  }

  public async loadDay(date: Date | string): Promise<HabitDaySnapshot> {
    return firstValueFrom(this.habitsApi.getHabitDay(date).pipe(first()));
  }

  public async toggleHabitCompletion(
    habitUuid: string,
    date: Date
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.toggleHabitCompletion(habitUuid, date).pipe(first())
    );
  }

  public async setHabitCompletion(
    habitUuid: string,
    date: Date | string,
    completed: boolean
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi
        .setHabitCompletion(habitUuid, date, completed)
        .pipe(first())
    );
  }

  public async createHabit(
    title: string,
    priority: UiPriority = 'low'
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi
        .createHabit({
          title,
          description: '',
          priority: mapPriorityToBackend(priority),
          status: Status.Active,
          meta: null,
        })
        .pipe(first())
    );
  }

  public async patchHabitTitle(
    habitUuid: string,
    title: string
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.patchHabitTitle(habitUuid, title).pipe(first())
    );
  }

  public async patchHabitPriority(
    habitUuid: string,
    priority: UiPriority
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi
        .patchHabit(habitUuid, { priority: mapPriorityToBackend(priority) })
        .pipe(first())
    );
  }

  public async archiveHabit(habitUuid: string): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.archiveHabit(habitUuid).pipe(first())
    );
  }

  public async restoreHabit(habitUuid: string): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.restoreHabit(habitUuid).pipe(first())
    );
  }

  public async deleteHabit(habitUuid: string): Promise<void> {
    await firstValueFrom(this.habitsApi.deleteHabit(habitUuid).pipe(first()));
  }
}
