import { Observable } from 'rxjs';
// @ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';
import { Goal, Subgoal, Strategy, Milestone } from '../interfaces/index.ts';

export class GoalsApiService {
  constructor(private http: RxJSHttpClient, private readonly apiUrl: string) {}

  public getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/goals/`);
  }

  public getGoal(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.apiUrl}/goals/${id}/`);
  }

  public createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>(`${this.apiUrl}/goals/`, data, {
      headers: {},
    });
  }

  public updateGoal(id: number, data: Goal): Observable<Goal> {
    return this.http.put<Goal>(`${this.apiUrl}/goals/${id}/`, data, {
      headers: {},
    });
  }

  public deleteGoal(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/goals/${id}/`, {
      headers: {},
    });
  }
}
