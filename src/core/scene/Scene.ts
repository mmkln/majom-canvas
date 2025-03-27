// core/scene/Scene.ts
import { Subject } from 'rxjs';
import { IDrawable } from '../interfaces/drawable';
import { IShape } from '../interfaces/shape';

export class Scene {
  private elements: IDrawable[] = [];
  public changes: Subject<void> = new Subject<void>();

  constructor() {}

  public addElement(element: IDrawable): void {
    this.elements.push(element);
    this.changes.next();
  }

  public removeElement(element: IDrawable): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      this.changes.next();
    }
  }

  public getElements(): IDrawable[] {
    return this.elements;
  }

  public getShapes(): IShape[] {
    return this.elements.filter(el => 'contains' in el) as IShape[];
  }

  public clear(): void {
    this.elements = [];
    this.changes.next();
  }
}
