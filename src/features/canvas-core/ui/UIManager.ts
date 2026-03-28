// ui/UIManager.ts
import { CanvasNavigationDock } from './CanvasNavigationDock.ts';
import { EditElementModal } from './components/EditElementModal.ts';
import { NotificationContainer } from './components/NotificationContainer.ts';
import { CanvasBoardSelector } from './components/CanvasBoardSelector.ts';
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { editElement$ } from '../core/eventBus.ts';
import { SaveControls } from './components/SaveControls.ts';
import type { Subscription } from 'rxjs';
import { GoalElement } from '../elements/GoalElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import type { CanvasLoadingPlaceholder } from '../core/types/canvasLoading.ts';
import { CanvasMenu } from './components/CanvasMenu.ts';
import { CanvasPerfHud } from './CanvasPerfHud.ts';
import { CANVAS_PERF_LOG } from '../../../config/env/index.ts';
import { CanvasHudLayoutController } from './CanvasHudLayoutController.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasInteractionAdapter } from '../adapters/CanvasInteractionAdapter.ts';
import type { CanvasLookupAdapter } from '../adapters/CanvasLookupAdapter.ts';
import type {
  CanvasUiAdapter,
  CanvasUiPreferences,
} from '../adapters/CanvasUiAdapter.ts';
import {
  EXISTING_PICKER_EVENT_NAMES,
  emitExistingPickerDropCompleted,
  type ExistingPickerDragEndedDetail,
  type ExistingPickerDragPayload,
  type ExistingPickerDragMovedDetail,
  type ExistingPickerDragStartedDetail,
} from './events/existingPickerEvents.ts';

export class UIManager {
  private readonly preferences: CanvasUiPreferences;
  private readonly components: {
    mount(parent?: HTMLElement): void;
    unmount(): void;
  }[] = [];
  private readonly canvasNavigationDock: CanvasNavigationDock;
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
    private readonly lookupAdapter: CanvasLookupAdapter,
    private readonly uiAdapter: CanvasUiAdapter,
    private readonly interactionAdapter: CanvasInteractionAdapter | null,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
    this.preferences = {
      showBoardSelector: true,
      showNavigationDock: true,
      showSaveControls: true,
      showCanvasMenu: true,
      ...this.uiAdapter.getPreferences?.(),
    };
    this.canvasNavigationDock = new CanvasNavigationDock(
      this.scene,
      this.canvasManager,
      this.runtime
    );
    const extensionComponents = this.uiAdapter.createComponents({
      canvasManager: this.canvasManager,
      scene: this.scene,
      lookupAdapter: this.lookupAdapter,
      interactionAdapter: this.interactionAdapter,
      runtime: this.runtime,
    });

    if (this.preferences.showBoardSelector) {
      this.components.push(new CanvasBoardSelector());
    }
    if (this.preferences.showNavigationDock) {
      this.components.push(this.canvasNavigationDock);
    }
    if (this.preferences.showSaveControls || this.preferences.showCanvasMenu) {
      const canvasMenu = new CanvasMenu({
        containerClassName: 'relative z-30 flex items-center',
        runtime: this.runtime,
        initialAnimationsEnabled: this.canvasManager.getAnimationsEnabled(),
        onAnimationsToggle: this.preferences.showCanvasMenu
          ? (enabled) => this.canvasManager.setAnimationsEnabled(enabled)
          : undefined,
        initialSmartGuidesEnabled: this.canvasManager.getSmartGuidesEnabled(),
        onSmartGuidesToggle: this.preferences.showCanvasMenu
          ? (enabled) => this.canvasManager.setSmartGuidesEnabled(enabled)
          : undefined,
        hidden: !this.preferences.showCanvasMenu,
      });
      if (this.preferences.showSaveControls) {
        this.components.push(new SaveControls(canvasMenu, this.runtime));
      } else if (this.preferences.showCanvasMenu) {
        this.components.push(canvasMenu);
      }
    }
    this.components.push(...extensionComponents);
    // Notification container
    const notificationContainer = new NotificationContainer();
    this.components.push(notificationContainer);
    if (CANVAS_PERF_LOG) {
      this.components.push(new CanvasPerfHud(this.canvasManager));
    }
    // Show modal on edit requests via RxJS bus
    this.editElementSubscription = editElement$.subscribe((el) =>
      new EditElementModal(el, this.scene).show()
    );
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
    root.style.position = 'absolute';
    root.style.left = '0';
    root.style.top = '0';
    root.style.width = '100%';
    root.style.height = '100%';
    root.style.zIndex = '40';
    root.style.pointerEvents = 'none';
    root.style.overflow = 'visible';
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

    const handled = this.uiAdapter.handleExistingPickerDrop?.(payload, { x, y });
    if (handled) {
      emitExistingPickerDropCompleted(payload.kind);
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
