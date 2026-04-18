import { Observable } from 'rxjs';
import type { BacklogApiSnapshot } from '../../features/focus-board/domain/types.ts';
import { HttpInterceptorClient } from './http-interceptor.js';

export class BacklogApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public loadSnapshot(): Observable<BacklogApiSnapshot> {
    return this.http.get<BacklogApiSnapshot>('/backlog/snapshot/');
  }

  public saveSnapshot(
    snapshot: BacklogApiSnapshot
  ): Observable<BacklogApiSnapshot> {
    return this.http.put<BacklogApiSnapshot>('/backlog/snapshot/', snapshot);
  }

  public clearSnapshot(): Observable<void> {
    return this.http.delete<void>('/backlog/snapshot/');
  }
}

