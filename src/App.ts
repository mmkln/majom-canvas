// app/App.ts
import { CanvasManager } from './core/managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';
import { AuthComponent } from './ui/components/AuthComponent.ts';
import { AuthService } from './majom-wrapper/data-access/auth-service.ts';
import { HttpInterceptorClient } from './majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from './majom-wrapper/data-access/tasks-api-service.ts';
import { StoriesApiService } from './majom-wrapper/data-access/stories-api-service.ts';
import { GoalsApiService } from './majom-wrapper/data-access/goals-api-service.ts';
import { CanvasApiService } from './majom-wrapper/data-access/canvas-api-service.ts';
import { CanvasDataService } from './majom-wrapper/services/CanvasDataService.ts';
import { UIManager } from './ui/UIManager.ts';
import type { IViewState } from './core/interfaces/interfaces.ts';
import { commandManager } from './core/managers/CommandManager.ts';
import { historyService } from './core/services/HistoryService.ts';
import { CopyCommand } from './core/commands/CopyCommand.ts';
import { PasteCommand } from './core/commands/PasteCommand.ts';
import { DeleteCommand } from './core/commands/DeleteCommand.ts';
import { CutCommand } from './core/commands/CutCommand.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import { environment } from './config/environment.ts';
import { CONTENT_TYPE_IDS } from './config/env/index.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { StoryElement } from './elements/StoryElement.ts';
import { GoalElement } from './elements/GoalElement.ts';
import { isPlanningElement } from './elements/utils/typeGuards.ts';
import { CanvasPositionDTO } from './majom-wrapper/data-access/canvas-position-dto.ts';
import { notify } from './core/services/NotificationService.ts';

export class App {
  private readonly dataProvider: IDataProvider;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;
  private readonly authService: AuthService;
  private readonly authComponent: AuthComponent;
  private readonly uiManager: UIManager;
  private readonly canvasDataService: CanvasDataService;
  private canvasTitle: string = 'New canvas';

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
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.canvasDataService = new CanvasDataService(
      new TasksApiService(http),
      new StoriesApiService(http),
      new GoalsApiService(http),
      new CanvasApiService(http)
    );
    // Створюємо компонент для авторизації
    const appContainer = document.getElementById('app') || document.body;
    this.authComponent = new AuthComponent(appContainer, this.authService);
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(this.canvasManager, this.scene);
    this.uiManager.mountAll(document.body);

    // Register commands from config
    getCommandConfigs(this.scene, this.canvasManager).forEach((cmd) => {
      commandManager.register(cmd.name, cmd.handler);
      cmd.keys.forEach((k) => commandManager.bindShortcut(cmd.name, k));
    });

    window.addEventListener('refreshCanvasData', () => this.loadCanvasFromApi());
    window.addEventListener('saveCanvasLayout', () => this.saveCanvasLayout());
    window.addEventListener('canvasTitleEdited', (event: Event) => {
      const customEvent = event as CustomEvent<{ title?: string }>;
      const title = customEvent.detail?.title;
      if (typeof title !== 'string') return;
      if (!this.authService.isLoggedIn()) {
        window.dispatchEvent(new CustomEvent('showLoginModal'));
        this.setCanvasTitle(this.canvasTitle);
        return;
      }
      const previousTitle = this.canvasTitle;
      this.canvasDataService.updateCanvasName(title).subscribe({
        next: (canvas) => {
          this.setCanvasTitle(canvas.name);
        },
        error: (err) => {
          console.error('Failed to update canvas title', err);
          notify('Failed to update canvas title', 'error');
          this.setCanvasTitle(previousTitle);
        },
      });
    });
  }

  public async init(): Promise<void> {
    this.canvasManager.init();
    if (this.authService.isLoggedIn()) {
      this.loadCanvasFromApi();
    } else {
      await this.diagramRepository.loadDiagram(this.scene);
    }
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

  private loadCanvasFromApi(): void {
    if (!this.authService.isLoggedIn()) {
      this.scene.clear();
      this.setCanvasTitle('New canvas');
      return;
    }
    this.canvasDataService.ensureCanvas().subscribe({
      next: (canvas) => {
        this.setCanvasTitle(canvas.name);
        this.canvasDataService.loadElements().subscribe({
          next: (elements) => {
            this.scene.clear();
            elements.forEach((el) => this.scene.addElement(el));
          },
          error: (err) => {
            console.error('Failed to load canvas data', err);
            notify('Failed to load canvas data', 'error');
          },
        });
      },
      error: (err) => {
        console.error('Failed to ensure canvas', err);
        notify('Failed to load canvas', 'error');
      },
    });
  }

  private saveCanvasLayout(): void {
    if (!this.authService.isLoggedIn()) {
      window.dispatchEvent(new CustomEvent('showLoginModal'));
      return;
    }
    const elements = this.scene
      .getElements()
      .filter(isPlanningElement) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    const positions: CanvasPositionDTO[] = [];
    const missingTypes = new Set<string>();
    const missingIds: string[] = [];

    elements.forEach((el) => {
      const contentType = this.getContentTypeId(el);
      if (!contentType) {
        missingTypes.add(
          el instanceof TaskElement
            ? 'task'
            : el instanceof StoryElement
              ? 'story'
              : 'goal'
        );
        return;
      }
      const objectId = Number((el as any).id);
      if (!Number.isFinite(objectId)) {
        missingIds.push(String((el as any).id));
        return;
      }
      positions.push({
        content_type: contentType,
        object_id: objectId,
        x: el.x,
        y: el.y,
      });
    });

    if (missingTypes.size > 0) {
      notify(
        `Missing content type IDs for: ${Array.from(missingTypes).join(', ')}`,
        'error'
      );
      return;
    }
    if (missingIds.length > 0) {
      notify('Some elements have no backend IDs; cannot save layout.', 'error');
      return;
    }
    if (positions.length === 0) {
      notify('No elements to save.', 'info');
      return;
    }

    this.canvasDataService.updateLayoutBatch(positions).subscribe({
      next: () => {
        notify('Layout saved', 'success');
      },
      error: (err) => {
        console.error('Failed to save layout', err);
        notify('Failed to save layout', 'error');
      },
    });
  }

  private getContentTypeId(
    element: TaskElement | StoryElement | GoalElement
  ): number | null {
    if (element instanceof TaskElement) return CONTENT_TYPE_IDS.task;
    if (element instanceof StoryElement) return CONTENT_TYPE_IDS.story;
    return CONTENT_TYPE_IDS.goal;
  }

  private setCanvasTitle(title: string): void {
    this.canvasTitle = title;
    window.dispatchEvent(
      new CustomEvent('canvasTitleChanged', { detail: { title } })
    );
  }
}
