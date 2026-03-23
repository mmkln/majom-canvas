import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasApp } from './CanvasApp.ts';

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

type CanvasTitleHarness = {
  canvasTitle: string;
  emitWorkspaceChatContext: () => void;
};

function runSetCanvasTitle(app: CanvasTitleHarness, title: string): void {
  (
    CanvasApp.prototype as unknown as {
      setCanvasTitle: (inputTitle: string) => void;
    }
  ).setCanvasTitle.call(app, title);
}

describe('CanvasApp.setCanvasTitle', () => {
  beforeEach(() => {
    class TestCustomEvent<T = unknown> {
      public readonly type: string;
      public readonly detail: T;

      constructor(type: string, init?: { detail?: T }) {
        this.type = type;
        this.detail = (init?.detail ?? undefined) as T;
      }
    }

    vi.stubGlobal('document', { title: 'Majom Canvas' });
    vi.stubGlobal('window', { dispatchEvent: vi.fn(() => true) });
    vi.stubGlobal('CustomEvent', TestCustomEvent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('updates canvas title, emits event, and syncs document title', () => {
    const app: CanvasTitleHarness = {
      canvasTitle: 'New canvas',
      emitWorkspaceChatContext: vi.fn(),
    };
    const fakeWindow = globalThis.window as unknown as {
      dispatchEvent: ReturnType<typeof vi.fn>;
    };

    runSetCanvasTitle(app, 'Roadmap');

    expect(app.canvasTitle).toBe('Roadmap');
    expect(document.title).toBe('Roadmap - Majom Canvas');
    expect(fakeWindow.dispatchEvent).toHaveBeenCalledTimes(1);
    const event = fakeWindow.dispatchEvent.mock.calls[0]?.[0] as {
      type?: string;
      detail?: { title?: string };
    };
    expect(event.type).toBe('canvasTitleChanged');
    expect(event.detail?.title).toBe('Roadmap');
    expect(app.emitWorkspaceChatContext).toHaveBeenCalledTimes(1);
  });

  it('falls back to app title when canvas title is empty', () => {
    const app: CanvasTitleHarness = {
      canvasTitle: 'New canvas',
      emitWorkspaceChatContext: vi.fn(),
    };

    runSetCanvasTitle(app, '   ');

    expect(app.canvasTitle).toBe('   ');
    expect(document.title).toBe('Majom Canvas');
    expect(app.emitWorkspaceChatContext).toHaveBeenCalledTimes(1);
  });
});
