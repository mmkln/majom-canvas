import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PaginatedResponse } from './paginated-response.js';
import {
  Habit,
  HabitDaySnapshot,
  HabitTrackerSnapshot,
  Status,
} from '../interfaces/index.ts';

function toDateKey(value: Date | string): string {
  if (typeof value === 'string') return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class HabitsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getHabits(): Observable<Habit[]> {
    return this.http
      .get<PaginatedResponse<Habit> | Habit[]>('/habits/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getHabitTracker(
    start: Date | string,
    days = 10
  ): Observable<HabitTrackerSnapshot> {
    const startDate = encodeURIComponent(toDateKey(start));
    return this.http.get<HabitTrackerSnapshot>(
      `/habits/tracker/?start=${startDate}&days=${days}`
    );
  }

  public getHabitDay(date: Date | string): Observable<HabitDaySnapshot> {
    const encodedDate = encodeURIComponent(toDateKey(date));
    return this.http.get<HabitDaySnapshot>(`/habits/day/?date=${encodedDate}`);
  }

  public patchHabit(
    habitUuid: string,
    payload: Partial<Habit>
  ): Observable<Habit> {
    const encodedUuid = encodeURIComponent(habitUuid);
    return this.http.patch<Habit>(`/habits/${encodedUuid}/`, payload);
  }

  public patchHabitTitle(
    habitUuid: string,
    title: string
  ): Observable<Habit> {
    return this.patchHabit(habitUuid, { title });
  }

  public createHabit(payload: Partial<Habit>): Observable<Habit> {
    return this.http.post<Habit>('/habits/', payload);
  }

  public archiveHabit(habitUuid: string): Observable<Habit> {
    return this.patchHabit(habitUuid, { status: Status.Archived });
  }

  public restoreHabit(habitUuid: string): Observable<Habit> {
    return this.patchHabit(habitUuid, { status: Status.Active });
  }

  public deleteHabit(habitUuid: string): Observable<void> {
    const encodedUuid = encodeURIComponent(habitUuid);
    return this.http.delete<void>(`/habits/${encodedUuid}/`);
  }

  public toggleHabitCompletion(
    habitUuid: string,
    date: Date
  ): Observable<Habit> {
    const encodedUuid = encodeURIComponent(habitUuid);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return this.http.post<Habit>(`/habits/${encodedUuid}/toggle_completion/`, {
      date: `${year}-${month}-${day}`,
    });
  }

  public setHabitCompletion(
    habitUuid: string,
    date: Date | string,
    completed: boolean
  ): Observable<Habit> {
    const encodedUuid = encodeURIComponent(habitUuid);
    return this.http.post<Habit>(`/habits/${encodedUuid}/set_completion/`, {
      date: toDateKey(date),
      completed,
    });
  }
}
