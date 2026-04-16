import { Observable } from 'rxjs';
import { HttpInterceptorClient } from './http-interceptor.js';
import { PaginatedResponse } from './paginated-response.js';
import {
  type Note,
  type NoteStatus,
  type NoteSummary,
} from '../interfaces/index.ts';

type NoteListParams = {
  status?: NoteStatus;
  isPinned?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  updatedAtGte?: string;
  updatedAtLte?: string;
};

export type NoteCreatePayload = Partial<
  Pick<Note, 'title' | 'body' | 'status' | 'is_pinned' | 'meta'>
>;

export type NoteUpdatePayload = NoteCreatePayload;

export class NotesApiService {
  constructor(private readonly http: HttpInterceptorClient) {}

  public fetchNotes(
    params: NoteListParams = {}
  ): Observable<PaginatedResponse<Note>> {
    return this.http.get<PaginatedResponse<Note>>(
      `/notes/${this.buildQuery(params)}`
    );
  }

  public getNote(id: string): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.get<Note>(`/notes/${encodedId}/`);
  }

  public createNote(payload: NoteCreatePayload): Observable<Note> {
    return this.http.post<Note>('/notes/', payload);
  }

  public patchNote(id: string, payload: NoteUpdatePayload): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.patch<Note>(`/notes/${encodedId}/`, payload);
  }

  public deleteNote(id: string): Observable<void> {
    const encodedId = encodeURIComponent(id);
    return this.http.delete<void>(`/notes/${encodedId}/`);
  }

  public archiveNote(id: string): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.post<Note>(`/notes/${encodedId}/archive/`, {});
  }

  public unarchiveNote(id: string): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.post<Note>(`/notes/${encodedId}/unarchive/`, {});
  }

  public pinNote(id: string): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.post<Note>(`/notes/${encodedId}/pin/`, {});
  }

  public unpinNote(id: string): Observable<Note> {
    const encodedId = encodeURIComponent(id);
    return this.http.post<Note>(`/notes/${encodedId}/unpin/`, {});
  }

  public fetchSummary(): Observable<NoteSummary> {
    return this.http.get<NoteSummary>('/notes/summary/');
  }

  private buildQuery(params: NoteListParams): string {
    const query: string[] = [];

    if (params.status) {
      query.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params.isPinned !== undefined) {
      query.push(`is_pinned=${encodeURIComponent(String(params.isPinned))}`);
    }
    if (params.page !== undefined) {
      query.push(`page=${encodeURIComponent(String(params.page))}`);
    }
    if (params.pageSize !== undefined) {
      query.push(`page_size=${encodeURIComponent(String(params.pageSize))}`);
    }
    if (params.search) {
      query.push(`search=${encodeURIComponent(params.search)}`);
    }
    if (params.updatedAtGte) {
      query.push(`updated_at__gte=${encodeURIComponent(params.updatedAtGte)}`);
    }
    if (params.updatedAtLte) {
      query.push(`updated_at__lte=${encodeURIComponent(params.updatedAtLte)}`);
    }

    return query.length > 0 ? `?${query.join('&')}` : '';
  }
}
