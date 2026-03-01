import type { Subscription } from 'rxjs';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { UserApiService } from '../../../../majom-wrapper/data-access/user-api-service.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { AuthController, type AuthState } from '../auth/AuthController.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import type { HudOverlayCoordinator } from '../HudOverlayCoordinator.ts';
import { MobileBottomSheet } from '../MobileBottomSheet.ts';
import {
  createDivider,
  createDropdownItem,
  createIconButton,
  createSurface,
  Dropdown,
} from '../primitives/index.ts';

type CanvasMenuOptions = {
  containerClassName?: string;
  layoutMode?: 'desktop' | 'mobile';
  overlayCoordinator?: HudOverlayCoordinator;
};

export class CanvasMenu {
  private static readonly OVERLAY_OWNER_ID = 'canvas-menu';
  private readonly container: HTMLDivElement;
  private readonly menuButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: Dropdown;
  private readonly deleteCanvasButton: HTMLButtonElement;
  private readonly logoutButton: HTMLButtonElement;
  private readonly authController: AuthController;
  private stateSubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private logoutRequested = false;
  private mounted = false;
  private layoutMode: 'desktop' | 'mobile';
  private readonly mobileSheet: MobileBottomSheet;
  private readonly overlayCoordinator: HudOverlayCoordinator | null;

  constructor(
    authService: AuthService,
    userApiService: UserApiService,
    options: CanvasMenuOptions = {}
  ) {
    this.layoutMode = options.layoutMode ?? 'desktop';
    this.overlayCoordinator = options.overlayCoordinator ?? null;
    this.mobileSheet = new MobileBottomSheet('info', 'CanvasMenu');
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
      className: this.resolveDropdownMenuClassName(),
    });

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

    this.dropdownController = new Dropdown({
      container: this.container,
      panel: this.dropdownMenu,
      onOpenChange: (open) => {
        this.menuButton.classList.toggle('bg-indigo-50', open);
        this.menuButton.classList.toggle('text-indigo-700', open);
      },
    });

    this.authController = new AuthController(authService, userApiService);
    this.refreshHandler = () => this.authController.initialize();
    this.applyLayoutState();
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
    this.overlayCoordinator?.close(CanvasMenu.OVERLAY_OWNER_ID);
    this.mobileSheet.close();
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this.container.remove();
    this.mounted = false;
    this.logoutRequested = false;
  }

  public setLayoutMode(mode: 'desktop' | 'mobile'): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.setDropdownOpen(false);
    this.dropdownMenu.className = this.resolveDropdownMenuClassName();
    this.applyLayoutState();
  }

  private render(state: AuthState): void {
    this.renderDropdownContent(state.user, state.isUserLoading);

    if (state.isAuthenticated) {
      this.logoutRequested = false;
      if (this.layoutMode === 'desktop') {
        this.container.replaceChildren(this.menuButton, this.dropdownMenu);
      } else {
        this.container.replaceChildren(this.menuButton);
      }
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
    actions.append(this.deleteCanvasButton, this.logoutButton);
    this.dropdownMenu.appendChild(actions);
  }

  private toggleDropdown(): void {
    if (this.layoutMode === 'mobile') {
      this.setDropdownOpen(!this.mobileSheet.isOpen());
      if (!this.mobileSheet.isOpen()) return;
      const state = this.authController.getState();
      if (!state.user && !state.isUserLoading) {
        this.authController.loadUserIfNeeded();
      }
      return;
    }
    const willOpen = !this.dropdownController.isOpen();
    this.dropdownController.toggle();
    if (!willOpen) return;
    const state = this.authController.getState();
    if (!state.user && !state.isUserLoading) {
      this.authController.loadUserIfNeeded();
    }
  }

  private setDropdownOpen(open: boolean): void {
    if (this.layoutMode === 'mobile') {
      if (open) {
        if (this.mobileSheet.isOpen()) return;
        this.overlayCoordinator?.open({
          ownerId: CanvasMenu.OVERLAY_OWNER_ID,
          kind: 'canvas-menu',
          onForceClose: () => this.setDropdownOpen(false),
        });
        this.mobileSheet.open({
          content: this.dropdownMenu,
          ariaLabel: 'Canvas menu',
          zIndex: 240,
          onRequestClose: () => this.setDropdownOpen(false),
          containerClassName:
            'max-h-[min(78dvh,34rem)] px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        });
        this.menuButton.classList.add('bg-indigo-50', 'text-indigo-700');
        return;
      }
      if (!this.mobileSheet.isOpen()) return;
      this.mobileSheet.close();
      this.overlayCoordinator?.close(CanvasMenu.OVERLAY_OWNER_ID, 'canvas-menu');
      this.menuButton.classList.remove('bg-indigo-50', 'text-indigo-700');
      return;
    }
    this.dropdownController.setOpen(open);
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

  private resolveDropdownMenuClassName(): string {
    if (this.layoutMode === 'mobile') {
      return 'hidden w-full overflow-y-auto';
    }
    return 'absolute right-[-10px] top-full mt-3.5 z-30 hidden w-72 overflow-hidden';
  }

  private applyLayoutState(): void {
    const mobileClasses = [
      'border-transparent',
      'bg-transparent',
      'shadow-none',
      'backdrop-blur-0',
      'rounded-none',
      'p-0',
    ];
    mobileClasses.forEach((className) => {
      this.dropdownMenu.classList.toggle(className, this.layoutMode === 'mobile');
    });
  }
}
