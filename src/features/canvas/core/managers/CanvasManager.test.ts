import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasManager } from './CanvasManager.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { CanvasClientStorage } from '../services/CanvasClientStorage.ts';
import { DEFAULT_CANVAS_THEME } from '../../theme/canvasTheme.ts';

type AnimationLoopHarness = {
  isAnimationRunning: boolean;
  animationsEnabled: boolean;
  nextAnimationFrameAtMs: number;
  animationFrameIntervalMs: number;
  animationFrameId: number | null;
  draw: ReturnType<typeof vi.fn>;
};

type RafCallback = (time: number) => void;
type ViewBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type ThemeUpdateHarness = {
  canvasTheme: typeof DEFAULT_CANVAS_THEME;
  renderer: {
    invalidateBackground: ReturnType<typeof vi.fn>;
  };
  requestDraw: ReturnType<typeof vi.fn>;
};

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

function runStartAnimationLoop(target: AnimationLoopHarness): void {
  (
    CanvasManager.prototype as unknown as {
      startAnimationLoop: (this: AnimationLoopHarness) => void;
    }
  ).startAnimationLoop.call(target);
}

function runStopAnimationLoop(target: AnimationLoopHarness): void {
  (
    CanvasManager.prototype as unknown as {
      stopAnimationLoop: (this: AnimationLoopHarness) => void;
    }
  ).stopAnimationLoop.call(target);
}

function runSetCanvasTheme(target: ThemeUpdateHarness): void {
  (
    CanvasManager.prototype as unknown as {
      setCanvasTheme: (
        this: ThemeUpdateHarness,
        theme: typeof DEFAULT_CANVAS_THEME
      ) => void;
    }
  ).setCanvasTheme.call(target, DEFAULT_CANVAS_THEME);
}

type AnimationFpsCapHarness = {
  maxAnimationFpsCap: number;
  reducedAnimationFpsCap: number;
  heavyAnimationFpsCap: number;
  mediumAnimationWorkloadThreshold: number;
  heavyAnimationWorkloadThreshold: number;
};

function runResolveAnimationFpsCap(
  target: AnimationFpsCapHarness,
  visibleAnimatedConnections: number,
  visibleAnimatedStatuses: number,
  connectionAnimDetail: 'full' | 'reduced',
  statusAnimDetail: 'full' | 'reduced'
): number {
  return (
    CanvasManager.prototype as unknown as {
      resolveAnimationFpsCap: (
        this: AnimationFpsCapHarness,
        visibleAnimatedConnections: number,
        visibleAnimatedStatuses: number,
        connectionAnimDetail: 'full' | 'reduced',
        statusAnimDetail: 'full' | 'reduced'
      ) => number;
    }
  ).resolveAnimationFpsCap.call(
    target,
    visibleAnimatedConnections,
    visibleAnimatedStatuses,
    connectionAnimDetail,
    statusAnimDetail
  );
}

