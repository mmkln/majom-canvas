import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throwError } from 'rxjs';
import { CanvasApp } from './CanvasApp.ts';

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}));

vi.mock('./core/services/NotificationService.ts', () => ({
  notify: notifyMock,
}));

type CanvasTitleHarness = {
  canvasTitle: string;
  emitAiAssistantContext: () => void;
};

type CanvasTitleEditHarness = {
  authService: {
    isLoggedIn: () => boolean;
  };
  canvasTitle: string;
  i18n: {
    t: (key: string, params?: Record<string, string>) => string;
  };
  canvasDataService: {
    updateCanvasName: ReturnType<typeof vi.fn>;
  };
  setCanvasTitle: ReturnType<typeof vi.fn>;
  refreshCanvasList: ReturnType<typeof vi.fn>;
  getCanvasTitleUpdateErrorMessage: (error: unknown) => string;
  getErrorResponseBody: (
    error: unknown
  ) => Record<string, unknown> | null;
  getFirstErrorMessage: (value: unknown) => string | null;
  extractMaxLengthLimit: (message: string) => number | null;
};

function runSetCanvasTitle(app: CanvasTitleHarness, title: string): void {
  (
    CanvasApp.prototype as unknown as {
      setCanvasTitle: (inputTitle: string) => void;
    }
  ).setCanvasTitle.call(app, title);
}

function runHandleCanvasTitleEdited(
  app: CanvasTitleEditHarness,
  title: string
): void {
  (
    CanvasApp.prototype as unknown as {
      handleCanvasTitleEdited: (event: Event) => void;
    }
  ).handleCanvasTitleEdited.call(
    app,
    new CustomEvent('canvasTitleEdited', {
      detail: { title },
    })
  );
}

function attachCanvasTitleErrorHelpers<T extends Omit<
  CanvasTitleEditHarness,
  | 'getCanvasTitleUpdateErrorMessage'
  | 'getErrorResponseBody'
  | 'getFirstErrorMessage'
  | 'extractMaxLengthLimit'
>>(app: T): CanvasTitleEditHarness {
  const target = app as T & Partial<CanvasTitleEditHarness>;
  target.getCanvasTitleUpdateErrorMessage = function (error: unknown): string {
    return (
      CanvasApp.prototype as unknown as {
        getCanvasTitleUpdateErrorMessage: (input: unknown) => string;
      }
    ).getCanvasTitleUpdateErrorMessage.call(target, error);
  };
  target.getErrorResponseBody = function (
    error: unknown
  ): Record<string, unknown> | null {
    return (
      CanvasApp.prototype as unknown as {
        getErrorResponseBody: (
          input: unknown
        ) => Record<string, unknown> | null;
      }
    ).getErrorResponseBody.call(target, error);
  };
  target.getFirstErrorMessage = function (value: unknown): string | null {
    return (
      CanvasApp.prototype as unknown as {
        getFirstErrorMessage: (input: unknown) => string | null;
      }
    ).getFirstErrorMessage.call(target, value);
  };
  target.extractMaxLengthLimit = function (message: string): number | null {
    return (
      CanvasApp.prototype as unknown as {
        extractMaxLengthLimit: (input: string) => number | null;
      }
    ).extractMaxLengthLimit.call(target, message);
  };
  return target as CanvasTitleEditHarness;
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
    notifyMock.mockReset();
  });

  it('updates canvas title, emits event, and syncs document title', () => {
    const app: CanvasTitleHarness = {
      canvasTitle: 'New canvas',
      emitAiAssistantContext: vi.fn(),
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
    expect(app.emitAiAssistantContext).toHaveBeenCalledTimes(1);
  });

  it('falls back to app title when canvas title is empty', () => {
    const app: CanvasTitleHarness = {
      canvasTitle: 'New canvas',
      emitAiAssistantContext: vi.fn(),
    };

    runSetCanvasTitle(app, '   ');

    expect(app.canvasTitle).toBe('   ');
    expect(document.title).toBe('Majom Canvas');
    expect(app.emitAiAssistantContext).toHaveBeenCalledTimes(1);
  });

  it('shows a specific validation message and skips the request when title exceeds 100 characters', () => {
    const setCanvasTitle = vi.fn();
    const refreshCanvasList = vi.fn();
    const updateCanvasName = vi.fn();
    const app = attachCanvasTitleErrorHelpers({
      authService: {
        isLoggedIn: () => true,
      },
      canvasTitle: 'Current canvas',
      i18n: {
        t: (key, params) => {
          if (key === 'canvas.titleTooLong') {
            return `Canvas title must be ${params?.limit} characters or less.`;
          }
          if (key === 'canvas.updateTitleFailed') {
            return 'Failed to update canvas title.';
          }
          return key;
        },
      },
      canvasDataService: {
        updateCanvasName,
      },
      setCanvasTitle,
      refreshCanvasList,
    });

    runHandleCanvasTitleEdited(app, 'x'.repeat(101));

    expect(updateCanvasName).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      'Canvas title must be 100 characters or less.',
      'error'
    );
    expect(setCanvasTitle).toHaveBeenCalledWith('Current canvas');
    expect(refreshCanvasList).not.toHaveBeenCalled();
  });

  it('surfaces the backend validation message as a friendly title-length error', () => {
    const setCanvasTitle = vi.fn();
    const refreshCanvasList = vi.fn();
    const updateCanvasName = vi.fn(() =>
      throwError(() => ({
        status: 400,
        response: {
          name: ['Ensure this field has no more than 100 characters.'],
        },
      }))
    );
    const app = attachCanvasTitleErrorHelpers({
      authService: {
        isLoggedIn: () => true,
      },
      canvasTitle: 'Current canvas',
      i18n: {
        t: (key, params) => {
          if (key === 'canvas.titleTooLong') {
            return `Canvas title must be ${params?.limit} characters or less.`;
          }
          if (key === 'canvas.updateTitleFailed') {
            return 'Failed to update canvas title.';
          }
          return key;
        },
      },
      canvasDataService: {
        updateCanvasName,
      },
      setCanvasTitle,
      refreshCanvasList,
    });

    runHandleCanvasTitleEdited(app, 'Valid title');

    expect(updateCanvasName).toHaveBeenCalledWith('Valid title');
    expect(notifyMock).toHaveBeenCalledWith(
      'Canvas title must be 100 characters or less.',
      'error'
    );
    expect(setCanvasTitle).toHaveBeenCalledWith('Current canvas');
    expect(refreshCanvasList).not.toHaveBeenCalled();
  });
});
