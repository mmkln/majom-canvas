import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  Flow,
  FlowFocus,
  FocusStatus,
  FocusType,
  PlatformTask,
} from '../interfaces/index.ts';
import type { HttpInterceptorClient } from './http-interceptor.ts';
import type { PaginatedResponse } from './paginated-response.ts';

type FlowListResponse = PaginatedResponse<Flow> | Flow[];

export type FlowCreatePayload = Pick<Flow, 'title'> &
  Partial<Pick<Flow, 'description' | 'status' | 'meta'>>;
export type FlowUpdatePayload = Partial<
  Pick<Flow, 'title' | 'description' | 'status' | 'meta'>
>;
export type FlowFocusCreatePayload = {
  type: FocusType;
  title: string;
  description?: string;
  status?: FocusStatus;
  startDate?: string | null;
  endDate?: string | null;
  successCriteria: string;
  evidenceRequired?: string | null;
  isPrimary?: boolean;
};
export type FlowFocusPatchPayload = Partial<{
  type: FocusType;
  title: string;
  description: string;
  status: FocusStatus;
  startDate: string | null;
  endDate: string | null;
  successCriteria: string;
  evidenceRequired: string | null;
  evidence: string | null;
  closeReason: string | null;
  isPrimary: boolean;
}>;
export type FlowFocusActivatePayload = {
  replaceActive?: boolean;
  startDate?: string | null;
};
export type FlowFocusCompletePayload = {
  evidence?: string | null;
  closeReason?: string | null;
  endDate?: string | null;
};
export type FlowFocusListParams = {
  status?: FocusStatus;
  type?: FocusType;
  includeArchived?: boolean;
};
export type FlowTaskListItem = Pick<
  PlatformTask,
  'id' | 'uuid' | 'title' | 'status' | 'priority' | 'due_date' | 'is_completed'
>;
export type FlowTaskCreatePayload = Pick<PlatformTask, 'title'> &
  Partial<
    Pick<
      PlatformTask,
      | 'description'
      | 'status'
      | 'priority'
      | 'due_date'
      | 'is_standalone'
      | 'is_completed'
      | 'goal_id'
      | 'story_id'
    >
  >;
export type FlowTaskUpdatePayload = Partial<
  Pick<
    PlatformTask,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'due_date'
    | 'is_completed'
    | 'goal_id'
    | 'story_id'
  >
>;
export type FlowTaskListParams = {
  isCompleted?: boolean;
  page?: number;
  pageSize?: number;
};

function normalizeFlowListResponse(response: FlowListResponse): Flow[] {
  return Array.isArray(response) ? response : response.results;
}

function encodeFlowId(id: Flow['id']): string {
  return encodeURIComponent(String(id));
}

function encodeFocusId(id: FlowFocus['id']): string {
  return encodeURIComponent(id);
}

function toFlowTaskListItem(task: PlatformTask): FlowTaskListItem {
  return {
    id: task.id,
    uuid: task.uuid,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    is_completed: task.is_completed,
  };
}

function buildFlowTaskQuery(params: FlowTaskListParams = {}): string {
  const query: string[] = [];
  if (params.isCompleted !== undefined) {
    query.push(`is_completed=${params.isCompleted ? 'true' : 'false'}`);
  }
  if (params.page !== undefined) {
    query.push(`page=${encodeURIComponent(params.page.toString())}`);
  }
  if (params.pageSize !== undefined) {
    query.push(`page_size=${encodeURIComponent(params.pageSize.toString())}`);
  }
  return query.length ? `?${query.join('&')}` : '';
}

function buildFlowFocusQuery(params: FlowFocusListParams = {}): string {
  const query: string[] = [];
  if (params.status !== undefined) {
    query.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.type !== undefined) {
    query.push(`type=${encodeURIComponent(params.type)}`);
  }
  if (params.includeArchived !== undefined) {
    query.push(`includeArchived=${params.includeArchived ? 'true' : 'false'}`);
  }
  return query.length ? `?${query.join('&')}` : '';
}

