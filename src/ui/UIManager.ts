// ui/UIManager.ts
import { CanvasControls } from './CanvasControls.ts';
import { ZoomIndicator } from './ZoomIndicator.ts';
import { CanvasToolbar } from './CanvasToolbar.ts';
import { EditElementModal } from './components/EditElementModal.ts';
import { NotificationContainer } from './components/NotificationContainer.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { editElement$ } from '../core/eventBus.ts';
import { UndoRedoControls } from './UndoRedoControls.ts';
import { PaletteMenu } from './components/PaletteMenu.ts';
import { SaveControls } from './components/SaveControls.ts';
import { ContextMenu } from './ContextMenu.ts';
import { SelectionActionMenu } from './SelectionActionMenu.ts';
import { RelatedItemsPicker } from './RelatedItemsPicker.ts';
import { StatusPicker } from './StatusPicker.ts';
import { MiniMap } from './MiniMap.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { mapStatus } from '../majom-wrapper/utils/statusMapping.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import { environment } from '../config/environment.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { GoalsApiService } from '../majom-wrapper/data-access/goals-api-service.ts';
import { map } from 'rxjs/operators';
import { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import {
  EXISTING_GOAL_EVENT_NAMES,
  emitExistingGoalDropCompleted,
  type ExistingGoalDragMovedDetail,
  type ExistingGoalDragStateDetail,
} from './events/existingGoalEvents.ts';

export class UIManager {
  private readonly components: {
    mount(parent?: HTMLElement): void;
    unmount(): void;
  }[] = [];
  private readonly canvasToolbar: CanvasToolbar;
  private readonly canvasControls: CanvasControls;
  private readonly zoomIndicator: ZoomIndicator;
  private readonly undoRedoControls: UndoRedoControls;
  private readonly addExistingGoalService: AddExistingGoalService;
  private existingGoalDragStateHandler: ((event: Event) => void) | null = null;
  private existingGoalDragMoveHandler: ((event: Event) => void) | null = null;
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

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene
  ) {
    // Initialize Canvas Toolbar for creating elements
    this.canvasToolbar = new CanvasToolbar(this.scene, this.canvasManager);
    this.canvasControls = new CanvasControls(this.canvasManager);
    const miniMap = new MiniMap(this.scene, this.canvasManager);
    this.zoomIndicator = new ZoomIndicator(this.canvasManager);
    this.undoRedoControls = new UndoRedoControls(this.canvasToolbar.container);

    // Initialize palette menu
    const paletteMenu = new PaletteMenu(this.scene);
    const saveControls = new SaveControls(this.scene);
    const goalsApi = new GoalsApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    this.addExistingGoalService = new AddExistingGoalService(
      this.scene,
      this.canvasManager
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
    const contextMenu = new ContextMenu(
      this.scene,
      this.canvasManager,
      existingGoalPicker,
      this.addExistingGoalService
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
      this.canvasControls,
      miniMap,
      this.zoomIndicator,
      paletteMenu,
      contextMenu,
      selectionActions,
      relatedItemsPicker,
      statusPicker,
      saveControls,
      this.canvasToolbar,
      this.undoRedoControls
    );
    // Notification container
    const notificationContainer = new NotificationContainer();
    this.components.push(notificationContainer);
    // Show modal on edit requests via RxJS bus
    editElement$.subscribe((el) => new EditElementModal(el, this.scene).show());
  }

  public mountAll(parent: HTMLElement = document.body): void {
    this.components.forEach((c) => c.mount(parent));

    // drag-and-drop from palette to canvas
    const canvas = this.canvasManager.getCanvas();
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const payload = this.parseDragPayload(e.dataTransfer);
      if (!payload) return;
      this.handleCanvasDropPayload(payload, e.clientX, e.clientY);
    });

    this.existingGoalDragStateHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ExistingGoalDragStateDetail>;
      if (customEvent.detail?.active) {
        this.startExternalGoalDragMode();
      } else {
        this.stopExternalGoalDragMode();
      }
    };
    this.existingGoalDragMoveHandler = (event: Event) => {
      if (!this.externalGoalDragActive) return;
      const customEvent = event as CustomEvent<ExistingGoalDragMovedDetail>;
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
      EXISTING_GOAL_EVENT_NAMES.dragStateChanged,
      this.existingGoalDragStateHandler
    );
    window.addEventListener(
      EXISTING_GOAL_EVENT_NAMES.dragMoved,
      this.existingGoalDragMoveHandler
    );
  }

  public unmountAll(): void {
    this.components.forEach((c) => c.unmount());
    if (this.existingGoalDragStateHandler) {
      window.removeEventListener(
        EXISTING_GOAL_EVENT_NAMES.dragStateChanged,
        this.existingGoalDragStateHandler
      );
      this.existingGoalDragStateHandler = null;
    }
    if (this.existingGoalDragMoveHandler) {
      window.removeEventListener(
        EXISTING_GOAL_EVENT_NAMES.dragMoved,
        this.existingGoalDragMoveHandler
      );
      this.existingGoalDragMoveHandler = null;
    }
    this.stopExternalGoalDragMode();
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

    if (payload?.kind === 'existing-goal' && payload.goal) {
      this.addExistingGoalService.addOrFocus(payload.goal, x, y);
      emitExistingGoalDropCompleted();
      return;
    }

    const { type, dto } = payload ?? {};
    if (!type || !dto) return;
    let element;
    if (type === 'task') {
      element = new TaskElement({
        ...dto,
        status: mapStatus(dto.status),
        x,
        y,
      });
    } else if (type === 'story') {
      element = new StoryElement({
        ...dto,
        status: mapStatus(dto.status),
        x,
        y,
      });
    } else if (type === 'goal') {
      element = new GoalElement({
        ...dto,
        status: mapStatus(dto.status),
        x,
        y,
      });
    }
    if (element) {
      historyService.execute(new AddElementCommand(this.scene, element));
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
      if (payload) {
        this.handleCanvasDropPayload(payload, event.clientX, event.clientY);
      }
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
      } else {
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
