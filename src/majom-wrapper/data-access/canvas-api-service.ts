import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { CanvasPositionDTO } from './canvas-position-dto.js';

export class CanvasApiService {
  /** http client with JWT interceptor */
  constructor(private http: HttpInterceptorClient) {}

  /** Load all canvas positions */
  loadLayout(): Observable<CanvasPositionDTO[]> {
    return this.http.get<CanvasPositionDTO[]>('/api/canvas/layouts/');
  }

  /** Batch update or create canvas positions */
  saveLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    return this.http.patch<void>('/api/canvas/layouts/batch/', changes);
  }

  /** Create a new canvas container */
  createCanvas(): Observable<{ id: string }> {
    return this.http.post<{ id: string }>('/api/canvas/', {});
  }

  /** Bulk create positions for a canvas */
  bulkCreatePositions(canvasId: string, positions: CanvasPositionDTO[]): Observable<void> {
    return this.http.post<void>(`/api/canvas/${canvasId}/positions/bulk/`, positions);
  }
}
