import { CanvasManager } from './core/managers/CanvasManager.ts';
import { Scene } from './core/scene/Scene.ts';
import Connection from './core/shapes/Connection.ts';
import { DiagramRepository } from './core/data/DiagramRepository.ts';
import { IDataProvider } from './core/interfaces/dataProvider.ts';
import {
  AuthService,
  HttpInterceptorClient,
  TasksApiService,
  StoriesApiService,
  GoalsApiService,
  GoalRelationsApiService,
  HabitsApiService,
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
import { CanvasPersistenceState } from './core/services/CanvasPersistenceState.ts';
import { CanvasDraftRecoveryCoordinator } from './core/services/CanvasDraftRecoveryCoordinator.ts';
import { CanvasRestoreReplayCoordinator } from './core/services/CanvasRestoreReplayCoordinator.ts';
import { getCommandConfigs } from './core/config/commandConfigs.ts';
import { environment } from '../../config/environment.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { StoryElement } from './elements/StoryElement.ts';
import { GoalElement } from './elements/GoalElement.ts';
import { HabitElement } from './elements/HabitElement.ts';
import { isPlanningElement } from './elements/utils/typeGuards.ts';
import { ElementStatus } from './elements/ElementStatus.ts';
import {
  type CanvasPlanningElement,
  isCanvasPlanningElement,
  isRelationPlanningElement,
  isTaskStoryGoalPlanningElement,
} from './elements/utils/planningElementCapabilities.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from './core/interfaces/connection.ts';
import { notify } from './core/services/NotificationService.ts';
import { CanvasClientStorage } from './core/services/CanvasClientStorage.ts';
import { AiAssistantCanvasActionExecutor } from './core/services/AiAssistantCanvasActionExecutor.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  type CanvasLinkLifecycleDetail,
  type GoalLinkSnapshot,
  isCanvasLinkLifecycleDetail,
  type StoryGoalLinkSnapshot,
  type TaskStoryLinkSnapshot,
} from './core/canvasLinkLifecycle.ts';
import {
  emitCanvasSaveFinished,
  emitCanvasSaveStarted,
  type CanvasSaveSource,
} from './core/canvasSaveLifecycle.ts';
import {
  emitCanvasElementAutosaveStatus,
  isCanvasElementAutosaveStatusDetail,
} from './core/canvasElementAutosaveLifecycle.ts';
import {
  CANVAS_AUTOSAVE_TOGGLE_EVENT,
  isCanvasAutosaveToggleDetail,
} from './core/canvasAutosaveLifecycle.ts';
import { confirmReplaceStoryGoalModal } from './ui/components/ConfirmReplaceStoryGoalModal.ts';
import { confirmDeleteCanvasModal } from './ui/components/ConfirmDeleteCanvasModal.ts';
import { confirmRestoreCanvasDraftModal } from './ui/components/ConfirmRestoreCanvasDraftModal.ts';
import { openCanvasVersionHistoryModal } from './ui/components/CanvasVersionHistoryModal.ts';
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
import {
  AppRuntime,
  createAppRuntime,
  type AppRuntimeSnapshot,
} from '../../app-runtime/index.ts';
import { Status } from '../../majom-wrapper/interfaces/index.ts';
import type {
  CanvasDraftRepository,
  CanvasDraftSnapshot,
} from './drafts/CanvasDraftRepository.ts';
import { CanvasDraftSerializer } from './drafts/CanvasDraftSerializer.ts';
import { LocalStorageCanvasDraftRepository } from './drafts/LocalStorageCanvasDraftRepository.ts';
import {
  readCanvasMetaFingerprint,
} from './drafts/canvasMetaFingerprint.ts';
import {
  type CanvasRestoreDiff,
} from './drafts/CanvasRestoreDiff.ts';

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
const CANVAS_UI_STATE_CHANGED_EVENT = 'canvasUiStateChanged';

export class CanvasApp {
  private readonly dataProvider: IDataProvider;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly diagramRepository: DiagramRepository;
  private readonly authService: AuthService;
  private readonly uiManager: UIManager;
  private readonly canvasDataService: CanvasDataService;
  private readonly draftRepository: CanvasDraftRepository;
  private readonly draftSerializer: CanvasDraftSerializer;
  private readonly draftRecoveryCoordinator: CanvasDraftRecoveryCoordinator;
  private readonly restoreReplayCoordinator: CanvasRestoreReplayCoordinator;
  private readonly persistenceState: CanvasPersistenceState;
  private readonly chatCanvasActionExecutor: AiAssistantCanvasActionExecutor;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
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
  private historyChangesSubscription: Subscription | null = null;
  private elementUpdateStatusSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private draftPersistTimer: number | null = null;
  private draftReconciliationToken = 0;
  private destroyed = false;
  private isApplyingLocalDraft = false;
  private readonly canvasListCache = new Map<string, CanvasListCacheItem>();
  private aiAssistantPreviousSnapshot: AiAssistantCanvasSnapshot | null = null;
  private aiAssistantRecentActivity: AiAssistantRecentActivityItem[] = [];
  private aiAssistantViewportSyncTimer: number | null = null;

