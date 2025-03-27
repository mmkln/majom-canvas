// core/utils/typeGuards.ts
import { IShape } from '../interfaces/shape';
import { IDrawable } from '../interfaces/drawable';

export function isShape(element: IDrawable): element is IShape {
  return 'contains' in element && typeof (element as any).contains === 'function';
}
