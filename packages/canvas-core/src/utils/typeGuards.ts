import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';

/**
 * Narrows a canvas element to a connection-like element.
 */
export function isConnection(element: ICanvasElement): element is IConnection {
  return (
    'fromId' in element &&
    'toId' in element &&
    typeof (element as { fromId: unknown }).fromId === 'string' &&
    typeof (element as { toId: unknown }).toId === 'string'
  );
}

/**
 * Narrows a canvas element to a connectable node-like element.
 */
export function isConnectable(element: ICanvasElement): element is IConnectable {
  const candidate = element as Partial<IConnectable>;
  return (
    typeof candidate.contains === 'function' &&
    typeof candidate.getNearestPoint === 'function' &&
    typeof candidate.getConnectionPoints === 'function'
  );
}
