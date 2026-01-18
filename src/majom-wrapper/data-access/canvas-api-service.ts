import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { CanvasPositionDTO } from './canvas-position-dto.js';

export interface CanvasSummary {
  id: string;
  name: string;
  created_at: string;
}

export interface ContentTypeInfo {
  id: number;
  app_label: string;
  model: string;
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

  /** Load content types for canvas layouts */
  loadContentTypes(): Observable<ContentTypeInfo[]> {
    return this.http.get<ContentTypeInfo[]>('/canvas/positions/content-types/');
  }

  /** Load positions for a specific canvas */
  fetchCanvasPositions(canvasId: string): Observable<CanvasPositionDTO[]> {
    return this.http.get<CanvasPositionDTO[]>(`/canvas/${canvasId}/positions/`);
  }

  /** Batch update or create canvas positions for a canvas */
  saveCanvasPositions(
    canvasId: string,
    changes: CanvasPositionDTO[]
  ): Observable<void> {
    return this.http.patch<void>(
      `/canvas/${canvasId}/positions/bulk/`,
      changes
    );
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
