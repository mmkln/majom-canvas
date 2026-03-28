import { CanvasManager } from './core/managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import {
  AuthService,
  type CanvasElementsLoadOptions,
} from '../../majom-wrapper/index.ts';
import { UIManager } from './ui/UIManager.ts';
import type { IViewState } from './core/interfaces/interfaces.ts';
import { commandManager } from './core/managers/CommandManager.ts';
import { historyService } from './core/services/HistoryService.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import type { ICanvasElement } from './core/interfaces/canvasElement.ts';
import { ElementStatus } from './elements/ElementStatus.ts';
import { ConnectionRelationType } from './core/interfaces/connection.ts';
import { notify } from './core/services/NotificationService.ts';
import { CanvasClientStorage } from './core/services/CanvasClientStorage.ts';
import { AiAssistantCanvasActionExecutor } from './core/services/AiAssistantCanvasActionExecutor.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  isCanvasLinkLifecycleDetail,
} from './core/canvasLinkLifecycle.ts';
import {
  emitCanvasSaveFinished,
  emitCanvasSaveStarted,
  type CanvasSaveSource,
} from './core/canvasSaveLifecycle.ts';
import {
  CANVAS_AUTOSAVE_TOGGLE_EVENT,
  isCanvasAutosaveToggleDetail,
} from './core/canvasAutosaveLifecycle.ts';
import { confirmDeleteCanvasModal } from './ui/components/ConfirmDeleteCanvasModal.ts';
import { authFlowService } from './ui/auth/authFlowService.ts';
import {
  emitAiAssistantContextChanged,
  type AiAssistantCanvasElement,
  type AiAssistantCanvasSnapshot,
  type AiAssistantConnectionEdge,
  type AiAssistantRecentActivityItem,
  type AiAssistantSelectionItem,
} from '../ai-assistant/aiAssistantEvents.ts';
import { firstValueFrom, Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type { UiPriority } from '../../majom-wrapper/utils/priorityMapping.ts';
import type {
  AiAssistantActionExecutionRequest,
  AiAssistantActionExecutionResult,
} from '../ai-assistant/aiAssistantActions.ts';
import type { I18nService } from '../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import type { CanvasCoreAdapters } from './adapters/CanvasCoreAdapters.ts';
import type { CanvasDataAdapter } from './adapters/CanvasDataAdapter.ts';
import type {
  CanvasLayoutRecord,
  CanvasNodeSemanticsAdapter,
  CanvasNodeRecord,
  CanvasSceneNode,
} from './adapters/CanvasNodeSemanticsAdapter.ts';
import type { CanvasPersistenceAdapter } from './adapters/CanvasPersistenceAdapter.ts';
import { DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER } from './adapters/CanvasRuntimeSemanticsAdapter.ts';
import { CANVAS_CORE_CANVAS_ELEMENT_ID } from './CanvasModule.ts';
import { PlanningCanvasAlignmentAdapter } from './adapters/planning/PlanningCanvasAlignmentAdapter.ts';
import {
  planningCanvasElementSemantics,
  type PlanningCanvasElement,
} from './adapters/planning/PlanningCanvasElementSemantics.ts';
import { planningCanvasRelationSemantics } from './adapters/planning/PlanningCanvasRelationSemantics.ts';
import type { PlanningCanvasRelationAdapter } from './adapters/planning/PlanningCanvasRelationAdapter.ts';

type CanvasListUiItem = {
  id: string;
  name: string;
  isFavorite: boolean;
  groupId: string | null;
  groupName: string | null;
};

type CanvasListCacheItem = {
  id: string;
  name: string;
  meta?: Record<string, unknown> | null;
};

const APP_DOCUMENT_TITLE = 'Majom Canvas';
const CANVAS_TITLE_MAX_LENGTH = 100;

export class CanvasApp {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly authService: AuthService;
  private readonly uiManager: UIManager;
  private readonly canvasDataService: CanvasDataAdapter;
  private readonly persistenceAdapter: CanvasPersistenceAdapter;
  private readonly nodeSemantics: CanvasNodeSemanticsAdapter;
  private readonly planningRelations: PlanningCanvasRelationAdapter | null;
  private readonly chatCanvasActionExecutor: AiAssistantCanvasActionExecutor;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly uiParent: HTMLElement;
  private canvasTitle: string = 'New canvas';
  private autosaveTimer: number | null = null;
  private autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);
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
  private aiAssistantPreviousSnapshot: AiAssistantCanvasSnapshot | null = null;
  private aiAssistantRecentActivity: AiAssistantRecentActivityItem[] = [];
  private aiAssistantViewportSyncTimer: number | null = null;

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
  private readonly canvasDuplicateRequestedHandler = (): void => {
    void this.handleCanvasDuplicateRequested();
  };
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
  private readonly canvasAutosaveToggledHandler = (event: Event): void =>
    this.handleCanvasAutosaveToggled(event);

  constructor(
    adapters: CanvasCoreAdapters,
    canvasElement?: HTMLCanvasElement,
    runtime: AppRuntime = createAppRuntime(),
    uiParent?: HTMLElement
  ) {
    this.runtime = runtime;
    this.i18n = this.runtime.i18n;
    const resolvedCanvas =
      canvasElement ??
      document.getElementById(CANVAS_CORE_CANVAS_ELEMENT_ID) ??
      document.getElementById('myCanvas');
    if (!(resolvedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = resolvedCanvas;
    this.uiParent = uiParent ?? this.canvas.parentElement ?? document.body;

    // Створюємо нову сцену (це місце для зберігання всіх елементів)
    this.scene = new Scene();
    const alignmentAdapter =
      adapters.alignment ??
      (adapters.nodeSemantics ? null : new PlanningCanvasAlignmentAdapter());

    // Передаємо сцену в CanvasManager, щоб менеджер міг працювати з даними
    this.canvasManager = new CanvasManager(
      this.canvas,
      this.scene,
      adapters.appearance ?? null,
      adapters.semantics ?? DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER,
      adapters.background ?? null,
      alignmentAdapter
    );
    // Ініціалізація сервісу аутентифікації
    this.authService = new AuthService();
    this.canvasDataService = adapters.data;
    this.persistenceAdapter = adapters.persistence;
    this.nodeSemantics =
      adapters.nodeSemantics ?? planningCanvasElementSemantics;
    this.planningRelations = adapters.planningRelations ?? null;
    // Створюємо компонент для авторизації
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(
      this.canvasManager,
      this.scene,
      adapters.lookup,
      adapters.ui,
      adapters.interaction ?? null,
      this.runtime
    );
    this.chatCanvasActionExecutor = new AiAssistantCanvasActionExecutor({
      scene: this.scene,
      canvasManager: this.canvasManager,
    });
    this.uiManager.mountAll(this.uiParent);

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
      'canvasDuplicateRequested',
      this.canvasDuplicateRequestedHandler
    );
    window.addEventListener(
      'canvasFavoriteToggled',
      this.canvasFavoriteToggledHandler
    );
    window.addEventListener(
      'canvasGroupUpdated',
      this.canvasGroupUpdatedHandler
    );
    window.addEventListener(
      'canvasRenameRequested',
      this.canvasRenameRequestedHandler
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
    window.addEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.canvasAutosaveToggledHandler
    );
  }

  private unregisterWindowEvents(): void {
    window.removeEventListener(
      'refreshCanvasData',
      this.refreshCanvasDataHandler
    );
    window.removeEventListener(
      'saveCanvasLayout',
      this.saveCanvasLayoutHandler
    );
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
      'canvasDuplicateRequested',
      this.canvasDuplicateRequestedHandler
    );
    window.removeEventListener(
      'canvasFavoriteToggled',
      this.canvasFavoriteToggledHandler
    );
    window.removeEventListener(
      'canvasGroupUpdated',
      this.canvasGroupUpdatedHandler
    );
    window.removeEventListener(
      'canvasRenameRequested',
      this.canvasRenameRequestedHandler
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
    window.removeEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.canvasAutosaveToggledHandler
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

  private handleCanvasAutosaveToggled(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasAutosaveToggleDetail(customEvent.detail)) return;
    const { enabled } = customEvent.detail;
    if (this.autosaveEnabled === enabled) return;
    this.autosaveEnabled = enabled;
    CanvasClientStorage.setCanvasAutosaveEnabled(enabled);
    if (enabled) {
      this.startAutosave();
      this.runAutosaveTick();
      return;
    }
    this.stopAutosave();
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
    const normalizedTitle = title.trim() || 'New canvas';
    if (normalizedTitle.length > CANVAS_TITLE_MAX_LENGTH) {
      notify(
        this.i18n.t('canvas.titleTooLong', {
          limit: String(CANVAS_TITLE_MAX_LENGTH),
        }),
        'error'
      );
      this.setCanvasTitle(previousTitle);
      return;
    }
    this.canvasDataService.updateCanvasName(normalizedTitle).subscribe({
      next: (canvas) => {
        this.setCanvasTitle(canvas.name);
        this.refreshCanvasList(canvas.id);
      },
      error: (err) => {
        console.error('Failed to update canvas title', err);
        notify(this.getCanvasTitleUpdateErrorMessage(err), 'error');
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
    const activeCanvasId = this.canvasDataService.getActiveCanvasId();
    const isCanvasSwitched = activeCanvasId !== id;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    const name = customEvent.detail?.name || 'New canvas';
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

  private async handleCanvasDuplicateRequested(): Promise<void> {
    if (this.isLinkDecisionPending()) {
      notify(this.i18n.t('canvas.finishRelationConfirmationFirst'), 'info');
      return;
    }
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }

    const elements = this.nodeSemantics.getSceneElements(this.scene);
    const records = this.nodeSemantics.toNodeRecords(elements, this.scene);
    const duplicateTitle = this.buildDuplicateCanvasTitle(this.canvasTitle);
    const currentViewState = this.getCurrentViewState();

    try {
      const duplicatedCanvas = await firstValueFrom(
        this.canvasDataService.createCanvas(duplicateTitle)
      );
      this.setCanvasTitle(duplicatedCanvas.name);
      this.refreshCanvasList(duplicatedCanvas.id);

      await firstValueFrom(
        this.canvasDataService.ensureElementsPersisted(records)
      );
      const saved = await firstValueFrom(
        this.saveLayoutPositions(elements, false)
      );
      if (!saved) {
        throw new Error('Canvas duplication skipped layout persistence.');
      }

      await this.persistenceAdapter.saveViewState(
        currentViewState,
        duplicatedCanvas.id
      );
      historyService.reset();
      notify(this.i18n.t('canvas.duplicateSuccess'), 'success');
    } catch (err) {
      console.error('Failed to duplicate canvas', err);
      notify(this.i18n.t('canvas.duplicateFailed'), 'error');
    }
  }

  private handleCanvasFavoriteToggled(event: Event): void {
    const customEvent = event as CustomEvent<{
      id?: string;
      isFavorite?: boolean;
      previousIsFavorite?: boolean;
    }>;
    const id = customEvent.detail?.id;
    const isFavorite = customEvent.detail?.isFavorite;
    if (!id || typeof isFavorite !== 'boolean') return;

    const previousIsFavorite = customEvent.detail?.previousIsFavorite;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      if (typeof previousIsFavorite === 'boolean') {
        this.emitCanvasFavoriteToggleFailed(id, previousIsFavorite);
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
            this.emitCanvasFavoriteToggleFailed(id, previousIsFavorite);
          }
        },
      });
  }

  private handleCanvasGroupUpdated(event: Event): void {
    const customEvent = event as CustomEvent<{
      id?: string;
      groupId?: string | null;
      groupName?: string | null;
      previousGroupId?: string | null;
      previousGroupName?: string | null;
    }>;
    const id = customEvent.detail?.id;
    if (!id) return;

    const nextGroup = this.normalizeCanvasGroup(
      customEvent.detail?.groupId,
      customEvent.detail?.groupName
    );
    const previousGroupFromEvent = this.normalizeCanvasGroup(
      customEvent.detail?.previousGroupId,
      customEvent.detail?.previousGroupName
    );

    const cachedCanvas = this.canvasListCache.get(id);
    const previousGroup =
      previousGroupFromEvent ?? this.extractCanvasGroup(cachedCanvas?.meta);

    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      this.emitCanvasGroupUpdateFailed(id, previousGroup);
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
          this.emitCanvasGroupUpdateFailed(id, previousGroup);
        },
      });
  }

  private handleCanvasRenameRequested(event: Event): void {
    const customEvent = event as CustomEvent<{
      id?: string;
      name?: string;
    }>;
    const id = customEvent.detail?.id;
    const name = customEvent.detail?.name;
    if (!id || typeof name !== 'string') return;
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
    const customEvent = event as CustomEvent<{
      element?: CanvasSceneNode;
      patch?: Partial<{
        title: string;
        description: string;
        status: ElementStatus;
        priority: UiPriority;
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
      elements?: ICanvasElement[];
    }>;
    const elements = this.nodeSemantics.getElements(
      customEvent.detail?.elements ?? []
    );
    if (elements.length === 0) return;
    this.canvasDataService.markPositionsDirty(
      this.nodeSemantics.toNodeRecords(elements, this.scene)
    );
  }

  private handleElementDeleteRequested(event: Event): void {
    const customEvent = event as CustomEvent<{
      element?: CanvasSceneNode;
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
    if (!this.planningRelations) return;
    if (!this.authService.isLoggedIn()) {
      return;
    }
    planningCanvasRelationSemantics.handleLinkLifecycle(customEvent.detail, {
      scene: this.scene,
      canvasDataService: this.canvasDataService,
      planningRelations: this.planningRelations,
      beginLinkDecision: () => this.beginLinkDecision(),
      endLinkDecision: () => this.endLinkDecision(),
    });
  }

  public async init(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Cannot init destroyed App instance.');
    }
    this.canvasManager.init();
    // Restore last view state (scroll & zoom) via centralized setter
    const view: IViewState = await this.persistenceAdapter.loadViewState();
    const panZoom = this.canvasManager.getPanZoomManager();
    panZoom.setViewState(view);
    if (this.authService.isLoggedIn()) {
      this.loadCanvasFromApi();
    } else {
      await this.persistenceAdapter.loadLegacyDiagram(this.scene);
    }
    // Draw after restore and notify listeners (including ZoomIndicator)
    this.canvasManager.draw();
    // Auto-save view state on any change
    this.viewChangesSubscription = panZoom.viewChanges.subscribe((state) => {
      const activeCanvasId = this.canvasDataService.getActiveCanvasId();
      void this.persistenceAdapter.saveViewState(state, activeCanvasId);
      this.scheduleAiAssistantContextEmit();
    });
    // Auto-save diagram on content change
    this.sceneChangesSubscription = this.scene.changes.subscribe(() => {
      if (this.isHydratingCanvas) return;
      void this.persistenceAdapter.saveLegacyDiagram(this.scene);
      this.emitAiAssistantContext();
    });
    this.emitAiAssistantContext();
    this.startAutosave();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.unregisterWindowEvents();
    this.stopAutosave();
    this.activeCanvasElementsSubscription?.unsubscribe();
    this.activeCanvasElementsSubscription = null;
    this.activeCanvasRelationsSubscription?.unsubscribe();
    this.activeCanvasRelationsSubscription = null;
    this.viewChangesSubscription?.unsubscribe();
    this.viewChangesSubscription = null;
    if (this.aiAssistantViewportSyncTimer !== null) {
      window.clearTimeout(this.aiAssistantViewportSyncTimer);
      this.aiAssistantViewportSyncTimer = null;
    }
    this.sceneChangesSubscription?.unsubscribe();
    this.sceneChangesSubscription = null;
    this.elementUpdateStatusSubscription?.unsubscribe();
    this.elementUpdateStatusSubscription = null;
    this.clearAiAssistantContext();
    this.uiManager.unmountAll();
    this.canvasManager.destroy();
  }

  public executeChatAction(
    request: AiAssistantActionExecutionRequest
  ): Promise<AiAssistantActionExecutionResult> {
    return this.chatCanvasActionExecutor.execute(request);
  }

  public executeChatActions(
    requests: AiAssistantActionExecutionRequest[]
  ): Promise<AiAssistantActionExecutionResult[]> {
    return this.chatCanvasActionExecutor.executeBatch(requests);
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot {
    const planningElements = this.getPlanningElements();
    const selectedElements = this.getSelectedPlanningElements();
    const detail: AiAssistantCanvasSnapshot = {
      canvasId: this.canvasDataService.getActiveCanvasId(),
      canvasTitle: this.canvasTitle,
      summary: planningCanvasElementSemantics.buildSnapshotSummary(
        planningElements,
        selectedElements
      ),
      selectionIds: selectedElements.map((element) => element.id),
      focusId: this.getPlanningFocusId(),
      highlightedIds: planningCanvasElementSemantics.getHighlightedElementIds(
        this.scene,
        planningElements
      ),
      elements: this.buildAiAssistantElements(planningElements),
      connections: this.buildAiAssistantConnections(planningElements),
      viewport: this.buildAiAssistantViewport(planningElements),
      recentActivity: [],
    };
    detail.recentActivity = this.computeAiAssistantRecentActivity(detail);
    return detail;
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
    const elements = this.nodeSemantics.getSceneElements(this.scene);
    const records = this.nodeSemantics.toNodeRecords(elements, this.scene);
    const saveSource: CanvasSaveSource = showNotifications
      ? 'manual'
      : 'autosave';
    emitCanvasSaveStarted(saveSource);
    return this.canvasDataService.ensureElementsPersisted(records).pipe(
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
    elements: CanvasSceneNode[],
    showNotifications: boolean
  ): Observable<boolean> {
    const records = this.nodeSemantics.toNodeRecords(elements, this.scene);
    const positions: CanvasLayoutRecord[] = [];
    const missingIds: string[] = [];

    elements.forEach((el) => {
      const layoutRecord = this.nodeSemantics.toLayoutRecord(this.scene, el);
      if (!layoutRecord) return;
      if (!layoutRecord.persistRef.layoutUuid) {
        missingIds.push(layoutRecord.nodeId);
        return;
      }
      positions.push(layoutRecord);
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
      this.canvasDataService.getRemovedPositionIds(records);
    const needsPositionRefresh =
      this.canvasDataService.needsPositionRefresh(records);
    const hasRelationChanges = this.canvasDataService.hasRelationChanges(
      this.scene.getConnections(),
      records
    );
    const uniquePositions = this.dedupeLayoutRecords(positions);
    const changedPositions =
      this.canvasDataService.filterLayoutUpdates(uniquePositions);
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
        this.canvasDataService
          .updateCanvasRelations(this.scene.getConnections(), records)
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
  private dedupeLayoutRecords(
    positions: CanvasLayoutRecord[]
  ): CanvasLayoutRecord[] {
    const map = new Map<string, CanvasLayoutRecord>();
    positions.forEach((pos) => {
      const ref = pos.persistRef.layoutUuid ?? 'na';
      const key = `${pos.persistRef.layoutType ?? 'na'}:${ref}`;
      map.set(key, pos);
    });
    return Array.from(map.values());
  }

  private async restoreCanvasViewState(
    canvasId: string | null | undefined
  ): Promise<void> {
    try {
      const panZoom = this.canvasManager.getPanZoomManager();
      const nextView = await this.persistenceAdapter.loadViewState(
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
    if (!this.autosaveEnabled) return;
    if (this.autosaveTimer) return;
    this.autosaveTimer = window.setInterval(() => {
      this.runAutosaveTick();
    }, 5000);
  }

  private stopAutosave(): void {
    if (this.autosaveTimer === null) return;
    window.clearInterval(this.autosaveTimer);
    this.autosaveTimer = null;
  }

  private runAutosaveTick(): void {
    if (!this.autosaveEnabled) return;
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
    this.emitAiAssistantContext();
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
            const elements = this.nodeSemantics.materializeNodes(state.records);
            this.replacePlanningElements(elements);
            this.applyFocusedElement(elements, state.focusedElementUuid);
            this.applyHighlightedElements(
              elements,
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
          const elements = this.nodeSemantics.materializeNodes(state.records);
          this.replacePlanningElements(elements);
          this.applyFocusedElement(elements, state.focusedElementUuid);
          this.applyHighlightedElements(
            elements,
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
    elements: CanvasSceneNode[],
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
    elements: CanvasSceneNode[],
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
      .filter((element): element is CanvasSceneNode => Boolean(element))
      .map((element) => element.id);
    this.scene.setHighlightedElementIds(highlightedIds);
  }

  private replacePlanningElements(elements: CanvasSceneNode[]): void {
    this.nodeSemantics.replaceSceneElements(this.scene, elements);
    this.emitAiAssistantContext();
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

    const customEvent = event as
      | CustomEvent<{
          id?: string;
        }>
      | undefined;
    const requestedCanvasId = customEvent?.detail?.id;
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

      await firstValueFrom(
        this.canvasDataService.deleteCanvas(targetCanvas.id)
      );
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
    window.dispatchEvent(
      new CustomEvent('canvasListUpdated', {
        detail: { canvases, activeId },
      })
    );
  }

  private setCanvasTitle(title: string): void {
    this.canvasTitle = title;
    const normalizedTitle = title.trim();
    document.title =
      normalizedTitle.length > 0
        ? `${normalizedTitle} - ${APP_DOCUMENT_TITLE}`
        : APP_DOCUMENT_TITLE;
    window.dispatchEvent(
      new CustomEvent('canvasTitleChanged', { detail: { title } })
    );
    this.emitAiAssistantContext();
  }

  private getCurrentViewState(): IViewState {
    const panZoom = this.canvasManager.getPanZoomManager();
    return {
      scrollX: panZoom.scrollX,
      scrollY: panZoom.scrollY,
      scale: panZoom.scale,
    };
  }

  private buildDuplicateCanvasTitle(title: string): string {
    const prefix = this.i18n.t('canvas.duplicatePrefix');
    const normalizedTitle = title.trim() || 'New canvas';
    const availableTitleLength = Math.max(
      0,
      CANVAS_TITLE_MAX_LENGTH - prefix.length
    );
    const baseTitle =
      normalizedTitle.length > availableTitleLength
        ? normalizedTitle.slice(0, availableTitleLength).replace(/\s+$/u, '')
        : normalizedTitle;
    return `${prefix}${baseTitle}`;
  }

  private getCanvasTitleUpdateErrorMessage(error: unknown): string {
    const response = this.getErrorResponseBody(error);
    const fieldMessage = this.getFirstErrorMessage(response?.name);
    if (fieldMessage) {
      const limit = this.extractMaxLengthLimit(fieldMessage);
      if (limit !== null) {
        return this.i18n.t('canvas.titleTooLong', {
          limit: String(limit),
        });
      }
      return fieldMessage;
    }
    const detailMessage = this.getFirstErrorMessage(response?.detail);
    if (detailMessage) {
      return detailMessage;
    }
    return this.i18n.t('canvas.updateTitleFailed');
  }

  private getErrorResponseBody(error: unknown): Record<string, unknown> | null {
    if (!error || typeof error !== 'object') {
      return null;
    }
    const response = (error as { response?: unknown }).response;
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      return response as Record<string, unknown>;
    }
    return null;
  }

  private getFirstErrorMessage(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const firstString = value.find(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0
      );
      return firstString?.trim() ?? null;
    }
    return null;
  }

  private extractMaxLengthLimit(message: string): number | null {
    const match = message.match(/no more than (\d+) characters/i);
    if (!match) {
      return null;
    }
    return Number.parseInt(match[1] ?? '', 10) || null;
  }

  private emitAiAssistantContext(): void {
    emitAiAssistantContextChanged(this.getAiAssistantSnapshot());
  }

  private scheduleAiAssistantContextEmit(): void {
    if (this.aiAssistantViewportSyncTimer !== null) {
      window.clearTimeout(this.aiAssistantViewportSyncTimer);
    }
    this.aiAssistantViewportSyncTimer = window.setTimeout(() => {
      this.aiAssistantViewportSyncTimer = null;
      this.emitAiAssistantContext();
    }, 120);
  }

  private clearAiAssistantContext(): void {
    this.aiAssistantPreviousSnapshot = null;
    this.aiAssistantRecentActivity = [];
    planningCanvasElementSemantics.emitEmptyAiAssistantContext();
  }

  private mapAiAssistantSelectionItem(
    element: PlanningCanvasElement
  ): AiAssistantSelectionItem {
    return planningCanvasElementSemantics.mapSelectionItem(element);
  }

  private buildAiAssistantElements(
    planningElements: PlanningCanvasElement[]
  ): AiAssistantCanvasElement[] {
    const hierarchy = planningCanvasRelationSemantics.buildHierarchy(
      planningElements,
      this.scene.getConnections()
    );

    return planningElements.map((element) => {
      const base = this.mapAiAssistantSelectionItem(element);
      const parentId = planningCanvasElementSemantics.getHierarchyParentId(
        element,
        hierarchy
      );
      const childIds = planningCanvasElementSemantics.getHierarchyChildIds(
        element,
        hierarchy
      );
      return {
        ...base,
        childCount: childIds.length,
        parentId,
        childIds,
        selected: element.selected,
        focused: this.scene.isFocused(element),
        highlighted: this.scene.isHighlighted(element),
      };
    });
  }

  private buildAiAssistantConnections(
    planningElements: PlanningCanvasElement[]
  ): AiAssistantConnectionEdge[] {
    const refToPlanningId =
      this.buildAiAssistantElementRefMap(planningElements);
    return this.scene
      .getConnections()
      .map((connection): AiAssistantConnectionEdge | null => {
        const fromId = refToPlanningId.get(connection.fromId);
        const toId = refToPlanningId.get(connection.toId);
        if (!fromId || !toId) return null;
        return {
          id: connection.id,
          fromId,
          toId,
          relationType:
            connection.relationType as AiAssistantConnectionEdge['relationType'],
        };
      })
      .filter(
        (connection): connection is AiAssistantConnectionEdge =>
          connection !== null
      );
  }

  private buildAiAssistantElementRefMap(
    planningElements: PlanningCanvasElement[]
  ): Map<string, string> {
    return planningCanvasElementSemantics.buildElementRefMap(planningElements);
  }

  private buildAiAssistantViewport(
    planningElements: PlanningCanvasElement[]
  ): AiAssistantCanvasSnapshot['viewport'] {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const scale = panZoom.scale || 1;
    const minX = panZoom.scrollX / scale;
    const minY = panZoom.scrollY / scale;
    const maxX = (panZoom.scrollX + canvas.width) / scale;
    const maxY = (panZoom.scrollY + canvas.height) / scale;
    return planningCanvasElementSemantics.buildViewport(planningElements, {
      minX,
      minY,
      maxX,
      maxY,
    });
  }

  private getPlanningFocusId(): string | null {
    return planningCanvasElementSemantics.getFocusedElementId(this.scene);
  }

  private getPlanningElements(): PlanningCanvasElement[] {
    return planningCanvasElementSemantics.getSceneElements(this.scene);
  }

  private getSelectedPlanningElements(): PlanningCanvasElement[] {
    return planningCanvasElementSemantics.getSelectedElements(this.scene);
  }

  private computeAiAssistantRecentActivity(
    snapshot: AiAssistantCanvasSnapshot
  ): AiAssistantRecentActivityItem[] {
    const previous = this.aiAssistantPreviousSnapshot;
    const nextItems = this.createAiAssistantActivityDiff(previous, snapshot);
    this.aiAssistantRecentActivity = [
      ...nextItems,
      ...this.aiAssistantRecentActivity,
    ].slice(0, 8);
    this.aiAssistantPreviousSnapshot = snapshot;
    return this.aiAssistantRecentActivity;
  }

  private createAiAssistantActivityDiff(
    previous: AiAssistantCanvasSnapshot | null,
    next: AiAssistantCanvasSnapshot
  ): AiAssistantRecentActivityItem[] {
    if (!previous) return [];
    const timestamp = Date.now();
    const activity: AiAssistantRecentActivityItem[] = [];
    const previousById = new Map(
      previous.elements.map((item) => [item.id, item])
    );
    const nextById = new Map(next.elements.map((item) => [item.id, item]));

    next.elements.forEach((item) => {
      if (!previousById.has(item.id)) {
        activity.push({
          id: `chat-activity-added-${item.id}-${timestamp}`,
          type: 'added',
          label: `Added ${item.kind} "${item.title || 'Untitled'}"`,
          entityIds: [item.id],
          timestamp,
        });
      }
    });

    previous.elements.forEach((item) => {
      if (!nextById.has(item.id)) {
        activity.push({
          id: `chat-activity-removed-${item.id}-${timestamp}`,
          type: 'removed',
          label: `Removed ${item.kind} "${item.title || 'Untitled'}"`,
          entityIds: [item.id],
          timestamp,
        });
      }
    });

    if (previous.focusId !== next.focusId) {
      const focused = next.focusId ? nextById.get(next.focusId) : null;
      activity.push({
        id: `chat-activity-focus-${next.focusId ?? 'none'}-${timestamp}`,
        type: 'focus',
        label: focused
          ? `Focused ${focused.kind} "${focused.title || 'Untitled'}"`
          : 'Cleared focus',
        entityIds: focused ? [focused.id] : [],
        timestamp,
      });
    }

    const previousSelection = previous.selectionIds.join('|');
    const nextSelection = next.selectionIds.join('|');
    if (previousSelection !== nextSelection) {
      activity.push({
        id: `chat-activity-selection-${timestamp}`,
        type: 'selection',
        label:
          next.selectionIds.length > 0
            ? `Selection changed to ${next.selectionIds.length} item${next.selectionIds.length === 1 ? '' : 's'}`
            : 'Cleared selection',
        entityIds: next.selectionIds,
        timestamp,
      });
    }

    next.elements.forEach((item) => {
      const previousItem = previousById.get(item.id);
      if (!previousItem) return;
      if (
        previousItem.title !== item.title ||
        previousItem.status !== item.status ||
        previousItem.priority !== item.priority ||
        previousItem.parentId !== item.parentId ||
        previousItem.childCount !== item.childCount
      ) {
        activity.push({
          id: `chat-activity-updated-${item.id}-${timestamp}`,
          type: 'updated',
          label: `Updated ${item.kind} "${item.title || 'Untitled'}"`,
          entityIds: [item.id],
          timestamp,
        });
      }
    });

    return activity.slice(0, 4);
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

  private emitCanvasFavoriteToggleFailed(
    id: string,
    previousIsFavorite: boolean
  ): void {
    window.dispatchEvent(
      new CustomEvent('canvasFavoriteToggleFailed', {
        detail: { id, previousIsFavorite },
      })
    );
  }

  private emitCanvasGroupUpdateFailed(
    id: string,
    previousGroup: { id: string; name: string } | null
  ): void {
    window.dispatchEvent(
      new CustomEvent('canvasGroupUpdateFailed', {
        detail: {
          id,
          previousGroupId: previousGroup?.id ?? null,
          previousGroupName: previousGroup?.name ?? null,
        },
      })
    );
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

  private beginLinkDecision(): void {
    this.pendingLinkDecisions += 1;
  }

  private endLinkDecision(): void {
    this.pendingLinkDecisions = Math.max(0, this.pendingLinkDecisions - 1);
  }

  private isLinkDecisionPending(): boolean {
    return this.pendingLinkDecisions > 0;
  }
}
