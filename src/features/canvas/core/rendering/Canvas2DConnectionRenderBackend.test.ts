import { describe, expect, it, vi } from 'vitest';
import { Canvas2DConnectionRenderBackend } from './Canvas2DConnectionRenderBackend.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';

function createConnectable(id: string, uuid?: string): IConnectable {
  return {
    id,
    ...(uuid ? { uuid } : {}),
    x: 0,
    y: 0,
    selected: false,
    zIndex: 1,
    draw: vi.fn(),
    contains: () => false,
    getConnectionPoints: () => [],
    getNearestPoint: () => ({ x: 0, y: 0 }),
    drawAnchors: vi.fn(),
    drawConnectionLine: vi.fn(),
  } as unknown as IConnectable;
}

function createConnection(draw: ReturnType<typeof vi.fn>): IConnection {
  return {
    id: 'conn-1',
    fromId: 'from',
    toId: 'to',
    lineType: ConnectionLineType.SShaped,
    relationType: ConnectionRelationType.RelatesTo,
    selected: false,
    zIndex: 1,
    draw,
    contains: () => false,
    isNearPoint: () => false,
    setLineType: vi.fn(),
  } as unknown as IConnection;
}

describe('Canvas2DConnectionRenderBackend', () => {
  it('delegates drawing to each connection with connectables', () => {
    const drawConnection = vi.fn();
    const backend = new Canvas2DConnectionRenderBackend();
    const connectables = [createConnectable('from'), createConnectable('to')];
    const connection = createConnection(drawConnection);
    const ctx = {} as CanvasRenderingContext2D;

    backend.draw({
      ctx,
      panZoom: { scale: 1 } as unknown as PanZoomManager,
      connections: [connection],
      connectables,
    });

    expect(drawConnection).toHaveBeenCalledTimes(1);
    expect(drawConnection).toHaveBeenCalledWith(
      ctx,
      expect.any(Object),
      connectables
    );
  });

  it('prefers lookup-based draw path and resolves uuid aliases', () => {
    const drawConnection = vi.fn();
    const drawWithLookup = vi.fn();
    const backend = new Canvas2DConnectionRenderBackend();
    const connectables = [
      createConnectable('internal-from', 'from-uuid'),
      createConnectable('internal-to', 'to-uuid'),
    ];
    const connection = {
      ...createConnection(drawConnection),
      fromId: 'from-uuid',
      toId: 'to-uuid',
      drawWithConnectableLookup: drawWithLookup,
    } as unknown as IConnection & {
      drawWithConnectableLookup: (
        ctx: CanvasRenderingContext2D,
        panZoom: PanZoomManager,
        lookup: ReadonlyMap<string, IConnectable>
      ) => void;
    };
    const ctx = {} as CanvasRenderingContext2D;

    backend.draw({
      ctx,
      panZoom: { scale: 1 } as unknown as PanZoomManager,
      connections: [connection],
      connectables,
    });

    expect(drawWithLookup).toHaveBeenCalledTimes(1);
    expect(drawConnection).not.toHaveBeenCalled();
    const lookup = drawWithLookup.mock.calls[0][2] as ReadonlyMap<
      string,
      IConnectable
    >;
    expect(lookup.get('from-uuid')?.id).toBe('internal-from');
    expect(lookup.get('to-uuid')?.id).toBe('internal-to');
  });
});
