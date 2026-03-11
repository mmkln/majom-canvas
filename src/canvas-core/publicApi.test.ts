import { describe, expect, it } from 'vitest';
import {
  AllowAllRelationPolicy,
  CommandManager,
  ConnectionInteractionRuntime,
  identityConnectableOrderResolver,
  identityDragGroupResolver,
  findConnectionPointAt,
  DragInteractionRuntime,
  HistoryService,
  InteractionRuntime,
  resolveTopElementByZIndex,
  PanZoomManager,
  SelectionRuntime,
  Scene,
  ShortcutManager,
  TypedEventBus,
} from './index.ts';

describe('canvas-core public API', () => {
  it('is consumable via barrel export', () => {
    const scene = new Scene();
    const history = new HistoryService();
    const canvas = { width: 1200, height: 800 } as HTMLCanvasElement;
    const panZoom = new PanZoomManager(canvas);
    const shortcuts = new ShortcutManager({ autoAttach: false });
    const commands = new CommandManager(shortcuts);
    const runtime = new ConnectionInteractionRuntime({
      getConnectables: () => [],
      getConnections: () => [],
      getScale: () => 1,
      onConnectionCreate: () => undefined,
    });
    const selection = new SelectionRuntime<{ id: string; selected: boolean }>({
      setSelected: () => undefined,
      toggleSelected: () => undefined,
    });
    const drag = new DragInteractionRuntime<{ id: string; x: number; y: number }>(
      (element) => ({ x: element.x, y: element.y })
    );
    const interaction = new InteractionRuntime<any, any, any, PanZoomManager>({
      canvas,
      scene: {
        getShapes: () => [],
        getElements: () => [],
        getSelectedElements: () => [],
        setSelected: () => undefined,
        toggleSelected: () => undefined,
        changes: { next: () => undefined },
      },
      panZoom,
      connectionInteraction: {
        start: () => false,
        update: () => undefined,
        finish: () => undefined,
        cancel: () => undefined,
        isCreating: () => false,
        hitTest: () => null,
        getTemporaryLine: () => null,
      },
    });
    const group = identityDragGroupResolver([{ id: 'a' }]);
    const ordered = identityConnectableOrderResolver({
      connectables: [{ id: 'a' }],
      isCreatingConnection: false,
    });
    const pointHit = findConnectionPointAt(
      10,
      10,
      [
        {
          getConnectionPoints: () => [{ x: 10, y: 10 }],
        },
      ],
      1
    );
    const top = resolveTopElementByZIndex({
      sceneX: 10,
      sceneY: 10,
      candidates: [
        {
          zIndex: 1,
          contains: () => true,
        },
      ],
    });
    const bus = new TypedEventBus<{ ping: { ok: boolean } }>();
    const policy = new AllowAllRelationPolicy<{ id: string }>();

    let payloadOk = false;
    bus.on('ping', (payload) => {
      payloadOk = payload.ok;
    });

    bus.emit('ping', { ok: true });

    expect(scene.getElements()).toEqual([]);
    expect(history.canUndo()).toBe(false);
    expect(panZoom.scale).toBeGreaterThan(0);
    expect(runtime.isCreating()).toBe(false);
    expect(interaction.getRegionRect()).toBe(null);
    expect(selection.getRegionRect()).toBe(null);
    expect(drag.isDragging()).toBe(false);
    expect(group).toEqual([{ id: 'a' }]);
    expect(ordered).toEqual([{ id: 'a' }]);
    expect(pointHit).not.toBeNull();
    expect(top).not.toBe(null);
    commands.register('noop', () => undefined);
    commands.execute('noop');
    expect(policy.canConnect({ source: { id: 'a' }, target: { id: 'b' } })).toEqual({
      allowed: true,
    });
    expect(payloadOk).toBe(true);
  });
});