export class FlowsApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public getFlows(): Observable<Flow[]> {
    return this.http
      .get<FlowListResponse>('/flows/')
      .pipe(map(normalizeFlowListResponse));
  }

  public getFlow(id: Flow['id']): Observable<Flow> {
    return this.http.get<Flow>(`/flows/${encodeFlowId(id)}/`);
  }

  public getFlowTasks(
    id: Flow['id'],
    params: FlowTaskListParams = {}
  ): Observable<PaginatedResponse<FlowTaskListItem>> {
    return this.http.get<PaginatedResponse<FlowTaskListItem>>(
      `/flows/${encodeFlowId(id)}/tasks/${buildFlowTaskQuery(params)}`
    );
  }

  public createFlowTask(
    id: Flow['id'],
    payload: FlowTaskCreatePayload
  ): Observable<FlowTaskListItem> {
    return this.http
      .post<PlatformTask>('/tasks/', {
        ...payload,
        flow_ids: [id],
      })
      .pipe(map(toFlowTaskListItem));
  }

  public getFlowFocuses(
    id: Flow['id'],
    params: FlowFocusListParams = {}
  ): Observable<FlowFocus[]> {
    return this.http.get<FlowFocus[]>(
      `/flows/${encodeFlowId(id)}/focuses/${buildFlowFocusQuery(params)}`
    );
  }

  public createFlowFocus(
    id: Flow['id'],
    payload: FlowFocusCreatePayload
  ): Observable<FlowFocus> {
    return this.http.post<FlowFocus>(
      `/flows/${encodeFlowId(id)}/focuses/`,
      payload
    );
  }

  public patchFlowFocus(
    id: FlowFocus['id'],
    payload: FlowFocusPatchPayload
  ): Observable<FlowFocus> {
    return this.http.patch<FlowFocus>(
      `/flow-focuses/${encodeFocusId(id)}/`,
      payload
    );
  }

  public activateFlowFocus(
    id: FlowFocus['id'],
    payload: FlowFocusActivatePayload = {}
  ): Observable<FlowFocus> {
    return this.http.post<FlowFocus>(
      `/flow-focuses/${encodeFocusId(id)}/activate/`,
      payload
    );
  }

  public completeFlowFocus(
    id: FlowFocus['id'],
    payload: FlowFocusCompletePayload
  ): Observable<FlowFocus> {
    return this.http.post<FlowFocus>(
      `/flow-focuses/${encodeFocusId(id)}/complete/`,
      payload
    );
  }

  public getTask(
    ref: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>
  ): Observable<PlatformTask> {
    return this.http.get<PlatformTask>(
      `/tasks/${encodeURIComponent(String(ref))}/`
    );
  }

  public patchTask(
    ref: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>,
    payload: FlowTaskUpdatePayload
  ): Observable<PlatformTask> {
    return this.http.patch<PlatformTask>(
      `/tasks/${encodeURIComponent(String(ref))}/`,
      payload
    );
  }

  public deleteTask(
    ref: PlatformTask['id'] | NonNullable<PlatformTask['uuid']>
  ): Observable<void> {
    return this.http.delete<void>(
      `/tasks/${encodeURIComponent(String(ref))}/`
    );
  }

  public createFlow(payload: FlowCreatePayload): Observable<Flow> {
    return this.http.post<Flow>('/flows/', payload);
  }

  public updateFlow(
    id: Flow['id'],
    payload: FlowCreatePayload
  ): Observable<Flow> {
    return this.http.put<Flow>(`/flows/${encodeFlowId(id)}/`, payload);
  }

  public patchFlow(
    id: Flow['id'],
    payload: FlowUpdatePayload
  ): Observable<Flow> {
    return this.http.patch<Flow>(`/flows/${encodeFlowId(id)}/`, payload);
  }

  public deleteFlow(id: Flow['id']): Observable<void> {
    return this.http.delete<void>(`/flows/${encodeFlowId(id)}/`);
  }
}