describe('CanvasManager animation FPS cap', () => {
  let rafCallbacks: Map<number, RafCallback>;
  let nextRafId: number;

  beforeEach(() => {
    rafCallbacks = new Map<number, RafCallback>();
    nextRafId = 1;

    vi.stubGlobal('requestAnimationFrame', (callback: RafCallback) => {
      const id = nextRafId;
      nextRafId += 1;
      rafCallbacks.set(id, callback);
      return id;
    });

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throttles draw calls to animationFrameIntervalMs', () => {
    const harness: AnimationLoopHarness = {
      isAnimationRunning: false,
      animationsEnabled: true,
      nextAnimationFrameAtMs: 0,
      animationFrameIntervalMs: 1000 / 45,
      animationFrameId: null,
      draw: vi.fn(),
    };

    runStartAnimationLoop(harness);

    const runNextFrame = (now: number): void => {
      const entry = rafCallbacks.entries().next();
      if (entry.done) {
        throw new Error('No pending requestAnimationFrame callback');
      }
      const [id, callback] = entry.value;
      rafCallbacks.delete(id);
      callback(now);
    };

    runNextFrame(100);
    runNextFrame(110);
    runNextFrame(120);
    runNextFrame(123);
    runNextFrame(130);
    runNextFrame(146);

    expect(harness.draw).toHaveBeenCalledTimes(3);
    expect(harness.isAnimationRunning).toBe(true);
    expect(harness.nextAnimationFrameAtMs).toBeGreaterThan(146);
  });

  it('advances schedule without rendering multiple catch-up frames in one tick', () => {
    const harness: AnimationLoopHarness = {
      isAnimationRunning: false,
      animationsEnabled: true,
      nextAnimationFrameAtMs: 0,
      animationFrameIntervalMs: 1000 / 45,
      animationFrameId: null,
      draw: vi.fn(),
    };

    runStartAnimationLoop(harness);

    const runNextFrame = (now: number): void => {
      const entry = rafCallbacks.entries().next();
      if (entry.done) {
        throw new Error('No pending requestAnimationFrame callback');
      }
      const [id, callback] = entry.value;
      rafCallbacks.delete(id);
      callback(now);
    };

    runNextFrame(100);
    runNextFrame(220);

    expect(harness.draw).toHaveBeenCalledTimes(2);
    expect(harness.nextAnimationFrameAtMs).toBeGreaterThan(220);
  });

  it('does not start animation loop when animations are disabled', () => {
    const harness: AnimationLoopHarness = {
      isAnimationRunning: false,
      animationsEnabled: false,
      nextAnimationFrameAtMs: 0,
      animationFrameIntervalMs: 1000 / 45,
      animationFrameId: null,
      draw: vi.fn(),
    };

    runStartAnimationLoop(harness);

    expect(harness.isAnimationRunning).toBe(false);
    expect(harness.animationFrameId).toBeNull();
    expect(harness.draw).not.toHaveBeenCalled();
    expect(rafCallbacks.size).toBe(0);
  });

  it('cancels pending animation frame and resets timing on stop', () => {
    const cancelSpy = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const harness: AnimationLoopHarness = {
      isAnimationRunning: true,
      animationsEnabled: true,
      nextAnimationFrameAtMs: 120,
      animationFrameIntervalMs: 1000 / 45,
      animationFrameId: 7,
      draw: vi.fn(),
    };

    runStopAnimationLoop(harness);

    expect(cancelSpy).toHaveBeenCalledWith(7);
    expect(harness.isAnimationRunning).toBe(false);
    expect(harness.animationFrameId).toBeNull();
    expect(harness.nextAnimationFrameAtMs).toBe(0);
  });
});

describe('CanvasManager theme updates', () => {
  it('invalidates the background renderer when the canvas palette changes', () => {
    const harness: ThemeUpdateHarness = {
      canvasTheme: DEFAULT_CANVAS_THEME,
      renderer: {
        invalidateBackground: vi.fn(),
      },
      requestDraw: vi.fn(),
    };

    runSetCanvasTheme(harness);

    expect(harness.canvasTheme).toBe(DEFAULT_CANVAS_THEME);
    expect(harness.renderer.invalidateBackground).toHaveBeenCalledTimes(1);
    expect(harness.requestDraw).toHaveBeenCalledTimes(1);
  });
});

describe('CanvasManager adaptive animation FPS cap', () => {
  const harness: AnimationFpsCapHarness = {
    maxAnimationFpsCap: 45,
    reducedAnimationFpsCap: 30,
    heavyAnimationFpsCap: 24,
    mediumAnimationWorkloadThreshold: 28,
    heavyAnimationWorkloadThreshold: 48,
  };

  it('keeps max cap for low workload in full detail mode', () => {
    expect(runResolveAnimationFpsCap(harness, 6, 10, 'full', 'full')).toBe(45);
  });

  it('drops to reduced cap for medium workload in full detail mode', () => {
    expect(runResolveAnimationFpsCap(harness, 12, 16, 'full', 'full')).toBe(30);
  });

  it('drops to heavy cap when workload is high regardless of detail mode', () => {
    expect(runResolveAnimationFpsCap(harness, 20, 28, 'full', 'full')).toBe(24);
  });

  it('drops to heavy cap earlier when reduced detail is already active', () => {
    expect(
      runResolveAnimationFpsCap(harness, 10, 20, 'reduced', 'full')
    ).toBe(24);
  });
});