  private readonly refreshCanvasDataHandler = (): void => {
    void this.handleRefreshCanvasData();
  };
  private readonly saveCanvasLayoutHandler = (): void =>
    this.handleSaveCanvasLayoutRequest();
  private readonly canvasTitleEditedHandler = (event: Event): void =>
    this.handleCanvasTitleEdited(event);
  private readonly canvasSelectedHandler = (event: Event): void => {
    void this.handleCanvasSelected(event);
  };
  private readonly canvasCreateRequestedHandler = (): void => {
    void this.handleCanvasCreateRequested();
  };
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
  private readonly canvasVersionHistoryRequestedHandler = (): void => {
    void this.handleCanvasVersionHistoryRequested();
  };
  private readonly elementDetailsEditedHandler = (event: Event): void =>
    this.handleElementDetailsEdited(event);
  private readonly canvasPositionsDirtyHandler = (event: Event): void =>
    this.handleCanvasPositionsDirty(event);
  private readonly elementDeleteRequestedHandler = (event: Event): void =>
    this.handleElementDeleteRequested(event);
  private readonly habitCanvasMutationRequestedHandler = (event: Event): void =>
    this.handleHabitCanvasMutationRequested(event);
  private readonly canvasLinkLifecycleHandler = (event: Event): void =>
    this.handleCanvasLinkLifecycle(event);
  private readonly canvasAutosaveToggledHandler = (event: Event): void =>
    this.handleCanvasAutosaveToggled(event);
  private readonly runtimeSnapshotHandler = (snapshot: AppRuntimeSnapshot): void =>
    this.handleRuntimeSnapshot(snapshot);

