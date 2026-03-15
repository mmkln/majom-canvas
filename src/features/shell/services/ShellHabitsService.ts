import { firstValueFrom } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../../../config/environment.ts';
import { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import { Status, type Habit } from '../../../majom-wrapper/interfaces/index.ts';

export class ShellHabitsService {
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly habitsApi = new HabitsApiService(this.http);

  public async loadHabits(): Promise<Habit[]> {
    return firstValueFrom(this.habitsApi.getHabits().pipe(first()));
  }

  public async toggleHabitCompletion(
    habitId: number,
    date: Date
  ): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.toggleHabitCompletion(habitId, date).pipe(first())
    );
  }

  public async createHabit(title: string): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi
        .createHabit({
          title,
          description: '',
          status: Status.Active,
        })
        .pipe(first())
    );
  }

  public async patchHabitTitle(habitId: number, title: string): Promise<Habit> {
    return firstValueFrom(
      this.habitsApi.patchHabitTitle(habitId, title).pipe(first())
    );
  }

  public async archiveHabit(habitId: number): Promise<Habit> {
    return firstValueFrom(this.habitsApi.archiveHabit(habitId).pipe(first()));
  }

  public async deleteHabit(habitId: number): Promise<void> {
    await firstValueFrom(this.habitsApi.deleteHabit(habitId).pipe(first()));
  }
}
