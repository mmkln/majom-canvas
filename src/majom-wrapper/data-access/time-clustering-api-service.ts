import { Observable } from 'rxjs';
import type { TimeClusteringStateSnapshot } from '../../features/time-clustering/domain/types.ts';
import { HttpInterceptorClient } from './http-interceptor.js';

export class TimeClusteringApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public loadSnapshot(): Observable<TimeClusteringStateSnapshot> {
    return this.http.get<TimeClusteringStateSnapshot>(
      '/time-clustering/snapshot/'
    );
  }

  public saveSnapshot(
    snapshot: TimeClusteringStateSnapshot
  ): Observable<TimeClusteringStateSnapshot> {
    return this.http.put<TimeClusteringStateSnapshot>(
      '/time-clustering/snapshot/',
      snapshot
    );
  }

  public clearSnapshot(): Observable<void> {
    return this.http.delete<void>('/time-clustering/snapshot/');
  }
}
