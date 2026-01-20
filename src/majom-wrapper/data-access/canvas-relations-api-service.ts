import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import type {
  CanvasRelation,
  CanvasRelationCreate,
  CanvasRelationUpdate,
  CanvasRelationType,
} from '../interfaces/index.js';

type RelationListParams = Partial<{
  canvas: string;
  from_uuid: string;
  to_uuid: string;
  relation_type: CanvasRelationType;
  uuids: string[];
}>;

export class CanvasRelationsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public fetchCanvasRelations(canvasId: string): Observable<CanvasRelation[]> {
    const encoded = encodeURIComponent(canvasId);
    return this.http.get<CanvasRelation[]>(`/canvas/${encoded}/relations/`);
  }

  public listRelations(
    params: RelationListParams = {}
  ): Observable<CanvasRelation[]> {
    const query = this.buildQuery(params);
    return this.http.get<CanvasRelation[]>(`/canvas/relations/${query}`);
  }

  public createRelation(
    payload: CanvasRelationCreate
  ): Observable<CanvasRelation> {
    return this.http.post<CanvasRelation>('/canvas/relations/', payload);
  }

  public updateRelation(
    id: string,
    payload: CanvasRelationUpdate
  ): Observable<CanvasRelation> {
    const encoded = encodeURIComponent(id);
    return this.http.patch<CanvasRelation>(
      `/canvas/relations/${encoded}/`,
      payload
    );
  }

  public deleteRelation(id: string): Observable<void> {
    const encoded = encodeURIComponent(id);
    return this.http.delete<void>(`/canvas/relations/${encoded}/`);
  }

  public batchCreate(
    payload: CanvasRelationCreate[]
  ): Observable<CanvasRelation[]> {
    return this.http.post<CanvasRelation[]>(
      '/canvas/relations/batch/',
      payload
    );
  }

  public batchUpdate(
    payload: CanvasRelationUpdate[]
  ): Observable<CanvasRelation[]> {
    return this.http.patch<CanvasRelation[]>(
      '/canvas/relations/batch/',
      payload
    );
  }

  public batchDelete(ids: string[]): Observable<void> {
    return this.http.post<void>('/canvas/relations/batch-delete/', { ids });
  }

  private buildQuery(params: RelationListParams): string {
    const query: string[] = [];
    if (params.canvas) {
      query.push(`canvas=${encodeURIComponent(params.canvas)}`);
    }
    if (params.from_uuid) {
      query.push(`from_uuid=${encodeURIComponent(params.from_uuid)}`);
    }
    if (params.to_uuid) {
      query.push(`to_uuid=${encodeURIComponent(params.to_uuid)}`);
    }
    if (params.relation_type) {
      query.push(`relation_type=${encodeURIComponent(params.relation_type)}`);
    }
    if (params.uuids && params.uuids.length > 0) {
      query.push(`uuids=${encodeURIComponent(params.uuids.join(','))}`);
    }
    return query.length ? `?${query.join('&')}` : '';
  }
}
