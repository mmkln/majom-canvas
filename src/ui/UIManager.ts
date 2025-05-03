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
import { SaveButton } from './components/SaveButton.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { mapStatus } from '../majom-wrapper/utils/statusMapping.ts';

export class UIManager {
  private readonly components: {
    mount(parent?: HTMLElement): void;
    unmount(): void;
  }[] = [];
  private readonly canvasToolbar: CanvasToolbar;
  private readonly canvasControls: CanvasControls;
  private readonly zoomIndicator: ZoomIndicator;
  private readonly undoRedoControls: UndoRedoControls;

  constructor(
    private readonly canvasManager: CanvasManager,
    private readonly scene: Scene
  ) {
    // Initialize Canvas Toolbar for creating elements
    this.canvasToolbar = new CanvasToolbar(this.scene, this.canvasManager);
    this.canvasControls = new CanvasControls(this.canvasManager);
    this.zoomIndicator = new ZoomIndicator(this.canvasManager);
    this.undoRedoControls = new UndoRedoControls(this.canvasToolbar.container);

    // Initialize palette menu
    const paletteMenu = new PaletteMenu(this.scene);
    const saveButton = new SaveButton(this.scene);

    // Add controls to components list
    this.components.push(
      this.canvasControls,
      this.zoomIndicator,
      paletteMenu,
      saveButton,
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
      const json = e.dataTransfer?.getData('application/json');
      if (!json) return;
      const { type, dto } = JSON.parse(json);
      const rect = canvas.getBoundingClientRect();
      const panZoom = this.canvasManager.getPanZoomManager();
      const x = (e.clientX - rect.left + panZoom.scrollX) / panZoom.scale;
      const y = (e.clientY - rect.top + panZoom.scrollY) / panZoom.scale;
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
      if (element) this.scene.addElement(element);
    });
  }

  public unmountAll(): void {
    this.components.forEach((c) => c.unmount());
  }
}
