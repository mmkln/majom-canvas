import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';

export type ConnectionRenderFrame = {
  ctx: CanvasRenderingContext2D;
  panZoom: PanZoomManager;
  connections: ReadonlyArray<IConnection>;
  connectables: ReadonlyArray<IConnectable>;
  connectableLookup?: ReadonlyMap<string, IConnectable>;
};

export interface ConnectionRenderBackend {
  draw(frame: ConnectionRenderFrame): void;
}
