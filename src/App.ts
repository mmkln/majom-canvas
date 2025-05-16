// app/App.ts
import { CanvasManager } from './core/managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';
import { AuthComponent } from './ui/components/AuthComponent.ts';
import { AuthService } from './majom-wrapper/data-access/auth-service.ts';
import { UIManager } from './ui/UIManager.ts';
import type { IViewState } from './core/interfaces/interfaces.ts';
import { commandManager } from './core/managers/CommandManager.ts';
import { historyService } from './core/services/HistoryService.ts';
import { CopyCommand } from './core/commands/CopyCommand.ts';
import { PasteCommand } from './core/commands/PasteCommand.ts';
import { DeleteCommand } from './core/commands/DeleteCommand.ts';
import { CutCommand } from './core/commands/CutCommand.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import { OfflineCanvasService } from './majom-wrapper/services/OfflineCanvasService.ts';
import { CanvasSyncService } from './majom-wrapper/services/CanvasSyncService.ts';
import { HttpInterceptorClient } from './majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from './majom-wrapper/data-access/tasks-api-service.ts';
import { StoriesApiService } from './majom-wrapper/data-access/stories-api-service.ts';
import { GoalsApiService } from './majom-wrapper/data-access/goals-api-service.ts';
import { CanvasApiService } from './majom-wrapper/data-access/canvas-api-service.ts';
import { environment } from './config/environment.js';

export class App {
  private readonly dataProvider: IDataProvider;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;
  private readonly authService: AuthService;
  private readonly authComponent: AuthComponent;
  private readonly uiManager: UIManager;

  constructor(dataProvider: IDataProvider) {
    this.dataProvider = dataProvider;
    const canvasElement = document.getElementById('myCanvas');
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvasElement;

    // Створюємо нову сцену (це місце для зберігання всіх елементів)
    this.scene = new Scene();

    // Передаємо сцену в CanvasManager, щоб менеджер міг працювати з даними
    this.canvasManager = new CanvasManager(this.canvas, this.scene);
    // Використовуємо провайдера для створення репозиторію діаграми
    this.diagramRepository = new DiagramRepository(dataProvider);
    // Ініціалізація сервісу аутентифікації
    this.authService = new AuthService();
    // Створюємо компонент для авторизації
    const appContainer = document.getElementById('app') || document.body;
    this.authComponent = new AuthComponent(appContainer, this.authService);

    // Instantiate HTTP client and API services
    const httpClient = new HttpInterceptorClient(environment.apiUrl);
    const tasksApi = new TasksApiService(httpClient);
    const storiesApi = new StoriesApiService(httpClient);
    const goalsApi = new GoalsApiService(httpClient);
    const canvasApi = new CanvasApiService(httpClient);
    const offlineService = new OfflineCanvasService();
    const canvasSyncService = new CanvasSyncService(offlineService, canvasApi, tasksApi, storiesApi, goalsApi);

    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(
      this.canvasManager,
      this.scene,
      offlineService,
      canvasSyncService
    );
    this.uiManager.mountAll(document.body);

    // Register commands from config
    getCommandConfigs(this.scene, this.canvasManager).forEach((cmd) => {
      commandManager.register(cmd.name, cmd.handler);
      cmd.keys.forEach((k) => commandManager.bindShortcut(cmd.name, k));
    });
  }

  public async init(): Promise<void> {
    this.canvasManager.init();
    await this.diagramRepository.loadDiagram(this.scene);
    // Restore last view state (scroll & zoom) via centralized setter
    const view: IViewState = await this.dataProvider.loadViewState();
    const panZoom = this.canvasManager.getPanZoomManager();
    panZoom.setViewState(view);
    // Draw after restore and notify listeners (including ZoomIndicator)
    this.canvasManager.draw();
    // Auto-save view state on any change
    panZoom.viewChanges.subscribe((state) =>
      this.dataProvider.saveViewState(state)
    );
    // Auto-save diagram on content change
    this.scene.changes.subscribe(() =>
      this.diagramRepository.saveDiagram(this.scene)
    );
    // AuthComponent does not have an init method, initialization happens in constructor
  }
}
