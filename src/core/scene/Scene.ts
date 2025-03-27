// core/scene/Scene.ts
import { Subject } from 'rxjs';
import { IShape } from '../interfaces/shape';

export class Scene {
  // Зберігаємо елементи (поки тип даних — any, пізніше можна уточнити інтерфейс)
  private elements: IShape[];
  public changes: Subject<void> = new Subject<void>();

  constructor() {
    this.elements = [];
  }

  public addElement(element: any): void {
    this.elements.push(element);
    this.changes.next();
  }

  public removeElement(element: any): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
      this.changes.next();
    }
  }

  public getElements(): any[] {
    return this.elements;
  }

  public clear(): void {
    this.elements = [];
    this.changes.next();
  }
}
