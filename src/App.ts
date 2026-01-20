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
import { CanvasRelationsApiService } from './majom-wrapper/data-access/canvas-relations-api-service.ts';
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
import { ElementStatus } from './elements/ElementStatus.ts';
import { CanvasPositionDTO } from './majom-wrapper/data-access/canvas-position-dto.ts';
import { notify } from './core/services/NotificationService.ts';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

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
  private autosaveTimer: number | null = null;
  private autosaveInFlight = false;

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
      new CanvasApiService(http),
      new CanvasRelationsApiService(http)
    );
    // Створюємо компонент для авторизації
    const appContainer = document.getElementById('app') || document.body;
    this.authComponent = new AuthComponent(appContainer, this.authService);
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(this.canvasManager, this.scene);
    this.uiManager.mountAll(document.body);

    this.canvasDataService.elementUpdateStatusChanges.subscribe((status) => {
      window.dispatchEvent(
        new CustomEvent('elementAutosaveStatus', { detail: status })
      );
    });

    // Register commands from config
    getCommandConfigs(this.scene, this.canvasManager).forEach((cmd) => {
      commandManager.register(cmd.name, cmd.handler);
      cmd.keys.forEach((k) => commandManager.bindShortcut(cmd.name, k));
    });

    window.addEventListener('refreshCanvasData', () =>
      this.loadCanvasFromApi()
    );
    window.addEventListener('saveCanvasLayout', () => {
      const tokenAtStart = historyService.getStateToken();
      this.saveCanvasLayout(true).subscribe({
        next: (saved) => {
          if (saved && historyService.isTokenCurrent(tokenAtStart)) {
            historyService.markSaved(tokenAtStart);
          }
        },
        error: (err) => {
          console.error('Failed to save layout', err);
        },
      });
    });
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
          this.refreshCanvasList(canvas.id);
        },
        error: (err) => {
          console.error('Failed to update canvas title', err);
          notify('Failed to update canvas title', 'error');
          this.setCanvasTitle(previousTitle);
        },
      });
    });
    window.addEventListener('canvasSelected', (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string;
        name?: string;
      }>;
      const id = customEvent.detail?.id;
      if (!id) return;
      if (!this.authService.isLoggedIn()) {
        window.dispatchEvent(new CustomEvent('showLoginModal'));
        return;
      }
      const name = customEvent.detail?.name || 'New canvas';
      this.canvasDataService.loadCanvasDetails(id).subscribe({
        next: (canvas) => {
          this.setCanvasTitle(canvas.name);
          this.loadActiveCanvasElements();
          this.refreshCanvasList(canvas.id);
        },
        error: (err) => {
          console.error('Failed to load canvas details', err);
          this.canvasDataService.setActiveCanvas({ id, name });
          this.setCanvasTitle(name);
          this.loadActiveCanvasElements();
          this.refreshCanvasList(id);
        },
      });
    });
    window.addEventListener('canvasCreateRequested', () => {
      if (!this.authService.isLoggedIn()) {
        window.dispatchEvent(new CustomEvent('showLoginModal'));
        return;
      }
      this.canvasDataService.createCanvas('New canvas').subscribe({
        next: (canvas) => {
          this.setCanvasTitle(canvas.name);
          this.refreshCanvasList(canvas.id);
          this.loadActiveCanvasElements();
        },
        error: (err) => {
          console.error('Failed to create canvas', err);
          notify('Failed to create canvas', 'error');
        },
      });
    });

    window.addEventListener('elementDetailsEdited', (event: Event) => {
      const customEvent = event as CustomEvent<{
        element?: TaskElement | StoryElement | GoalElement;
        patch?: Partial<{
          title: string;
          description: string;
          status: ElementStatus;
          priority: 'low' | 'medium' | 'high';
        }>;
      }>;
      const element = customEvent.detail?.element;
      const patch = customEvent.detail?.patch;
      if (!element || !patch) return;
      if (!this.authService.isLoggedIn()) {
        return;
      }
      this.canvasDataService.queueElementUpdate(element, patch);
    });

    window.addEventListener('elementDeleteRequested', (event: Event) => {
      const customEvent = event as CustomEvent<{
        element?: TaskElement | StoryElement | GoalElement;
      }>;
      const element = customEvent.detail?.element;
      if (!element) return;
      if (!this.authService.isLoggedIn()) {
        window.dispatchEvent(new CustomEvent('showLoginModal'));
        return;
      }
      this.scene.removeElements([element]);
      this.canvasDataService.deleteElement(element).subscribe({
        error: (err) => {
          console.error('Failed to delete element', err);
          notify('Failed to delete element', 'error');
          this.scene.addElement(element);
        },
      });
    });

    window.addEventListener('taskStoryLinkChanged', (event: Event) => {
      const customEvent = event as CustomEvent<{
        task?: TaskElement;
        story?: StoryElement | null;
      }>;
      const task = customEvent.detail?.task;
      const story = customEvent.detail?.story ?? null;
      if (!task) return;
      if (!this.authService.isLoggedIn()) {
        return;
      }
      this.canvasDataService.updateTaskStoryLink(task, story).subscribe({
        error: (err) => {
          console.error('Failed to update task story link', err);
          notify('Failed to update task link', 'error');
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
    this.startAutosave();
    // AuthComponent does not have an init method, initialization happens in constructor
  }

  private loadCanvasFromApi(): void {
    if (!this.authService.isLoggedIn()) {
      this.scene.clear();
      this.setCanvasTitle('New canvas');
      this.refreshCanvasList(null);
      return;
    }
    this.canvasDataService.clearElementCache();
    this.canvasDataService.ensureCanvas().subscribe({
      next: (canvas) => {
        this.canvasDataService.loadCanvasDetails(canvas.id).subscribe({
          next: (details) => {
            this.setCanvasTitle(details.name);
            this.refreshCanvasList(details.id);
            this.loadActiveCanvasElements();
          },
          error: (err) => {
            console.error('Failed to load canvas details', err);
            this.canvasDataService.setActiveCanvas(canvas);
            this.setCanvasTitle(canvas.name);
            this.refreshCanvasList(canvas.id);
            this.loadActiveCanvasElements();
          },
        });
      },
      error: (err) => {
        console.error('Failed to ensure canvas', err);
        notify('Failed to load canvas', 'error');
      },
    });
  }

  private saveCanvasLayout(
    showNotifications: boolean = true
  ): Observable<boolean> {
    if (!this.authService.isLoggedIn()) {
      if (showNotifications) {
        window.dispatchEvent(new CustomEvent('showLoginModal'));
      }
      return of(false);
    }
    return this.canvasDataService.loadContentTypeMap().pipe(
      catchError((err) => {
        console.error('Failed to load content types', err);
        const fallbackMap = this.getFallbackContentTypeMap();
        if (Object.keys(fallbackMap).length === 0) {
          if (showNotifications) {
            notify('Missing content type mapping', 'error');
          }
          return throwError(() => err);
        }
        return of(fallbackMap);
      }),
      switchMap((contentTypeMap) =>
        this.saveLayoutWithContentTypes(contentTypeMap, showNotifications)
      )
    );
  }

  private saveLayoutWithContentTypes(
    contentTypeMap: Record<string, number>,
    showNotifications: boolean
  ): Observable<boolean> {
    const elements = this.scene
      .getElements()
      .filter(isPlanningElement) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    return this.canvasDataService.ensureElementsPersisted(elements).pipe(
      switchMap(() =>
        this.saveLayoutPositions(elements, contentTypeMap, showNotifications)
      ),
      catchError((err) => {
        console.error('Failed to create elements', err);
        if (showNotifications) {
          notify('Failed to create elements', 'error');
        }
        return throwError(() => err);
      })
    );
  }

  private saveLayoutPositions(
    elements: Array<TaskElement | StoryElement | GoalElement>,
    contentTypeMap: Record<string, number>,
    showNotifications: boolean
  ): Observable<boolean> {
    const positions: CanvasPositionDTO[] = [];
    const missingTypes = new Set<string>();
    const missingIds: string[] = [];

    elements.forEach((el) => {
      const contentType = this.getContentTypeId(contentTypeMap, el);
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
      const objectUuid = el.uuid;
      if (!objectUuid) {
        missingIds.push(String((el as any).id));
        return;
      }
      const meta =
        el instanceof StoryElement
          ? { width: el.width, height: el.height }
          : undefined;
      positions.push({
        content_type: contentType,
        object_uuid: objectUuid,
        x: el.x,
        y: el.y,
        meta,
      });
    });

    if (missingTypes.size > 0) {
      if (showNotifications) {
        notify(
          `Missing content type IDs for: ${Array.from(missingTypes).join(', ')}`,
          'error'
        );
      }
      return of(false);
    }
    if (missingIds.length > 0) {
      if (showNotifications) {
        notify(
          'Some elements have no backend IDs; cannot save layout.',
          'error'
        );
      }
      return of(false);
    }
    const removedPositionIds =
      this.canvasDataService.getRemovedPositionIds(elements);
    const needsPositionRefresh =
      this.canvasDataService.needsPositionRefresh(elements);
    const hasRelationChanges =
      this.canvasDataService.hasRelationChanges(
        this.scene.getConnections(),
        elements
      );
    if (
      positions.length === 0 &&
      removedPositionIds.length === 0 &&
      !hasRelationChanges
    ) {
      if (showNotifications) {
        notify('No elements to save.', 'info');
      }
      return of(false);
    }

    const uniquePositions = this.dedupeLayoutPositions(positions);
    const save$ =
      uniquePositions.length > 0
        ? this.canvasDataService.updateLayoutBatch(uniquePositions)
        : of(undefined);
    return save$.pipe(
      switchMap(() =>
        this.canvasDataService.deletePositions(removedPositionIds)
      ),
      switchMap(() => {
        if (!needsPositionRefresh) return of(undefined);
        return this.canvasDataService.refreshPositions().pipe(
          catchError((err) => {
            console.error('Failed to refresh positions', err);
            return of(undefined);
          })
        );
      }),
      switchMap(() =>
        this.canvasDataService
          .updateCanvasRelations(this.scene.getConnections(), elements)
          .pipe(
            catchError((err) => {
              console.error('Failed to save relations', err);
              if (showNotifications) {
                notify('Failed to save relations', 'error');
              }
              return throwError(() => err);
            })
          )
      ),
      map(() => {
        if (showNotifications) {
          notify('Layout saved', 'success');
        }
        return true;
      }),
      catchError((err) => {
        console.error('Failed to save layout', err);
        if (showNotifications) {
          notify('Failed to save layout', 'error');
        }
        return throwError(() => err);
      })
    );
  }

  private dedupeLayoutPositions(
    positions: CanvasPositionDTO[]
  ): CanvasPositionDTO[] {
    const map = new Map<string, CanvasPositionDTO>();
    positions.forEach((pos) => {
      const ref =
        pos.object_uuid ??
        (Number.isFinite(pos.object_id) ? `id:${pos.object_id}` : 'na');
      const key = `${pos.content_type ?? 'na'}:${ref}`;
      map.set(key, pos);
    });
    return Array.from(map.values());
  }

  private startAutosave(): void {
    if (this.autosaveTimer) return;
    this.autosaveTimer = window.setInterval(() => {
      this.runAutosaveTick();
    }, 5000);
  }

  private runAutosaveTick(): void {
    if (!this.authService.isLoggedIn()) return;
    if (this.autosaveInFlight) return;
    if (!historyService.hasUnsavedChanges()) return;
    const tokenAtStart = historyService.getStateToken();
    this.autosaveInFlight = true;
    this.saveCanvasLayout(false)
      .pipe(
        finalize(() => {
          this.autosaveInFlight = false;
        })
      )
      .subscribe({
        next: (saved) => {
          if (saved && historyService.isTokenCurrent(tokenAtStart)) {
            historyService.markSaved(tokenAtStart);
          }
        },
        error: (err) => {
          console.error('Autosave failed', err);
        },
      });
  }

  private loadActiveCanvasElements(): void {
    this.canvasDataService.loadElements().subscribe({
      next: (elements) => {
        this.scene.clear();
        elements.forEach((el) => this.scene.addElement(el));
        this.loadActiveCanvasRelations();
      },
      error: (err) => {
        console.error('Failed to load canvas data', err);
        notify('Failed to load canvas data', 'error');
      },
    });
  }

  private loadActiveCanvasRelations(): void {
    this.canvasDataService.loadRelations().subscribe({
      next: (connections) => {
        connections.forEach((conn) => this.scene.addElement(conn));
      },
      error: (err) => {
        console.error('Failed to load canvas relations', err);
      },
    });
  }

  private refreshCanvasList(activeId?: string | null): void {
    if (!this.authService.isLoggedIn()) {
      this.emitCanvasList([], null);
      return;
    }
    this.canvasDataService.loadCanvases().subscribe({
      next: (canvases) => {
        const selectedId =
          activeId || this.canvasDataService.getActiveCanvasId();
        this.emitCanvasList(canvases, selectedId ?? null);
      },
      error: (err) => {
        console.error('Failed to load canvases', err);
      },
    });
  }

  private emitCanvasList(
    canvases: Array<{ id: string; name: string }>,
    activeId: string | null
  ): void {
    window.dispatchEvent(
      new CustomEvent('canvasListUpdated', {
        detail: { canvases, activeId },
      })
    );
  }

  private getContentTypeId(
    contentTypeMap: Record<string, number>,
    element: TaskElement | StoryElement | GoalElement
  ): number | null {
    if (element instanceof TaskElement) {
      return contentTypeMap.task ?? CONTENT_TYPE_IDS.task ?? null;
    }
    if (element instanceof StoryElement) {
      return contentTypeMap.story ?? CONTENT_TYPE_IDS.story ?? null;
    }
    return contentTypeMap.goal ?? CONTENT_TYPE_IDS.goal ?? null;
  }

  private getFallbackContentTypeMap(): Record<string, number> {
    const map: Record<string, number> = {};
    if (typeof CONTENT_TYPE_IDS.task === 'number') {
      map.task = CONTENT_TYPE_IDS.task;
    }
    if (typeof CONTENT_TYPE_IDS.story === 'number') {
      map.story = CONTENT_TYPE_IDS.story;
    }
    if (typeof CONTENT_TYPE_IDS.goal === 'number') {
      map.goal = CONTENT_TYPE_IDS.goal;
    }
    return map;
  }

  private setCanvasTitle(title: string): void {
    this.canvasTitle = title;
    window.dispatchEvent(
      new CustomEvent('canvasTitleChanged', { detail: { title } })
    );
  }
}
