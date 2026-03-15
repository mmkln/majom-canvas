import type { Subscription } from 'rxjs';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { UserApiService } from '../../../../majom-wrapper/data-access/user-api-service.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';
import { emitCanvasAutosaveToggled } from '../../core/canvasAutosaveLifecycle.ts';
import { AuthController, type AuthState } from '../auth/AuthController.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import {
  AnchoredMenu,
  createDivider,
  createDropdownItem,
  createIconButton,
  createSurface,
  createToggleSwitch,
} from '../primitives/index.ts';
import {
  openTopbarDropdown,
} from './topbarDropdownLayout.ts';

type CanvasMenuOptions = {
  containerClassName?: string;
  initialAnimationsEnabled?: boolean;
  onAnimationsToggle?: (enabled: boolean) => void;
  initialSmartGuidesEnabled?: boolean;
  onSmartGuidesToggle?: (enabled: boolean) => void;
};

export class CanvasMenu {
  private readonly container: HTMLDivElement;
  private readonly menuButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: AnchoredMenu;
  private readonly deleteCanvasButton: HTMLButtonElement;
  private readonly logoutButton: HTMLButtonElement;
  private readonly authController: AuthController;
  private readonly animationsToggleHandler: ((enabled: boolean) => void) | null;
  private readonly smartGuidesToggleHandler: ((enabled: boolean) => void) | null;
  private animationsEnabled: boolean;
  private smartGuidesEnabled: boolean;
  private autosaveEnabled: boolean;
  private stateSubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private logoutRequested = false;
  private mounted = false;

