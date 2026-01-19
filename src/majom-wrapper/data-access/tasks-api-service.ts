import { from, Observable, of } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PlatformTask, Subtask, Tag } from '../interfaces/index.js';
import { PaginatedResponse } from './paginated-response.js';

interface TasksFilterParams {
  is_standalone?: boolean;
  project?: number;
  stage?: number;
  goal?: number;
  resolvedDateAfter?: string; // Format as 'YYYY-MM-DD'
  resolvedDateBefore?: string; // Format as 'YYYY-MM-DD'
  // TODO: add a filter param that will be used to filter tasks by flow, or return tasks that are not in any flow
}

interface TaskListParams extends TasksFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export class TasksApiService {
  constructor(private http: HttpInterceptorClient) {}

  public fetchTasks(
    params: TaskListParams = {}
  ): Observable<PaginatedResponse<PlatformTask>> {
    const queryString = this.buildQuery(params);
    return this.http.get<PaginatedResponse<PlatformTask>>(
      `/tasks/${queryString}`
    );
  }

  public fetchTasksByIds(ids: number[]): Observable<PlatformTask[]> {
    if (!ids.length) return of([]);
    const encodedIds = encodeURIComponent(ids.join(','));
    return this.http.get<PlatformTask[]>(`/tasks/?ids=${encodedIds}`);
  }

  public fetchTasksByUuids(uuids: string[]): Observable<PlatformTask[]> {
    if (!uuids.length) return of([]);
    const encoded = encodeURIComponent(uuids.join(','));
    return this.http.get<PlatformTask[]>(`/tasks/?uuids=${encoded}`);
  }

  public getTasks(
    filterParams?: TasksFilterParams
  ): Observable<PlatformTask[]> {
    const queryString = this.buildQuery(filterParams);
    return this.http
      .get<
        PaginatedResponse<PlatformTask> | PlatformTask[]
      >(`/tasks/${queryString}`)
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getTask(id: string | number): Observable<PlatformTask> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.get<PlatformTask>(`/tasks/${encodedId}/`);
  }

  public createTask(data: Partial<PlatformTask>): Observable<PlatformTask> {
    return this.http.post<PlatformTask>('/tasks/', data);
  }

  public updateTask(
    id: string | number,
    data: PlatformTask
  ): Observable<PlatformTask> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.put<PlatformTask>(`/tasks/${encodedId}/`, data);
  }

  public patchTask(
    id: string | number,
    data: Partial<PlatformTask>
  ): Observable<PlatformTask> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.patch<PlatformTask>(`/tasks/${encodedId}/`, data);
  }

  public deleteTask(id: string | number): Observable<any> {
    const encodedId = encodeURIComponent(String(id));
    return this.http.delete(`/tasks/${encodedId}/`);
  }

  public getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>('/tags/');
  }

  public createSubtask(data: Partial<Subtask>): Observable<Subtask> {
    return this.http.post<Subtask>('/subtasks/', data);
  }

  public updateSubtask(id: number, data: Subtask): Observable<Subtask> {
    return this.http.put<Subtask>(`/subtasks/${id}/`, data);
  }

  public deleteSubtask(id: number): Observable<any> {
    return this.http.delete(`/subtasks/${id}/`);
  }

  public deleteAllTaskSubtasks(task: PlatformTask): Observable<any[]> {
    return from(task.subtasks).pipe(
      mergeMap((subtask) => {
        return this.deleteSubtask(subtask.id);
      }),
      toArray()
    );
  }

  private buildQuery(params?: TaskListParams): string {
    if (!params) return '';
    const query: string[] = [];

    if (params.is_standalone !== undefined) {
      query.push(
        `is_standalone=${encodeURIComponent(params.is_standalone.toString())}`
      );
    }
    if (params.project !== undefined) {
      query.push(`project=${encodeURIComponent(params.project.toString())}`);
    }
    if (params.stage !== undefined) {
      query.push(`stage=${encodeURIComponent(params.stage.toString())}`);
    }
    if (params.goal !== undefined) {
      query.push(`goal=${encodeURIComponent(params.goal.toString())}`);
    }
    if (params.resolvedDateAfter) {
      query.push(
        `resolved_date_range_after=${encodeURIComponent(params.resolvedDateAfter)}`
      );
    }
    if (params.resolvedDateBefore) {
      query.push(
        `resolved_date_range_before=${encodeURIComponent(params.resolvedDateBefore)}`
      );
    }
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
