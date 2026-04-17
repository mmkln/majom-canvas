// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PaginatedResponse } from '../../../majom-wrapper/data-access/paginated-response.ts';
import type {
  Note,
  NoteSummary,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  NotesQuickModal,
  type NotesQuickModalService,
} from './NotesQuickModal.ts';
import * as confirmDeleteNoteModalModule from './ConfirmDeleteNoteModal.ts';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makePaginated<T>(results: T[]): PaginatedResponse<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  };
}

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: overrides.id ?? 'note-1',
    title: overrides.title ?? 'Focus note',
    body: overrides.body ?? 'Initial body',
    status: overrides.status ?? 'active',
    is_pinned: overrides.is_pinned ?? false,
    meta: overrides.meta ?? {},
    created_at: overrides.created_at ?? '2026-04-16T10:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-04-16T10:00:00.000Z',
  };
}

function createService(options?: {
  activeNotes?: Note[];
  archivedNotes?: Note[];
  summary?: NoteSummary;
  createNoteImpl?: (payload: Partial<Note>) => Promise<Note>;
  patchNoteImpl?: (noteId: string, payload: Partial<Note>) => Promise<Note>;
  archiveNoteImpl?: (noteId: string) => Promise<Note>;
  pinNoteImpl?: (noteId: string) => Promise<Note>;
}): {
  service: NotesQuickModalService;
  createNote: ReturnType<typeof vi.fn>;
  patchNote: ReturnType<typeof vi.fn>;
  archiveNote: ReturnType<typeof vi.fn>;
  pinNote: ReturnType<typeof vi.fn>;
  deleteNote: ReturnType<typeof vi.fn>;
} {
  const activeNotes = options?.activeNotes ?? [makeNote()];
  const archivedNotes = options?.archivedNotes ?? [];
  const summary =
    options?.summary ??
    ({
      total: activeNotes.length + archivedNotes.length,
      active: activeNotes.length,
      archived: archivedNotes.length,
      pinned: activeNotes.filter((note) => note.is_pinned).length,
      pinned_active: activeNotes.filter((note) => note.is_pinned).length,
    } satisfies NoteSummary);

  const loadNotes = vi.fn(
    async (params?: { status?: 'active' | 'archived' }) =>
      params?.status === 'archived'
        ? makePaginated(archivedNotes)
        : makePaginated(activeNotes)
  );
  const loadSummary = vi.fn(async () => summary);
  const createNote = vi.fn(
    options?.createNoteImpl ??
      (async () => makeNote({ id: 'note-new', title: 'Untitled', body: '' }))
  );
  const patchNote = vi.fn(
    options?.patchNoteImpl ??
      (async (noteId: string, payload: Partial<Note>) =>
        makeNote({
          id: noteId,
          title: payload.title ?? 'Focus note',
          body: payload.body ?? 'Initial body',
          updated_at: '2026-04-16T10:05:00.000Z',
        }))
  );
  const archiveNote = vi.fn(
    options?.archiveNoteImpl ??
      (async (noteId: string) => makeNote({ id: noteId, status: 'archived' }))
  );
  const unarchiveNote = vi.fn(async (noteId: string) =>
    makeNote({ id: noteId, status: 'active' })
  );
  const pinNote = vi.fn(
    options?.pinNoteImpl ??
      (async (noteId: string) => makeNote({ id: noteId, is_pinned: true }))
  );
  const unpinNote = vi.fn(async (noteId: string) =>
    makeNote({ id: noteId, is_pinned: false })
  );
  const deleteNote = vi.fn(async () => Promise.resolve());

  return {
    service: {
      loadNotes,
      loadSummary,
      createNote,
      patchNote,
      archiveNote,
      unarchiveNote,
      pinNote,
      unpinNote,
      deleteNote,
    },
    createNote,
    patchNote,
    archiveNote,
    pinNote,
    deleteNote,
  };
}

async function flushUi(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

function mockMobileViewport(): () => void {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalVisualViewport = window.visualViewport;
  const originalMatchMedia = window.matchMedia;

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 390,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 844,
  });
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: { width: 390, height: 844 },
  });
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === '(pointer: coarse)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;

  return () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: originalVisualViewport,
    });
    window.matchMedia = originalMatchMedia;
  };
}

