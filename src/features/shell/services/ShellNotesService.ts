import { firstValueFrom } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../../../config/environment.ts';
import { NotesApiService } from '../../../majom-wrapper/data-access/notes-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import type { PaginatedResponse } from '../../../majom-wrapper/data-access/paginated-response.ts';
import type {
  Note,
  NoteStatus,
  NoteSummary,
} from '../../../majom-wrapper/interfaces/index.ts';

export type ShellNotesListOptions = {
  status?: NoteStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  isPinned?: boolean;
  updatedAtGte?: string;
  updatedAtLte?: string;
};

export type ShellNoteCreatePayload = Partial<
  Pick<Note, 'title' | 'body' | 'status' | 'is_pinned' | 'meta'>
>;

export type ShellNotePatchPayload = ShellNoteCreatePayload;

export class ShellNotesService {
  private readonly http = new HttpInterceptorClient(environment.apiUrl);
  private readonly notesApi = new NotesApiService(this.http);

  public async loadNotes(
    options: ShellNotesListOptions = {}
  ): Promise<PaginatedResponse<Note>> {
    return firstValueFrom(this.notesApi.fetchNotes(options).pipe(first()));
  }

  public async loadSummary(): Promise<NoteSummary> {
    return firstValueFrom(this.notesApi.fetchSummary().pipe(first()));
  }

  public async createNote(payload: ShellNoteCreatePayload): Promise<Note> {
    return firstValueFrom(this.notesApi.createNote(payload).pipe(first()));
  }

  public async patchNote(
    noteId: string,
    payload: ShellNotePatchPayload
  ): Promise<Note> {
    return firstValueFrom(this.notesApi.patchNote(noteId, payload).pipe(first()));
  }

  public async archiveNote(noteId: string): Promise<Note> {
    return firstValueFrom(this.notesApi.archiveNote(noteId).pipe(first()));
  }

  public async unarchiveNote(noteId: string): Promise<Note> {
    return firstValueFrom(this.notesApi.unarchiveNote(noteId).pipe(first()));
  }

  public async pinNote(noteId: string): Promise<Note> {
    return firstValueFrom(this.notesApi.pinNote(noteId).pipe(first()));
  }

  public async unpinNote(noteId: string): Promise<Note> {
    return firstValueFrom(this.notesApi.unpinNote(noteId).pipe(first()));
  }

  public async deleteNote(noteId: string): Promise<void> {
    await firstValueFrom(this.notesApi.deleteNote(noteId).pipe(first()));
  }
}
