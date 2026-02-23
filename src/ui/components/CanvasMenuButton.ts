import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { HUD_DROPDOWN_CLASS } from '../primitives/hudClassNames.ts';
import {
  createHudDropdownItem,
  createHudIconButton,
  HudDropdown,
} from '../primitives/index.ts';

/**
 * CanvasMenuButton: a compact menu placed near the user avatar
 * with canvas-level actions.
 */
export class CanvasMenuButton {
  private readonly container: HTMLDivElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: HudDropdown;
  private readonly authService = new AuthService();
  private readonly refreshHandler: () => void;
  private mounted = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'relative z-30 flex items-center';

    this.toggleButton = createHudIconButton({
      icon: 'ellipsis-vertical',
      title: 'Canvas menu',
      ariaLabel: 'Canvas menu',
      onClick: (event) => {
        event.stopPropagation();
        this.dropdownController.toggle();
      },
    });

    this.dropdownMenu = document.createElement('div');
    this.dropdownMenu.className =
      `absolute right-0 top-full mt-2 hidden w-52 z-30 ${HUD_DROPDOWN_CLASS}`;

    const actionsHeader = document.createElement('div');
    actionsHeader.className =
      'px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400';
    actionsHeader.textContent = 'Canvas actions';

    const deleteCanvasButton = createHudDropdownItem({
      label: 'Delete canvas',
      tone: 'danger',
      onClick: () => {
        this.dropdownController.setOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDeleteRequested'));
      },
    });

    this.dropdownMenu.append(actionsHeader, deleteCanvasButton);
    this.container.append(this.toggleButton, this.dropdownMenu);

    this.dropdownController = new HudDropdown({
      container: this.container,
      panel: this.dropdownMenu,
      onOpenChange: (open) => {
        this.toggleButton.classList.toggle('bg-slate-100', open);
        this.toggleButton.classList.toggle('text-slate-800', open);
      },
    });
    this.refreshHandler = () => this.updateVisibility();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.mounted) return;
    parent.appendChild(this.container);
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.dropdownController.mount();
    this.mounted = true;
    this.updateVisibility();
  }

  public unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.dropdownController.unmount();
    this.container.remove();
    this.mounted = false;
  }

  private updateVisibility(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    this.container.style.display = isLoggedIn ? 'flex' : 'none';
    if (!isLoggedIn) {
      this.dropdownController.setOpen(false);
    }
  }
}