describe('NotesQuickModal focus retention', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps textarea focus after an async autosave response resolves', async () => {
    const deferredSave = createDeferred<Note>();
    const baseNote = makeNote({ body: 'Draft body' });
    const { service, patchNote } = createService({
      activeNotes: [baseNote],
      patchNoteImpl: async () => deferredSave.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const textarea = document.body.querySelector('textarea');
    expect(textarea).not.toBeNull();
    if (!textarea) {
      throw new Error('Expected notes textarea.');
    }

    textarea.focus();
    textarea.value = 'Draft body extended';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    await Promise.resolve();

    expect(patchNote).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(textarea);
    expect(textarea.isConnected).toBe(true);

    deferredSave.resolve(
      makeNote({
        ...baseNote,
        body: 'Draft body extended',
        updated_at: '2026-04-16T10:06:00.000Z',
      })
    );
    await flushUi();

    expect(document.activeElement).toBe(textarea);
    expect(textarea.isConnected).toBe(true);
    expect(document.body.querySelector('textarea')).toBe(textarea);

    modal.destroy();
  });

  it('preserves caret position inside textarea after save completion', async () => {
    const deferredSave = createDeferred<Note>();
    const baseNote = makeNote({ body: 'Alpha beta gamma' });
    const { service } = createService({
      activeNotes: [baseNote],
      patchNoteImpl: async () => deferredSave.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const textarea = document.body.querySelector('textarea');
    expect(textarea).not.toBeNull();
    if (!textarea) {
      throw new Error('Expected notes textarea.');
    }

    textarea.focus();
    textarea.value = 'Alpha beta gamma delta';
    textarea.setSelectionRange(11, 11);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    await Promise.resolve();
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);

    deferredSave.resolve(
      makeNote({
        ...baseNote,
        body: 'Alpha beta gamma delta',
        updated_at: '2026-04-16T10:07:00.000Z',
      })
    );
    await flushUi();

    expect(document.activeElement).toBe(textarea);
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
    expect(document.body.querySelector('textarea')).toBe(textarea);

    modal.destroy();
  });

  it('creates a new note optimistically without waiting for the backend', async () => {
    const deferredCreate = createDeferred<Note>();
    const { service, createNote } = createService({
      createNoteImpl: async () => deferredCreate.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const newNoteButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === 'New note');
    expect(newNoteButton).not.toBeUndefined();
    if (!newNoteButton) {
      throw new Error('Expected New note button.');
    }

    newNoteButton.click();
    await flushUi();

    const titleInput =
      document.body.querySelector<HTMLInputElement>('input[type="text"]');
    expect(titleInput).not.toBeNull();
    if (!titleInput) {
      throw new Error('Expected note title input.');
    }

    expect(titleInput.value).toBe('');
    expect(document.activeElement).toBe(titleInput);
    expect(createNote).toHaveBeenCalledTimes(1);
    expect(createNote).toHaveBeenCalledWith(
      expect.objectContaining({
        body: '',
        status: 'active',
        is_pinned: false,
        meta: null,
      })
    );

    deferredCreate.resolve(
      makeNote({
        id: 'note-new',
        title: 'Untitled',
        body: '',
        updated_at: '2026-04-16T10:08:00.000Z',
      })
    );
    await flushUi();

    expect(document.body.querySelector('input[type="text"]')).toBe(titleInput);
    expect(document.activeElement).toBe(titleInput);

    modal.destroy();
  });

  it('uses a fullscreen list-first mobile flow before opening the editor', async () => {
    const restoreViewport = mockMobileViewport();
    try {
      const noteA = makeNote({ id: 'note-a', title: 'First mobile note' });
      const noteB = makeNote({ id: 'note-b', title: 'Second mobile note' });
      const { service } = createService({
        activeNotes: [noteA, noteB],
      });
      const modal = new NotesQuickModal(service);

      modal.open();
      await flushUi();

      const container = document.body.querySelector<HTMLElement>(
        '[data-component="PaneModalContainer"]'
      );
      const overlay = document.body.querySelector<HTMLElement>(
        '[data-component="PaneModalOverlay"]'
      );
      expect(container?.dataset.overlayPresentation).toBe('fullscreen');
      expect(overlay?.style.padding).toBe('0px');
      expect(container?.style.borderRadius).toBe('0px');
      expect(container?.style.height).toBe('100dvh');
      expect(document.body.querySelector('textarea')).toBeNull();
      expect(document.body.textContent).toContain('First mobile note');
      expect(document.body.textContent).toContain('New note');

      const openButton = Array.from(
        document.body.querySelectorAll<HTMLButtonElement>('button')
      ).find((button) => button.textContent?.includes('First mobile note'));
      expect(openButton).not.toBeUndefined();
      if (!openButton) {
        throw new Error('Expected mobile note row.');
      }

      openButton.click();
      await flushUi();

      expect(document.body.querySelector('textarea')).not.toBeNull();

      const backButton = document.body.querySelector<HTMLButtonElement>(
        'button[aria-label="Back to list"]'
      );
      expect(backButton).not.toBeNull();
      if (!backButton) {
        throw new Error('Expected mobile back button.');
      }

      backButton.click();
      await flushUi();

      expect(document.body.querySelector('textarea')).toBeNull();
      expect(document.body.textContent).toContain('Second mobile note');

      modal.destroy();
    } finally {
      restoreViewport();
    }
  });

  it('applies pin optimistically for a server-backed note before sync resolves', async () => {
    const deferredPin = createDeferred<Note>();
    const baseNote = makeNote({ id: 'note-pin', title: 'Pinned later' });
    const { service, pinNote } = createService({
      activeNotes: [baseNote],
      pinNoteImpl: async () => deferredPin.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const selectedNote = modal['selectedNote'] as Note | null;
    expect(selectedNote).not.toBeNull();
    if (!selectedNote) {
      throw new Error('Expected selected note.');
    }

    await modal['togglePin'](selectedNote);

    expect((modal['selectedNote'] as Note | null)?.is_pinned).toBe(true);
    expect(pinNote).toHaveBeenCalledTimes(1);
    expect(pinNote).toHaveBeenCalledWith('note-pin');
    expect(
      document.body.querySelector('button[aria-label="Unpin note"]')
    ).not.toBeNull();

    deferredPin.resolve(
      makeNote({
        id: 'note-pin',
        title: 'Pinned later',
        is_pinned: true,
        updated_at: '2026-04-16T10:09:00.000Z',
      })
    );
    await flushUi();

    expect((modal['selectedNote'] as Note | null)?.is_pinned).toBe(true);

    modal.destroy();
  });

  it('applies archive optimistically for a server-backed note before sync resolves', async () => {
    const deferredArchive = createDeferred<Note>();
    const baseNote = makeNote({ id: 'note-archive', title: 'Archive later' });
    const { service, archiveNote } = createService({
      activeNotes: [baseNote],
      archiveNoteImpl: async () => deferredArchive.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const selectedNote = modal['selectedNote'] as Note | null;
    expect(selectedNote).not.toBeNull();
    if (!selectedNote) {
      throw new Error('Expected selected note.');
    }

    await modal['toggleArchive'](selectedNote);

    expect((modal['selectedNote'] as Note | null)?.status).toBe('archived');
    expect(archiveNote).toHaveBeenCalledTimes(1);
    expect(archiveNote).toHaveBeenCalledWith('note-archive');

    deferredArchive.resolve(
      makeNote({
        id: 'note-archive',
        title: 'Archive later',
        status: 'archived',
        updated_at: '2026-04-16T10:09:00.000Z',
      })
    );
    await flushUi();

    expect((modal['selectedNote'] as Note | null)?.status).toBe('archived');

    modal.destroy();
  });

  it('queues pin state for an optimistic note until create resolves', async () => {
    const deferredCreate = createDeferred<Note>();
    const { service, createNote, pinNote } = createService({
      createNoteImpl: async () => deferredCreate.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const newNoteButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === 'New note');
    if (!newNoteButton) {
      throw new Error('Expected New note button.');
    }

    newNoteButton.click();
    await flushUi();

    const selectedNote = modal['selectedNote'] as Note | null;
    expect(selectedNote).not.toBeNull();
    if (!selectedNote) {
      throw new Error('Expected selected optimistic note.');
    }

    await modal['togglePin'](selectedNote);
    await flushUi();

    expect(createNote).toHaveBeenCalledTimes(1);
    expect(pinNote).toHaveBeenCalledTimes(0);

    deferredCreate.resolve(
      makeNote({
        id: 'note-new',
        title: 'Untitled note',
        body: '',
        is_pinned: false,
        updated_at: '2026-04-16T10:08:00.000Z',
      })
    );
    await flushUi();

    expect(pinNote).toHaveBeenCalledTimes(1);
    expect(pinNote).toHaveBeenCalledWith('note-new');

    modal.destroy();
  });

  it('removes an optimistic note immediately and deletes it after create resolves', async () => {
    const deferredCreate = createDeferred<Note>();
    vi.spyOn(
      confirmDeleteNoteModalModule,
      'confirmDeleteNoteModal'
    ).mockResolvedValue(true);
    const { service, deleteNote } = createService({
      activeNotes: [],
      summary: {
        total: 0,
        active: 0,
        archived: 0,
        pinned: 0,
        pinned_active: 0,
      },
      createNoteImpl: async () => deferredCreate.promise,
    });
    const modal = new NotesQuickModal(service);

    modal.open();
    await flushUi();

    const newNoteButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === 'New note');
    if (!newNoteButton) {
      throw new Error('Expected New note button.');
    }

    newNoteButton.click();
    await flushUi();

    const selectedNote = modal['selectedNote'] as Note | null;
    expect(selectedNote).not.toBeNull();
    if (!selectedNote) {
      throw new Error('Expected selected optimistic note.');
    }

    await modal['deleteSelectedNote'](selectedNote);
    await flushUi();

    expect(document.body.querySelector('input[type="text"]')).toBeNull();
    expect(deleteNote).toHaveBeenCalledTimes(0);

    deferredCreate.resolve(
      makeNote({
        id: 'note-new',
        title: 'Untitled note',
        body: '',
        updated_at: '2026-04-16T10:08:00.000Z',
      })
    );
    await flushUi();

    expect(deleteNote).toHaveBeenCalledTimes(1);
    expect(deleteNote).toHaveBeenCalledWith('note-new');

    modal.destroy();
  });
});