  constructor(
    authService: AuthService,
    userApiService: UserApiService,
    options: CanvasMenuOptions = {}
  ) {
    this.container = document.createElement('div');
    this.container.className =
      options.containerClassName ?? 'relative z-30 flex items-center';

    this.menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      title: 'Open canvas menu',
      ariaLabel: 'Open canvas menu',
      onClick: (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      },
    });

    this.dropdownMenu = createSurface({
      elevated: true,
      className:
        'absolute left-0 top-0 z-30 hidden w-72 overflow-hidden',
    });

    this.animationsEnabled = options.initialAnimationsEnabled ?? true;
    this.animationsToggleHandler = options.onAnimationsToggle ?? null;
    this.smartGuidesEnabled =
      options.initialSmartGuidesEnabled ??
      CanvasClientStorage.getCanvasSmartGuidesEnabled(true);
    this.smartGuidesToggleHandler = options.onSmartGuidesToggle ?? null;
    this.autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);

    this.deleteCanvasButton = createDropdownItem({
      label: 'Delete canvas',
      variant: 'default',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDeleteRequested'));
      },
    });

    this.logoutButton = createDropdownItem({
      label: 'Logout',
      variant: 'emphasis',
      onClick: () => this.handleLogout(),
    });

    this.dropdownController = new AnchoredMenu({
      container: this.container,
      panel: this.dropdownMenu,
      
      onOpenChange: (open) => {
        this.menuButton.classList.toggle('bg-indigo-50', open);
        this.menuButton.classList.toggle('text-indigo-700', open);
      },
    });

    this.authController = new AuthController(authService, userApiService);
    this.refreshHandler = () => this.authController.initialize();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.mounted) return;
    parent.appendChild(this.container);
    this.dropdownController.mount();
    window.addEventListener('refreshCanvasData', this.refreshHandler);

    // Initialize auth state before subscribing, otherwise the initial
    // BehaviorSubject emission (default unauthenticated) can trigger a
    // false-positive logout during app bootstrap.
    this.authController.initialize();
    this.stateSubscription = this.authController.state$.subscribe((state) =>
      this.render(state)
    );

    this.mounted = true;
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.setDropdownOpen(false);
    this.dropdownController.unmount();
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this.container.remove();
    this.mounted = false;
    this.logoutRequested = false;
  }

  private render(state: AuthState): void {
    this.renderDropdownContent(state.user, state.isUserLoading);

    if (state.isAuthenticated) {
      this.logoutRequested = false;
      this.container.replaceChildren(this.menuButton, this.dropdownMenu);
      if (!state.user && !state.isUserLoading) {
        this.authController.loadUserIfNeeded();
      }
      return;
    }

    this.setDropdownOpen(false);
    this.container.replaceChildren();
    if (!this.logoutRequested) {
      this.logoutRequested = true;
      authFlowService.requestLogout('session-expired');
    }
  }

  private renderDropdownContent(
    user: User | null,
    isUserLoading: boolean
  ): void {
    this.dropdownMenu.innerHTML = '';

    if (isUserLoading) {
      const loadingRow = document.createElement('div');
      loadingRow.className = 'px-4 py-3 text-sm text-slate-500';
      loadingRow.textContent = 'Loading account...';
      this.dropdownMenu.appendChild(loadingRow);
      this.dropdownMenu.appendChild(createDivider());
    } else if (user) {
      const userInfo = document.createElement('div');
      userInfo.className = 'px-4 py-3';

      const userName = document.createElement('div');
      userName.className =
        'truncate text-sm font-semibold leading-5 tracking-tight text-slate-900';
      userName.textContent = user.username;

      const userEmail = document.createElement('div');
      userEmail.className = 'truncate text-sm leading-5 text-slate-500';
      userEmail.textContent = user.email;

      userInfo.append(userName, userEmail);
      this.dropdownMenu.append(userInfo, createDivider());
    }

    const actions = document.createElement('div');
    const animationsToggle = createToggleSwitch({
      label: 'Canvas animations',
      labelClassName: '!font-normal',
      togglePosition: 'right',
      checked: this.animationsEnabled,
      onChange: (checked) => this.handleAnimationsToggle(checked),
    });
    const autosaveToggle = createToggleSwitch({
      label: 'Autosave',
      labelClassName: '!font-normal',
      togglePosition: 'right',
      checked: this.autosaveEnabled,
      onChange: (checked) => this.handleAutosaveToggle(checked),
    });
    const smartGuidesToggle = createToggleSwitch({
      label: 'Smart guides',
      labelClassName: '!font-normal',
      togglePosition: 'right',
      checked: this.smartGuidesEnabled,
      onChange: (checked) => this.handleSmartGuidesToggle(checked),
    });
    actions.append(
      animationsToggle,
      smartGuidesToggle,
      autosaveToggle,
      this.deleteCanvasButton,
      this.logoutButton
    );
    this.dropdownMenu.appendChild(actions);
    if (this.dropdownController.isOpen()) {
      this.dropdownController.reposition();
    }
  }

  private toggleDropdown(): void {
    const willOpen = !this.dropdownController.isOpen();
    if (willOpen) {
      this.openDropdown();
    } else {
      this.dropdownController.close();
      return;
    }

    const state = this.authController.getState();
    if (!state.user && !state.isUserLoading) {
      this.authController.loadUserIfNeeded();
    }
  }

  private setDropdownOpen(open: boolean): void {
    if (open) {
      this.openDropdown();
      return;
    }
    this.dropdownController.close();
  }

  private openDropdown(): void {
    openTopbarDropdown({
      controller: this.dropdownController,
      anchor: this.resolveDropdownAnchor(),
      align: 'end',
    });
  }

  private resolveDropdownAnchor(): HTMLElement {
    const surfaceAnchor = this.container.closest(
      '[data-component="HudSurface"]'
    );
    if (surfaceAnchor instanceof HTMLElement) {
      return surfaceAnchor;
    }
    return this.container;
  }

  private handleLogout(): void {
    this.authController.logout();
    notify('Logged out', 'info');
    this.setDropdownOpen(false);
    if (!this.logoutRequested) {
      this.logoutRequested = true;
      authFlowService.requestLogout('manual');
    }
  }

  private handleAnimationsToggle(checked: boolean): void {
    if (this.animationsEnabled === checked) return;
    this.animationsEnabled = checked;
    this.animationsToggleHandler?.(this.animationsEnabled);
  }

  private handleAutosaveToggle(checked: boolean): void {
    if (this.autosaveEnabled === checked) return;
    this.autosaveEnabled = checked;
    CanvasClientStorage.setCanvasAutosaveEnabled(checked);
    emitCanvasAutosaveToggled(checked);
  }

  private handleSmartGuidesToggle(checked: boolean): void {
    if (this.smartGuidesEnabled === checked) return;
    this.smartGuidesEnabled = checked;
    CanvasClientStorage.setCanvasSmartGuidesEnabled(checked);
    this.smartGuidesToggleHandler?.(checked);
  }
}
