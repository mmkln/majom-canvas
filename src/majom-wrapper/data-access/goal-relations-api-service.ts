import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import type {
  GoalRelation,
  GoalRelationCreate,
  GoalRelationType,
  GoalRelationUpdate,
} from '../interfaces/index.js';

type GoalRelationListParams = Partial<{
  goal_id: string | number;
  from_goal_uuid: string;
  to_goal_uuid: string;
  relation_type: GoalRelationType;
}>;

export class GoalRelationsApiService {
  constructor(private http: HttpInterceptorClient) {}

  public listRelations(
    params: GoalRelationListParams = {}
  ): Observable<GoalRelation[]> {
    const query = this.buildQuery(params);
    return this.http.get<GoalRelation[]>(`/goal-relations/${query}`);
  }

  public createRelation(
    payload: GoalRelationCreate
  ): Observable<GoalRelation> {
    return this.http.post<GoalRelation>('/goal-relations/', payload);
  }

  public updateRelation(
    id: string,
    payload: GoalRelationUpdate
  ): Observable<GoalRelation> {
    const encoded = encodeURIComponent(id);
    return this.http.patch<GoalRelation>(`/goal-relations/${encoded}/`, payload);
  }

  public deleteRelation(id: string): Observable<void> {
    const encoded = encodeURIComponent(id);
    return this.http.delete<void>(`/goal-relations/${encoded}/`);
  }

  private buildQuery(params: GoalRelationListParams): string {
    const query: string[] = [];
    if (params.goal_id !== undefined && params.goal_id !== null) {
      query.push(`goal_id=${encodeURIComponent(String(params.goal_id))}`);
    }
    if (params.from_goal_uuid) {
      query.push(
        `from_goal_uuid=${encodeURIComponent(params.from_goal_uuid)}`
      );
    }
    if (params.to_goal_uuid) {
      query.push(`to_goal_uuid=${encodeURIComponent(params.to_goal_uuid)}`);
    }
    if (params.relation_type) {
      query.push(
        `relation_type=${encodeURIComponent(params.relation_type)}`
      );
    }
    return query.length ? `?${query.join('&')}` : '';
  }
}
