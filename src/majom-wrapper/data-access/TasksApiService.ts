import { from, Observable } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
//@ts-ignore
import { RxJSHttpClient } from 'rxjs-http-client';
import { PlatformTask, Subtask, Tag } from '../interfaces';

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
  constructor(private http: RxJSHttpClient, private readonly apiUrl: string ) {}

  public getTasks(filterParams?: TasksFilterParams): Observable<PlatformTask[]> {
    let queryString = '';

    if (filterParams) {
      const params: string[] = [];

      if (filterParams.is_standalone !== undefined) {
        params.push(`is_standalone=${encodeURIComponent(filterParams.is_standalone.toString())}`);
      }
      if (filterParams.project !== undefined) {
        params.push(`project=${encodeURIComponent(filterParams.project.toString())}`);
      }
      if (filterParams.stage !== undefined) {
        params.push(`stage=${encodeURIComponent(filterParams.stage.toString())}`);
      }
      if (filterParams.goal !== undefined) {
        params.push(`goal=${encodeURIComponent(filterParams.goal.toString())}`);
      }
      if (filterParams.resolvedDateAfter) {
        params.push(`resolved_date_range_after=${encodeURIComponent(filterParams.resolvedDateAfter)}`);
      }
      if (filterParams.resolvedDateBefore) {
        params.push(`resolved_date_range_before=${encodeURIComponent(filterParams.resolvedDateBefore)}`);
      }

      if (params.length) {
        queryString = `?${params.join('&')}`;
      }
    }

    return this.http.get<PlatformTask[]>(`${this.apiUrl}/tasks/${queryString}`);
  }

  public getTask(id: number): Observable<PlatformTask> {
    return this.http.get<PlatformTask>(`${this.apiUrl}/tasks/${id}/`);
  }

  public createTask(data: Partial<PlatformTask>): Observable<PlatformTask> {
    return this.http.post<PlatformTask>(`${this.apiUrl}/tasks/`, data, {
      headers: {},
    });
  }

  public updateTask(id: number, data: PlatformTask): Observable<PlatformTask> {
    return this.http.put<PlatformTask>(
      `${this.apiUrl}/tasks/${id}/`,
      data,
      {
        headers: {},
      }
    );
  }

  public deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}/`, {
      headers: {},
    });
  }

  public getTags(): Observable<Array<Tag>> {
    return this.http.get<Array<Tag>>(`${this.apiUrl}/tags/`);
  }

  public createSubtask(data: Partial<Subtask>): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.apiUrl}/subtasks/`, data, {
      headers: {},
    });
  }

  public updateSubtask(id: number, data: Subtask): Observable<Subtask> {
    return this.http.put<Subtask>(
      `${this.apiUrl}/subtasks/${id}/`,
      data,
      {
        headers: {},
      }
    );
  }

  public deleteSubtask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subtasks/${id}/`, {
      headers: {},
    });
  }

  public deleteAllTaskSubtasks(task: PlatformTask): Observable<any> {
    return from(task.subtasks).pipe(
      mergeMap((subtask) => {
        return this.deleteSubtask(subtask.id);
      }),
      toArray()
    );
  }
}
