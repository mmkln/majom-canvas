import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PaginatedResponse } from './paginated-response.js';
import { Habit } from '../interfaces/index.ts';

export class HabitsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getHabits(): Observable<Habit[]> {
    return this.http
      .get<PaginatedResponse<Habit> | Habit[]>('/habits/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public patchHabit(
    habitId: number,
    payload: Partial<Habit>
  ): Observable<Habit> {
    const encodedId = encodeURIComponent(String(habitId));
    return this.http.patch<Habit>(`/habits/${encodedId}/`, payload);
  }

  public toggleHabitCompletion(habitId: number, date: Date): Observable<Habit> {
    const encodedId = encodeURIComponent(String(habitId));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return this.http.post<Habit>(`/habits/${encodedId}/toggle_completion/`, {
      date: `${year}-${month}-${day}`,
    });
  }
}
