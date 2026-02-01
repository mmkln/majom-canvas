// core/scene/Scene.ts
import { Subject } from 'rxjs';
import { ICanvasElement } from '../interfaces/canvasElement.ts';
import { IShape } from '../interfaces/shape.ts';
import { isConnection, isShape } from '../utils/typeGuards.ts';
import { IConnection } from '../interfaces/connection.ts';

export class Scene {
  private elements: ICanvasElement[] = [];
  private elementsVersion = 0;
  private selectedMap: Map<string, ICanvasElement> = new Map<string, ICanvasElement>();
  public changes: Subject<void> = new Subject<void>();

  constructor() {}

  // TODO: change to addElements
  public addElement(element: ICanvasElement): void {
    this.elements.push(element);
    this.elementsVersion += 1;
    if (element.selected) {
      this.selectedMap.set(element.id, element);
    }
    this.changes.next();
  }


  public removeElements(elements: ICanvasElement[]): void {
    elements.forEach((element) => {
      const index = this.elements.indexOf(element);
      const elementId = element.id;
      if (index > -1) {
        this.elements.splice(index, 1);
      }
      if (this.selectedMap.has(elementId)) {
        this.selectedMap.delete(elementId);
        // element.selected = false; TODO: check if this is needed or not
      }
    });
    if (elements.length > 0) {
      this.elementsVersion += 1;
    }
    this.changes.next();
  }

  public getElements(): ICanvasElement[] {
    return this.elements;
  }

  public getElementsVersion(): number {
    return this.elementsVersion;
  }

  public getShapes(): IShape[] {
    return this.elements.filter(isShape);
  }

  public getConnections(): IConnection[] {
    return this.elements.filter(isConnection);
  }

  public setSelected(elements: ICanvasElement[]): void {
    this.clearSelected();

    elements.forEach((selectable) => {
      selectable.selected = true;
      this.selectedMap.set(selectable.id, selectable);
    });

    this.changes.next();
  }

  public addToSelected(elements: ICanvasElement[]): void {
    let changed = false;
    elements.forEach((selectable) => {
      if (!selectable.selected) {
        selectable.selected = true;
        this.selectedMap.set(selectable.id, selectable);
        changed = true;
      } else if (!this.selectedMap.has(selectable.id)) {
        // keep map in sync if selection was changed outside Scene APIs
        this.selectedMap.set(selectable.id, selectable);
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public removeFromSelected(elements: ICanvasElement[]): void {
    let changed = false;
    elements.forEach((selectable) => {
      if (selectable.selected) {
        selectable.selected = false;
        this.selectedMap.delete(selectable.id);
        changed = true;
      } else if (this.selectedMap.has(selectable.id)) {
        // keep map in sync if selection was changed outside Scene APIs
        this.selectedMap.delete(selectable.id);
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public clearSelected(): void {
    for (const [_, el] of this.selectedMap) {
      el.selected = false;
    }
    this.selectedMap.clear();
    this.changes.next();
  }

  public toggleSelected(elements: ICanvasElement[]): void {
    console.log({elements});
    let changed = false;
    elements.forEach((selectable) => {
      if (selectable.selected) {
        selectable.selected = false;
        this.selectedMap.delete(selectable.id);
        changed = true;
      } else {
        selectable.selected = true;
        this.selectedMap.set(selectable.id, selectable);
        changed = true;
      }
    });
    if (changed) {
      this.changes.next();
    }
  }

  public getSelectedElements(): ICanvasElement[] {
    return Array.from(this.selectedMap.values());
  }

  public getSelectedShapes(): IShape[] {
    return this.getShapes().filter((shape) => shape.selected);
  }

  public clear(): void {
    this.elements = [];
    this.selectedMap.clear();
    this.elementsVersion += 1;
    this.changes.next();
  }
}
