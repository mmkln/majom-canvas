// app/Scene.ts
export class Scene {
  // Зберігаємо елементи (поки тип даних — any, пізніше можна уточнити інтерфейс)
  private elements: any[];

  constructor() {
    this.elements = [];
  }

  public addElement(element: any): void {
    this.elements.push(element);
  }

  public removeElement(element: any): void {
    const index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements.splice(index, 1);
    }
  }

  public getElements(): any[] {
    return this.elements;
  }

  public clear(): void {
    this.elements = [];
  }
}
