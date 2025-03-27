// core/utils/typeGuards.ts
import { IShape } from '../interfaces/shape';
import { IDrawable } from '../interfaces/drawable';

export function isShape(element: IDrawable): element is IShape {
  return 'id' in element && 'x' in element && 'y' in element && 'radius' in element && 'contains' in element;
}
