import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import type {
  ConnectionRenderBackend,
  ConnectionRenderFrame,
} from './ConnectionRenderBackend.ts';

type DrawableConnection = IConnection & {
  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements: IConnectable[]
  ): void;
};

type LookupDrawableConnection = IConnection & {
  drawWithConnectableLookup(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    lookup: ReadonlyMap<string, IConnectable>
  ): void;
};

export class Canvas2DConnectionRenderBackend
  implements ConnectionRenderBackend
{
  public draw({
    ctx,
    panZoom,
    connections,
    connectables,
    connectableLookup,
  }: ConnectionRenderFrame): void {
    const drawConnectables = connectables as IConnectable[];
    const lookup =
      connectableLookup ?? this.buildConnectableLookup(drawConnectables);
    connections.forEach((connection) => {
      if (this.hasLookupDraw(connection)) {
        connection.drawWithConnectableLookup(ctx, panZoom, lookup);
        return;
      }
      (connection as DrawableConnection).draw(ctx, panZoom, drawConnectables);
    });
  }

  private hasLookupDraw(
    connection: IConnection
  ): connection is LookupDrawableConnection {
    return typeof (connection as Partial<LookupDrawableConnection>)
      .drawWithConnectableLookup === 'function';
  }

  private buildConnectableLookup(
    connectables: ReadonlyArray<IConnectable>
  ): ReadonlyMap<string, IConnectable> {
    const lookup = new Map<string, IConnectable>();
    connectables.forEach((connectable) => {
      lookup.set(connectable.id, connectable);
      const uuid = (connectable as { uuid?: string }).uuid;
      if (uuid) {
        lookup.set(uuid, connectable);
      }
    });
    return lookup;
  }
}
