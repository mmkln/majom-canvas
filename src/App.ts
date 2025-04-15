// app/App.ts
import { CanvasManager } from './managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import { Toolbar } from './ui/Toolbar.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';
import { AuthComponent } from './ui/components/AuthComponent.ts';
import { AuthService } from './majom-wrapper/data-access/auth-service.js';
import { CanvasControls } from './ui/CanvasControls.ts';
import { ZoomIndicator } from './ui/ZoomIndicator.ts';
import { UIManager } from './ui/UIManager.ts';

export class App {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly toolbar: Toolbar;
  private canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;
  private readonly authService: AuthService;
  private readonly authComponent: AuthComponent;
  private readonly canvasControls: CanvasControls;
  private readonly zoomIndicator: ZoomIndicator;
  private readonly uiManager: UIManager;

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
    // Ініціалізація сервісу аутентифікації
    this.authService = new AuthService();
    // Ініціалізація компонента аутентифікації
    const appContainer = document.getElementById('app') || document.body;
    this.authComponent = new AuthComponent(appContainer, this.authService);
    // Додаємо CanvasControls
    this.canvasControls = new CanvasControls(this.canvasManager);
    this.zoomIndicator = new ZoomIndicator(this.canvasManager);
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(this.canvasControls, this.zoomIndicator);
    this.uiManager.mountAll(document.body);
  }

  public async init(): Promise<void> {
    this.canvasManager.init();
    this.toolbar.init();
    await this.diagramRepository.loadDiagram(this.scene);
    // AuthComponent does not have an init method, initialization happens in constructor
  }
}
