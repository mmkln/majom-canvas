import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import { SaveButton } from './SaveButton.ts';
import { SaveStatusChip } from './SaveStatusChip.ts';
import { UndoRedoControls } from '../UndoRedoControls.ts';
import { CanvasMenu } from './CanvasMenu.ts';
import { createSurface } from '../primitives/index.ts';

export type SaveControlsLayoutMode = 'desktop' | 'mobile';

type SaveControlsOptions = {
  layoutMode?: SaveControlsLayoutMode;
  containerClassName?: string;
  showUndoRedo?: boolean;
};

/**
 * SaveControls: wraps save and auth actions in a shared HUD layout.
 */
export class SaveControls {
  private container: HTMLDivElement;
  private actionsContainer: HTMLDivElement;
  private saveGroup: HTMLDivElement;
  private undoRedoControls: UndoRedoControls;
  private saveButton: SaveButton;
  private saveStatusChip: SaveStatusChip;
  private canvasMenu: CanvasMenu;
  private authService = new AuthService();
  private refreshHandler: () => void;
  private layoutMode: SaveControlsLayoutMode;
  private containerClassName: string;
  private showUndoRedo: boolean;

  constructor(canvasMenu: CanvasMenu, options: SaveControlsOptions = {}) {
    this.layoutMode = options.layoutMode ?? 'desktop';
    this.containerClassName = options.containerClassName ?? '';
    this.showUndoRedo = options.showUndoRedo ?? true;
    this.container = document.createElement('div');
    this.container.className = this.resolveContainerClassName();
    this.actionsContainer = createSurface({
      className: 'flex items-center gap-2 p-1.5',
    });
    this.saveGroup = document.createElement('div');
    this.saveGroup.className = 'flex items-center gap-1';
    this.undoRedoControls = new UndoRedoControls();
    this.saveButton = new SaveButton();
    this.saveStatusChip = new SaveStatusChip();
    this.canvasMenu = canvasMenu;
    this.refreshHandler = () => this.updateVisibility();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.container.appendChild(this.actionsContainer);
    this.undoRedoControls.mount(this.actionsContainer);
    this.actionsContainer.appendChild(this.saveGroup);
    this.saveButton.mount(this.saveGroup);
    this.saveStatusChip.mount(this.saveGroup);
    this.canvasMenu.setLayoutMode(this.layoutMode);
    this.canvasMenu.mount(this.actionsContainer);
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.applyLayoutState();
    this.updateVisibility();
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.undoRedoControls.unmount();
    this.saveButton.unmount();
    this.saveStatusChip.unmount();
    this.canvasMenu.unmount();
    this.container.remove();
  }

  public setLayoutMode(mode: SaveControlsLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.container.className = this.resolveContainerClassName();
    this.canvasMenu.setLayoutMode(mode);
    this.applyLayoutState();
  }

  public setContainerClassName(className: string): void {
    this.containerClassName = className.trim();
    this.container.className = this.resolveContainerClassName();
  }

  public setShowUndoRedo(show: boolean): void {
    this.showUndoRedo = show;
    this.applyLayoutState();
  }

  private updateVisibility(): void {
    this.saveGroup.style.display = this.authService.isLoggedIn()
      ? 'flex'
      : 'none';
  }

  private resolveContainerClassName(): string {
    if (this.containerClassName.length > 0) {
      return this.containerClassName;
    }
    return this.layoutMode === 'mobile'
      ? 'relative'
      : 'absolute top-4 right-4 z-20';
  }

  private applyLayoutState(): void {
    this.undoRedoControls.container.style.display = this.showUndoRedo
      ? 'flex'
      : 'none';
    this.saveButton.setVisible(this.layoutMode !== 'mobile');
    this.saveStatusChip.setVisible(this.layoutMode === 'mobile');
    const mobileClasses = [
      'border-transparent',
      'bg-transparent',
      'shadow-none',
      'backdrop-blur-0',
      'p-0',
      'gap-1',
    ];
    mobileClasses.forEach((className) => {
      this.actionsContainer.classList.toggle(
        className,
        this.layoutMode === 'mobile'
      );
    });
  }
}