function createConnectable(
  id: string,
  geometry: { x: number; y: number; width?: number; height?: number; radius?: number },
  uuid?: string
): IConnectable {
  return {
    id,
    ...(uuid ? { uuid } : {}),
    x: geometry.x,
    y: geometry.y,
    ...(typeof geometry.width === 'number' ? { width: geometry.width } : {}),
    ...(typeof geometry.height === 'number' ? { height: geometry.height } : {}),
    ...(typeof geometry.radius === 'number' ? { radius: geometry.radius } : {}),
    selected: false,
    zIndex: 1,
    draw: vi.fn(),
    getConnectionPoints: () => [],
    getNearestPoint: () => ({ x: geometry.x, y: geometry.y }),
    contains: () => false,
    drawAnchors: vi.fn(),
    drawConnectionLine: vi.fn(),
  } as unknown as IConnectable;
}

function createConnection(
  fromId: string,
  toId: string,
  curve: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    cp1: { x: number; y: number };
    cp2: { x: number; y: number };
  }
): IConnection {
  return {
    id: 'connection-1',
    fromId,
    toId,
    selected: false,
    zIndex: 1,
    lineType: ConnectionLineType.SShaped,
    relationType: ConnectionRelationType.RelatesTo,
    draw: vi.fn(),
    isNearPoint: () => false,
    setLineType: vi.fn(),
    getCurvePoints: () => ({ ...curve, isBezier: true }),
  } as unknown as IConnection;
}

function createVisibilityHarness(): {
  buildConnectableLookup: (
    connectables: IConnectable[]
  ) => Map<string, IConnectable>;
  isConnectionVisible: (
    connection: IConnection,
    connectableLookup: Map<string, IConnectable>,
    viewBounds: ViewBounds | null
  ) => boolean;
} {
  const harness: {
    getElementBounds?: (
      element: unknown,
      overrides?: Partial<{
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
      }>
    ) => { x: number; y: number; width: number; height: number } | null;
    isElementVisible?: (
      element: unknown,
      viewBounds: ViewBounds | null,
      overrides?: Partial<{
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
      }>
    ) => boolean;
    getConnectionCurveBounds?: (
      connection: IConnection,
      from: IConnectable,
      to: IConnectable
    ) => { x: number; y: number; width: number; height: number } | null;
  } = {};

  harness.getElementBounds = (element, overrides) =>
    (
      CanvasManager.prototype as unknown as {
        getElementBounds: (
          incoming: unknown,
          incomingOverrides?: unknown
        ) => { x: number; y: number; width: number; height: number } | null;
      }
    ).getElementBounds.call(harness, element, overrides);

  harness.isElementVisible = (element, viewBounds, overrides) =>
    (
      CanvasManager.prototype as unknown as {
        isElementVisible: (
          incoming: unknown,
          incomingViewBounds: ViewBounds | null,
          incomingOverrides?: unknown
        ) => boolean;
      }
    ).isElementVisible.call(harness, element, viewBounds, overrides);

  harness.getConnectionCurveBounds = (connection, from, to) =>
    (
      CanvasManager.prototype as unknown as {
        getConnectionCurveBounds: (
          incomingConnection: IConnection,
          incomingFrom: IConnectable,
          incomingTo: IConnectable
        ) => { x: number; y: number; width: number; height: number } | null;
      }
    ).getConnectionCurveBounds.call(harness, connection, from, to);

  return {
    buildConnectableLookup: (connectables) =>
      (
        CanvasManager.prototype as unknown as {
          buildConnectableLookup: (
            incomingConnectables: IConnectable[]
          ) => Map<string, IConnectable>;
        }
      ).buildConnectableLookup.call(harness, connectables),
    isConnectionVisible: (connection, connectableLookup, viewBounds) =>
      (
        CanvasManager.prototype as unknown as {
          isConnectionVisible: (
            incomingConnection: IConnection,
            incomingLookup: Map<string, IConnectable>,
            incomingViewBounds: ViewBounds | null
          ) => boolean;
        }
      ).isConnectionVisible.call(
        harness,
        connection,
        connectableLookup,
        viewBounds
      ),
  };
}

