import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import {
  CanvasPositionReadDTO,
  CanvasPositionWriteDTO,
} from './canvas-position-dto.js';

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

  /** Load canvas details by id */
  loadCanvas(id: string): Observable<CanvasSummary> {
    return this.http.get<CanvasSummary>(`/canvas/${id}/`);
  }

  /** Load positions for a specific canvas */
  fetchCanvasPositions(canvasId: string): Observable<CanvasPositionReadDTO[]> {
    return this.http.get<CanvasPositionReadDTO[]>(
      `/canvas/${canvasId}/positions/`
    );
  }

  /** Batch update or create canvas positions for a canvas */
  saveCanvasPositions(
    canvasId: string,
    changes: CanvasPositionWriteDTO[]
  ): Observable<void> {
    return this.http.patch<void>(
      `/canvas/${canvasId}/positions/bulk/`,
      changes
    );
  }

  /** Delete a canvas position by id */
  deleteCanvasPosition(positionId: string): Observable<void> {
    return this.http.delete<void>(`/canvas/positions/${positionId}/`);
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
