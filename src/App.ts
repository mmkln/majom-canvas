// app/App.ts
import { CanvasManager } from './managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import { Toolbar } from './ui/Toolbar.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly toolbar: Toolbar;
  private canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;

  constructor(dataProvider: IDataProvider) {
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
    // Використовуємо провайдера для створення репозиторію діаграми
    this.diagramRepository = new DiagramRepository(dataProvider);
  }

  public async init(): Promise<void> {
    this.canvasManager.init();
    this.toolbar.init();
    await this.diagramRepository.loadDiagram(this.scene);
  }
}
