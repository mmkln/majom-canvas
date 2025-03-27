// app/App.ts
import { CanvasManager } from './managers/CanvasManager';
import { Scene } from './core/scene/Scene';
import { Toolbar } from './ui/Toolbar';

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly toolbar: Toolbar;
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
    this.toolbar = new Toolbar(this.scene);

    // Передаємо сцену в CanvasManager, щоб менеджер міг працювати з даними
    this.canvasManager = new CanvasManager(this.canvas, this.scene);
  }

  public init(): void {
    this.canvasManager.init();
    this.toolbar.init();
  }
}
