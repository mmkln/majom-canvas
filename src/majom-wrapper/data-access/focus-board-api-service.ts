import { Observable } from 'rxjs';
import type { FocusBoardApiSnapshot } from '../../features/focus-board/domain/types.ts';
import { HttpInterceptorClient } from './http-interceptor.js';

export class FocusBoardApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public loadSnapshot(): Observable<FocusBoardApiSnapshot> {
    return this.http.get<FocusBoardApiSnapshot>('/focus-board/snapshot/');
  }

  public saveSnapshot(
    snapshot: FocusBoardApiSnapshot
  ): Observable<FocusBoardApiSnapshot> {
    return this.http.put<FocusBoardApiSnapshot>(
      '/focus-board/snapshot/',
      snapshot
    );
  }

  public clearSnapshot(): Observable<void> {
    return this.http.delete<void>('/focus-board/snapshot/');
  }
}

