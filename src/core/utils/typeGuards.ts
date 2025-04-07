// core/utils/typeGuards.ts
import { IShape } from '../interfaces/shape';
import { ICanvasElement } from '../interfaces/canvasElement';
import { IConnection } from '../interfaces/connection';

export function isShape(element: ICanvasElement): element is IShape {
  return (
    'id' in element &&
    'x' in element &&
    'y' in element &&
    'radius' in element &&
    'contains' in element
  );
}

export function isConnection(element: ICanvasElement): element is IConnection {
  return (
    'id' in element &&
    'selected' in element &&
    'fromId' in element &&
    'toId' in element
  );
}
