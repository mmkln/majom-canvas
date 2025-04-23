import { Observable } from 'rxjs';
// @ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';
import { Goal } from '../interfaces/index.ts';

export class GoalsApiService {
  constructor(private http: RxJSHttpClient) {}

  public getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>('/goals/');
  }

  public getGoal(id: number): Observable<Goal> {
    return this.http.get<Goal>(`/goals/${id}/`);
  }

  public createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>('/goals/', data, {
      headers: {},
    });
  }

  public updateGoal(id: number, data: Goal): Observable<Goal> {
    return this.http.put<Goal>(`/goals/${id}/`, data, {
      headers: {},
    });
  }

  public deleteGoal(id: number): Observable<any> {
    return this.http.delete(`/goals/${id}/`, {
      headers: {},
    });
  }
}
