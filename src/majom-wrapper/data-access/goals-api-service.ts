import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { Goal } from '../interfaces/index.ts';

export class GoalsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>('/goals/');
  }

  public getGoal(id: number): Observable<Goal> {
    return this.http.get<Goal>(`/goals/${id}/`);
  }

  public createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>('/goals/', data);
  }

  public updateGoal(id: number, data: Goal): Observable<Goal> {
    return this.http.put<Goal>(`/goals/${id}/`, data);
  }

  public deleteGoal(id: number): Observable<any> {
    return this.http.delete(`/goals/${id}/`);
  }
}