function createConnectionHoverOverlayHarness(): {
  getConnectionHoverOverlayGeometry: (
    element: unknown,
    pad: number
  ) =>
    | { kind: 'circle'; cx: number; cy: number; radius: number }
    | {
        kind: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
        cornerRadius: number;
      }
    | null;
} {
  const harness: {
    panZoom: { scale: number };
    getElementBounds?: (
      element: unknown,
      overrides?: Partial<{
        x: number;
        y: number;
        width: number;
        height: number;
        radius: number;
      }>
    ) => { x: number; y: number; width: number; height: number } | null;
  } = {
    panZoom: { scale: 1 },
  };

  harness.getElementBounds = (element, overrides) =>
    (
      CanvasManager.prototype as unknown as {
        getElementBounds: (
          incoming: unknown,
          incomingOverrides?: unknown
        ) => { x: number; y: number; width: number; height: number } | null;
      }
    ).getElementBounds.call(harness, element, overrides);

  return {
    getConnectionHoverOverlayGeometry: (element, pad) =>
      (
        CanvasManager.prototype as unknown as {
          getConnectionHoverOverlayGeometry: (
            incomingElement: unknown,
            incomingPad: number
          ) =>
            | { kind: 'circle'; cx: number; cy: number; radius: number }
            | {
                kind: 'rect';
                x: number;
                y: number;
                width: number;
                height: number;
                cornerRadius: number;
              }
            | null;
        }
      ).getConnectionHoverOverlayGeometry.call(harness, element, pad),
  };
}

describe('CanvasManager connection visibility culling', () => {
  const viewBounds: ViewBounds = {
    minX: 0,
    minY: 0,
    maxX: 100,
    maxY: 100,
  };

  it('keeps connection visible when one endpoint is in viewport', () => {
    const harness = createVisibilityHarness();
    const from = createConnectable('from', { x: 20, y: 20, width: 20, height: 20 });
    const to = createConnectable('to', { x: 220, y: 20, width: 20, height: 20 });
    const connection = createConnection('from', 'to', {
      start: { x: 40, y: 30 },
      end: { x: 220, y: 30 },
      cp1: { x: 100, y: 30 },
      cp2: { x: 160, y: 30 },
    });

    const lookup = harness.buildConnectableLookup([from, to]);

    expect(harness.isConnectionVisible(connection, lookup, viewBounds)).toBe(
      true
    );
  });

  it('hides connection when both endpoints and curve bounds are out of viewport', () => {
    const harness = createVisibilityHarness();
    const from = createConnectable('from', {
      x: -240,
      y: 20,
      width: 20,
      height: 20,
    });
    const to = createConnectable('to', {
      x: -140,
      y: 30,
      width: 20,
      height: 20,
    });
    const connection = createConnection('from', 'to', {
      start: { x: -220, y: 30 },
      end: { x: -120, y: 40 },
      cp1: { x: -180, y: 30 },
      cp2: { x: -150, y: 40 },
    });

    const lookup = harness.buildConnectableLookup([from, to]);

    expect(harness.isConnectionVisible(connection, lookup, viewBounds)).toBe(
      false
    );
  });

  it('keeps connection visible when both endpoints are out of viewport but path bounds intersect viewport', () => {
    const harness = createVisibilityHarness();
    const from = createConnectable('from', {
      x: -160,
      y: 40,
      width: 20,
      height: 20,
    });
    const to = createConnectable('to', {
      x: 160,
      y: 40,
      width: 20,
      height: 20,
    });
    const connection = createConnection('from', 'to', {
      start: { x: -140, y: 50 },
      end: { x: 160, y: 50 },
      cp1: { x: -20, y: 50 },
      cp2: { x: 40, y: 50 },
    });

    const lookup = harness.buildConnectableLookup([from, to]);

    expect(harness.isConnectionVisible(connection, lookup, viewBounds)).toBe(
      true
    );
  });

  it('resolves endpoints by uuid aliases in lookup', () => {
    const harness = createVisibilityHarness();
    const from = createConnectable(
      'internal-from-id',
      { x: 10, y: 10, width: 20, height: 20 },
      'from-uuid'
    );
    const to = createConnectable(
      'internal-to-id',
      { x: 220, y: 10, width: 20, height: 20 },
      'to-uuid'
    );
    const connection = createConnection('from-uuid', 'to-uuid', {
      start: { x: 30, y: 20 },
      end: { x: 220, y: 20 },
      cp1: { x: 90, y: 20 },
      cp2: { x: 150, y: 20 },
    });

    const lookup = harness.buildConnectableLookup([from, to]);

    expect(harness.isConnectionVisible(connection, lookup, viewBounds)).toBe(
      true
    );
  });
});

