import { Scene } from '../../core/scene/Scene.ts';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { SaveButton } from './SaveButton.ts';
import { SaveSpinner } from './SaveSpinner.ts';
import { UndoRedoControls } from '../UndoRedoControls.ts';

/**
 * SaveControls: wraps the save spinner and button in a shared layout.
 */
export class SaveControls {
  private container: HTMLDivElement;
  private actionsContainer: HTMLDivElement;
  private saveGroup: HTMLDivElement;
  private undoRedoControls: UndoRedoControls;
  private saveButton: SaveButton;
  private saveSpinner: SaveSpinner;
  private authService = new AuthService();
  private refreshHandler: () => void;

  constructor(scene: Scene) {
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-5 right-20 z-20';
    this.actionsContainer = document.createElement('div');
    this.actionsContainer.className = 'flex items-center gap-2';
    this.saveGroup = document.createElement('div');
    this.saveGroup.className = 'flex items-center gap-2';
    this.undoRedoControls = new UndoRedoControls();
    this.saveButton = new SaveButton(scene);
    this.saveSpinner = new SaveSpinner();
    this.refreshHandler = () => this.updateVisibility();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.container.appendChild(this.actionsContainer);
    this.undoRedoControls.mount(this.actionsContainer);
    this.actionsContainer.appendChild(this.saveGroup);
    this.saveSpinner.mount(this.saveGroup);
    this.saveButton.mount(this.saveGroup);
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.updateVisibility();
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.undoRedoControls.unmount();
    this.saveSpinner.unmount();
    this.saveButton.unmount();
    this.container.remove();
  }

  private updateVisibility(): void {
    this.saveGroup.style.display = this.authService.isLoggedIn()
      ? 'flex'
      : 'none';
  }
}
