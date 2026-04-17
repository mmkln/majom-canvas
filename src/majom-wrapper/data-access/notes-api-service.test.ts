import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { NotesApiService } from './notes-api-service.ts';

describe('NotesApiService write payload normalization', () => {
  it('sends an empty meta object instead of null when creating a note', async () => {
    const http = {
      post: vi.fn(() =>
        of({
          id: 'note-1',
          title: 'Title',
          body: 'Body',
          status: 'active',
          is_pinned: false,
          meta: {},
          created_at: '2026-04-17T10:00:00.000Z',
          updated_at: '2026-04-17T10:00:00.000Z',
        })
      ),
    };
    const service = new NotesApiService(http as any);

    await firstValueFrom(
      service.createNote({
        title: 'Title',
        body: 'Body',
        status: 'active',
        is_pinned: false,
        meta: {},
      })
    );

    expect(http.post).toHaveBeenCalledWith('/notes/', {
      title: 'Title',
      body: 'Body',
      status: 'active',
      is_pinned: false,
      meta: {},
    });
  });

  it('sends an empty meta object instead of null when patching a note', async () => {
    const http = {
      patch: vi.fn(() =>
        of({
          id: 'note-1',
          title: 'Updated',
          body: 'Body',
          status: 'active',
          is_pinned: false,
          meta: {},
          created_at: '2026-04-17T10:00:00.000Z',
          updated_at: '2026-04-17T10:05:00.000Z',
        })
      ),
    };
    const service = new NotesApiService(http as any);

    await firstValueFrom(
      service.patchNote('note-1', {
        title: 'Updated',
        meta: {},
      })
    );

    expect(http.patch).toHaveBeenCalledWith('/notes/note-1/', {
      title: 'Updated',
      meta: {},
    });
  });
});
