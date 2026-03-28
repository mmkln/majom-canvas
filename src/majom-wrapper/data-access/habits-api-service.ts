import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PaginatedResponse } from './paginated-response.js';
import { Habit, Status } from '../interfaces/index.ts';

export class HabitsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getHabits(): Observable<Habit[]> {
    return this.http
      .get<PaginatedResponse<Habit> | Habit[]>('/habits/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
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
}
