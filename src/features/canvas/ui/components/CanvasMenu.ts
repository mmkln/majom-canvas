import { firstValueFrom, type Subscription } from 'rxjs';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { User } from '../../../../majom-wrapper/interfaces/auth-interfaces.ts';
import { UserApiService } from '../../../../majom-wrapper/data-access/user-api-service.ts';
import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';
import { emitCanvasAutosaveToggled } from '../../core/canvasAutosaveLifecycle.ts';
import { AuthController, type AuthState } from '../auth/AuthController.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import { performManualLogout } from '../auth/manualLogout.ts';
import {
  AnchoredMenu,
  createDivider,
  createDropdownItem,
  createIconButton,
  createMenuControlRow,
  createSurface,
  createToggleSwitch,
} from '../primitives/index.ts';
import { createAccountMenuProfileSection } from './accountMenuProfileSection.ts';
import {
  createLocaleSubmenu,
  type LocaleSubmenuHandle,
} from './LocaleSubmenu.ts';
import { openTopbarDropdown } from './topbarDropdownLayout.ts';
import { type AppLocale, type I18nService } from '../../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';

type CanvasMenuOptions = {
  containerClassName?: string;
  runtime?: AppRuntime;
  initialAnimationsEnabled?: boolean;
  onAnimationsToggle?: (enabled: boolean) => void;
  initialSmartGuidesEnabled?: boolean;
  onSmartGuidesToggle?: (enabled: boolean) => void;
};

export class CanvasMenu {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly userApiService: UserApiService;
  private readonly container: HTMLDivElement;
  private readonly menuButton: HTMLButtonElement;
  private readonly dropdownMenu: HTMLDivElement;
  private readonly dropdownController: AnchoredMenu;
  private readonly authController: AuthController;
  private readonly animationsToggleHandler: ((enabled: boolean) => void) | null;
  private readonly smartGuidesToggleHandler:
    | ((enabled: boolean) => void)
    | null;
  private authState: AuthState = {
    isAuthenticated: false,
    isLoginRequested: false,
    isSubmitting: false,
    isUserLoading: false,
    user: null,
    error: null,
  };
  private animationsEnabled: boolean;
  private smartGuidesEnabled: boolean;
  private autosaveEnabled: boolean;
  private stateSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private readonly refreshHandler: () => void;
  private localeSubmenu: LocaleSubmenuHandle | null = null;
  private logoutRequested = false;
  private localePersistInFlight = false;
  private mounted = false;

  constructor(
    authService: AuthService,
    userApiService: UserApiService,
    options: CanvasMenuOptions = {}
  ) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    this.userApiService = userApiService;
    this.container = document.createElement('div');
    this.container.className =
      options.containerClassName ?? 'relative z-30 flex items-center';

    this.menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      title: this.i18n.t('canvasMenu.openCanvasMenu'),
      ariaLabel: this.i18n.t('canvasMenu.openCanvasMenu'),
      onClick: (event) => {
        event.stopPropagation();
        this.toggleDropdown();
      },
    });

    this.dropdownMenu = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-30 hidden w-72 overflow-hidden',
    });

    this.animationsEnabled = options.initialAnimationsEnabled ?? true;
    this.animationsToggleHandler = options.onAnimationsToggle ?? null;
    this.smartGuidesEnabled =
      options.initialSmartGuidesEnabled ??
      CanvasClientStorage.getCanvasSmartGuidesEnabled(false);
    this.smartGuidesToggleHandler = options.onSmartGuidesToggle ?? null;
    this.autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);

    this.dropdownController = new AnchoredMenu({
      container: this.container,
      panel: this.dropdownMenu,

      onOpenChange: (open) => {
        this.menuButton.classList.toggle('bg-indigo-50', open);
        this.menuButton.classList.toggle('text-indigo-700', open);
        if (!open) {
          this.localeSubmenu?.close();
        }
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
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshTranslations();
    }, { emitCurrent: true });

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
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.localeSubmenu?.destroy();
    this.localeSubmenu = null;
    this.stateSubscription?.unsubscribe();
    this.stateSubscription = null;
    this.container.remove();
    this.mounted = false;
    this.logoutRequested = false;
  }

  private render(state: AuthState): void {
    this.authState = state;
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
    this.localeSubmenu?.destroy();
    this.localeSubmenu = null;
    this.dropdownMenu.innerHTML = '';
    this.dropdownMenu.append(
      ...createAccountMenuProfileSection(user, isUserLoading, {
        loadingLabel: this.i18n.t('common.accountLoading'),
      })
    );

    const actions = document.createElement('div');
    this.localeSubmenu = createLocaleSubmenu({
      i18n: this.i18n,
      currentLocale: this.i18n.getLocale(),
      disabled: this.localePersistInFlight,
      panelZIndex: 40,
      onSelect: (locale) => {
        void this.handleLocaleChange(locale);
      },
    });
    const animationsToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.canvasAnimations'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.animationsEnabled,
        onChange: (checked) => this.handleAnimationsToggle(checked),
      }),
    });
    const autosaveToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.autosave'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.autosaveEnabled,
        onChange: (checked) => this.handleAutosaveToggle(checked),
      }),
    });
    const smartGuidesToggle = createMenuControlRow({
      control: createToggleSwitch({
        label: this.i18n.t('canvasMenu.alignmentGuides'),
        labelClassName: '!font-normal',
        togglePosition: 'right',
        checked: this.smartGuidesEnabled,
        onChange: (checked) => this.handleSmartGuidesToggle(checked),
      }),
    });
    const deleteCanvasButton = createDropdownItem({
      label: this.i18n.t('canvasMenu.deleteCanvas'),
      variant: 'default',
      onClick: () => {
        this.setDropdownOpen(false);
        window.dispatchEvent(new CustomEvent('canvasDeleteRequested'));
      },
    });
    const logoutButton = createDropdownItem({
      label: this.i18n.t('header.logout'),
      variant: 'emphasis',
      onClick: () => this.handleLogout(),
    });
    actions.append(
      this.localeSubmenu.trigger,
      createDivider(),
      animationsToggle,
      smartGuidesToggle,
      autosaveToggle,
      deleteCanvasButton,
      createDivider(),
      logoutButton
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
    this.localeSubmenu?.close();
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
    this.logoutRequested = true;
    performManualLogout({
      logout: () => this.authController.logout(),
      onAfterLogout: () => this.setDropdownOpen(false),
    });
  }

  private refreshTranslations(): void {
    this.menuButton.title = this.i18n.t('canvasMenu.openCanvasMenu');
    this.menuButton.setAttribute(
      'aria-label',
      this.i18n.t('canvasMenu.openCanvasMenu')
    );
    if (this.mounted) {
      this.renderDropdownContent(
        this.authState.user,
        this.authState.isUserLoading
      );
    }
  }

  private async handleLocaleChange(nextLocale: AppLocale): Promise<void> {
    if (this.localePersistInFlight) return;
    const previousLocale = this.i18n.getLocale();
    if (previousLocale === nextLocale) return;

    this.localePersistInFlight = true;
    this.runtime.setLocale(nextLocale);
    try {
      if (this.authState.isAuthenticated) {
        const updatedUser = await firstValueFrom(
          this.userApiService.setUserProfileLanguage(nextLocale)
        );
        this.authController.syncUser(updatedUser);
      }
    } catch (error: unknown) {
      console.warn('Failed to persist user language.', error);
      this.runtime.setLocale(previousLocale);
    } finally {
      this.localePersistInFlight = false;
      this.refreshTranslations();
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
