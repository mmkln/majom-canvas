import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import {
  CanvasPositionReadDTO,
  CanvasPositionWriteDTO,
} from './canvas-position-dto.js';

export type CanvasMeta = Record<string, unknown> | null;
export type CanvasStatus = 'active' | 'archived';

export interface CanvasSummary {
  id: string;
  name: string;
  created_at: string;
  meta?: CanvasMeta;
  status?: CanvasStatus;
  archived_at?: string | null;
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
    name: string = 'New canvas',
    meta?: CanvasMeta
  ): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
    return this.http.post<Pick<CanvasSummary, 'id' | 'name' | 'meta'>>(
      '/canvas/',
      {
        name,
        ...(meta !== undefined ? { meta } : {}),
      }
    );
  }

  /** Update an existing canvas */
  updateCanvas(
    id: string,
    name: string,
    meta?: CanvasMeta
  ): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
    return this.http.patch<Pick<CanvasSummary, 'id' | 'name' | 'meta'>>(
      `/canvas/${id}/`,
      {
        name,
        ...(meta !== undefined ? { meta } : {}),
      }
    );
  }

  /** Delete canvas container */
  deleteCanvas(id: string): Observable<void> {
    return this.http.delete<void>(`/canvas/${id}/`);
  }

  public archiveCanvas(id: string): Observable<CanvasSummary> {
    return this.http.post<CanvasSummary>(`/canvas/${id}/archive/`, {});
  }

  public restoreCanvas(id: string): Observable<CanvasSummary> {
    return this.http.post<CanvasSummary>(`/canvas/${id}/restore/`, {});
  }
}
