// ui/UIManager.ts
import { CanvasNavigationDock } from './CanvasNavigationDock.ts';
import { EditElementModal } from './components/EditElementModal.ts';
import { StoryDetailsModal } from './components/StoryDetailsModal.ts';
import { GoalDetailsModal } from './components/GoalDetailsModal.ts';
import { NotificationContainer } from './components/NotificationContainer.ts';
import { CanvasBoardSelector } from './components/CanvasBoardSelector.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { editElement$ } from '../core/eventBus.ts';
import { SaveControls } from './components/SaveControls.ts';
import { ContextMenu } from './ContextMenu.ts';
import { SelectedConnectionActionMenu } from './SelectedConnectionActionMenu.ts';
import { SelectionActionMenu } from './SelectionActionMenu.ts';
import {
  RelatedItemsPicker,
  type RelatedItemsLookupPort,
} from './RelatedItemsPicker.ts';
import { StatusPicker } from './StatusPicker.ts';
import { StoryQuickCreateAction } from './StoryQuickCreateAction.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import { ExistingHabitPicker } from './components/ExistingHabitPicker.ts';
import { environment } from '../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.ts';
import { GoalRelationsApiService } from '../../../majom-wrapper/data-access/goal-relations-api-service.ts';
import { TasksApiService } from '../../../majom-wrapper/data-access/tasks-api-service.ts';
import { GoalsApiService } from '../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../majom-wrapper/data-access/stories-api-service.ts';
import { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import { map } from 'rxjs/operators';
import type { Subscription } from 'rxjs';
import { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';
import { AddExistingHabitService } from '../core/services/AddExistingHabitService.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { HabitElement } from '../elements/HabitElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import type { CanvasLoadingPlaceholder } from '../core/types/canvasLoading.ts';
import { AuthService } from '../../../majom-wrapper/data-access/auth-service.ts';
import { UserApiService } from '../../../majom-wrapper/data-access/user-api-service.ts';
import { CanvasMenu } from './components/CanvasMenu.ts';
import { CanvasPerfHud } from './CanvasPerfHud.ts';
import { CANVAS_PERF_LOG } from '../../../config/env/index.ts';
import { CanvasHudLayoutController } from './CanvasHudLayoutController.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { GoalRelatedItemsLookupService } from '../../../majom-wrapper/services/goal-related-items-lookup-service.ts';
import { CanvasPersistenceState } from '../core/services/CanvasPersistenceState.ts';
import {
  EXISTING_PICKER_EVENT_NAMES,
  emitExistingPickerDropCompleted,
  type ExistingPickerDragEndedDetail,
  type ExistingPickerDragPayload,
  type ExistingPickerDragMovedDetail,
  type ExistingPickerDragStartedDetail,
} from './events/existingPickerEvents.ts';

export class UIManager {
  private readonly components: {
    mount(parent?: HTMLElement): void;
    unmount(): void;
  }[] = [];
  private readonly canvasNavigationDock: CanvasNavigationDock;
  private readonly addExistingTaskService: AddExistingTaskService;
  private readonly addExistingGoalService: AddExistingGoalService;
  private readonly addExistingStoryService: AddExistingStoryService;
  private readonly addExistingHabitService: AddExistingHabitService;
  private existingPickerDragStartHandler: ((event: Event) => void) | null =
    null;
  private existingPickerDragMoveHandler: ((event: Event) => void) | null = null;
  private existingPickerDragEndHandler: ((event: Event) => void) | null = null;
  private externalGoalDragOverlay: HTMLDivElement | null = null;
  private externalGoalDropPreview: HTMLDivElement | null = null;
  private externalGoalDragActive = false;
  private activeExistingPickerDrag: ExistingPickerDragPayload | null = null;
  private externalGoalDragPointer: { clientX: number; clientY: number } | null =
    null;
  private externalGoalLastDragOverAt = 0;
  private externalGoalPanVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private externalGoalPanRafId: number | null = null;
  private uiRoot: HTMLDivElement | null = null;
  private editElementSubscription: Subscription | null = null;
  private readonly hudLayoutController = new CanvasHudLayoutController();

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene,
    private readonly authService: AuthService,
    private readonly persistenceState: CanvasPersistenceState,
    private readonly getActiveCanvasId: () => string | null,
    private readonly canTriggerManualSave: () => boolean,
    private readonly getManualSaveBlockedReason: () => string,
    private readonly canMutateCanvasStructure: () => boolean,
    private readonly onCanvasMutationBlocked: () => void,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
    this.canvasNavigationDock = new CanvasNavigationDock(
      this.scene,
      this.canvasManager,
      this.runtime
    );
    const canvasBoardSelector = new CanvasBoardSelector();

    const http = new HttpInterceptorClient(environment.apiUrl);
    const tasksApi = new TasksApiService(http);
    const goalsApi = new GoalsApiService(http);
    const storiesApi = new StoriesApiService(http);
    const habitsApi = new HabitsApiService(http);
    const userApi = new UserApiService(http);
    const goalRelatedItemsLookup = new GoalRelatedItemsLookupService(
      goalsApi,
      storiesApi,
      new GoalRelationsApiService(http)
    );
    const relatedItemsLookup: RelatedItemsLookupPort = {
      getStory: (ref) => storiesApi.getStory(ref),
      getGoalRelatedItems: (ref) => goalRelatedItemsLookup.getRelatedItems(ref),
    };
    const canvasMenu = new CanvasMenu(this.authService, userApi, {
      containerClassName: 'relative z-30 flex items-center',
      runtime: this.runtime,
      initialAnimationsEnabled: this.canvasManager.getAnimationsEnabled(),
      onAnimationsToggle: (enabled) =>
        this.canvasManager.setAnimationsEnabled(enabled),
      initialSmartGuidesEnabled: this.canvasManager.getSmartGuidesEnabled(),
      initialSpacingGuidesEnabled:
        this.canvasManager.getSmartGuidePreferences().showSpacingGuides,
      initialContainerGuidesEnabled:
        this.canvasManager.getSmartGuidePreferences().showContainerGuides,
      initialViewportCenterGuidesEnabled:
        this.canvasManager.getSmartGuidePreferences()
          .showViewportCenterGuides,
      onSmartGuidesToggle: (enabled) =>
        this.canvasManager.setSmartGuidesEnabled(enabled),
      onSpacingGuidesToggle: (enabled) =>
        this.canvasManager.setSmartGuidePreferences({
          showSpacingGuides: enabled,
        }),
      onContainerGuidesToggle: (enabled) =>
        this.canvasManager.setSmartGuidePreferences({
          showContainerGuides: enabled,
        }),
      onViewportCenterGuidesToggle: (enabled) =>
        this.canvasManager.setSmartGuidePreferences({
          showViewportCenterGuides: enabled,
        }),
    });
    const saveControls = new SaveControls(
      canvasMenu,
      this.persistenceState,
      this.getActiveCanvasId,
      {
        canTriggerManualSave: this.canTriggerManualSave,
        getManualSaveBlockedReason: this.getManualSaveBlockedReason,
      },
      this.runtime
    );
    this.addExistingTaskService = new AddExistingTaskService(
      this.scene,
      this.canvasManager
    );
    this.addExistingGoalService = new AddExistingGoalService(
      this.scene,
      this.canvasManager
    );
    this.addExistingStoryService = new AddExistingStoryService(
      this.scene,
      this.canvasManager
    );
    this.addExistingHabitService = new AddExistingHabitService(
      this.scene,
      this.canvasManager
    );
    const existingTaskPicker = new ExistingTaskPicker((term, page, pageSize) =>
      tasksApi
        .fetchTasks({
          page,
          pageSize,
          search: term || undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        ),
      30,
      this.runtime
    );
    const existingGoalPicker = new ExistingGoalPicker(({ term, page, pageSize, tagIds }) =>
      goalsApi
        .searchGoalsForPicker({
          page,
          pageSize,
          search: term || undefined,
          tags: tagIds.length > 0 ? tagIds : undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        ),
      30,
      this.runtime
    );
    const existingStoryPicker = new ExistingStoryPicker(
      (term, page, pageSize) =>
        storiesApi
          .fetchStories({
            page,
            pageSize,
            search: term || undefined,
          })
          .pipe(
            map((res) => ({
              items: res.results || [],
              hasMore: Boolean(res.next),
            }))
          ),
      30,
      this.runtime
    );
    const existingHabitPicker = new ExistingHabitPicker(
      (term, page, pageSize) =>
        habitsApi.getHabits().pipe(
          map((habits) => {
            const normalizedTerm = term.trim().toLowerCase();
            const filtered = normalizedTerm
              ? habits.filter((habit) => {
                  const title = habit.title?.toLowerCase() ?? '';
                  const description = habit.description?.toLowerCase() ?? '';
                  return (
                    title.includes(normalizedTerm) ||
                    description.includes(normalizedTerm)
                  );
                })
              : habits;
            const start = (page - 1) * pageSize;
            const items = filtered.slice(start, start + pageSize);
            return {
              items,
              hasMore: start + pageSize < filtered.length,
            };
          })
        ),
      30,
      this.runtime
    );
    const contextMenu = new ContextMenu(
      this.scene,
      this.canvasManager,
      existingTaskPicker,
      existingGoalPicker,
      existingStoryPicker,
      existingHabitPicker,
      this.addExistingTaskService,
      this.addExistingGoalService,
      this.addExistingStoryService,
      this.addExistingHabitService,
      {
        canMutateCanvasStructure: this.canMutateCanvasStructure,
        onCanvasMutationBlocked: this.onCanvasMutationBlocked,
      },
      this.runtime
    );
    const bulkActions = new BulkActionsController(this.scene, {
      canMutateStructure: this.canMutateCanvasStructure,
      onMutationBlocked: this.onCanvasMutationBlocked,
    });
    const selectionActions = new SelectionActionMenu(
      this.scene,
      this.canvasManager,
      bulkActions,
      this.runtime
    );
    const selectedConnectionActions = new SelectedConnectionActionMenu(
      this.scene,
      this.canvasManager,
      bulkActions,
      this.runtime
    );
    const relatedItemsPicker = new RelatedItemsPicker(
      this.scene,
      this.canvasManager,
      relatedItemsLookup,
      this.runtime
    );
    const statusPicker = new StatusPicker(
      this.scene,
      this.canvasManager,
      bulkActions
    );
    const storyQuickCreateAction = new StoryQuickCreateAction(
      this.scene,
      this.canvasManager,
      this.runtime
    );

    // Add controls to components list
    this.components.push(
      canvasBoardSelector,
      this.canvasNavigationDock,
      contextMenu,
      selectionActions,
      selectedConnectionActions,
      storyQuickCreateAction,
      relatedItemsPicker,
      statusPicker,
      saveControls
    );
    // Notification container
    const notificationContainer = new NotificationContainer();
    this.components.push(notificationContainer);
    if (CANVAS_PERF_LOG) {
      this.components.push(new CanvasPerfHud(this.canvasManager));
    }
    // Show modal on edit requests via RxJS bus
    this.editElementSubscription = editElement$.subscribe((el) => {
      if (el instanceof StoryElement) {
        new StoryDetailsModal(el, this.scene, this.runtime).show();
        return;
      }
      if (el instanceof GoalElement) {
        new GoalDetailsModal(el, this.scene, this.runtime).show();
        return;
      }
      new EditElementModal(el, this.scene).show();
    });
  }

  public mountAll(parent: HTMLElement = document.body): void {
    if (this.uiRoot) return;
    this.uiRoot = this.createUiRoot();
    this.hudLayoutController.mount(this.uiRoot);
    parent.appendChild(this.uiRoot);

    this.components.forEach((c) => c.mount(this.uiRoot!));
    Array.from(this.uiRoot.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.pointerEvents =
          child.dataset.uiPointerEvents === 'none' ? 'none' : 'auto';
      }
    });

    this.existingPickerDragStartHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ExistingPickerDragStartedDetail>;
      const detail = customEvent.detail;
      if (!detail?.item) return;
      this.activeExistingPickerDrag = detail;
      this.startExternalGoalDragMode(
        detail.title,
        detail.clientX,
        detail.clientY
      );
    };
    this.existingPickerDragMoveHandler = (event: Event) => {
      if (!this.externalGoalDragActive) return;
      const customEvent = event as CustomEvent<ExistingPickerDragMovedDetail>;
      const clientX = customEvent.detail?.clientX;
      const clientY = customEvent.detail?.clientY;
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
      this.updateExternalGoalDragPointer(clientX, clientY);
    };
    this.existingPickerDragEndHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ExistingPickerDragEndedDetail>;
      const detail = customEvent.detail;
      const dragPayload = this.activeExistingPickerDrag;
      if (!dragPayload) {
        this.stopExternalGoalDragMode();
        return;
      }
      if (
        detail &&
        !detail.cancelled &&
        typeof detail.clientX === 'number' &&
        typeof detail.clientY === 'number' &&
        this.isInsideExternalGoalOverlay(detail.clientX, detail.clientY)
      ) {
        this.handleCanvasDropPayload(dragPayload, detail.clientX, detail.clientY);
      }
      this.stopExternalGoalDragMode();
    };
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dragStarted,
      this.existingPickerDragStartHandler
    );
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dragMoved,
      this.existingPickerDragMoveHandler
    );
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dragEnded,
      this.existingPickerDragEndHandler
    );
  }

  public unmountAll(): void {
    this.components.forEach((c) => c.unmount());
    this.editElementSubscription?.unsubscribe();
    this.editElementSubscription = null;
    this.hudLayoutController.unmount();
    if (this.existingPickerDragStartHandler) {
      window.removeEventListener(
        EXISTING_PICKER_EVENT_NAMES.dragStarted,
        this.existingPickerDragStartHandler
      );
      this.existingPickerDragStartHandler = null;
    }
    if (this.existingPickerDragMoveHandler) {
      window.removeEventListener(
        EXISTING_PICKER_EVENT_NAMES.dragMoved,
        this.existingPickerDragMoveHandler
      );
      this.existingPickerDragMoveHandler = null;
    }
    if (this.existingPickerDragEndHandler) {
      window.removeEventListener(
        EXISTING_PICKER_EVENT_NAMES.dragEnded,
        this.existingPickerDragEndHandler
      );
      this.existingPickerDragEndHandler = null;
    }
    this.stopExternalGoalDragMode();
    if (this.uiRoot) {
      this.uiRoot.remove();
      this.uiRoot = null;
    }
  }

  private createUiRoot(): HTMLDivElement {
    const root = document.createElement('div');
    root.id = 'canvas-ui-root';
    root.style.position = 'fixed';
    root.style.left = '0';
    root.style.top = '0';
    root.style.width = '100vw';
    root.style.height = '100vh';
    root.style.zIndex = '40';
    root.style.pointerEvents = 'none';
    root.style.overflow = 'hidden';
    return root;
  }

  private handleCanvasDropPayload(
    payload: ExistingPickerDragPayload,
    clientX: number,
    clientY: number
  ): void {
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const panZoom = this.canvasManager.getPanZoomManager();
    const x = (clientX - rect.left + panZoom.scrollX) / panZoom.scale;
    const y = (clientY - rect.top + panZoom.scrollY) / panZoom.scale;

    if (payload.kind === 'existing-goal') {
      this.addExistingGoalService.addOrFocus(payload.item, x, y);
      emitExistingPickerDropCompleted('existing-goal');
      return;
    }
    if (payload.kind === 'existing-habit') {
      this.addExistingHabitService.addOrFocus(payload.item, x, y);
      emitExistingPickerDropCompleted('existing-habit');
      return;
    }
    if (payload.kind === 'existing-task') {
      this.addExistingTaskService.addOrFocus(payload.item, x, y);
      emitExistingPickerDropCompleted('existing-task');
      return;
    }
    if (payload.kind === 'existing-story') {
      this.addExistingStoryService.addOrFocus(payload.item, x, y);
      emitExistingPickerDropCompleted('existing-story');
    }
  }

  private startExternalGoalDragMode(
    title: string,
    clientX: number,
    clientY: number
  ): void {
    if (this.externalGoalDragActive) return;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '58';
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'transparent';
    overlay.style.cursor = 'grabbing';
    overlay.style.touchAction = 'none';

    const preview = document.createElement('div');
    preview.style.position = 'fixed';
    preview.style.display = 'block';
    preview.style.maxWidth = '280px';
    preview.style.padding = '8px 12px';
    preview.style.border = '1px solid rgba(148, 163, 184, 0.24)';
    preview.style.borderRadius = '999px';
    preview.style.background = 'rgba(255,255,255,0.92)';
    preview.style.backdropFilter = 'blur(10px)';
    preview.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.10)';
    preview.style.color = '#0f172a';
    preview.style.pointerEvents = 'none';
    preview.style.left = '0';
    preview.style.top = '0';
    preview.style.transform = 'translate(-50%, -100%)';
    this.configureExternalDragPreview(preview, title);

    document.body.appendChild(overlay);
    document.body.appendChild(preview);
    this.externalGoalDragOverlay = overlay;
    this.externalGoalDropPreview = preview;
    this.externalGoalDragActive = true;
    this.externalGoalPanVelocity = { x: 0, y: 0 };
    this.updateExternalGoalDragPointer(clientX, clientY);
  }

  private stopExternalGoalDragMode(): void {
    this.externalGoalDragActive = false;
    this.activeExistingPickerDrag = null;
    this.externalGoalPanVelocity = { x: 0, y: 0 };
    this.externalGoalDragPointer = null;
    this.externalGoalLastDragOverAt = 0;
    if (this.externalGoalPanRafId !== null) {
      cancelAnimationFrame(this.externalGoalPanRafId);
      this.externalGoalPanRafId = null;
    }
    if (this.externalGoalDragOverlay) {
      this.externalGoalDragOverlay.remove();
      this.externalGoalDragOverlay = null;
    }
    if (this.externalGoalDropPreview) {
      this.externalGoalDropPreview.remove();
      this.externalGoalDropPreview = null;
    }
    this.canvasManager.clearTransientLoadingPlaceholder();
  }

  private updateExternalGoalDragPointer(
    clientX: number,
    clientY: number
  ): void {
    this.externalGoalDragPointer = { clientX, clientY };
    this.externalGoalLastDragOverAt = performance.now();
    this.updateExternalGoalPanVelocity(clientX, clientY);
    this.ensureExternalGoalPanLoop();
    this.updateExternalGoalDropPreview(clientX, clientY);
  }

  private updateExternalGoalDropPreview(
    clientX: number,
    clientY: number
  ): void {
    if (!this.externalGoalDropPreview) return;
    const insideCanvas = this.isInsideExternalGoalOverlay(clientX, clientY);
    const metrics = this.getExternalDragPlaceholderMetrics();
    this.updateExternalGoalCanvasPlaceholder(clientX, clientY, insideCanvas);
    this.externalGoalDropPreview.style.display = 'block';
    this.externalGoalDropPreview.style.left = `${clientX}px`;
    const scale = this.canvasManager.getPanZoomManager().scale;
    const topOffset =
      insideCanvas && metrics ? metrics.height * scale * 0.5 + 14 : 12;
    this.externalGoalDropPreview.style.top = `${clientY - topOffset}px`;
    this.externalGoalDropPreview.style.borderColor =
      'rgba(148, 163, 184, 0.24)';
    this.externalGoalDropPreview.style.background = 'rgba(255,255,255,0.92)';
  }

  private updateExternalGoalCanvasPlaceholder(
    clientX: number,
    clientY: number,
    insideCanvas: boolean
  ): void {
    if (!insideCanvas) {
      this.canvasManager.clearTransientLoadingPlaceholder();
      return;
    }
    const metrics = this.getExternalDragPlaceholderMetrics();
    if (!metrics) {
      this.canvasManager.clearTransientLoadingPlaceholder();
      return;
    }
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const sceneX =
      (clientX - rect.left + panZoom.scrollX) / panZoom.scale -
      metrics.width / 2;
    const sceneY =
      (clientY - rect.top + panZoom.scrollY) / panZoom.scale -
      metrics.height / 2;
    const placeholder: CanvasLoadingPlaceholder = {
      elementType: metrics.elementType,
      elementUuid: '__drag-placeholder__',
      x: sceneX,
      y: sceneY,
      width: metrics.width,
      height: metrics.height,
    };
    this.canvasManager.setTransientLoadingPlaceholder(placeholder);
  }

  private getExternalDragPlaceholderMetrics(): {
    elementType: CanvasLoadingPlaceholder['elementType'];
    width: number;
    height: number;
  } | null {
    const drag = this.activeExistingPickerDrag;
    if (!drag) return null;
    if (drag.kind === 'existing-goal') {
      return {
        elementType: 'goal',
        width: GoalElement.width,
        height: GoalElement.height,
      };
    }
    if (drag.kind === 'existing-habit') {
      return {
        elementType: 'habit',
        width: HabitElement.diameter,
        height: HabitElement.diameter,
      };
    }
    if (drag.kind === 'existing-task') {
      return {
        elementType: 'task',
        width: TaskElement.width,
        height: TaskElement.height,
      };
    }
    if (drag.kind === 'existing-story') {
      return {
        elementType: 'story',
        width: StoryElement.width,
        height: StoryElement.height,
      };
    }
    return null;
  }

  private configureExternalDragPreview(
    preview: HTMLDivElement,
    title: string
  ): void {
    const titleText = document.createElement('span');
    titleText.style.display = 'block';
    titleText.style.minWidth = '0';
    titleText.style.overflow = 'hidden';
    titleText.style.textOverflow = 'ellipsis';
    titleText.style.whiteSpace = 'nowrap';
    titleText.style.fontSize = '12px';
    titleText.style.fontWeight = '500';
    titleText.style.lineHeight = '1.25';
    titleText.style.letterSpacing = '-0.01em';
    titleText.style.color = '#0f172a';
    titleText.textContent = title.trim() || 'Untitled';

    preview.replaceChildren(titleText);
  }

  private updateExternalGoalPanVelocity(
    clientX: number,
    clientY: number
  ): void {
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      this.externalGoalPanVelocity = { x: 0, y: 0 };
      return;
    }
    const threshold = 96;
    const maxSpeed = 26;

    const speedByAxis = (pointer: number, min: number, max: number): number => {
      if (pointer < min + threshold) {
        const ratio = Math.min(1, (min + threshold - pointer) / threshold);
        return -maxSpeed * ratio;
      }
      if (pointer > max - threshold) {
        const ratio = Math.min(1, (pointer - (max - threshold)) / threshold);
        return maxSpeed * ratio;
      }
      return 0;
    };

    this.externalGoalPanVelocity = {
      x: speedByAxis(clientX, rect.left, rect.right),
      y: speedByAxis(clientY, rect.top, rect.bottom),
    };
  }

  private isInsideExternalGoalOverlay(
    clientX: number,
    clientY: number
  ): boolean {
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  private ensureExternalGoalPanLoop(): void {
    if (this.externalGoalPanRafId !== null) return;
    const tick = () => {
      if (!this.externalGoalDragActive) {
        this.externalGoalPanRafId = null;
        return;
      }
      if (performance.now() - this.externalGoalLastDragOverAt > 140) {
        this.externalGoalPanVelocity = { x: 0, y: 0 };
      }
      const { x, y } = this.externalGoalPanVelocity;
      if (x !== 0 || y !== 0) {
        const panZoom = this.canvasManager.getPanZoomManager();
        this.canvasManager.setScroll(panZoom.scrollX + x, panZoom.scrollY + y);
        if (this.externalGoalDragPointer) {
          this.updateExternalGoalDropPreview(
            this.externalGoalDragPointer.clientX,
            this.externalGoalDragPointer.clientY
          );
        }
      }
      this.externalGoalPanRafId = requestAnimationFrame(tick);
    };
    this.externalGoalPanRafId = requestAnimationFrame(tick);
  }
}