describe('CanvasManager cull bounds hysteresis', () => {
  it('expands viewport bounds by pixel padding normalized by scale', () => {
    const harness = {
      panZoom: { scale: 2 },
      cullPaddingPx: 96,
    };

    const result = (
      CanvasManager.prototype as unknown as {
        expandViewBounds: (input: ViewBounds | null) => ViewBounds | null;
      }
    ).expandViewBounds.call(harness, {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 200,
    });

    expect(result).toEqual({
      minX: -48,
      minY: -48,
      maxX: 148,
      maxY: 248,
    });
  });

  it('returns null when source bounds are null', () => {
    const harness = {
      panZoom: { scale: 1 },
      cullPaddingPx: 96,
    };

    const result = (
      CanvasManager.prototype as unknown as {
        expandViewBounds: (input: ViewBounds | null) => ViewBounds | null;
      }
    ).expandViewBounds.call(harness, null);

    expect(result).toBeNull();
  });
});

describe('CanvasManager connection hover overlay geometry', () => {
  it('centers circular overlays using element bounds for planning circles', () => {
    const harness = createConnectionHoverOverlayHarness();

    const geometry = harness.getConnectionHoverOverlayGeometry(
      {
        x: 120,
        y: 80,
        width: 180,
        height: 180,
        radius: 90,
      },
      4
    );

    expect(geometry).toEqual({
      kind: 'circle',
      cx: 210,
      cy: 170,
      radius: 94,
    });
  });
});

