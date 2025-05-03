import { from, Observable } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PlatformTask, Subtask, Tag } from '../interfaces/index.js';

interface TasksFilterParams {
  is_standalone?: boolean;
  project?: number;
  stage?: number;
  goal?: number;
  resolvedDateAfter?: string; // Format as 'YYYY-MM-DD'
  resolvedDateBefore?: string; // Format as 'YYYY-MM-DD'
  // TODO: add a filter param that will be used to filter tasks by flow, or return tasks that are not in any flow
}

export class TasksApiService {
  constructor(private http: HttpInterceptorClient) {}

  public getTasks(
    filterParams?: TasksFilterParams
  ): Observable<PlatformTask[]> {
    let queryString = '';

    if (filterParams) {
      const params: string[] = [];

      if (filterParams.is_standalone !== undefined) {
        params.push(
          `is_standalone=${encodeURIComponent(filterParams.is_standalone.toString())}`
        );
      }
      if (filterParams.project !== undefined) {
        params.push(
          `project=${encodeURIComponent(filterParams.project.toString())}`
        );
      }
      if (filterParams.stage !== undefined) {
        params.push(
          `stage=${encodeURIComponent(filterParams.stage.toString())}`
        );
      }
      if (filterParams.goal !== undefined) {
        params.push(`goal=${encodeURIComponent(filterParams.goal.toString())}`);
      }
      if (filterParams.resolvedDateAfter) {
        params.push(
          `resolved_date_range_after=${encodeURIComponent(filterParams.resolvedDateAfter)}`
        );
      }
      if (filterParams.resolvedDateBefore) {
        params.push(
          `resolved_date_range_before=${encodeURIComponent(filterParams.resolvedDateBefore)}`
        );
      }

      if (params.length) {
        queryString = `?${params.join('&')}`;
      }
    }

    return this.http.get<PlatformTask[]>(`/tasks/${queryString}`);
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
}
