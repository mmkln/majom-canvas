import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import {
  CanvasPositionReadDTO,
  CanvasPositionWriteDTO,
} from './canvas-position-dto.js';
import type {
  CanvasSnapshotDTO,
  CanvasSnapshotVersionDetailDTO,
  CanvasSnapshotVersionListItemDTO,
  CanvasSnapshotWriteDTO,
} from './canvas-snapshot-dto.ts';

export type CanvasMeta = Record<string, unknown> | null;
export type CanvasStatus = 'active' | 'archived';

export interface CanvasSummary {
  id: string;
  name: string;
  created_at: string;
  meta?: CanvasMeta;
  revision?: number;
  status?: CanvasStatus;
  archived_at?: string | null;
  updated_at?: string;
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

  public loadCanvasSnapshot(canvasId: string): Observable<CanvasSnapshotDTO> {
    const encoded = encodeURIComponent(canvasId);
    return this.http.get<CanvasSnapshotDTO>(`/canvas/${encoded}/snapshot/`);
  }

  public saveCanvasSnapshot(
    canvasId: string,
    payload: CanvasSnapshotWriteDTO
  ): Observable<CanvasSnapshotDTO> {
    const encoded = encodeURIComponent(canvasId);
    return this.http.put<CanvasSnapshotDTO>(
      `/canvas/${encoded}/snapshot/`,
      payload
    );
  }

  public loadCanvasHistory(
    canvasId: string
  ): Observable<CanvasSnapshotVersionListItemDTO[]> {
    const encoded = encodeURIComponent(canvasId);
    return this.http.get<CanvasSnapshotVersionListItemDTO[]>(
      `/canvas/${encoded}/history/`
    );
  }

  public loadCanvasHistoryVersion(
    canvasId: string,
    versionId: string
  ): Observable<CanvasSnapshotVersionDetailDTO> {
    const encodedCanvasId = encodeURIComponent(canvasId);
    const encodedVersionId = encodeURIComponent(versionId);
    return this.http.get<CanvasSnapshotVersionDetailDTO>(
      `/canvas/${encodedCanvasId}/history/${encodedVersionId}/`
    );
  }

  public restoreCanvasHistoryVersion(
    canvasId: string,
    versionId: string
  ): Observable<CanvasSnapshotDTO> {
    const encodedCanvasId = encodeURIComponent(canvasId);
    const encodedVersionId = encodeURIComponent(versionId);
    return this.http.post<CanvasSnapshotDTO>(
      `/canvas/${encodedCanvasId}/history/${encodedVersionId}/restore/`,
      {}
    );
  }
}
