import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { CanvasPositionDTO } from './canvas-position-dto.js';

export interface CanvasSummary {
  id: string;
  name: string;
  created_at: string;
}

export class CanvasApiService {
  /** http client with JWT interceptor */
  constructor(private http: HttpInterceptorClient) {}

  /** Load available canvases */
  loadCanvases(): Observable<CanvasSummary[]> {
    return this.http.get<CanvasSummary[]>('/canvas/');
  }

  /** Load all canvas positions */
  loadLayout(): Observable<CanvasPositionDTO[]> {
    return this.http.get<CanvasPositionDTO[]>('/canvas/layouts/');
  }

  /** Batch update or create canvas positions */
  saveLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    return this.http.patch<void>('/canvas/layouts/batch/', changes);
  }

  /** Create a new canvas container */
  createCanvas(
    name: string = 'New canvas'
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.http.post<Pick<CanvasSummary, 'id' | 'name'>>('/canvas/', {
      name,
    });
  }

  /** Update an existing canvas */
  updateCanvas(
    id: string,
    name: string
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.http.patch<Pick<CanvasSummary, 'id' | 'name'>>(
      `/canvas/${id}/`,
      {
        name,
      }
    );
  }
}
