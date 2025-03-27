// ui/Toolbar.ts
import { Scene } from '../core/scene/Scene';
import Circle from '../core/shapes/Circle';

export class Toolbar {
  private readonly container: HTMLDivElement;

  constructor(private scene: Scene) {
    // Створюємо контейнер для тулбару (вертикальна панель)
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = '10px';
    this.container.style.top = '10px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '8px'; // Відступи між кнопками
    this.container.style.padding = '8px';
    this.container.style.background = '#f4f4f4';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 0 5px rgba(0,0,0,0.1)';
  }

  public init(): void {
    // Створюємо кнопку
    const addCircleBtn = document.createElement('button');
    addCircleBtn.textContent = 'Add Circle';
    addCircleBtn.style.cursor = 'pointer';
    addCircleBtn.style.padding = '6px 12px';
    addCircleBtn.style.border = '1px solid #ccc';
    addCircleBtn.style.borderRadius = '4px';
    addCircleBtn.style.background = '#fff';
    addCircleBtn.style.fontSize = '14px';

    // При натисканні на кнопку додаємо нове коло до сцени
    addCircleBtn.onclick = () => {
      const circle = new Circle(100, 100, 50);
      this.scene.addElement(circle);
      // При потребі можна одразу викликати метод перерисовки CanvasManager
      // наприклад: this.canvasManager.draw();
    };

    // Додаємо кнопку до контейнера тулбару
    this.container.appendChild(addCircleBtn);

    // Додаємо тулбар у body (або в інший контейнер на сторінці)
    document.body.appendChild(this.container);
  }
}
