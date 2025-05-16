import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { CanvasPositionDTO } from './canvas-position-dto.js';

export class CanvasApiService {
  /** http client with JWT interceptor */
  constructor(private http: HttpInterceptorClient) {}

  /** Load all canvas positions */
  loadLayout(): Observable<CanvasPositionDTO[]> {
    return this.http.get<CanvasPositionDTO[]>('/canvas/layouts/');
  }

  /** Batch update or create canvas positions */
  saveLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    return this.http.patch<void>('/canvas/layouts/batch/', changes);
  }

  /** Create a new canvas container */
  createCanvas(name: string = 'Untitled Canvas'): Observable<{ id: string }> {
    // 'name' is required by the API
    return this.http.post<{ id: string }>('/canvas/', { name });
  }

  /** Bulk create positions for a canvas */
  bulkCreatePositions(canvasId: string, positions: CanvasPositionDTO[]): Observable<void> {
    return this.http.post<void>(`/canvas/${canvasId}/positions/bulk/`, positions);
  }
}
