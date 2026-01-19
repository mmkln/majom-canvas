import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { Goal } from '../interfaces/index.ts';
import { PaginatedResponse } from './paginated-response.js';

export class GoalsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public fetchGoals(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<PaginatedResponse<Goal>> {
    const query = this.buildQuery(params);
    return this.http.get<PaginatedResponse<Goal>>(`/goals/${query}`);
  }

  public fetchGoalsByIds(ids: number[]): Observable<Goal[]> {
    if (!ids.length) return of([]);
    const encodedIds = encodeURIComponent(ids.join(','));
    return this.http.get<Goal[]>(`/goals/?ids=${encodedIds}`);
  }

  public fetchGoalsByUuids(uuids: string[]): Observable<Goal[]> {
    if (!uuids.length) return of([]);
    const encoded = encodeURIComponent(uuids.join(','));
    return this.http.get<Goal[]>(`/goals/?uuids=${encoded}`);
  }

  public getGoals(): Observable<Goal[]> {
    return this.http
      .get<PaginatedResponse<Goal> | Goal[]>('/goals/')
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getGoal(id: string | number): Observable<Goal> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.get<Goal>(`/goals/${encodedId}/`);
  }

  public createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.http.post<Goal>('/goals/', data);
  }

  public updateGoal(id: string | number, data: Goal): Observable<Goal> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.put<Goal>(`/goals/${encodedId}/`, data);
  }

  public patchGoal(id: string | number, data: Partial<Goal>): Observable<Goal> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.patch<Goal>(`/goals/${encodedId}/`, data);
  }

  public deleteGoal(id: string | number): Observable<any> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.delete(`/goals/${encodedId}/`);
  }

  private buildQuery(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): string {
    if (!params) return '';
    const query: string[] = [];
    if (params.page !== undefined) {
      query.push(`page=${encodeURIComponent(params.page.toString())}`);
    }
    if (params.pageSize !== undefined) {
      query.push(`page_size=${encodeURIComponent(params.pageSize.toString())}`);
    }
    if (params.search) {
      query.push(`search=${encodeURIComponent(params.search)}`);
    }
    return query.length ? `?${query.join('&')}` : '';
  }
}
