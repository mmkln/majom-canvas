import { EMPTY, Observable, of } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
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

  public searchGoalsForPicker(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<PaginatedResponse<Goal>> {
    const normalizedSearch = params?.search?.trim() ?? '';
    if (!normalizedSearch) {
      return this.fetchGoals({
        ...params,
        search: undefined,
      });
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 30;

    return this.fetchAllGoalsForSearch().pipe(
      map((goals) => {
        const filtered = goals.filter((goal) =>
          goalMatchesPickerSearch(goal, normalizedSearch)
        );
        const start = Math.max(0, (page - 1) * pageSize);
        const end = start + pageSize;
        const results = filtered.slice(start, end);
        const hasNextPage = end < filtered.length;

        return {
          count: filtered.length,
          next: hasNextPage
            ? this.buildGoalPageUrl({
                page: page + 1,
                pageSize,
                search: normalizedSearch,
              })
            : null,
          previous:
            page > 1
              ? this.buildGoalPageUrl({
                  page: page - 1,
                  pageSize,
                  search: normalizedSearch,
                })
              : null,
          results,
        };
      })
    );
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

  private fetchAllGoalsForSearch(): Observable<Goal[]> {
    const searchPageSize = 100;
    return this.fetchGoals({ page: 1, pageSize: searchPageSize }).pipe(
      expand((response, index) =>
        response.next
          ? this.fetchGoals({
              page: index + 2,
              pageSize: searchPageSize,
            })
          : EMPTY
      ),
      map((response) => response.results ?? []),
      reduce((allGoals, pageGoals) => allGoals.concat(pageGoals), [] as Goal[])
    );
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

  private buildGoalPageUrl(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): string | null {
    const query = this.buildQuery(params);
    return query ? `/goals/${query}` : '/goals/';
  }
}

function goalMatchesPickerSearch(goal: Goal, term: string): boolean {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return true;

  const haystacks = [
    goal.title,
    goal.description,
    ...goal.tags.reduce<string[]>(
      (values, tag) => values.concat(tag.title, tag.slug, tag.description ?? ''),
      []
    ),
  ];

  return haystacks.some((value) =>
    typeof value === 'string' ? value.toLowerCase().includes(normalizedTerm) : false
  );
}
