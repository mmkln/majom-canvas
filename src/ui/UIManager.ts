// ui/UIManager.ts
import { CanvasNavigationDock } from './CanvasNavigationDock.ts';
import { EditElementModal } from './components/EditElementModal.ts';
import { NotificationContainer } from './components/NotificationContainer.ts';
import { CanvasBoardSelector } from './components/CanvasBoardSelector.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { editElement$ } from '../core/eventBus.ts';
import { SaveControls } from './components/SaveControls.ts';
import { ContextMenu } from './ContextMenu.ts';
import { SelectionActionMenu } from './SelectionActionMenu.ts';
import { RelatedItemsPicker } from './RelatedItemsPicker.ts';
import { StatusPicker } from './StatusPicker.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import { environment } from '../config/environment.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from '../majom-wrapper/data-access/tasks-api-service.ts';
import { GoalsApiService } from '../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../majom-wrapper/data-access/stories-api-service.ts';
import { map } from 'rxjs/operators';
import { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';
import { AuthService } from '../majom-wrapper/data-access/auth-service.ts';
import { UserApiService } from '../majom-wrapper/data-access/user-api-service.ts';
import { CanvasMenu } from './components/CanvasMenu.ts';
import {
  EXISTING_PICKER_EVENT_NAMES,
  emitExistingPickerDropCompleted,
  type ExistingPickerDragMovedDetail,
  type ExistingPickerDragStateDetail,
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
  private existingPickerDragStateHandler: ((event: Event) => void) | null = null;
  private existingPickerDragMoveHandler: ((event: Event) => void) | null = null;
  private externalGoalDragOverlay: HTMLDivElement | null = null;
  private externalGoalDropPreview: HTMLDivElement | null = null;
  private externalGoalDragActive = false;
  private externalGoalDragPointer: { clientX: number; clientY: number } | null =
    null;
  private externalGoalLastDragOverAt = 0;
  private externalGoalPanVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private externalGoalPanRafId: number | null = null;
  private externalGoalGlobalDragOverHandler:
    | ((event: DragEvent) => void)
    | null = null;
  private externalGoalGlobalDropHandler: ((event: DragEvent) => void) | null =
    null;
  private canvasDragOverHandler: ((event: DragEvent) => void) | null = null;
  private canvasDropHandler: ((event: DragEvent) => void) | null = null;
  private uiRoot: HTMLDivElement | null = null;

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene,
    private readonly authService: AuthService
  ) {
    this.canvasNavigationDock = new CanvasNavigationDock(
      this.scene,
      this.canvasManager
    );
    const canvasBoardSelector = new CanvasBoardSelector();

    const http = new HttpInterceptorClient(environment.apiUrl);
    const tasksApi = new TasksApiService(http);
    const goalsApi = new GoalsApiService(http);
    const storiesApi = new StoriesApiService(http);
    const userApi = new UserApiService(http);
    const canvasMenu = new CanvasMenu(this.authService, userApi, {
      containerClassName: 'relative z-30 flex items-center',
    });
    const saveControls = new SaveControls(canvasMenu);
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
        )
    );
    const existingGoalPicker = new ExistingGoalPicker((term, page, pageSize) =>
      goalsApi
        .fetchGoals({
          page,
          pageSize,
          search: term || undefined,
        })
        .pipe(
          map((res) => ({
            items: res.results || [],
            hasMore: Boolean(res.next),
          }))
        )
    );
    const existingStoryPicker = new ExistingStoryPicker((term, page, pageSize) =>
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
        )
    );
    const contextMenu = new ContextMenu(
      this.scene,
      this.canvasManager,
      existingTaskPicker,
      existingGoalPicker,
      existingStoryPicker,
      this.addExistingTaskService,
      this.addExistingGoalService,
      this.addExistingStoryService
    );
    const bulkActions = new BulkActionsController(this.scene);
    const selectionActions = new SelectionActionMenu(
      this.scene,
      this.canvasManager,
      bulkActions
    );
    const relatedItemsPicker = new RelatedItemsPicker(
      this.scene,
      this.canvasManager
    );
    const statusPicker = new StatusPicker(
      this.scene,
      this.canvasManager,
      bulkActions
    );

    // Add controls to components list
    this.components.push(
      canvasBoardSelector,
      this.canvasNavigationDock,
      contextMenu,
      selectionActions,
      relatedItemsPicker,
      statusPicker,
      saveControls
    );
    // Notification container
    const notificationContainer = new NotificationContainer();
    this.components.push(notificationContainer);
    // Show modal on edit requests via RxJS bus
    editElement$.subscribe((el) => new EditElementModal(el, this.scene).show());
  }

  public mountAll(parent: HTMLElement = document.body): void {
    if (this.uiRoot) return;
    this.uiRoot = this.createUiRoot();
    parent.appendChild(this.uiRoot);

    this.components.forEach((c) => c.mount(this.uiRoot!));
    Array.from(this.uiRoot.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.pointerEvents = 'auto';
      }
    });

    // drag-and-drop from existing pickers to canvas
    const canvas = this.canvasManager.getCanvas();
    this.canvasDragOverHandler = (event: DragEvent) => event.preventDefault();
    this.canvasDropHandler = (event: DragEvent) => {
      event.preventDefault();
      const payload = this.parseDragPayload(event.dataTransfer);
      if (!payload) return;
      this.handleCanvasDropPayload(payload, event.clientX, event.clientY);
    };
    canvas.addEventListener('dragover', this.canvasDragOverHandler);
    canvas.addEventListener('drop', this.canvasDropHandler);

    this.existingPickerDragStateHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ExistingPickerDragStateDetail>;
      if (customEvent.detail?.active) {
        this.startExternalGoalDragMode();
      } else {
        this.stopExternalGoalDragMode();
      }
    };
    this.existingPickerDragMoveHandler = (event: Event) => {
      if (!this.externalGoalDragActive) return;
      const customEvent = event as CustomEvent<ExistingPickerDragMovedDetail>;
      const clientX = customEvent.detail?.clientX;
      const clientY = customEvent.detail?.clientY;
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
      this.externalGoalDragPointer = { clientX, clientY };
      this.externalGoalLastDragOverAt = performance.now();
      this.updateExternalGoalPanVelocity(clientX, clientY);
      this.ensureExternalGoalPanLoop();
      if (this.isInsideExternalGoalOverlay(clientX, clientY)) {
        this.updateExternalGoalDropPreview(clientX, clientY);
      } else if (this.externalGoalDropPreview) {
        this.externalGoalDropPreview.style.display = 'none';
      }
    };
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dragStateChanged,
      this.existingPickerDragStateHandler
    );
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dragMoved,
      this.existingPickerDragMoveHandler
    );
  }

  public unmountAll(): void {
    this.components.forEach((c) => c.unmount());
    if (this.existingPickerDragStateHandler) {
      window.removeEventListener(
        EXISTING_PICKER_EVENT_NAMES.dragStateChanged,
        this.existingPickerDragStateHandler
      );
      this.existingPickerDragStateHandler = null;
    }
    if (this.existingPickerDragMoveHandler) {
      window.removeEventListener(
        EXISTING_PICKER_EVENT_NAMES.dragMoved,
        this.existingPickerDragMoveHandler
      );
      this.existingPickerDragMoveHandler = null;
    }
    const canvas = this.canvasManager.getCanvas();
    if (this.canvasDragOverHandler) {
      canvas.removeEventListener('dragover', this.canvasDragOverHandler);
      this.canvasDragOverHandler = null;
    }
    if (this.canvasDropHandler) {
      canvas.removeEventListener('drop', this.canvasDropHandler);
      this.canvasDropHandler = null;
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
    return root;
  }

  private parseDragPayload(dataTransfer: DataTransfer | null): any | null {
    const json = dataTransfer?.getData('application/json');
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private handleCanvasDropPayload(
    payload: any,
    clientX: number,
    clientY: number
  ): void {
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const panZoom = this.canvasManager.getPanZoomManager();
    const x = (clientX - rect.left + panZoom.scrollX) / panZoom.scale;
    const y = (clientY - rect.top + panZoom.scrollY) / panZoom.scale;

    const existingItem = payload?.item ?? payload?.goal ?? payload?.story;
    if (payload?.kind === 'existing-goal' && existingItem) {
      this.addExistingGoalService.addOrFocus(existingItem, x, y);
      emitExistingPickerDropCompleted('existing-goal');
      return;
    }
    if (payload?.kind === 'existing-task' && existingItem) {
      this.addExistingTaskService.addOrFocus(existingItem, x, y);
      emitExistingPickerDropCompleted('existing-task');
      return;
    }
    if (payload?.kind === 'existing-story' && existingItem) {
      this.addExistingStoryService.addOrFocus(existingItem, x, y);
      emitExistingPickerDropCompleted('existing-story');
      return;
    }
  }

  private startExternalGoalDragMode(): void {
    if (this.externalGoalDragActive) return;
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.zIndex = '58';
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'transparent';
    overlay.style.cursor = 'grabbing';
    overlay.style.touchAction = 'none';

    const preview = document.createElement('div');
    preview.style.position = 'absolute';
    preview.style.width = '44px';
    preview.style.height = '44px';
    preview.style.border = '2px dashed #22c55e';
    preview.style.background = 'rgba(34, 197, 94, 0.12)';
    preview.style.clipPath =
      'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
    preview.style.pointerEvents = 'none';
    preview.style.display = 'none';
    preview.style.transform = 'translate(-50%, -50%)';
    overlay.appendChild(preview);

    overlay.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      this.externalGoalDragPointer = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      this.externalGoalLastDragOverAt = performance.now();
      this.updateExternalGoalDropPreview(event.clientX, event.clientY);
      this.updateExternalGoalPanVelocity(event.clientX, event.clientY);
      this.ensureExternalGoalPanLoop();
    });

    overlay.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      const payload = this.parseDragPayload(event.dataTransfer);
      if (!payload) return;
      this.handleCanvasDropPayload(payload, event.clientX, event.clientY);
      this.stopExternalGoalDragMode();
    });

    overlay.addEventListener('dragleave', (event: DragEvent) => {
      const next = event.relatedTarget as Node | null;
      if (!next || !overlay.contains(next)) {
        preview.style.display = 'none';
      }
    });

    document.body.appendChild(overlay);

    this.externalGoalGlobalDragOverHandler = (event: DragEvent) => {
      if (!this.externalGoalDragActive) return;
      this.externalGoalDragPointer = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      this.externalGoalLastDragOverAt = performance.now();
      this.updateExternalGoalPanVelocity(event.clientX, event.clientY);
      this.ensureExternalGoalPanLoop();

      if (!this.externalGoalDropPreview) return;
      if (this.isInsideExternalGoalOverlay(event.clientX, event.clientY)) {
        this.updateExternalGoalDropPreview(event.clientX, event.clientY);
      } else if (this.externalGoalDropPreview) {
        this.externalGoalDropPreview.style.display = 'none';
      }
    };
    window.addEventListener(
      'dragover',
      this.externalGoalGlobalDragOverHandler,
      true
    );

    this.externalGoalGlobalDropHandler = () => {
      this.stopExternalGoalDragMode();
    };
    window.addEventListener('drop', this.externalGoalGlobalDropHandler, true);

    canvas.style.pointerEvents = 'none';
    this.externalGoalDragOverlay = overlay;
    this.externalGoalDropPreview = preview;
    this.externalGoalDragActive = true;
    this.externalGoalDragPointer = null;
    this.externalGoalLastDragOverAt = 0;
    this.externalGoalPanVelocity = { x: 0, y: 0 };
  }

  private stopExternalGoalDragMode(): void {
    this.externalGoalDragActive = false;
    this.externalGoalPanVelocity = { x: 0, y: 0 };
    this.externalGoalDragPointer = null;
    this.externalGoalLastDragOverAt = 0;
    if (this.externalGoalPanRafId !== null) {
      cancelAnimationFrame(this.externalGoalPanRafId);
      this.externalGoalPanRafId = null;
    }
    if (this.externalGoalGlobalDragOverHandler) {
      window.removeEventListener(
        'dragover',
        this.externalGoalGlobalDragOverHandler,
        true
      );
      this.externalGoalGlobalDragOverHandler = null;
    }
    if (this.externalGoalGlobalDropHandler) {
      window.removeEventListener('drop', this.externalGoalGlobalDropHandler, true);
      this.externalGoalGlobalDropHandler = null;
    }
    const canvas = this.canvasManager.getCanvas();
    canvas.style.pointerEvents = '';
    if (this.externalGoalDragOverlay) {
      this.externalGoalDragOverlay.remove();
      this.externalGoalDragOverlay = null;
    }
    this.externalGoalDropPreview = null;
  }

  private updateExternalGoalDropPreview(
    clientX: number,
    clientY: number
  ): void {
    if (!this.externalGoalDropPreview || !this.externalGoalDragOverlay) return;
    const overlayRect = this.externalGoalDragOverlay.getBoundingClientRect();
    const localX = clientX - overlayRect.left;
    const localY = clientY - overlayRect.top;
    this.externalGoalDropPreview.style.display = 'block';
    this.externalGoalDropPreview.style.left = `${localX}px`;
    this.externalGoalDropPreview.style.top = `${localY}px`;
  }

  private updateExternalGoalPanVelocity(
    clientX: number,
    clientY: number
  ): void {
    const threshold = 96;
    const maxSpeed = 26;

    const speedByAxis = (
      pointer: number,
      min: number,
      max: number
    ): number => {
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
      x: speedByAxis(clientX, 0, window.innerWidth),
      y: speedByAxis(clientY, 0, window.innerHeight),
    };
  }

  private isInsideExternalGoalOverlay(clientX: number, clientY: number): boolean {
    if (!this.externalGoalDragOverlay) return false;
    const rect = this.externalGoalDragOverlay.getBoundingClientRect();
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
