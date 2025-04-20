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

export class UIManager {
  private readonly components: { mount(parent?: HTMLElement): void; unmount(): void }[] = [];
  private readonly canvasToolbar: CanvasToolbar;
  private readonly canvasControls: CanvasControls;
  private readonly zoomIndicator: ZoomIndicator;
  private readonly undoRedoControls: UndoRedoControls;

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene,
  ) {
    // Initialize Canvas Toolbar for creating elements
    this.canvasToolbar = new CanvasToolbar(this.scene, this.canvasManager);
    this.canvasControls = new CanvasControls(this.canvasManager);
    this.zoomIndicator = new ZoomIndicator(this.canvasManager);
    this.undoRedoControls = new UndoRedoControls();
    
    // Add controls to components that will be mounted
    // Core UI components
    this.components.push(this.canvasControls, this.zoomIndicator, this.canvasToolbar, this.undoRedoControls);
    // Notification container
    const notificationContainer = new NotificationContainer();
    this.components.push(notificationContainer);
    // Show modal on edit requests via RxJS bus
    editElement$.subscribe((el) => new EditElementModal(el, this.scene).show());
  }

  public mountAll(parent: HTMLElement = document.body): void {
    this.components.forEach(c => c.mount(parent));
  }

  public unmountAll(): void {
    this.components.forEach(c => c.unmount());
  }
}
