import { CanvasManager } from './core/managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';
import {
  AuthService,
  HttpInterceptorClient,
  TasksApiService,
  StoriesApiService,
  GoalsApiService,
  CanvasApiService,
  CanvasRelationsApiService,
  CanvasDataService,
  type CanvasPositionWriteDTO,
  type CanvasElementsLoadOptions,
} from '../../majom-wrapper/index.ts';
import { UIManager } from './ui/UIManager.ts';
import type { IViewState } from './core/interfaces/interfaces.ts';
import { commandManager } from './core/managers/CommandManager.ts';
import { historyService } from './core/services/HistoryService.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import { environment } from '../../config/environment.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { StoryElement } from './elements/StoryElement.ts';
import { GoalElement } from './elements/GoalElement.ts';
import { isPlanningElement } from './elements/utils/typeGuards.ts';
import { ElementStatus } from './elements/ElementStatus.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from './core/interfaces/connection.ts';
import { notify } from './core/services/NotificationService.ts';
import { CanvasClientStorage } from './core/services/CanvasClientStorage.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  isCanvasLinkLifecycleDetail,
} from './core/canvasLinkLifecycle.ts';
import {
  emitCanvasSaveFinished,
  emitCanvasSaveStarted,
  type CanvasSaveSource,
} from './core/canvasSaveLifecycle.ts';
import { confirmReplaceStoryGoalModal } from './ui/components/ConfirmReplaceStoryGoalModal.ts';
import { confirmDeleteCanvasModal } from './ui/components/ConfirmDeleteCanvasModal.ts';
import { authFlowService } from './ui/auth/authFlowService.ts';
import { firstValueFrom, Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

export class CanvasApp {
  private readonly dataProvider: IDataProvider;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;
  private readonly authService: AuthService;
  private readonly uiManager: UIManager;
  private readonly canvasDataService: CanvasDataService;
  private canvasTitle: string = 'New canvas';
  private autosaveTimer: number | null = null;
  private autosaveInFlight = false;
  private pendingLinkDecisions = 0;
  private isHydratingCanvas = false;
  private isElementsHydrating = false;
  private isRelationsHydrating = false;
  private activeCanvasElementsSubscription: Subscription | null = null;
  private activeCanvasRelationsSubscription: Subscription | null = null;
  private viewChangesSubscription: Subscription | null = null;
  private sceneChangesSubscription: Subscription | null = null;
  private elementUpdateStatusSubscription: Subscription | null = null;
  private destroyed = false;

  private readonly refreshCanvasDataHandler = (): void =>
    this.loadCanvasFromApi();
  private readonly saveCanvasLayoutHandler = (): void =>
    this.handleSaveCanvasLayoutRequest();
  private readonly canvasTitleEditedHandler = (event: Event): void =>
    this.handleCanvasTitleEdited(event);
  private readonly canvasSelectedHandler = (event: Event): void =>
    this.handleCanvasSelected(event);
  private readonly canvasCreateRequestedHandler = (): void =>
    this.handleCanvasCreateRequested();
  private readonly canvasDeleteRequestedHandler = (): void => {
    void this.handleCanvasDeleteRequested();
  };
  private readonly elementDetailsEditedHandler = (event: Event): void =>
    this.handleElementDetailsEdited(event);
  private readonly canvasPositionsDirtyHandler = (event: Event): void =>
    this.handleCanvasPositionsDirty(event);
  private readonly elementDeleteRequestedHandler = (event: Event): void =>
    this.handleElementDeleteRequested(event);
  private readonly canvasLinkLifecycleHandler = (event: Event): void =>
    this.handleCanvasLinkLifecycle(event);

  constructor(dataProvider: IDataProvider, canvasElement?: HTMLCanvasElement) {
    this.dataProvider = dataProvider;
    const resolvedCanvas = canvasElement ?? document.getElementById('myCanvas');
    if (!(resolvedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = resolvedCanvas;

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
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(
      this.canvasManager,
      this.scene,
      this.authService
    );
    this.uiManager.mountAll(document.body);

    this.elementUpdateStatusSubscription =
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
    this.registerWindowEvents();
  }

  private registerWindowEvents(): void {
    window.addEventListener('refreshCanvasData', this.refreshCanvasDataHandler);
    window.addEventListener('saveCanvasLayout', this.saveCanvasLayoutHandler);
    window.addEventListener('canvasTitleEdited', this.canvasTitleEditedHandler);
    window.addEventListener('canvasSelected', this.canvasSelectedHandler);
    window.addEventListener(
      'canvasCreateRequested',
      this.canvasCreateRequestedHandler
    );
    window.addEventListener(
      'canvasDeleteRequested',
      this.canvasDeleteRequestedHandler
    );
    window.addEventListener(
      'elementDetailsEdited',
      this.elementDetailsEditedHandler
    );
    window.addEventListener(
      'canvasPositionsDirty',
      this.canvasPositionsDirtyHandler
    );
    window.addEventListener(
      'elementDeleteRequested',
      this.elementDeleteRequestedHandler
    );
    window.addEventListener(
      CANVAS_LINK_LIFECYCLE_EVENT,
      this.canvasLinkLifecycleHandler
    );
  }

  private unregisterWindowEvents(): void {
    window.removeEventListener(
      'refreshCanvasData',
      this.refreshCanvasDataHandler
    );
    window.removeEventListener('saveCanvasLayout', this.saveCanvasLayoutHandler);
    window.removeEventListener(
      'canvasTitleEdited',
      this.canvasTitleEditedHandler
    );
    window.removeEventListener('canvasSelected', this.canvasSelectedHandler);
    window.removeEventListener(
      'canvasCreateRequested',
      this.canvasCreateRequestedHandler
    );
    window.removeEventListener(
      'canvasDeleteRequested',
      this.canvasDeleteRequestedHandler
    );
    window.removeEventListener(
      'elementDetailsEdited',
      this.elementDetailsEditedHandler
    );
    window.removeEventListener(
      'canvasPositionsDirty',
      this.canvasPositionsDirtyHandler
    );
    window.removeEventListener(
      'elementDeleteRequested',
      this.elementDeleteRequestedHandler
    );
    window.removeEventListener(
      CANVAS_LINK_LIFECYCLE_EVENT,
      this.canvasLinkLifecycleHandler
    );
  }

  private handleSaveCanvasLayoutRequest(): void {
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
  }

  private handleCanvasTitleEdited(event: Event): void {
    const customEvent = event as CustomEvent<{ title?: string }>;
    const title = customEvent.detail?.title;
    if (typeof title !== 'string') return;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
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
  }

  private handleCanvasSelected(event: Event): void {
    const customEvent = event as CustomEvent<{
      id?: string;
      name?: string;
    }>;
    const id = customEvent.detail?.id;
    if (!id) return;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    const name = customEvent.detail?.name || 'New canvas';
    this.canvasDataService.loadCanvasDetails(id).subscribe({
      next: (canvas) => {
        this.setCanvasTitle(canvas.name);
        this.restoreCanvasViewState(canvas.id).finally(() => {
          this.loadActiveCanvasElements();
          this.refreshCanvasList(canvas.id);
        });
      },
      error: (err) => {
        console.error('Failed to load canvas details', err);
        this.canvasDataService.setActiveCanvas({ id, name });
        this.setCanvasTitle(name);
        this.restoreCanvasViewState(id).finally(() => {
          this.loadActiveCanvasElements();
          this.refreshCanvasList(id);
        });
      },
    });
  }

  private handleCanvasCreateRequested(): void {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    this.canvasDataService.createCanvas('New canvas').subscribe({
      next: (canvas) => {
        this.setCanvasTitle(canvas.name);
        this.restoreCanvasViewState(canvas.id).finally(() => {
          this.refreshCanvasList(canvas.id);
          this.loadActiveCanvasElements();
        });
      },
      error: (err) => {
        console.error('Failed to create canvas', err);
        notify('Failed to create canvas', 'error');
      },
    });
  }

  private handleElementDetailsEdited(event: Event): void {
    const customEvent = event as CustomEvent<{
      element?: TaskElement | StoryElement | GoalElement;
      patch?: Partial<{
        title: string;
        description: string;
        status: ElementStatus;
        priority: 'low' | 'medium' | 'high';
        dueDate: Date | null;
      }>;
    }>;
    const element = customEvent.detail?.element;
    const patch = customEvent.detail?.patch;
    if (!element || !patch) return;
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.canvasDataService.queueElementUpdate(element, patch);
  }

  private handleCanvasPositionsDirty(event: Event): void {
    const customEvent = event as CustomEvent<{
      elements?: Array<TaskElement | StoryElement | GoalElement>;
    }>;
    const elements = (customEvent.detail?.elements ?? []).filter(
      (el): el is TaskElement | StoryElement | GoalElement =>
        el instanceof TaskElement ||
        el instanceof StoryElement ||
        el instanceof GoalElement
    );
    if (elements.length === 0) return;
    this.canvasDataService.markPositionsDirty(elements);
  }

  private handleElementDeleteRequested(event: Event): void {
    const customEvent = event as CustomEvent<{
      element?: TaskElement | StoryElement | GoalElement;
    }>;
    const element = customEvent.detail?.element;
    if (!element) return;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
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
  }

  private handleCanvasLinkLifecycle(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasLinkLifecycleDetail(customEvent.detail)) return;
    const detail = customEvent.detail;
    if (!this.authService.isLoggedIn()) {
      return;
    }
    if (detail.kind === 'task-story') {
      this.canvasDataService.updateTaskStoryLink(detail.task, detail.story).subscribe({
        error: (err) => {
          console.error('Failed to update task story link', err);
          notify('Failed to update task link', 'error');
        },
      });
      return;
    }
    void this.handleStoryGoalLinkSet(detail.story, detail.goal);
  }

  public async init(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Cannot init destroyed App instance.');
    }
    this.canvasManager.init();
    // Restore last view state (scroll & zoom) via centralized setter
    const view: IViewState = await this.dataProvider.loadViewState();
    const panZoom = this.canvasManager.getPanZoomManager();
    panZoom.setViewState(view);
    if (this.authService.isLoggedIn()) {
      this.loadCanvasFromApi();
    } else {
      await this.diagramRepository.loadDiagram(this.scene);
    }
    // Draw after restore and notify listeners (including ZoomIndicator)
    this.canvasManager.draw();
    // Auto-save view state on any change
    this.viewChangesSubscription = panZoom.viewChanges.subscribe((state) => {
      const activeCanvasId = this.canvasDataService.getActiveCanvasId();
      void this.dataProvider.saveViewState(state, activeCanvasId);
    });
    // Auto-save diagram on content change
    this.sceneChangesSubscription = this.scene.changes.subscribe(() => {
      if (this.isHydratingCanvas) return;
      void this.diagramRepository.saveDiagram(this.scene);
    });
    this.startAutosave();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.unregisterWindowEvents();
    if (this.autosaveTimer !== null) {
      window.clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    this.activeCanvasElementsSubscription?.unsubscribe();
    this.activeCanvasElementsSubscription = null;
    this.activeCanvasRelationsSubscription?.unsubscribe();
    this.activeCanvasRelationsSubscription = null;
    this.viewChangesSubscription?.unsubscribe();
    this.viewChangesSubscription = null;
    this.sceneChangesSubscription?.unsubscribe();
    this.sceneChangesSubscription = null;
    this.elementUpdateStatusSubscription?.unsubscribe();
    this.elementUpdateStatusSubscription = null;
    this.uiManager.unmountAll();
    this.canvasManager.destroy();
  }

  private loadCanvasFromApi(): void {
    if (!this.authService.isLoggedIn()) {
      this.resetHydrationState();
      this.canvasManager.setLoadPhase('idle');
      this.scene.clear();
      this.canvasManager.clearLoadingPlaceholders();
      this.setCanvasTitle('New canvas');
      this.refreshCanvasList(null);
      return;
    }
    this.canvasDataService.clearElementCache();
    // TODO(snapshot-cache): once snapshot endpoint is available,
    // replace bootstrap + elements + relations chain with single snapshot hydration.
    this.canvasDataService.bootstrapCanvas().subscribe({
      next: ({ canvases, activeCanvas }) => {
        this.setCanvasTitle(activeCanvas.name);
        this.emitCanvasList(canvases, activeCanvas.id);
        this.restoreCanvasViewState(activeCanvas.id).finally(() => {
          this.loadActiveCanvasElements();
        });
      },
      error: (err) => {
        console.error('Failed to bootstrap canvas', err);
        notify('Failed to load canvas', 'error');
      },
    });
  }

  private saveCanvasLayout(
    showNotifications: boolean = true
  ): Observable<boolean> {
    if (this.isLinkDecisionPending()) {
      if (showNotifications) {
        notify('Please finish relation confirmation first.', 'info');
      }
      return of(false);
    }
    if (!this.authService.isLoggedIn()) {
      if (showNotifications) {
        authFlowService.requestLogin('save');
      }
      return of(false);
    }
    const elements = this.scene
      .getElements()
      .filter(isPlanningElement) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    const saveSource: CanvasSaveSource = showNotifications
      ? 'manual'
      : 'autosave';
    emitCanvasSaveStarted(saveSource);
    return this.canvasDataService.ensureElementsPersisted(elements).pipe(
      switchMap(() => this.saveLayoutPositions(elements, showNotifications)),
      catchError((err) => {
        console.error('Failed to create elements', err);
        if (showNotifications) {
          notify('Failed to create elements', 'error');
        }
        return throwError(() => err);
      }),
      finalize(() => emitCanvasSaveFinished(saveSource))
    );
  }
  private saveLayoutPositions(
    elements: Array<TaskElement | StoryElement | GoalElement>,
    showNotifications: boolean
  ): Observable<boolean> {
    const positions: CanvasPositionWriteDTO[] = [];
    const missingIds: string[] = [];

    elements.forEach((el) => {
      const elementType =
        el instanceof TaskElement
          ? 'task'
          : el instanceof StoryElement
            ? 'story'
            : 'goal';
      const elementUuid = el.uuid;
      if (!elementUuid) {
        missingIds.push(String((el as any).id));
        return;
      }
      const meta =
        el instanceof StoryElement
          ? {
              width: el.width,
              height: el.height,
              focused: this.scene.isFocused(el),
              highlighted: this.scene.isHighlighted(el),
            }
          : el instanceof GoalElement
            ? {
                goalScale: el.scale,
                focused: this.scene.isFocused(el),
                highlighted: this.scene.isHighlighted(el),
              }
            : {
                focused: this.scene.isFocused(el),
                highlighted: this.scene.isHighlighted(el),
              };
      positions.push({
        element_type: elementType,
        element_uuid: elementUuid,
        x: el.x,
        y: el.y,
        meta,
      });
    });

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
    const hasRelationChanges = this.canvasDataService.hasRelationChanges(
      this.scene.getConnections(),
      elements
    );
    const uniquePositions = this.dedupeLayoutPositions(positions);
    const changedPositions =
      this.canvasDataService.filterPositionUpdates(uniquePositions);
    const layoutDraftId = 'layout-sync';
    const relationsDraftId = 'relations-sync';
    if (
      changedPositions.length === 0 &&
      removedPositionIds.length === 0 &&
      !hasRelationChanges
    ) {
      if (showNotifications) {
        notify('No changes to save.', 'info');
      }
      return of(false);
    }

    const save$ =
      changedPositions.length > 0
        ? this.canvasDataService.updateLayoutBatch(changedPositions)
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
              this.queueUnsyncedDraft(relationsDraftId, 'relations', {
                relationCount: this.scene.getConnections().length,
                elementCount: elements.length,
              });
              console.error('Failed to save relations', err);
              if (showNotifications) {
                notify('Failed to save relations', 'error');
              }
              return throwError(() => err);
            })
          )
      ),
      map(() => {
        this.removeUnsyncedDraft(layoutDraftId);
        this.removeUnsyncedDraft(relationsDraftId);
        if (showNotifications) {
          notify('Layout saved', 'success');
        }
        return true;
      }),
      catchError((err) => {
        this.queueUnsyncedDraft(layoutDraftId, 'layout', {
          changedPositions,
          removedPositionIds,
          relationCount: this.scene.getConnections().length,
        });
        console.error('Failed to save layout', err);
        if (showNotifications) {
          notify('Failed to save layout', 'error');
        }
        return throwError(() => err);
      })
    );
  }
  private dedupeLayoutPositions(
    positions: CanvasPositionWriteDTO[]
  ): CanvasPositionWriteDTO[] {
    const map = new Map<string, CanvasPositionWriteDTO>();
    positions.forEach((pos) => {
      const ref = pos.element_uuid ?? 'na';
      const key = `${pos.element_type ?? 'na'}:${ref}`;
      map.set(key, pos);
    });
    return Array.from(map.values());
  }

  private async restoreCanvasViewState(
    canvasId: string | null | undefined
  ): Promise<void> {
    try {
      const panZoom = this.canvasManager.getPanZoomManager();
      const nextView = await this.dataProvider.loadViewState(
        canvasId ?? undefined
      );
      panZoom.setViewState(nextView);
      this.canvasManager.draw();
    } catch (err) {
      console.error('Failed to restore canvas view state', err);
    }
  }

  private queueUnsyncedDraft(
    draftId: string,
    kind: 'layout' | 'relations',
    payload: unknown
  ): void {
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return;
    CanvasClientStorage.upsertUnsyncedDraft(canvasId, {
      id: draftId,
      kind,
      payload,
    });
  }

  private removeUnsyncedDraft(draftId: string): void {
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return;
    CanvasClientStorage.removeUnsyncedDraft(canvasId, draftId);
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
    if (this.isLinkDecisionPending()) return;
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
    this.activeCanvasElementsSubscription?.unsubscribe();
    this.activeCanvasRelationsSubscription?.unsubscribe();
    this.setRelationsHydrating(false);
    this.setElementsHydrating(true);
    this.canvasManager.setLoadPhase('loading');
    this.scene.clear();
    this.canvasManager.clearLoadingPlaceholders();
    const loadOptions = this.buildCanvasLoadOptions();
    this.activeCanvasElementsSubscription =
      this.canvasDataService.loadElementsProgressive(loadOptions).subscribe({
        next: (state) => {
          if (state.phase === 'layout-ready') {
            this.loadActiveCanvasRelations();
            this.canvasManager.setLoadingPlaceholders(
              state.placeholders,
              state.focusedElementUuid
            );
            this.canvasManager.setLoadPhase('layout-ready');
            return;
          }
          if (state.phase === 'elements-partial-ready') {
            this.replacePlanningElements(state.elements);
            this.applyFocusedElement(state.elements, state.focusedElementUuid);
            this.applyHighlightedElements(
              state.elements,
              this.canvasDataService.getHighlightedElementUuids()
            );
            this.canvasManager.setLoadingPlaceholders(
              state.placeholders,
              state.focusedElementUuid
            );
            this.canvasManager.setLoadPhase('elements-partial-ready');
            return;
          }
          this.canvasManager.clearLoadingPlaceholders();
          this.replacePlanningElements(state.elements);
          this.applyFocusedElement(state.elements, state.focusedElementUuid);
          this.applyHighlightedElements(
            state.elements,
            this.canvasDataService.getHighlightedElementUuids()
          );
          this.canvasManager.setLoadPhase('elements-ready');
          this.setElementsHydrating(false);
        },
        error: (err) => {
          this.canvasManager.clearLoadingPlaceholders();
          this.canvasManager.setLoadPhase('idle');
          this.setElementsHydrating(false);
          this.setRelationsHydrating(false);
          console.error('Failed to load canvas data', err);
          notify('Failed to load canvas data', 'error');
        },
      });
  }

  private applyFocusedElement(
    elements: Array<TaskElement | StoryElement | GoalElement>,
    focusedUuid: string | null
  ): void {
    const focusedElement =
      focusedUuid !== null
        ? elements.find(
            (element) =>
              element.uuid === focusedUuid || element.id === focusedUuid
          ) ?? null
        : null;
    this.scene.setFocusedElement(focusedElement);
  }

  private applyHighlightedElements(
    elements: Array<TaskElement | StoryElement | GoalElement>,
    highlightedUuids: string[]
  ): void {
    if (highlightedUuids.length === 0) {
      this.scene.clearHighlightedElements();
      return;
    }
    const highlightedIds = highlightedUuids
      .map((highlightedUuid) =>
        elements.find(
          (element) =>
            element.uuid === highlightedUuid || element.id === highlightedUuid
        )
      )
      .filter((element): element is TaskElement | StoryElement | GoalElement =>
        Boolean(element)
      )
      .map((element) => element.id);
    this.scene.setHighlightedElementIds(highlightedIds);
  }

  private replacePlanningElements(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): void {
    this.scene.replaceElements(isPlanningElement, elements);
  }

  private buildCanvasLoadOptions(): CanvasElementsLoadOptions {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const scale = panZoom.scale || 1;
    const minX = panZoom.scrollX / scale;
    const minY = panZoom.scrollY / scale;
    const maxX = (panZoom.scrollX + canvas.width) / scale;
    const maxY = (panZoom.scrollY + canvas.height) / scale;
    return {
      viewportBounds: { minX, minY, maxX, maxY },
      viewportFirstThreshold: 250,
    };
  }

  private loadActiveCanvasRelations(): void {
    this.activeCanvasRelationsSubscription?.unsubscribe();
    this.setRelationsHydrating(true);
    this.activeCanvasRelationsSubscription =
      this.canvasDataService.loadRelations().subscribe({
        next: (connections) => {
          connections.forEach((conn) => this.scene.addElement(conn));
        },
        error: (err) => {
          this.setRelationsHydrating(false);
          console.error('Failed to load canvas relations', err);
        },
        complete: () => {
          this.setRelationsHydrating(false);
        },
      });
  }

  private setElementsHydrating(value: boolean): void {
    this.isElementsHydrating = value;
    this.syncHydrationState();
  }

  private setRelationsHydrating(value: boolean): void {
    this.isRelationsHydrating = value;
    this.syncHydrationState();
  }

  private resetHydrationState(): void {
    this.isElementsHydrating = false;
    this.isRelationsHydrating = false;
    this.syncHydrationState();
  }

  private syncHydrationState(): void {
    this.isHydratingCanvas =
      this.isElementsHydrating || this.isRelationsHydrating;
  }

  private async handleCanvasDeleteRequested(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }

    const activeCanvasId = this.canvasDataService.getActiveCanvasId();
    if (!activeCanvasId) {
      notify('No active canvas selected.', 'info');
      return;
    }

    try {
      const canvases = await firstValueFrom(this.canvasDataService.loadCanvases());
      const activeCanvas =
        canvases.find((canvas) => canvas.id === activeCanvasId) ?? null;
      if (!activeCanvas) {
        notify('Active canvas was not found.', 'error');
        return;
      }

      const confirmed = await confirmDeleteCanvasModal({
        canvasTitle: activeCanvas.name,
        isLastCanvas: canvases.length <= 1,
      });
      if (!confirmed) {
        return;
      }

      await firstValueFrom(this.canvasDataService.deleteCanvas(activeCanvas.id));
      notify('Canvas deleted.', 'success');

      const remainingCanvases = canvases.filter(
        (canvas) => canvas.id !== activeCanvas.id
      );
      if (remainingCanvases.length === 0) {
        const createdCanvas = await firstValueFrom(
          this.canvasDataService.createCanvas('New canvas')
        );
        this.setCanvasTitle(createdCanvas.name);
        await this.restoreCanvasViewState(createdCanvas.id);
        this.refreshCanvasList(createdCanvas.id);
        this.loadActiveCanvasElements();
        return;
      }

      const nextCanvas = remainingCanvases[0];
      try {
        const loadedCanvas = await firstValueFrom(
          this.canvasDataService.loadCanvasDetails(nextCanvas.id)
        );
        this.setCanvasTitle(loadedCanvas.name);
      } catch (err) {
        console.error('Failed to load next canvas details', err);
        this.canvasDataService.setActiveCanvas({
          id: nextCanvas.id,
          name: nextCanvas.name,
        });
        this.setCanvasTitle(nextCanvas.name);
      }

      await this.restoreCanvasViewState(nextCanvas.id);
      this.refreshCanvasList(nextCanvas.id);
      this.loadActiveCanvasElements();
    } catch (err) {
      console.error('Failed to delete canvas', err);
      notify('Failed to delete canvas', 'error');
    }
  }

  private refreshCanvasList(activeId?: string | null): void {
    if (!this.authService.isLoggedIn()) {
      this.emitCanvasList([], null);
      return;
    }
    this.canvasDataService.loadCanvases().subscribe({
      next: (canvases) => {
        const selectedId = activeId || this.canvasDataService.getActiveCanvasId();
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

  private setCanvasTitle(title: string): void {
    this.canvasTitle = title;
    window.dispatchEvent(
      new CustomEvent('canvasTitleChanged', { detail: { title } })
    );
  }

  private async handleStoryGoalLinkSet(
    story: StoryElement,
    goal: GoalElement
  ): Promise<void> {
    this.beginLinkDecision();
    // TODO(relation-policy): extract this branch into a dedicated policy orchestrator.
    const storyRef = this.getLinkElementRef(story);
    const goalRef = this.getLinkElementRef(goal);
    const currentGoalId = Number.isFinite(story.goalBackendId)
      ? Number(story.goalBackendId)
      : null;
    const requestedGoalId = this.getLinkElementBackendId(goal);
    const shouldConfirmReplace =
      Number.isFinite(currentGoalId) &&
      (requestedGoalId === null || requestedGoalId !== currentGoalId);

    if (shouldConfirmReplace) {
      const confirmed = await confirmReplaceStoryGoalModal({
        storyTitle: story.title,
      });
      if (!confirmed) {
        this.rollbackCreatedStoryGoalRelation(storyRef, goalRef);
        this.endLinkDecision();
        return;
      }
    }

    this.canvasDataService
      .updateStoryGoalLink(story, goal, {
        allowReplace: shouldConfirmReplace,
      })
      .pipe(
        finalize(() => {
          this.endLinkDecision();
        })
      )
      .subscribe({
        next: (result) => {
          if (result.status === 'conflict') {
            this.rollbackCreatedStoryGoalRelation(storyRef, goalRef);
            notify(
              'Story already has another goal. Cannot link to this goal.',
              'error'
            );
            return;
          }
          this.enforceSingleStoryGoalCanvasRelation(storyRef, goalRef);
          this.syncCanvasRelationsNow();
        },
        error: (err) => {
          this.rollbackCreatedStoryGoalRelation(storyRef, goalRef);
          console.error('Failed to update story goal link', err);
          notify('Failed to update story goal link', 'error');
        },
      });
  }

  private beginLinkDecision(): void {
    this.pendingLinkDecisions += 1;
  }

  private endLinkDecision(): void {
    this.pendingLinkDecisions = Math.max(0, this.pendingLinkDecisions - 1);
  }

  private isLinkDecisionPending(): boolean {
    return this.pendingLinkDecisions > 0;
  }

  private syncCanvasRelationsNow(): void {
    if (!this.authService.isLoggedIn()) return;
    const elements = this.scene
      .getElements()
      .filter(isPlanningElement) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    if (
      !this.canvasDataService.hasRelationChanges(
        this.scene.getConnections(),
        elements
      )
    ) {
      return;
    }
    this.canvasDataService
      .updateCanvasRelations(this.scene.getConnections(), elements)
      .subscribe({
        error: (err) => {
          console.error('Failed to sync canvas relations', err);
          notify('Failed to sync canvas relations', 'error');
        },
      });
  }

  private getLinkElementRef(element: {
    id: string;
    uuid?: string;
  }): string {
    return element.uuid ?? element.id;
  }

  private getLinkElementBackendId(element: {
    id: string;
    backendId?: number | null;
  }): number | null {
    if (Number.isFinite(element.backendId)) {
      return Number(element.backendId);
    }
    const legacyId = Number(element.id);
    if (Number.isFinite(legacyId)) return legacyId;
    return null;
  }

  private getStoryGoalConnections(storyRef: string): IConnection[] {
    return this.scene
      .getConnections()
      .filter(
        (conn) =>
          conn.relationType === ConnectionRelationType.ParentChild &&
          conn.toId === storyRef
      );
  }

  private findLatestStoryGoalConnection(
    storyRef: string,
    goalRef: string
  ): IConnection | null {
    const connections = this.scene.getConnections();
    for (let i = connections.length - 1; i >= 0; i -= 1) {
      const conn = connections[i];
      if (conn.relationType !== ConnectionRelationType.ParentChild) continue;
      if (conn.toId !== storyRef) continue;
      if (conn.fromId !== goalRef) continue;
      return conn;
    }
    return null;
  }

  private removeCanvasConnections(connections: IConnection[]): void {
    if (connections.length === 0) return;
    this.scene.removeElements(connections);
  }

  private rollbackCreatedStoryGoalRelation(
    storyRef: string,
    goalRef: string
  ): void {
    const created = this.findLatestStoryGoalConnection(storyRef, goalRef);
    if (!created) return;
    this.removeCanvasConnections([created]);
  }

  private enforceSingleStoryGoalCanvasRelation(
    storyRef: string,
    goalRef: string
  ): void {
    const all = this.getStoryGoalConnections(storyRef);
    if (all.length <= 1) return;

    const keep =
      this.findLatestStoryGoalConnection(storyRef, goalRef) ??
      all[all.length - 1];
    const duplicates = all.filter((conn) => conn !== keep);
    this.removeCanvasConnections(duplicates);
  }
}










