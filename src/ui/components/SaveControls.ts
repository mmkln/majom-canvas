import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { SaveButton } from './SaveButton.ts';
import { UndoRedoControls } from '../UndoRedoControls.ts';
import { CanvasMenu } from './CanvasMenu.ts';
import { createHudSurface } from '../primitives/index.ts';

/**
 * SaveControls: wraps save and auth actions in a shared HUD layout.
 */
export class SaveControls {
  private container: HTMLDivElement;
  private actionsContainer: HTMLDivElement;
  private saveGroup: HTMLDivElement;
  private undoRedoControls: UndoRedoControls;
  private saveButton: SaveButton;
  private canvasMenu: CanvasMenu;
  private authService = new AuthService();
  private refreshHandler: () => void;

  constructor(canvasMenu: CanvasMenu) {
    this.container = document.createElement('div');
    this.container.className = 'absolute top-4 right-4 z-20';
    this.actionsContainer = createHudSurface({
      className: 'flex items-center gap-2 px-2.5 py-2',
    });
    this.saveGroup = document.createElement('div');
    this.saveGroup.className = 'flex items-center';
    this.undoRedoControls = new UndoRedoControls();
    this.saveButton = new SaveButton();
    this.canvasMenu = canvasMenu;
    this.refreshHandler = () => this.updateVisibility();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.container.appendChild(this.actionsContainer);
    this.undoRedoControls.mount(this.actionsContainer);
    this.actionsContainer.appendChild(this.saveGroup);
    this.saveButton.mount(this.saveGroup);
    this.canvasMenu.mount(this.actionsContainer);
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.updateVisibility();
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.undoRedoControls.unmount();
    this.saveButton.unmount();
    this.canvasMenu.unmount();
    this.container.remove();
  }

  private updateVisibility(): void {
    this.saveGroup.style.display = this.authService.isLoggedIn()
      ? 'flex'
      : 'none';
  }
}
