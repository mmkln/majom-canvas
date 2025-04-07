// core/scene/Scene.ts
import { Subject } from 'rxjs';
import { ICanvasElement } from '../interfaces/canvasElement';
import { IShape } from '../interfaces/shape';
import { isConnection, isShape } from '../utils/typeGuards';
import { IConnection } from '../interfaces/connection';

export class Scene {
  private elements: ICanvasElement[] = [];
  public changes: Subject<void> = new Subject<void>();

  constructor() {}

  public addElement(element: ICanvasElement): void {
    this.elements.push(element);
    this.changes.next();
  }

  public removeElement(element: ICanvasElement): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      this.changes.next();
    }
  }

  public removeElements(elements: ICanvasElement[]): void {
    elements.forEach((element) => {
      const index = this.elements.indexOf(element);
      if (index > -1) {
        this.elements.splice(index, 1);
      }
    });
    this.changes.next();
  }

  public getElements(): ICanvasElement[] {
    return this.elements;
  }

  public getShapes(): IShape[] {
    return this.elements.filter(isShape);
  }

  public getConnections(): IConnection[] {
    return this.elements.filter(isConnection);
  }

  public setSelected(elements: ICanvasElement[]): void {
    this.getElements().forEach((element) => {
      element.selected = false;
    });
    elements.forEach((selectable) => {
      selectable.selected = true;
    });
    this.changes.next();
  }

  public getSelectedElements(): ICanvasElement[] {
    return this.getElements().filter((element) => element.selected);
  }

  public getSelectedShapes(): IShape[] {
    return this.getShapes().filter((shape) => shape.selected);
  }

  public clear(): void {
    this.elements = [];
    this.changes.next();
  }
}
