import type { Subscription } from 'rxjs';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import type { User } from '../../majom-wrapper/interfaces/auth-interfaces.ts';
import { UserApiService } from '../../majom-wrapper/data-access/user-api-service.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { AuthController, type AuthState } from '../auth/AuthController.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import {
  createHudDropdownItem,
  createHudIconButton,
  createHudSurface,
  HudDropdown,
} from '../primitives/index.ts';

import { LoginPage } from './LoginPage.ts';

type CanvasMenuOptions = {
  containerClassName?: string;
};

export class CanvasMenu {
  private readonly container: HTMLDivElement;
  private readonly menuButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: HudDropdown;
  private readonly deleteCanvasButton: HTMLButtonElement;
  private readonly logoutButton: HTMLButtonElement;
  private readonly authController: AuthController;
  private readonly loginPage: LoginPage;
  private stateSubscription: Subscription | null = null;
  private authRequestSubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private mounted = false;

  constructor(
    authService: AuthService,
    userApiService: UserApiService,
    options: CanvasMenuOptions = {}
  ) {
    this.container = document.createElement('div');
    this.container.className =
      options.containerClassName ?? 'relative z-30 flex items-center';

    this.menuButton = createHudIconButton({
      icon: 'ellipsis-vertical',
      title: 'Open canvas menu',
      ariaLabel: 'Open canvas menu',
      onClick: (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      },
    });

    this.dropdownMenu = createHudSurface({
      elevated: true,
      className:
        'absolute right-[-10px] top-full mt-3.5 z-30 hidden w-72 overflow-hidden',
    });

    this.deleteCanvasButton = createHudDropdownItem({
      label: 'Delete canvas',
      variant: 'default',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDeleteRequested'));
      },
    });

    this.logoutButton = createHudDropdownItem({
      label: 'Logout',
      variant: 'emphasis',
      onClick: () => this.handleLogout(),
    });

    this.dropdownController = new HudDropdown({
      container: this.container,
      panel: this.dropdownMenu,
      onOpenChange: (open) => {
        this.menuButton.classList.toggle('bg-indigo-50', open);
        this.menuButton.classList.toggle('text-indigo-700', open);
      },
    });

    this.authController = new AuthController(authService, userApiService);
    this.loginPage = new LoginPage({
      onSubmit: async (credentials) => {
        const result = await this.authController.submitLogin(credentials);
        if (result.ok) {
          notify('Logged in successfully', 'success');
          window.dispatchEvent(new CustomEvent('refreshCanvasData'));
        }
        return result;
      },
    });
    this.refreshHandler = () => this.authController.initialize();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (this.mounted) return;
    parent.appendChild(this.container);
    this.dropdownController.mount();
    window.addEventListener('refreshCanvasData', this.refreshHandler);

    this.stateSubscription = this.authController.state$.subscribe((state) =>
      this.render(state)
    );
    this.authRequestSubscription = authFlowService.loginRequests$.subscribe(() => {
      this.authController.requestLogin();
      if (!this.authController.getState().isAuthenticated) {
        this.loginPage.show();
        this.loginPage.focusPrimaryField();
      }
    });

    this.mounted = true;
    this.authController.initialize();
  }

  public unmount(): void {
    if (!this.mounted) return;
    this.setDropdownOpen(false);
    this.dropdownController.unmount();
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this.authRequestSubscription?.unsubscribe();
    this.authRequestSubscription = null;
    this.loginPage.hide();
    this.container.remove();
    this.mounted = false;
  }

  private render(state: AuthState): void {
    this.renderDropdownContent(state.user, state.isUserLoading);

    if (state.isAuthenticated) {
      this.container.replaceChildren(this.menuButton, this.dropdownMenu);
      this.loginPage.hide();
      if (!state.user && !state.isUserLoading) {
        this.authController.loadUserIfNeeded();
      }
      return;
    }

    this.setDropdownOpen(false);
    this.container.replaceChildren();
    this.loginPage.show();
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
      this.dropdownMenu.appendChild(this.createDivider());
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
      this.dropdownMenu.append(userInfo, this.createDivider());
    }

    const actions = document.createElement('div');
    actions.append(this.deleteCanvasButton, this.logoutButton);
    this.dropdownMenu.appendChild(actions);
  }

  private toggleDropdown(): void {
    const willOpen = !this.dropdownController.isOpen();
    this.dropdownController.toggle();
    if (!willOpen) return;
    const state = this.authController.getState();
    if (!state.user && !state.isUserLoading) {
      this.authController.loadUserIfNeeded();
    }
  }

  private setDropdownOpen(open: boolean): void {
    this.dropdownController.setOpen(open);
  }

  private handleLogout(): void {
    this.authController.logout();
    notify('Logged out', 'info');
    this.setDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('refreshCanvasData'));
  }

  private createDivider(): HTMLDivElement {
    const divider = document.createElement('div');
    divider.className = 'mx-2 border-t border-slate-200/80';
    return divider;
  }
}