  constructor(
    dataProvider: IDataProvider,
    canvasElement?: HTMLCanvasElement,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.dataProvider = dataProvider;
    this.runtime = runtime;
    this.i18n = this.runtime.i18n;
    const resolvedCanvas = canvasElement ?? document.getElementById('myCanvas');
    if (!(resolvedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found');
    }
    this.canvas = resolvedCanvas;

    // Створюємо нову сцену (це місце для зберігання всіх елементів)
    this.scene = new Scene();

    // Передаємо сцену в CanvasManager, щоб менеджер міг працювати з даними
    this.canvasManager = new CanvasManager(this.canvas, this.scene);
    this.canvasManager.setCanvasRuntimeTheme(this.runtime.getTheme());
    // Використовуємо провайдера для створення репозиторію діаграми
    this.diagramRepository = new DiagramRepository(dataProvider);
    // Ініціалізація сервісу аутентифікації
    this.authService = new AuthService();
    this.persistenceState = new CanvasPersistenceState();
    this.draftRepository = new LocalStorageCanvasDraftRepository();
    this.draftSerializer = new CanvasDraftSerializer();
    this.draftRecoveryCoordinator = new CanvasDraftRecoveryCoordinator({
      draftRepository: this.draftRepository,
      confirmRestore: confirmRestoreCanvasDraftModal,
      applySnapshot: (snapshot, restoreDiff) => {
        this.applyCanvasDraftSnapshot(snapshot, restoreDiff);
      },
    });
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.canvasDataService = new CanvasDataService(
      new TasksApiService(http),
      new StoriesApiService(http),
      new GoalsApiService(http),
      new HabitsApiService(http),
      new CanvasApiService(http),
      new CanvasRelationsApiService(http),
      new GoalRelationsApiService(http)
    );
    this.restoreReplayCoordinator = new CanvasRestoreReplayCoordinator({
      scene: this.scene,
      canvasDataService: this.canvasDataService,
      persistenceState: this.persistenceState,
      onSettled: () => {
        void this.clearActiveCanvasDraftIfSettled();
      },
    });
    // Створюємо компонент для авторизації
    // Використовуємо UIManager для монтування UI-компонентів
    this.uiManager = new UIManager(
      this.canvasManager,
      this.scene,
      this.authService,
      this.persistenceState,
      () => this.canvasDataService.getActiveCanvasId(),
      () => this.canTriggerManualSave(),
      () => this.i18n.t('saveButton.waitForCanvasLoad'),
      () => this.canMutateCanvasStructure(),
      () => this.notifyCanvasMutationBlocked(),
      this.runtime
    );
    this.chatCanvasActionExecutor = new AiAssistantCanvasActionExecutor({
      scene: this.scene,
      canvasManager: this.canvasManager,
    });
    this.uiManager.mountAll(document.body);

    this.elementUpdateStatusSubscription =
      this.canvasDataService.elementUpdateStatusChanges.subscribe((status) => {
        if (!isCanvasElementAutosaveStatusDetail(status)) return;
        emitCanvasElementAutosaveStatus(status);
        this.restoreReplayCoordinator.handleElementAutosaveStatus(
          status,
          this.canvasDataService.getActiveCanvasId()
        );
        if (
          status.status === 'saved' &&
          status.canvasId &&
          status.canvasId === this.canvasDataService.getActiveCanvasId()
        ) {
          void this.clearActiveCanvasDraftIfSettled();
        }
      });
    this.historyChangesSubscription = historyService.changes.subscribe(() => {
      this.persistenceState.syncHistoryLayoutDirty(
        historyService.hasUnsavedChanges()
      );
    });
    this.persistenceState.syncHistoryLayoutDirty(
      historyService.hasUnsavedChanges()
    );

    // Register commands from config
    getCommandConfigs(this.scene, this.canvasManager, {
      canMutateStructure: () => this.canMutateCanvasStructure(),
      onMutationBlocked: () => this.notifyCanvasMutationBlocked(),
    }).forEach((cmd) => {
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
      'canvasVersionHistoryRequested',
      this.canvasVersionHistoryRequestedHandler
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
      'habitCanvasMutationRequested',
      this.habitCanvasMutationRequestedHandler
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
      'canvasVersionHistoryRequested',
      this.canvasVersionHistoryRequestedHandler
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
      'habitCanvasMutationRequested',
      this.habitCanvasMutationRequestedHandler
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
    if (!this.canPersistCanvasState()) {
      notify(this.i18n.t('canvas.waitForCanvasLoadBeforePersisting'), 'info');
      return;
    }
    if (!this.persistenceState.hasLayoutDirty()) {
      this.retryRestoreReplayPersistence();
      return;
    }
    const tokenAtStart = historyService.getStateToken();
    this.saveCanvasLayout(true).subscribe({
      next: (saved) => {
        if (saved && historyService.isTokenCurrent(tokenAtStart)) {
          historyService.markSaved(tokenAtStart);
          this.persistenceState.clearRestoredLayoutDirty();
          void this.clearActiveCanvasDraftIfSettled();
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

  private handleRuntimeSnapshot(snapshot: AppRuntimeSnapshot): void {
    this.canvasManager.setCanvasRuntimeTheme(snapshot.theme);
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

  private async handleCanvasSelected(event: Event): Promise<void> {
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
    if (isCanvasSwitched) {
      await this.persistActiveCanvasDraftNow();
    }
    this.canvasDataService.loadCanvasDetails(id).subscribe({
      next: (canvas) => {
        void this.activateCanvasSession(canvas, {
          resetPersistenceTracking: isCanvasSwitched,
        });
      },
      error: (err) => {
        console.error('Failed to load canvas details', err);
        this.canvasDataService.setActiveCanvas({ id, name });
        void this.activateCanvasSession(
          { id, name },
          { resetPersistenceTracking: isCanvasSwitched }
        );
      },
    });
  }

  private async handleCanvasCreateRequested(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    await this.persistActiveCanvasDraftNow();
    this.canvasDataService.createCanvas('New canvas').subscribe({
      next: (canvas) => {
        void this.activateCanvasSession(canvas, {
          resetPersistenceTracking: true,
        });
      },
      error: (err) => {
        console.error('Failed to create canvas', err);
        notify('Failed to create canvas', 'error');
      },
    });
  }

  private async handleRefreshCanvasData(): Promise<void> {
    await this.persistActiveCanvasDraftNow();
    this.loadCanvasFromApi();
  }

  private async handleCanvasDuplicateRequested(): Promise<void> {
    if (!this.canPersistCanvasState()) {
      notify(this.i18n.t('canvas.waitForCanvasLoadBeforePersisting'), 'info');
      return;
    }
    if (this.isLinkDecisionPending()) {
      notify(this.i18n.t('canvas.finishRelationConfirmationFirst'), 'info');
      return;
    }
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }

    const elements = this.scene
      .getElements()
      .filter(isCanvasPlanningElement) as CanvasPlanningElement[];
    const duplicateTitle = this.buildDuplicateCanvasTitle(this.canvasTitle);
    const currentViewState = this.getCurrentViewState();

    try {
      const duplicatedCanvas = await firstValueFrom(
        this.canvasDataService.createCanvas(duplicateTitle)
      );
      this.setCanvasTitle(duplicatedCanvas.name);
      this.refreshCanvasList(duplicatedCanvas.id);

      await firstValueFrom(
        this.canvasDataService.ensureElementsPersisted(elements)
      );
      const saved = await firstValueFrom(
        this.saveLayoutPositions(elements, false, 'system')
      );
      if (!saved) {
        throw new Error('Canvas duplication skipped layout persistence.');
      }

      await this.dataProvider.saveViewState(
        currentViewState,
        duplicatedCanvas.id
      );
      this.resetHistoryAndPersistence();
      notify(this.i18n.t('canvas.duplicateSuccess'), 'success');
    } catch (err) {
      console.error('Failed to duplicate canvas', err);
      notify(this.i18n.t('canvas.duplicateFailed'), 'error');
    }
  }

  private async handleCanvasVersionHistoryRequested(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('canvas-access');
      return;
    }
    const activeCanvasId = this.canvasDataService.getActiveCanvasId();
    if (!activeCanvasId) return;

    openCanvasVersionHistoryModal({
      canvasTitle: this.canvasTitle,
      runtime: this.runtime,
      loadVersions: () =>
        firstValueFrom(this.canvasDataService.loadCanvasHistory(activeCanvasId)),
      restoreVersion: async (versionId) => {
        await this.persistActiveCanvasDraftNow();
        const snapshot = await firstValueFrom(
          this.canvasDataService.restoreCanvasHistoryVersion(
            activeCanvasId,
            versionId
          )
        );
        this.setCanvasTitle(snapshot.canvas.name);
        this.canvasListCache.set(activeCanvasId, {
          id: activeCanvasId,
          name: snapshot.canvas.name,
          meta: snapshot.canvas.meta ?? null,
        });
        this.emitCanvasList(
          this.getCanvasListUiItemsFromCache(),
          activeCanvasId
        );
        this.resetHistoryAndPersistence();
        this.loadActiveCanvasElements();
        notify(this.i18n.t('canvasHistory.restoreSuccess'), 'success');
      },
    });
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
      element?: CanvasPlanningElement;
      patch?: Partial<{
        title: string;
        description: string;
        status: ElementStatus;
        priority: UiPriority;
        dueDate: Date | null;
        tagIds: number[];
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
      elements?: CanvasPlanningElement[];
    }>;
    const elements = (customEvent.detail?.elements ?? []).filter(
      (el): el is CanvasPlanningElement => isCanvasPlanningElement(el)
    );
    if (elements.length === 0) return;
    this.canvasDataService.markPositionsDirty(elements);
  }

  private handleElementDeleteRequested(event: Event): void {
    const customEvent = event as CustomEvent<{
      element?: CanvasPlanningElement;
    }>;
    const element = customEvent.detail?.element;
    if (!element) return;
    if (!this.canMutateCanvasStructure()) {
      this.notifyCanvasMutationBlocked();
      return;
    }
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

  private handleHabitCanvasMutationRequested(event: Event): void {
    const customEvent = event as CustomEvent<{
      element?: HabitElement;
      action?:
        | 'toggle-completion-today'
        | 'mark-done-today'
        | 'undo-today'
        | 'set-completion-date'
        | 'archive'
        | 'restore';
      date?: string;
      completed?: boolean;
    }>;
    const element = customEvent.detail?.element;
    const action = customEvent.detail?.action;
    const dateKey = customEvent.detail?.date;
    const completed = customEvent.detail?.completed;
    if (!(element instanceof HabitElement) || !action) return;
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('protected-action');
      return;
    }
    const parsedDate =
      typeof dateKey === 'string' && dateKey.trim().length > 0
        ? new Date(`${dateKey}T12:00:00`)
        : new Date();
    const request$ =
      action === 'toggle-completion-today'
        ? this.canvasDataService.setHabitCompletionToday(
            element,
            !element.completedToday
          )
        : action === 'mark-done-today'
          ? this.canvasDataService.setHabitCompletionToday(element, true)
          : action === 'undo-today'
            ? this.canvasDataService.setHabitCompletionToday(element, false)
            : action === 'set-completion-date'
              ? this.canvasDataService.setHabitCompletionToday(
                  element,
                  completed === true,
                  parsedDate
                )
            : this.canvasDataService.updateHabitLifecycleStatus(
                element,
                action === 'archive' ? Status.Archived : Status.Active
              );
    request$.subscribe({
      next: () => {
        this.scene.changes.next();
      },
      error: (err) => {
        console.error('Failed to update routine on canvas', err);
        notify('Failed to update routine', 'error');
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
      const taskStoryLink = this.resolveTaskStoryLink(detail.taskStoryLink);
      if (!taskStoryLink) {
        notify('Failed to resolve task link', 'error');
        return;
      }
      this.canvasDataService
        .updateTaskStoryLink(taskStoryLink)
        .subscribe({
          error: (err) => {
            console.error('Failed to update task story link', err);
            notify('Failed to update task link', 'error');
          },
      });
      return;
    }
    if (detail.kind === 'goal-link') {
      void this.handleGoalLinkLifecycle(detail);
      return;
    }
    const storyGoalLink = this.resolveStoryGoalLink(detail.storyGoalLink);
    if (!storyGoalLink) {
      notify('Failed to resolve story goal link', 'error');
      return;
    }
    void this.handleStoryGoalLinkSet(storyGoalLink.story, storyGoalLink.goal);
  }

  public async init(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Cannot init destroyed App instance.');
    }
    this.canvasManager.init();
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      this.runtimeSnapshotHandler,
      { emitCurrent: true }
    );
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
      this.scheduleAiAssistantContextEmit();
    });
    // Auto-save diagram on content change
    this.sceneChangesSubscription = this.scene.changes.subscribe(() => {
      if (this.isHydratingCanvas || this.isApplyingLocalDraft) return;
      void this.diagramRepository.saveDiagram(this.scene);
      this.scheduleActiveCanvasDraftPersist();
      this.emitAiAssistantContext();
    });
    this.emitAiAssistantContext();
    this.startAutosave();
  }

  public destroy(): void {
    if (this.destroyed) return;
    void this.persistActiveCanvasDraftNow();
    this.destroyed = true;
    this.draftReconciliationToken += 1;
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
    if (this.draftPersistTimer !== null) {
      window.clearTimeout(this.draftPersistTimer);
      this.draftPersistTimer = null;
    }
    this.sceneChangesSubscription?.unsubscribe();
    this.sceneChangesSubscription = null;
    this.historyChangesSubscription?.unsubscribe();
    this.historyChangesSubscription = null;
    this.elementUpdateStatusSubscription?.unsubscribe();
    this.elementUpdateStatusSubscription = null;
    this.resetCanvasPersistenceTracking();
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
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
    const planningElements = this.scene
      .getElements()
      .filter(isTaskStoryGoalPlanningElement);
    const selectedPlanningElements = this.scene
      .getSelectedElements()
      .filter(isTaskStoryGoalPlanningElement);
    const detail: AiAssistantCanvasSnapshot = {
      canvasId: this.canvasDataService.getActiveCanvasId(),
      canvasTitle: this.canvasTitle,
      summary: {
        goalCount: planningElements.filter(
          (element) => element instanceof GoalElement
        ).length,
        storyCount: planningElements.filter(
          (element) => element instanceof StoryElement
        ).length,
        taskCount: planningElements.filter(
          (element) => element instanceof TaskElement
        ).length,
        selectedCount: selectedPlanningElements.length,
      },
      selectionIds: selectedPlanningElements.map((element) => element.id),
      focusId: this.getPlanningFocusId(),
      highlightedIds: this.scene
        .getHighlightedElementIds()
        .filter((id) => planningElements.some((element) => element.id === id)),
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
      this.resetHistoryAndPersistence();
      this.setCanvasTitle('New canvas');
      this.refreshCanvasList(null);
      return;
    }
    this.canvasDataService.clearElementCache();
    this.canvasDataService.bootstrapCanvas().subscribe({
      next: ({ canvases, activeCanvas }) => {
        void this.activateCanvasSession(
          activeCanvas,
          {
            resetPersistenceTracking: true,
            refreshCanvasList: false,
          },
          () => {
            this.setCanvasListCache(canvases);
            this.emitCanvasList(
              this.getCanvasListUiItemsFromCache(),
              activeCanvas.id
            );
          }
        );
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
      .filter(isCanvasPlanningElement) as CanvasPlanningElement[];
    const saveSource: CanvasSaveSource = showNotifications
      ? 'manual'
      : 'autosave';
    emitCanvasSaveStarted(saveSource);
    return this.canvasDataService.ensureElementsPersisted(elements).pipe(
      switchMap(() =>
        this.saveLayoutPositions(
          elements,
          showNotifications,
          saveSource === 'manual' ? 'manual-save' : 'autosave'
        )
      ),
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
    elements: CanvasPlanningElement[],
    showNotifications: boolean,
    saveSource: 'manual-save' | 'autosave' | 'restore' | 'system' =
      showNotifications ? 'manual-save' : 'autosave'
  ): Observable<boolean> {
    const positions: CanvasPositionWriteDTO[] = [];
    const missingIds: string[] = [];

    elements.forEach((el) => {
      const elementType =
        el instanceof TaskElement
          ? 'task'
          : el instanceof StoryElement
            ? 'story'
            : el instanceof GoalElement
              ? 'goal'
              : 'habit';
      const elementRef = this.getLayoutPersistenceRef(el);
      if (!elementRef) {
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
        element_uuid: elementRef,
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
    const relationCapableElements = elements.filter(isRelationPlanningElement);
    const hasRelationChanges = this.canvasDataService.hasRelationChanges(
      this.scene.getConnections(),
      relationCapableElements
    );
    const uniquePositions = this.dedupeLayoutPositions(positions);
    const changedPositions =
      this.canvasDataService.filterPositionUpdates(uniquePositions);
    const layoutDraftId = 'layout-sync';
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

    return this.canvasDataService
      .saveCanvasSnapshot({
        positions: uniquePositions,
        connections: this.scene.getConnections(),
        elements: relationCapableElements,
        source: saveSource,
        canvas: {
          name: this.canvasTitle,
          meta: this.canvasDataService.getActiveCanvasMeta() ?? null,
        },
      })
      .pipe(
      map(() => {
        this.removeUnsyncedDraft(layoutDraftId);
        this.removeUnsyncedDraft('relations-sync');
        if (showNotifications) {
          notify('Layout saved', 'success');
        }
        return true;
      }),
      catchError((err) => {
        this.queueUnsyncedDraft(layoutDraftId, 'layout', {
          positions: uniquePositions,
          removedPositionIds,
          relationCount: this.scene.getConnections().length,
          baseRevision: this.canvasDataService.getActiveCanvasRevision(),
        });
        console.error('Failed to save canvas snapshot', err);
        if (showNotifications) {
          notify(
            this.isSnapshotConflictError(err)
              ? this.i18n.t('canvas.snapshotOutOfDate')
              : 'Failed to save layout',
            'error'
          );
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

  private captureActiveCanvasDraftSnapshot(): CanvasDraftSnapshot | null {
    if (!this.authService.isLoggedIn()) {
      return null;
    }
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return null;
    return this.draftSerializer.capture(
      canvasId,
      this.scene,
      readCanvasMetaFingerprint(this.canvasDataService.getActiveCanvasMeta())
    );
  }

  private scheduleActiveCanvasDraftPersist(): void {
    if (!this.authService.isLoggedIn()) return;
    if (this.draftPersistTimer !== null) {
      window.clearTimeout(this.draftPersistTimer);
    }
    this.draftPersistTimer = window.setTimeout(() => {
      this.draftPersistTimer = null;
      void this.persistActiveCanvasDraftNow();
    }, 400);
  }

  private async persistActiveCanvasDraftNow(): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    if (this.isHydratingCanvas || this.isApplyingLocalDraft || this.destroyed) {
      return;
    }
    if (this.draftPersistTimer !== null) {
      window.clearTimeout(this.draftPersistTimer);
      this.draftPersistTimer = null;
    }
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return;
    const hasRecoverableLocalChanges =
      this.persistenceState.hasLayoutDirty() ||
      this.persistenceState.hasRestoredReplayPending() ||
      this.persistenceState.hasRestoredReplayFailed() ||
      this.canvasDataService.hasUnpersistedElementUpdates();
    if (!hasRecoverableLocalChanges) {
      await this.draftRepository.clear(canvasId);
      return;
    }
    const snapshot = this.captureActiveCanvasDraftSnapshot();
    if (!snapshot) return;
    await this.draftRepository.save(snapshot);
  }

  private async clearActiveCanvasDraftIfSettled(): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return;
    if (this.persistenceState.hasLayoutDirty()) return;
    if (this.persistenceState.hasRestoredReplayPending()) return;
    if (this.persistenceState.hasRestoredReplayFailed()) return;
    if (this.canvasDataService.hasUnpersistedElementUpdates()) return;
    if (this.draftPersistTimer !== null) {
      window.clearTimeout(this.draftPersistTimer);
      this.draftPersistTimer = null;
    }
    await this.draftRepository.clear(canvasId);
  }

  private resetCanvasPersistenceTracking(): void {
    this.restoreReplayCoordinator.reset();
  }

  private resetHistoryAndPersistence(): void {
    historyService.reset();
    this.resetCanvasPersistenceTracking();
  }

  private async activateCanvasSession(
    canvas: { id: string; name: string },
    options: {
      resetPersistenceTracking?: boolean;
      refreshCanvasList?: boolean;
      loadElements?: boolean;
    } = {},
    beforeLoad?: () => void
  ): Promise<void> {
    if (options.resetPersistenceTracking) {
      this.resetHistoryAndPersistence();
    }
    this.setCanvasTitle(canvas.name);
    beforeLoad?.();
    await this.restoreCanvasViewState(canvas.id);
    if (options.loadElements !== false) {
      this.loadActiveCanvasElements();
    }
    if (options.refreshCanvasList !== false) {
      this.refreshCanvasList(canvas.id);
    }
  }

  private async reconcileActiveCanvasDraft(): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    const canvasId = this.canvasDataService.getActiveCanvasId();
    if (!canvasId) return;
    const hydratedSnapshot = this.captureActiveCanvasDraftSnapshot();
    if (!hydratedSnapshot) return;
    const token = ++this.draftReconciliationToken;
    await this.draftRecoveryCoordinator.reconcile({
      canvasId,
      hydratedSnapshot,
      isStillCurrent: () =>
        token === this.draftReconciliationToken &&
        this.canvasDataService.getActiveCanvasId() === canvasId,
    });
  }

  private applyCanvasDraftSnapshot(
    snapshot: CanvasDraftSnapshot,
    restoreDiff: CanvasRestoreDiff | null = null
  ): void {
    const restored = this.draftSerializer.materialize(snapshot);
    this.isApplyingLocalDraft = true;
    try {
      this.scene.clear();
      this.replacePlanningElements(restored.elements);
      restored.connections.forEach((connection) => this.scene.addElement(connection));
      this.scene.setFocusedElementById(restored.focusedElementId);
      this.scene.setHighlightedElementIds(restored.highlightedElementIds);
      this.canvasManager.clearLoadingPlaceholders();
      this.canvasManager.setLoadPhase('elements-ready');
      this.canvasManager.draw();
      historyService.reset();
      if (restoreDiff?.hasStructuralChanges) {
        const structurallyChanged = restored.elements.filter((element) =>
          restoreDiff.structurallyChangedElementIds.includes(element.id)
        );
        this.canvasDataService.markPositionsDirty(structurallyChanged);
        this.persistenceState.markRestoredLayoutDirty();
      }
      this.restoreReplayCoordinator.replay(restoreDiff);
      this.emitAiAssistantContext();
    } finally {
      this.isApplyingLocalDraft = false;
    }
  }

  private retryRestoreReplayPersistence(): void {
    this.restoreReplayCoordinator.retry();
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
    if (!this.canPersistCanvasState()) return;
    if (this.isLinkDecisionPending()) return;
    if (!this.persistenceState.hasLayoutDirty()) return;
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
            this.persistenceState.clearRestoredLayoutDirty();
            void this.clearActiveCanvasDraftIfSettled();
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
    elements: CanvasPlanningElement[],
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
    elements: CanvasPlanningElement[],
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
      .filter((element): element is CanvasPlanningElement => Boolean(element))
      .map((element) => element.id);
    this.scene.setHighlightedElementIds(highlightedIds);
  }

  private replacePlanningElements(
    elements: CanvasPlanningElement[]
  ): void {
    this.scene.replaceElements(isPlanningElement, elements);
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
    const wasHydrating = this.isHydratingCanvas;
    this.isHydratingCanvas =
      this.isElementsHydrating || this.isRelationsHydrating;
    window.dispatchEvent(new CustomEvent(CANVAS_UI_STATE_CHANGED_EVENT));
    if (wasHydrating && !this.isHydratingCanvas) {
      void this.reconcileActiveCanvasDraft();
    }
  }

  private async handleCanvasDeleteRequested(event?: Event): Promise<void> {
    if (!this.canMutateCanvasStructure()) {
      this.notifyCanvasMutationBlocked();
      return;
    }
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
      await this.draftRepository.clear(targetCanvas.id);
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
        await this.activateCanvasSession(createdCanvas, {
          resetPersistenceTracking: true,
        });
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

      await this.activateCanvasSession(
        { id: nextCanvas.id, name: this.canvasTitle || nextCanvas.name },
        { resetPersistenceTracking: true }
      );
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
        ? normalizedTitle.slice(0, availableTitleLength).trimEnd()
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
    emitAiAssistantContextChanged({
      canvasId: null,
      canvasTitle: '',
      summary: {
        goalCount: 0,
        storyCount: 0,
        taskCount: 0,
        selectedCount: 0,
      },
      selectionIds: [],
      focusId: null,
      highlightedIds: [],
      elements: [],
      connections: [],
      viewport: null,
      recentActivity: [],
    });
  }

  private mapAiAssistantSelectionItem(
    element: GoalElement | StoryElement | TaskElement
  ): AiAssistantSelectionItem {
    if (element instanceof GoalElement) {
      return {
        id: element.id,
        kind: 'goal',
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
      };
    }

    if (element instanceof StoryElement) {
      return {
        id: element.id,
        kind: 'story',
        title: element.title,
        description: element.description ?? '',
        status: element.status,
        priority: element.priority,
        childCount: element.tasks.length,
      };
    }

    return {
      id: element.id,
      kind: 'task',
      title: element.title,
      description: element.description ?? '',
      status: element.status,
      priority: element.priority,
    };
  }

  private buildAiAssistantElements(
    planningElements: Array<TaskElement | StoryElement | GoalElement>
  ): AiAssistantCanvasElement[] {
    const goals = planningElements.filter(
      (element): element is GoalElement => element instanceof GoalElement
    );
    const stories = planningElements.filter(
      (element): element is StoryElement => element instanceof StoryElement
    );
    const tasks = planningElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const goalByBackendId = new Map<number, GoalElement>();
    goals.forEach((goal) => {
      if (typeof goal.backendId === 'number') {
        goalByBackendId.set(goal.backendId, goal);
      }
    });
    const refToPlanningId =
      this.buildAiAssistantElementRefMap(planningElements);
    const goalParentById = new Map<string, string | null>();
    goals.forEach((goal) => {
      goalParentById.set(goal.id, null);
    });

    const storyParentById = new Map<string, string | null>();
    stories.forEach((story) => {
      const backendGoal = Number.isFinite(story.goalBackendId)
        ? goalByBackendId.get(Number(story.goalBackendId))
        : undefined;
      storyParentById.set(story.id, backendGoal?.id ?? null);
    });
    this.scene
      .getConnections()
      .filter(
        (connection) =>
          connection.relationType === ConnectionRelationType.ParentChild
      )
      .forEach((connection) => {
        const fromId = refToPlanningId.get(connection.fromId);
        const toId = refToPlanningId.get(connection.toId);
        if (!fromId || !toId) return;
        const fromEl = planningElements.find(
          (element) => element.id === fromId
        );
        const toEl = planningElements.find((element) => element.id === toId);
        if (!(fromEl instanceof GoalElement)) return;
        if (toEl instanceof GoalElement) {
          goalParentById.set(toEl.id, fromEl.id);
          return;
        }
        if (toEl instanceof StoryElement) {
          storyParentById.set(toEl.id, fromEl.id);
        }
      });

    const taskParentById = new Map<string, string | null>();
    stories.forEach((story) => {
      story.tasks.forEach((task) => {
        taskParentById.set(task.id, story.id);
      });
    });
    tasks.forEach((task) => {
      if (!taskParentById.has(task.id)) {
        taskParentById.set(task.id, null);
      }
    });

    const storyChildIds = new Map<string, string[]>();
    stories.forEach((story) => {
      storyChildIds.set(
        story.id,
        story.tasks.map((task) => task.id)
      );
    });

    const goalChildIds = new Map<string, string[]>();
    goals.forEach((goal) => goalChildIds.set(goal.id, []));
    goals.forEach((goal) => {
      const parentId = goalParentById.get(goal.id);
      if (!parentId) return;
      const current = goalChildIds.get(parentId) ?? [];
      current.push(goal.id);
      goalChildIds.set(parentId, current);
    });
    stories.forEach((story) => {
      const parentId = storyParentById.get(story.id);
      if (!parentId) return;
      const current = goalChildIds.get(parentId) ?? [];
      current.push(story.id);
      goalChildIds.set(parentId, current);
    });

    return planningElements.map((element) => {
      const base = this.mapAiAssistantSelectionItem(element);
      const parentId =
        element instanceof GoalElement
          ? (goalParentById.get(element.id) ?? null)
          : element instanceof StoryElement
            ? (storyParentById.get(element.id) ?? null)
            : (taskParentById.get(element.id) ?? null);
      const childIds =
        element instanceof GoalElement
          ? (goalChildIds.get(element.id) ?? [])
          : element instanceof StoryElement
            ? (storyChildIds.get(element.id) ?? [])
            : [];
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
    planningElements: Array<TaskElement | StoryElement | GoalElement>
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
    planningElements: Array<TaskElement | StoryElement | GoalElement>
  ): Map<string, string> {
    const refToPlanningId = new Map<string, string>();
    planningElements.forEach((element) => {
      refToPlanningId.set(element.id, element.id);
      if (element.uuid) {
        refToPlanningId.set(element.uuid, element.id);
      }
    });
    return refToPlanningId;
  }

  private buildAiAssistantViewport(
    planningElements: Array<TaskElement | StoryElement | GoalElement>
  ): AiAssistantCanvasSnapshot['viewport'] {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const scale = panZoom.scale || 1;
    const minX = panZoom.scrollX / scale;
    const minY = panZoom.scrollY / scale;
    const maxX = (panZoom.scrollX + canvas.width) / scale;
    const maxY = (panZoom.scrollY + canvas.height) / scale;
    const visibleElementIds = planningElements
      .filter((element) => {
        const right = element.x + element.width;
        const bottom = element.y + element.height;
        return (
          right >= minX &&
          element.x <= maxX &&
          bottom >= minY &&
          element.y <= maxY
        );
      })
      .map((element) => element.id);
    return {
      minX,
      minY,
      maxX,
      maxY,
      visibleElementIds,
    };
  }

  private getPlanningFocusId(): string | null {
    const focusedId = this.scene.getFocusedElementId();
    if (!focusedId) return null;
    const focused = this.scene
      .getElements()
      .find((element) => element.id === focusedId);
    return focused && isPlanningElement(focused) ? focused.id : null;
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

  private canPersistCanvasState(): boolean {
    return (
      !this.isHydratingCanvas &&
      this.canvasManager.getLoadPhase() === 'elements-ready'
    );
  }

  private canTriggerManualSave(): boolean {
    return this.canPersistCanvasState();
  }

  private canMutateCanvasStructure(): boolean {
    return this.canPersistCanvasState();
  }

  private notifyCanvasMutationBlocked(): void {
    notify(
      this.i18n.t('canvas.waitForCanvasLoadBeforeDestructiveAction'),
      'info'
    );
  }

  private isSnapshotConflictError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' && status === 409;
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
      .updateStoryGoalLink({ story, goal }, {
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

  private async handleGoalLinkLifecycle(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>
  ): Promise<void> {
    this.beginLinkDecision();
    const request$ = this.buildGoalLinkRequest(detail);

    if (!request$) {
      this.rollbackGoalLinkLifecycle(detail);
      notify('Failed to sync goal relation', 'error');
      this.endLinkDecision();
      return;
    }

    request$
      .pipe(
        finalize(() => {
          this.endLinkDecision();
        })
      )
      .subscribe({
        next: () => {
          this.syncCanvasRelationsNow();
        },
        error: (err) => {
          this.rollbackGoalLinkLifecycle(detail);
          console.error('Failed to sync goal relation', err);
          notify('Failed to sync goal relation', 'error');
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
    const planningElements = this.scene
      .getElements()
      .filter(isCanvasPlanningElement) as CanvasPlanningElement[];
    const relationElements = planningElements.filter(isRelationPlanningElement);
    if (
      !this.canvasDataService.hasRelationChanges(
        this.scene.getConnections(),
        relationElements
      )
    ) {
      return;
    }
    this.canvasDataService
      .ensureElementsPersisted(planningElements)
      .pipe(
        switchMap(() =>
          this.saveLayoutPositions(planningElements, false, 'system')
        )
      )
      .subscribe({
        error: (err) => {
          console.error('Failed to sync canvas relations', err);
          notify('Failed to sync canvas relations', 'error');
        },
      });
  }

  private getLinkElementRef(element: { id: string; uuid?: string }): string {
    return element.uuid ?? element.id;
  }

  private getLayoutPersistenceRef(element: {
    uuid?: string;
    backendId?: string | number | null;
  }): string | null {
    if (element.uuid) return element.uuid;
    if (typeof element.backendId === 'string' && element.backendId.length > 0) {
      return element.backendId;
    }
    if (Number.isFinite(element.backendId)) {
      return String(element.backendId);
    }
    return null;
  }

  private getLinkElementBackendId(element: {
    id: string;
    backendId?: string | number | null;
  }): number | null {
    if (Number.isFinite(element.backendId)) {
      return Number(element.backendId);
    }
    const legacyId = Number(element.id);
    if (Number.isFinite(legacyId)) return legacyId;
    return null;
  }

  private resolveTaskStoryLink(
    taskStoryLink: TaskStoryLinkSnapshot
  ): { task: TaskElement; story: StoryElement | null } | null {
    const task = this.findTaskByLinkRef(
      taskStoryLink.taskRef,
      taskStoryLink.taskUuid
    );
    if (!task) {
      return null;
    }
    const story = taskStoryLink.storyRef
      ? this.findStoryByLinkRef(
          taskStoryLink.storyRef,
          taskStoryLink.storyUuid
        )
      : null;
    if (taskStoryLink.storyRef && !story) {
      return null;
    }
    return { task, story };
  }

  private resolveStoryGoalLink(
    storyGoalLink: StoryGoalLinkSnapshot
  ): { story: StoryElement; goal: GoalElement } | null {
    const story = this.findStoryByLinkRef(
      storyGoalLink.storyRef,
      storyGoalLink.storyUuid
    );
    const goal = this.findGoalByLinkRef(
      storyGoalLink.goalRef,
      storyGoalLink.goalUuid
    );
    if (!story || !goal) {
      return null;
    }
    return { story, goal };
  }

  private resolveGoalLink(
    goalLink: GoalLinkSnapshot
  ): {
    fromGoal: GoalElement;
    toGoal: GoalElement;
    relationType: ConnectionRelationType;
  } | null {
    const fromGoal = this.findGoalByLinkRef(
      goalLink.fromGoalRef,
      goalLink.fromGoalUuid
    );
    const toGoal = this.findGoalByLinkRef(
      goalLink.toGoalRef,
      goalLink.toGoalUuid
    );
    if (!fromGoal || !toGoal) {
      return null;
    }
    return {
      fromGoal,
      toGoal,
      relationType: goalLink.relationType,
    };
  }

  private findTaskByLinkRef(
    taskRef: string,
    taskUuid: string | null
  ): TaskElement | null {
    return (
      this.scene
        .getElements()
        .find(
          (element): element is TaskElement =>
            element instanceof TaskElement &&
            (element.id === taskRef ||
              element.uuid === taskRef ||
              (taskUuid !== null && element.uuid === taskUuid))
        ) ?? null
    );
  }

  private findStoryByLinkRef(
    storyRef: string,
    storyUuid: string | null
  ): StoryElement | null {
    return (
      this.scene
        .getElements()
        .find(
          (element): element is StoryElement =>
            element instanceof StoryElement &&
            (element.id === storyRef ||
              element.uuid === storyRef ||
              (storyUuid !== null && element.uuid === storyUuid))
        ) ?? null
    );
  }

  private findGoalByLinkRef(
    goalRef: string,
    goalUuid: string | null
  ): GoalElement | null {
    return (
      this.scene
        .getElements()
        .find(
          (element): element is GoalElement =>
            element instanceof GoalElement &&
            (element.id === goalRef ||
              element.uuid === goalRef ||
              (goalUuid !== null && element.uuid === goalUuid))
        ) ?? null
    );
  }

  private buildGoalLinkRequest(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>
  ): Observable<unknown> | null {
    if (detail.action === 'set') {
      const goalLink = this.resolveGoalLink(detail.goalLink);
      return goalLink
        ? this.canvasDataService.createGoalRelation(goalLink)
        : null;
    }
    if (detail.action === 'remove') {
      const goalLink = this.resolveGoalLink(detail.goalLink);
      return goalLink
        ? this.canvasDataService.deleteGoalRelation(goalLink)
        : null;
    }
    const currentGoalLink = this.resolveGoalLink(detail.currentGoalLink);
    const nextGoalLink = this.resolveGoalLink(detail.nextGoalLink);
    if (!currentGoalLink || !nextGoalLink) {
      return null;
    }
    return this.canvasDataService.updateGoalRelation(
      currentGoalLink,
      nextGoalLink
    );
  }

  private rollbackGoalLinkLifecycle(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>
  ): void {
    if (detail.action === 'set') {
      const connection = this.findConnectionById(detail.goalLink.connectionId);
      if (connection) {
        this.removeCanvasConnections([connection]);
      }
      return;
    }
    if (detail.action === 'remove') {
      const connection = this.findConnectionById(detail.goalLink.connectionId);
      if (connection) {
        this.applyGoalLinkSnapshot(connection, detail.goalLink);
        return;
      }
      this.scene.addElement(this.createConnectionFromGoalLink(detail.goalLink));
      this.scene.changes.next();
      return;
    }

    const connection =
      this.findConnectionById(detail.currentGoalLink.connectionId) ??
      this.findConnectionById(detail.nextGoalLink.connectionId);
    if (connection) {
      this.applyGoalLinkSnapshot(connection, detail.currentGoalLink);
      return;
    }
    this.scene.addElement(
      this.createConnectionFromGoalLink(detail.currentGoalLink)
    );
    this.scene.changes.next();
  }

  private findConnectionById(connectionId: string): IConnection | null {
    return (
      this.scene
        .getConnections()
        .find((connection) => connection.id === connectionId) ?? null
    );
  }

  private applyGoalLinkSnapshot(
    connection: IConnection,
    goalLink: GoalLinkSnapshot
  ): void {
    connection.fromId = goalLink.fromGoalRef;
    connection.toId = goalLink.toGoalRef;
    connection.lineType = goalLink.lineType;
    connection.relationType = goalLink.relationType;
    this.scene.changes.next();
  }

  private createConnectionFromGoalLink(goalLink: GoalLinkSnapshot): IConnection {
    return new Connection(
      goalLink.fromGoalRef,
      goalLink.toGoalRef,
      goalLink.connectionId,
      goalLink.lineType,
      goalLink.relationType
    );
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