describe('CanvasManager goal progress dirty updates', () => {
  it('updates goal links and progress using cached connectable lookup', () => {
    const goal = new GoalElement({ id: 'goal-1', x: 0, y: 0 });
    const doneTask = new TaskElement({
      id: 'task-1',
      x: 10,
      y: 10,
      status: ElementStatus.Done,
    });
    const pendingTask = new TaskElement({
      id: 'task-2',
      x: 20,
      y: 20,
      status: ElementStatus.Pending,
    });
    const unrelatedTask = new TaskElement({
      id: 'task-3',
      x: 30,
      y: 30,
      status: ElementStatus.Pending,
    });
    const harness = {
      goalProgressDirty: true,
      cachedGoalElements: [goal],
      cachedTaskElements: [doneTask, pendingTask, unrelatedTask],
      cachedConnectableLookup: new Map<string, IConnectable>([
        ['goal-1', goal as unknown as IConnectable],
        ['task-1', doneTask as unknown as IConnectable],
        ['task-2', pendingTask as unknown as IConnectable],
      ]),
    };

    const connections = [
      {
        id: 'connection-1',
        fromId: 'goal-1',
        toId: 'task-1',
        relationType: ConnectionRelationType.RelatesTo,
      },
      {
        id: 'connection-2',
        fromId: 'task-2',
        toId: 'goal-1',
        relationType: ConnectionRelationType.RelatesTo,
      },
    ] as IConnection[];

    (
      CanvasManager.prototype as unknown as {
        updateGoalLinksAndProgressIfNeeded: (
          sourceConnections: IConnection[]
        ) => void;
      }
    ).updateGoalLinksAndProgressIfNeeded.call(harness, connections);

    expect(new Set(goal.links)).toEqual(new Set(['task-1', 'task-2']));
    expect(goal.progress).toBe(0.5);
    expect(harness.goalProgressDirty).toBe(false);
  });

  it('skips recomputation when dirty flag is false', () => {
    const goal = new GoalElement({ id: 'goal-1', x: 0, y: 0 });
    goal.links = ['task-1'];
    goal.progress = 1;
    const harness = {
      goalProgressDirty: false,
      cachedGoalElements: [goal],
      cachedTaskElements: [] as TaskElement[],
      cachedConnectableLookup: new Map<string, IConnectable>(),
    };

    (
      CanvasManager.prototype as unknown as {
        updateGoalLinksAndProgressIfNeeded: (
          sourceConnections: IConnection[]
        ) => void;
      }
    ).updateGoalLinksAndProgressIfNeeded.call(harness, []);

    expect(goal.links).toEqual(['task-1']);
    expect(goal.progress).toBe(1);
    expect(harness.goalProgressDirty).toBe(false);
  });
});

describe('CanvasManager smart guide preferences', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('persists and forwards per-kind smart guide preferences', () => {
    const setSmartGuidePreferences = vi.fn();
    const requestDraw = vi.fn();
    const harness = {
      smartGuidePreferences: {
        showSpacingGuides: true,
        showContainerGuides: true,
        showViewportCenterGuides: true,
      },
      interactionManager: {
        setSmartGuidePreferences,
      },
      requestDraw,
    };

    (
      CanvasManager.prototype as unknown as {
        setSmartGuidePreferences: (
          this: typeof harness,
          preferences: Partial<typeof harness.smartGuidePreferences>
        ) => void;
      }
    ).setSmartGuidePreferences.call(harness, {
      showSpacingGuides: false,
      showViewportCenterGuides: false,
    });

    expect(harness.smartGuidePreferences).toEqual({
      showSpacingGuides: false,
      showContainerGuides: true,
      showViewportCenterGuides: false,
    });
    expect(setSmartGuidePreferences).toHaveBeenCalledWith({
      showSpacingGuides: false,
      showContainerGuides: true,
      showViewportCenterGuides: false,
    });
    expect(CanvasClientStorage.getCanvasSpacingGuidesEnabled(true)).toBe(false);
    expect(CanvasClientStorage.getCanvasContainerGuidesEnabled(true)).toBe(
      true
    );
    expect(
      CanvasClientStorage.getCanvasViewportCenterGuidesEnabled(true)
    ).toBe(false);
    expect(requestDraw).toHaveBeenCalledTimes(1);
  });

  it('persists and forwards the master smart guides toggle', () => {
    const setSmartGuidesEnabled = vi.fn();
    const requestDraw = vi.fn();
    const harness = {
      smartGuidesEnabled: true,
      interactionManager: {
        setSmartGuidesEnabled,
      },
      requestDraw,
    };

    (
      CanvasManager.prototype as unknown as {
        setSmartGuidesEnabled: (this: typeof harness, enabled: boolean) => void;
      }
    ).setSmartGuidesEnabled.call(harness, false);

    expect(harness.smartGuidesEnabled).toBe(false);
    expect(setSmartGuidesEnabled).toHaveBeenCalledWith(false);
    expect(CanvasClientStorage.getCanvasSmartGuidesEnabled(true)).toBe(false);
    expect(requestDraw).toHaveBeenCalledTimes(1);
  });
});
