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
import { notify } from './core/services/NotificationService.ts';
import { PlanningElement } from './elements/PlanningElement.ts';

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
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(this.canvasManager, this.scene);
    this.uiManager.mountAll(document.body);
    // Global mouse position for paste fallback (client coords)
    let lastGlobalMouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
      lastGlobalMouse = { x: e.clientX, y: e.clientY };
    });
    // Register global commands and keyboard shortcuts
    commandManager.register('undo', () => {
      console.warn('Undo action not implemented');
    });
    commandManager.bindShortcut('undo', 'ctrl+z');
    commandManager.register('redo', () => {
      console.warn('Redo action not implemented');
    });
    commandManager.bindShortcut('redo', 'ctrl+y');
    // Copy/Paste for Tasks, Stories, Goals (only PlanningElement clones)
    let clipboard: PlanningElement[] = [];
    commandManager.register('copy', () => {
      const selection = this.scene.getSelectedElements()
        .filter((el): el is PlanningElement => el instanceof PlanningElement);
      clipboard = selection.map(el => el.clone() as PlanningElement);
      notify(`Copied ${clipboard.length} items`, 'info');
    });
    commandManager.bindShortcut('copy', 'ctrl+c');
    commandManager.register('paste', () => {
      if (!clipboard.length) return;
      let mouseCoords = this.canvasManager.getLastMouseCoords();
      if (!mouseCoords) {
        const panZoom = this.canvasManager.getPanZoomManager();
        const rect = this.canvasManager.getCanvas().getBoundingClientRect();
        const localX = lastGlobalMouse.x - rect.left;
        const localY = lastGlobalMouse.y - rect.top;
        mouseCoords = {
          x: (localX + panZoom.scrollX) / panZoom.scale,
          y: (localY + panZoom.scrollY) / panZoom.scale,
        };
      }
      this.scene.getElements().forEach(el => el.selected = false);
      clipboard.forEach(orig => {
        const clone = orig.clone() as PlanningElement;
        clone.x = mouseCoords!.x + (orig.x - clipboard[0].x);
        clone.y = mouseCoords!.y + (orig.y - clipboard[0].y);
        clone.selected = true;
        this.scene.addElement(clone);
      });
      this.canvasManager.draw();
      notify(`Pasted ${clipboard.length} items`, 'success');
    });
    commandManager.bindShortcut('paste', 'ctrl+v');
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
    panZoom.viewChanges.subscribe(state => this.dataProvider.saveViewState(state));
    // Auto-save diagram on content change
    this.scene.changes.subscribe(() => this.diagramRepository.saveDiagram(this.scene));
    // AuthComponent does not have an init method, initialization happens in constructor
  }
}
