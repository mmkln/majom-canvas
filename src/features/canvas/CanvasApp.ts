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
  type CanvasElementsLoadOptions,
} from '../../majom-wrapper/index.ts';
import { UIManager } from './ui/UIManager.ts';
import type { IViewState } from './core/interfaces/interfaces.ts';
import { commandManager } from './core/managers/CommandManager.ts';
import { historyService } from './core/services/HistoryService.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import { environment } from '../../config/environment.ts';
import { CanvasCoreBridge } from './core/adapters/CanvasCoreBridge.ts';
import {
  dedupeLayoutPositions,
  mapPlanningElementsToLayoutPositions,
} from './core/adapters/layoutPositionMapper.ts';
import { RelationSyncAdapter } from './core/adapters/RelationSyncAdapter.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { StoryElement } from './elements/StoryElement.ts';
import { GoalElement } from './elements/GoalElement.ts';
import { isPlanningElement } from './elements/utils/typeGuards.ts';
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
  CANVAS_CREATE_REQUESTED_EVENT,
  CANVAS_DELETE_REQUESTED_EVENT,
  CANVAS_FAVORITE_TOGGLED_EVENT,
  CANVAS_GROUP_UPDATED_EVENT,
  CANVAS_RENAME_REQUESTED_EVENT,
  CANVAS_SELECTED_EVENT,
  type CanvasBoardListItem,
  CANVAS_TITLE_EDITED_EVENT,
  emitCanvasFavoriteToggleFailed,
  emitCanvasGroupUpdateFailed,
  emitCanvasListUpdated,
  emitCanvasTitleChanged,
  isCanvasDeleteRequestedDetail,
  isCanvasFavoriteToggledDetail,
  isCanvasGroupUpdatedDetail,
  isCanvasRenameRequestedDetail,
  isCanvasSelectedDetail,
  isCanvasTitleEditedDetail,
} from './core/canvasBoardLifecycle.ts';
import {
  CANVAS_REFRESH_DATA_EVENT,
  CANVAS_SAVE_LAYOUT_REQUESTED_EVENT,
} from './core/canvasDataLifecycle.ts';
import {
  CANVAS_POSITIONS_DIRTY_EVENT,
  isCanvasPositionsDirtyDetail,
} from './core/canvasPositionsLifecycle.ts';
import {
  CANVAS_ELEMENT_DELETE_REQUESTED_EVENT,
  CANVAS_ELEMENT_DETAILS_EDITED_EVENT,
  isCanvasElementDeleteRequestedDetail,
  isCanvasElementDetailsEditedDetail,
} from './core/canvasElementLifecycle.ts';
import {
  emitCanvasSaveFinished,
  emitCanvasSaveStarted,
  type CanvasSaveSource,
} from './core/canvasSaveLifecycle.ts';
import { emitElementAutosaveStatus } from './core/elementAutosaveLifecycle.ts';
import { confirmReplaceStoryGoalModal } from './ui/components/ConfirmReplaceStoryGoalModal.ts';
import { confirmDeleteCanvasModal } from './ui/components/ConfirmDeleteCanvasModal.ts';
import { authFlowService } from './ui/auth/authFlowService.ts';
import { firstValueFrom, Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

type CanvasListUiItem = CanvasBoardListItem;

type CanvasListCacheItem = {
  id: string;
  name: string;
  meta?: Record<string, unknown> | null;
};

type WindowEventBinding = {
  eventName: string;
  handler: EventListener;
};

export class CanvasApp {
  private readonly dataProvider: IDataProvider;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly canvasCoreBridge: CanvasCoreBridge;
  private readonly relationSyncAdapter: RelationSyncAdapter;
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
  private readonly canvasListCache = new Map<string, CanvasListCacheItem>();

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
  private readonly canvasFavoriteToggledHandler = (event: Event): void =>
    this.handleCanvasFavoriteToggled(event);
  private readonly canvasGroupUpdatedHandler = (event: Event): void =>
    this.handleCanvasGroupUpdated(event);
  private readonly canvasRenameRequestedHandler = (event: Event): void =>
    this.handleCanvasRenameRequested(event);
  private readonly canvasDeleteRequestedHandler = (event: Event): void => {
    void this.handleCanvasDeleteRequested(event);
  };
  private readonly elementDetailsEditedHandler = (event: Event): void =>
    this.handleElementDetailsEdited(event);
  private readonly canvasPositionsDirtyHandler = (event: Event): void =>
    this.handleCanvasPositionsDirty(event);
  private readonly elementDeleteRequestedHandler = (event: Event): void =>
    this.handleElementDeleteRequested(event);
  private readonly canvasLinkLifecycleHandler = (event: Event): void =>
    this.handleCanvasLinkLifecycle(event);
  private readonly windowEventBindings: WindowEventBinding[] = [
    {
      eventName: CANVAS_REFRESH_DATA_EVENT,
      handler: this.refreshCanvasDataHandler as EventListener,
    },
    {
      eventName: CANVAS_SAVE_LAYOUT_REQUESTED_EVENT,
      handler: this.saveCanvasLayoutHandler as EventListener,
    },
    {
      eventName: CANVAS_TITLE_EDITED_EVENT,
      handler: this.canvasTitleEditedHandler as EventListener,
    },
    {
      eventName: CANVAS_SELECTED_EVENT,
      handler: this.canvasSelectedHandler as EventListener,
    },
    {
      eventName: CANVAS_CREATE_REQUESTED_EVENT,
      handler: this.canvasCreateRequestedHandler as EventListener,
    },
    {
      eventName: CANVAS_FAVORITE_TOGGLED_EVENT,
      handler: this.canvasFavoriteToggledHandler as EventListener,
    },
    {
      eventName: CANVAS_GROUP_UPDATED_EVENT,
      handler: this.canvasGroupUpdatedHandler as EventListener,
    },
    {
      eventName: CANVAS_RENAME_REQUESTED_EVENT,
      handler: this.canvasRenameRequestedHandler as EventListener,
    },
    {
      eventName: CANVAS_DELETE_REQUESTED_EVENT,
      handler: this.canvasDeleteRequestedHandler as EventListener,
    },
    {
      eventName: CANVAS_ELEMENT_DETAILS_EDITED_EVENT,
      handler: this.elementDetailsEditedHandler as EventListener,
    },
    {
      eventName: CANVAS_POSITIONS_DIRTY_EVENT,
      handler: this.canvasPositionsDirtyHandler as EventListener,
    },
    {
      eventName: CANVAS_ELEMENT_DELETE_REQUESTED_EVENT,
      handler: this.elementDeleteRequestedHandler as EventListener,
    },
    {
      eventName: CANVAS_LINK_LIFECYCLE_EVENT,
      handler: this.canvasLinkLifecycleHandler as EventListener,
    },
  ];

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
    this.canvasCoreBridge = new CanvasCoreBridge(
      this.scene,
      this.canvasManager.getPanZoomManager(),
      historyService
    );
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
    this.relationSyncAdapter = new RelationSyncAdapter(
      this.canvasDataService,
      () => this.scene.getConnections(),
      (message) => notify(message, 'error'),
      (message, error) => console.error(message, error),
      (draftId, payload) =>
        this.queueUnsyncedDraft(draftId, 'relations', payload)
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
        emitElementAutosaveStatus(status);
      });

    // Register commands from config
    getCommandConfigs(this.scene, this.canvasManager).forEach((cmd) => {
      commandManager.register(cmd.name, cmd.handler);
      cmd.keys.forEach((k) => commandManager.bindShortcut(cmd.name, k));
    });
    this.registerWindowEvents();
  }

  private registerWindowEvents(): void {
    this.windowEventBindings.forEach(({ eventName, handler }) => {
      window.addEventListener(eventName, handler);
    });
  }

  private unregisterWindowEvents(): void {
    this.windowEventBindings.forEach(({ eventName, handler }) => {
      window.removeEventListener(eventName, handler);
    });
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
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasTitleEditedDetail(customEvent.detail)) return;
    const { title } = customEvent.detail;
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
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasSelectedDetail(customEvent.detail)) return;
    const { id, name: detailName } = customEvent.detail;
    const activeCanvasId = this.canvasDataService.getActiveCanvasId();
    const isCanvasSwitched = activeCanvasId !== id;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    const name = detailName || 'New canvas';
    this.canvasDataService.loadCanvasDetails(id).subscribe({
      next: (canvas) => {
        if (isCanvasSwitched) {
          historyService.reset();
        }
        this.setCanvasTitle(canvas.name);
        this.restoreCanvasViewState(canvas.id).finally(() => {
          this.loadActiveCanvasElements();
          this.refreshCanvasList(canvas.id);
        });
      },
      error: (err) => {
        console.error('Failed to load canvas details', err);
        this.canvasDataService.setActiveCanvas({ id, name });
        if (isCanvasSwitched) {
          historyService.reset();
        }
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
        historyService.reset();
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

  private handleCanvasFavoriteToggled(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasFavoriteToggledDetail(customEvent.detail)) return;
    const { id, isFavorite, previousIsFavorite } = customEvent.detail;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      if (typeof previousIsFavorite === 'boolean') {
        emitCanvasFavoriteToggleFailed(id, previousIsFavorite);
      }
      return;
    }

    const cachedCanvas = this.canvasListCache.get(id);
    this.canvasDataService
      .updateCanvasFavorite({
        id,
        isFavorite,
        name: cachedCanvas?.name,
        meta: cachedCanvas?.meta,
      })
      .subscribe({
        next: (updated) => {
          const fallbackName = cachedCanvas?.name ?? 'New canvas';
          this.canvasListCache.set(id, {
            id,
            name: updated.name || fallbackName,
            meta: updated.meta ?? cachedCanvas?.meta ?? null,
          });
          this.emitCanvasList(
            this.getCanvasListUiItemsFromCache(),
            this.canvasDataService.getActiveCanvasId()
          );
        },
        error: (err) => {
          console.error('Failed to update canvas favourite', err);
          notify('Failed to update favourite', 'error');
          if (typeof previousIsFavorite === 'boolean') {
            emitCanvasFavoriteToggleFailed(id, previousIsFavorite);
          }
        },
      });
  }

  private handleCanvasGroupUpdated(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasGroupUpdatedDetail(customEvent.detail)) return;
    const {
      id,
      groupId,
      groupName,
      previousGroupId,
      previousGroupName,
    } = customEvent.detail;

    const nextGroup = this.normalizeCanvasGroup(groupId, groupName);
    const previousGroupFromEvent = this.normalizeCanvasGroup(
      previousGroupId,
      previousGroupName
    );

    const cachedCanvas = this.canvasListCache.get(id);
    const previousGroup =
      previousGroupFromEvent ?? this.extractCanvasGroup(cachedCanvas?.meta);

    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      emitCanvasGroupUpdateFailed(
        id,
        previousGroup?.id ?? null,
        previousGroup?.name ?? null
      );
      return;
    }

    this.canvasDataService
      .updateCanvasGroup({
        id,
        groupId: nextGroup?.id ?? null,
        groupName: nextGroup?.name ?? null,
        name: cachedCanvas?.name,
        meta: cachedCanvas?.meta,
      })
      .subscribe({
        next: (updated) => {
          const fallbackName = cachedCanvas?.name ?? 'New canvas';
          this.canvasListCache.set(id, {
            id,
            name: updated.name || fallbackName,
            meta: updated.meta ?? cachedCanvas?.meta ?? null,
          });
          this.emitCanvasList(
            this.getCanvasListUiItemsFromCache(),
            this.canvasDataService.getActiveCanvasId()
          );
        },
        error: (err) => {
          console.error('Failed to update canvas group', err);
          notify('Failed to update group', 'error');
          emitCanvasGroupUpdateFailed(
            id,
            previousGroup?.id ?? null,
            previousGroup?.name ?? null
          );
        },
      });
  }

  private handleCanvasRenameRequested(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasRenameRequestedDetail(customEvent.detail)) return;
    const { id, name } = customEvent.detail;
    const nextName = name.trim();
    if (nextName.length === 0) return;

    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      return;
    }

    const cachedCanvas = this.canvasListCache.get(id);
    this.canvasDataService.updateCanvasNameById(id, nextName).subscribe({
      next: (updated) => {
        const fallbackName = cachedCanvas?.name ?? 'New canvas';
        this.canvasListCache.set(id, {
          id,
          name: updated.name || fallbackName,
          meta: updated.meta ?? cachedCanvas?.meta ?? null,
        });
        if (this.canvasDataService.getActiveCanvasId() === id) {
          this.setCanvasTitle(updated.name || fallbackName);
        }
        this.emitCanvasList(
          this.getCanvasListUiItemsFromCache(),
          this.canvasDataService.getActiveCanvasId()
        );
      },
      error: (err) => {
        console.error('Failed to rename canvas', err);
        notify('Failed to rename canvas', 'error');
      },
    });
  }

  private handleElementDetailsEdited(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasElementDetailsEditedDetail(customEvent.detail)) return;
    const { element, patch } = customEvent.detail;
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.canvasDataService.queueElementUpdate(element, patch);
  }

  private handleCanvasPositionsDirty(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasPositionsDirtyDetail(customEvent.detail)) return;
    const elements = customEvent.detail.elements.filter(
      isPlanningElement
    ) as Array<TaskElement | StoryElement | GoalElement>;
    if (elements.length === 0) return;
    this.canvasDataService.markPositionsDirty(elements);
  }

  private handleElementDeleteRequested(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasElementDeleteRequestedDetail(customEvent.detail)) return;
    const { element } = customEvent.detail;
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
      this.canvasDataService
        .updateTaskStoryLink(detail.task, detail.story)
        .subscribe({
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
    this.canvasCoreBridge.start();
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
    this.canvasCoreBridge.stop();
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

  public getCanvasCoreBridge(): CanvasCoreBridge {
    return this.canvasCoreBridge;
  }

  private loadCanvasFromApi(): void {
    if (!this.authService.isLoggedIn()) {
      this.resetHydrationState();
      this.canvasManager.setLoadPhase('idle');
      this.scene.clear();
      this.canvasManager.clearLoadingPlaceholders();
      historyService.reset();
      this.setCanvasTitle('New canvas');
      this.refreshCanvasList(null);
      return;
    }
    this.canvasDataService.clearElementCache();
    // TODO(snapshot-cache): once snapshot endpoint is available,
    // replace bootstrap + elements + relations chain with single snapshot hydration.
    this.canvasDataService.bootstrapCanvas().subscribe({
      next: ({ canvases, activeCanvas }) => {
        historyService.reset();
        this.setCanvasTitle(activeCanvas.name);
        this.setCanvasListCache(canvases);
        this.emitCanvasList(
          this.getCanvasListUiItemsFromCache(),
          activeCanvas.id
        );
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
    const elements = this.getPlanningElements();
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
    const { positions, missingIds } = mapPlanningElementsToLayoutPositions(
      elements,
      {
        isFocused: (element) => this.scene.isFocused(element),
        isHighlighted: (element) => this.scene.isHighlighted(element),
      }
    );

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
      this.relationSyncAdapter.hasPendingChanges(elements);
    const uniquePositions = dedupeLayoutPositions(positions);
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
      return of(true);
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
        this.relationSyncAdapter.sync$(elements, {
          showNotifications,
          relationDraftId: relationsDraftId,
          throwOnError: true,
        })
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
    this.activeCanvasElementsSubscription = this.canvasDataService
      .loadElementsProgressive(loadOptions)
      .subscribe({
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
        ? (elements.find(
            (element) =>
              element.uuid === focusedUuid || element.id === focusedUuid
          ) ?? null)
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
    this.activeCanvasRelationsSubscription = this.canvasDataService
      .loadRelations()
      .subscribe({
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

  private async handleCanvasDeleteRequested(event?: Event): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }

    const customEvent = event as CustomEvent<unknown> | undefined;
    const requestedCanvasId =
      customEvent && isCanvasDeleteRequestedDetail(customEvent.detail)
        ? customEvent.detail.id
        : undefined;
    const activeCanvasId = this.canvasDataService.getActiveCanvasId();
    const canvasIdToDelete = requestedCanvasId || activeCanvasId;
    if (!canvasIdToDelete) {
      notify('No active canvas selected.', 'info');
      return;
    }

    try {
      const canvases = await firstValueFrom(
        this.canvasDataService.loadCanvases()
      );
      const targetCanvas =
        canvases.find((canvas) => canvas.id === canvasIdToDelete) ?? null;
      if (!targetCanvas) {
        notify('Canvas was not found.', 'error');
        return;
      }

      const confirmed = await confirmDeleteCanvasModal({
        canvasTitle: targetCanvas.name,
        isLastCanvas: canvases.length <= 1,
      });
      if (!confirmed) {
        return;
      }

      await firstValueFrom(this.canvasDataService.deleteCanvas(targetCanvas.id));
      notify('Canvas deleted.', 'success');

      const remainingCanvases = canvases.filter(
        (canvas) => canvas.id !== targetCanvas.id
      );
      const deletedActiveCanvas = activeCanvasId === targetCanvas.id;

      if (!deletedActiveCanvas) {
        this.refreshCanvasList(activeCanvasId ?? null);
        return;
      }

      if (remainingCanvases.length === 0) {
        const createdCanvas = await firstValueFrom(
          this.canvasDataService.createCanvas('New canvas')
        );
        historyService.reset();
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

      historyService.reset();
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
      this.canvasListCache.clear();
      this.emitCanvasList([], null);
      return;
    }
    this.canvasDataService.loadCanvases().subscribe({
      next: (canvases) => {
        const selectedId =
          activeId || this.canvasDataService.getActiveCanvasId();
        this.setCanvasListCache(canvases);
        this.emitCanvasList(
          this.getCanvasListUiItemsFromCache(),
          selectedId ?? null
        );
      },
      error: (err) => {
        console.error('Failed to load canvases', err);
      },
    });
  }

  private emitCanvasList(
    canvases: CanvasListUiItem[],
    activeId: string | null
  ): void {
    emitCanvasListUpdated(canvases, activeId);
  }

  private setCanvasTitle(title: string): void {
    this.canvasTitle = title;
    emitCanvasTitleChanged(title);
  }

  private mapCanvasListUiItem(canvas: {
    id: string;
    name: string;
    meta?: Record<string, unknown> | null;
  }): CanvasListUiItem {
    const group = this.extractCanvasGroup(canvas.meta);
    return {
      id: canvas.id,
      name: canvas.name,
      isFavorite: this.extractCanvasFavoriteFlag(canvas.meta),
      groupId: group?.id ?? null,
      groupName: group?.name ?? null,
    };
  }

  private setCanvasListCache(
    canvases: Array<{
      id: string;
      name: string;
      meta?: Record<string, unknown> | null;
    }>
  ): void {
    this.canvasListCache.clear();
    canvases.forEach((canvas) => {
      this.canvasListCache.set(canvas.id, {
        id: canvas.id,
        name: canvas.name,
        meta: canvas.meta,
      });
    });
  }

  private getCanvasListUiItemsFromCache(): CanvasListUiItem[] {
    return Array.from(this.canvasListCache.values()).map((canvas) =>
      this.mapCanvasListUiItem(canvas)
    );
  }

  private extractCanvasFavoriteFlag(
    meta: Record<string, unknown> | null | undefined
  ): boolean {
    if (!meta) return false;
    const favorite = meta.favorite;
    if (typeof favorite === 'boolean') return favorite;
    const favourite = meta.favourite;
    return typeof favourite === 'boolean' ? favourite : false;
  }

  private extractCanvasGroup(
    meta: Record<string, unknown> | null | undefined
  ): { id: string; name: string } | null {
    if (!meta) return null;

    const directGroup = meta.group;
    if (typeof directGroup === 'string' && directGroup.trim().length > 0) {
      const value = directGroup.trim();
      return { id: value, name: value };
    }

    if (
      directGroup &&
      typeof directGroup === 'object' &&
      !Array.isArray(directGroup)
    ) {
      const group = directGroup as Record<string, unknown>;
      const id = typeof group.id === 'string' ? group.id.trim() : '';
      const name = typeof group.name === 'string' ? group.name.trim() : '';
      if (id || name) {
        return {
          id: id || name,
          name: name || id,
        };
      }
    }

    const groupId = this.extractMetaString(meta, ['groupId', 'group_id']);
    const groupName = this.extractMetaString(meta, ['groupName', 'group_name']);
    if (!groupId && !groupName) return null;
    return {
      id: groupId || groupName,
      name: groupName || groupId,
    };
  }

  private extractMetaString(
    meta: Record<string, unknown>,
    keys: string[]
  ): string {
    for (const key of keys) {
      const value = meta[key];
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
    return '';
  }

  private normalizeCanvasGroup(
    groupId: string | null | undefined,
    groupName: string | null | undefined
  ): { id: string; name: string } | null {
    const id = typeof groupId === 'string' ? groupId.trim() : '';
    const name = typeof groupName === 'string' ? groupName.trim() : '';
    if (!id && !name) return null;
    return {
      id: id || name,
      name: name || id,
    };
  }

  private async handleStoryGoalLinkSet(
    story: StoryElement,
    goal: GoalElement
  ): Promise<void> {
    this.beginLinkDecision();
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
    const elements = this.getPlanningElements();
    this.relationSyncAdapter
      .sync$(elements, {
        showNotifications: true,
        throwOnError: false,
        errorMessage: 'Failed to sync canvas relations',
      })
      .subscribe({
        next: () => undefined,
      });
  }

  private getPlanningElements(): Array<
    TaskElement | StoryElement | GoalElement
  > {
    return this.scene.getElements().filter(isPlanningElement) as Array<
      TaskElement | StoryElement | GoalElement
    >;
  }

  private getLinkElementRef(element: { id: string; uuid?: string }): string {
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
