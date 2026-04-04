import { describe, expect, it, vi } from 'vitest';
import { createAppRuntime, type AppRuntimeSnapshot } from '../../app-runtime/index.ts';
import { CanvasApp } from './CanvasApp.ts';

type RuntimeThemeHarness = {
  canvasManager: {
    setCanvasRuntimeTheme: ReturnType<typeof vi.fn>;
  };
};

function runRuntimeSnapshot(
  app: RuntimeThemeHarness,
  snapshot: AppRuntimeSnapshot
): void {
  (
    CanvasApp.prototype as unknown as {
      handleRuntimeSnapshot: (value: AppRuntimeSnapshot) => void;
    }
  ).handleRuntimeSnapshot.call(app, snapshot);
}

describe('CanvasApp runtime theme integration', () => {
  it('updates the canvas palette when runtime theme changes', () => {
    const runtime = createAppRuntime({ initialTheme: 'light' });
    const app: RuntimeThemeHarness = {
      canvasManager: {
        setCanvasRuntimeTheme: vi.fn(),
      },
    };

    runtime.subscribe((snapshot) => runRuntimeSnapshot(app, snapshot), {
      emitCurrent: true,
    });
    runtime.setTheme('dark');

    expect(app.canvasManager.setCanvasRuntimeTheme).toHaveBeenNthCalledWith(
      1,
      'light'
    );
    expect(app.canvasManager.setCanvasRuntimeTheme).toHaveBeenNthCalledWith(
      2,
      'dark'
    );
  });
});
