// app/App.ts
import { CanvasManager } from './managers/CanvasManager';
import { Scene } from './core/scene/Scene';

export class App {
  private canvas: HTMLCanvasElement;
  private scene: Scene;
  private canvasManager: CanvasManager;

  constructor() {
    // Припускаємо, що у вашому index.html canvas має id="myCanvas"
    const canvasElement = document.getElementById('myCanvas');
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvasElement;

    // Створюємо нову сцену (це місце для зберігання всіх елементів)
    this.scene = new Scene();

    // Передаємо сцену в CanvasManager, щоб менеджер міг працювати з даними
    this.canvasManager = new CanvasManager(this.canvas, this.scene);
  }

  public init(): void {
    // Ініціалізація менеджера канви (події, рендеринг тощо)
    this.canvasManager.init();
  }
}
