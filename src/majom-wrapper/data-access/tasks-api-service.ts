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
    return this.http.get<PaginatedResponse<PlatformTask>>(`/tasks/${queryString}`);
  }

  public fetchTasksByIds(ids: number[]): Observable<PlatformTask[]> {
    if (!ids.length) return of([]);
    const encodedIds = encodeURIComponent(ids.join(','));
    return this.http.get<PlatformTask[]>(`/tasks/?ids=${encodedIds}`);
  }

  public getTasks(
    filterParams?: TasksFilterParams
  ): Observable<PlatformTask[]> {
    const queryString = this.buildQuery(filterParams);
    return this.http
      .get<PaginatedResponse<PlatformTask> | PlatformTask[]>(`/tasks/${queryString}`)
      .pipe(map((res) => (Array.isArray(res) ? res : res.results)));
  }

  public getTask(id: number): Observable<PlatformTask> {
    return this.http.get<PlatformTask>(`/tasks/${id}/`);
  }

  public createTask(data: Partial<PlatformTask>): Observable<PlatformTask> {
    return this.http.post<PlatformTask>('/tasks/', data);
  }

  public updateTask(id: number, data: PlatformTask): Observable<PlatformTask> {
    return this.http.put<PlatformTask>(`/tasks/${id}/`, data);
  }

  public patchTask(
    id: number,
    data: Partial<PlatformTask>
  ): Observable<PlatformTask> {
    return this.http.patch<PlatformTask>(`/tasks/${id}/`, data);
  }

  public deleteTask(id: number): Observable<any> {
    return this.http.delete(`/tasks/${id}/`);
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
